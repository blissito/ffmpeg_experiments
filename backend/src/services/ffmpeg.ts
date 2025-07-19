import ffmpeg from "fluent-ffmpeg";
import { promises as fs } from "fs";
import path from "path";
import type {
  ProcessingJobData,
  VideoMetadata,
} from "video-frame-overlay-shared";

export interface FFmpegService {
  processVideo(jobData: ProcessingJobData): Promise<string>;
  validateInputs(videoPath: string, framePath: string): Promise<boolean>;
  getVideoMetadata(videoPath: string): Promise<VideoMetadata>;
}

export class FFmpegServiceImpl implements FFmpegService {
  /**
   * Add custom frame overlay to video using FFmpeg
   */
  async addCustomFrame(
    videoPath: string,
    framePath: string,
    startTime: number,
    duration: number,
    outputPath: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      // Validate parameters
      if (startTime < 0) {
        reject(new Error("Start time must be non-negative"));
        return;
      }

      if (duration <= 0) {
        reject(new Error("Duration must be positive"));
        return;
      }

      const command = ffmpeg()
        .input(videoPath)
        .input(framePath)
        .complexFilter([
          // Scale the frame to match video dimensions if needed
          `[1:v]scale=iw:ih[frame]`,
          // Apply overlay with timing
          `[0:v][frame]overlay=0:0:enable='between(t,${startTime},${
            startTime + duration
          })'[v]`,
        ])
        .outputOptions([
          "-map",
          "[v]",
          "-map",
          "0:a?", // Include audio if present
          "-c:a",
          "copy", // Copy audio without re-encoding
          "-c:v",
          "libx264", // Use H.264 codec for video
          "-preset",
          "medium", // Balance between speed and compression
          "-crf",
          "23", // Good quality setting
        ])
        .output(outputPath)
        .on("start", (commandLine) => {
          console.log("FFmpeg command:", commandLine);
        })
        .on("progress", (progress) => {
          console.log(`Processing: ${progress.percent}% done`);
        })
        .on("end", () => {
          console.log("Video processing completed");
          resolve(outputPath);
        })
        .on("error", (err) => {
          console.error("FFmpeg error:", err);
          reject(new Error(`Video processing failed: ${err.message}`));
        });

      command.run();
    });
  }

  /**
   * Process video with frame overlay
   */
  async processVideo(jobData: ProcessingJobData): Promise<string> {
    const { videoPath, framePath, startTime, duration, outputPath } = jobData;

    // Validate inputs before processing
    const isValid = await this.validateInputs(videoPath, framePath);
    if (!isValid) {
      throw new Error("Invalid input files");
    }

    // Get video metadata to validate timing parameters
    const metadata = await this.getVideoMetadata(videoPath);

    if (startTime >= metadata.duration) {
      throw new Error("Start time exceeds video duration");
    }

    if (startTime + duration > metadata.duration) {
      throw new Error("Overlay duration exceeds remaining video time");
    }

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });

    return this.addCustomFrame(
      videoPath,
      framePath,
      startTime,
      duration,
      outputPath
    );
  }

  /**
   * Validate input video and frame files
   */
  async validateInputs(videoPath: string, framePath: string): Promise<boolean> {
    try {
      // Check if files exist
      await fs.access(videoPath);
      await fs.access(framePath);

      // Validate video file
      const videoValid = await this.validateVideoFile(videoPath);
      if (!videoValid) {
        return false;
      }

      // Validate frame file
      const frameValid = await this.validateFrameFile(framePath);
      if (!frameValid) {
        return false;
      }

      return true;
    } catch (error) {
      console.error("File validation error:", error);
      return false;
    }
  }

  /**
   * Validate video file format and properties
   */
  private async validateVideoFile(videoPath: string): Promise<boolean> {
    return new Promise((resolve) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          console.error("Video validation error:", err);
          resolve(false);
          return;
        }

        // Check if file has video stream
        const videoStream = metadata.streams.find(
          (stream) => stream.codec_type === "video"
        );
        if (!videoStream) {
          console.error("No video stream found");
          resolve(false);
          return;
        }

        // Validate supported formats
        const supportedFormats = ["mp4", "mov", "avi", "mkv", "webm"];
        const format = metadata.format.format_name?.toLowerCase() || "";
        const isSupported = supportedFormats.some((fmt) =>
          format.includes(fmt)
        );

        if (!isSupported) {
          console.error(`Unsupported video format: ${format}`);
          resolve(false);
          return;
        }

        resolve(true);
      });
    });
  }

  /**
   * Validate frame file (image or video)
   */
  private async validateFrameFile(framePath: string): Promise<boolean> {
    return new Promise((resolve) => {
      ffmpeg.ffprobe(framePath, (err, metadata) => {
        if (err) {
          console.error("Frame validation error:", err);
          resolve(false);
          return;
        }

        // Check if file has video stream (for images or videos)
        const videoStream = metadata.streams.find(
          (stream) => stream.codec_type === "video"
        );
        if (!videoStream) {
          console.error("No video/image stream found in frame file");
          resolve(false);
          return;
        }

        // Validate supported formats for frames
        const supportedFormats = [
          "png",
          "jpg",
          "jpeg",
          "gif",
          "mp4",
          "mov",
          "webm",
        ];
        const format = metadata.format.format_name?.toLowerCase() || "";
        const isSupported = supportedFormats.some((fmt) =>
          format.includes(fmt)
        );

        if (!isSupported) {
          console.error(`Unsupported frame format: ${format}`);
          resolve(false);
          return;
        }

        resolve(true);
      });
    });
  }

  /**
   * Extract video metadata using FFprobe
   */
  async getVideoMetadata(videoPath: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          reject(new Error(`Failed to get video metadata: ${err.message}`));
          return;
        }

        const videoStream = metadata.streams.find(
          (stream) => stream.codec_type === "video"
        );
        if (!videoStream) {
          reject(new Error("No video stream found"));
          return;
        }

        const videoMetadata: VideoMetadata = {
          duration: metadata.format.duration || 0,
          width: videoStream.width || 0,
          height: videoStream.height || 0,
          format: metadata.format.format_name || "unknown",
          bitrate: metadata.format.bit_rate
            ? parseInt(metadata.format.bit_rate.toString())
            : 0,
        };

        resolve(videoMetadata);
      });
    });
  }
}

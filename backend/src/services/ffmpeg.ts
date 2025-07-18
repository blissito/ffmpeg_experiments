import type {
  ProcessingJobData,
  VideoMetadata,
} from "video-frame-overlay-shared";

export interface FFmpegService {
  processVideo(jobData: ProcessingJobData): Promise<string>;
  validateInputs(videoPath: string, framePath: string): Promise<boolean>;
  getVideoMetadata(videoPath: string): Promise<VideoMetadata>;
}

// Placeholder implementation - will be implemented in later tasks
export class FFmpegServiceImpl implements FFmpegService {
  async processVideo(jobData: ProcessingJobData): Promise<string> {
    throw new Error("Not implemented yet");
  }

  async validateInputs(videoPath: string, framePath: string): Promise<boolean> {
    throw new Error("Not implemented yet");
  }

  async getVideoMetadata(videoPath: string): Promise<VideoMetadata> {
    throw new Error("Not implemented yet");
  }
}

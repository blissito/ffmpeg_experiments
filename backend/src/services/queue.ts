import Agenda from "agenda";
import { databaseService } from "./database.js";
import { FFmpegServiceImpl } from "./ffmpeg.js";
import { ProcessingJobData } from "../../../shared/src/schemas/job.js";

export interface QueueService {
  addJob(jobData: ProcessingJobData): Promise<string>;
  getJobStatus(jobId: string): Promise<any>;
  getJobResult(
    jobId: string
  ): Promise<{ outputPath: string; status: string } | null>;
  getUserJobs(userId: string, limit?: number): Promise<any[]>;
  cancelJob(jobId: string): Promise<void>;
  initialize(): Promise<void>;
}

export class AgendaQueueService implements QueueService {
  private agenda: Agenda | null = null;
  private isInitialized = false;
  private ffmpegService: FFmpegServiceImpl;

  constructor() {
    this.ffmpegService = new FFmpegServiceImpl();
  }

  async initialize(): Promise<void> {
    try {
      if (this.isInitialized && this.agenda) {
        return;
      }

      console.log("🔄 Initializing Agenda.js queue...");

      // Ensure database is connected
      console.log("🔄 Ensuring database connection...");
      await databaseService.connect();
      console.log("✅ Database connection confirmed");

      // Initialize Agenda with MongoDB connection
      console.log("🔄 Creating Agenda instance...");
      this.agenda = new Agenda({
        mongo: databaseService.getDb(),
        db: { collection: "jobs" },
        processEvery: "10 seconds",
        maxConcurrency: 3,
        defaultConcurrency: 1,
        defaultLockLifetime: 10 * 60 * 1000, // 10 minutes
      });
      console.log("✅ Agenda instance created");

      // Define job processors
      console.log("🔄 Defining job processors...");
      this.defineJobProcessors();
      console.log("✅ Job processors defined");

      // Start the agenda with timeout
      console.log("🔄 Starting Agenda.js...");

      const startPromise = this.agenda.start();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Agenda.js start timeout after 10 seconds")),
          10000
        );
      });

      await Promise.race([startPromise, timeoutPromise]);
      console.log("✅ Agenda.js started successfully");

      this.isInitialized = true;
      console.log("✅ Agenda.js queue initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize queue service:", error);
      throw new Error(
        `Queue initialization failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private defineJobProcessors(): void {
    if (!this.agenda) {
      throw new Error("Agenda not initialized");
    }

    // Define the video processing job
    this.agenda.define("process video", { concurrency: 1 }, async (job) => {
      const data = job.attrs.data as ProcessingJobData;

      try {
        console.log(`🎬 Starting video processing job: ${data.jobId}`);

        // Initial progress update
        job.progress(5, 100);
        await job.save();

        console.log(`📹 Processing video: ${data.videoPath}`);
        console.log(`🖼️  Adding frame: ${data.framePath}`);
        console.log(
          `⏰ Start time: ${data.startTime}s, Duration: ${data.duration}s`
        );

        // Validate inputs
        job.progress(10, 100);
        await job.save();

        const isValid = await this.ffmpegService.validateInputs(
          data.videoPath,
          data.framePath
        );
        if (!isValid) {
          throw new Error("Invalid input files provided");
        }

        // Get video metadata for validation
        job.progress(20, 100);
        await job.save();

        const metadata = await this.ffmpegService.getVideoMetadata(
          data.videoPath
        );
        console.log(
          `📊 Video metadata: ${metadata.width}x${metadata.height}, ${metadata.duration}s`
        );

        // Validate timing parameters
        if (data.startTime >= metadata.duration) {
          throw new Error(
            `Start time (${data.startTime}s) exceeds video duration (${metadata.duration}s)`
          );
        }

        if (data.startTime + data.duration > metadata.duration) {
          throw new Error(`Overlay duration exceeds remaining video time`);
        }

        // Start video processing
        job.progress(30, 100);
        await job.save();

        console.log(`🔄 Starting FFmpeg processing...`);
        const outputPath = await this.ffmpegService.processVideo(data);

        // Processing completed
        job.progress(100, 100);
        await job.save();

        console.log(`✅ Video processing completed: ${data.jobId}`);
        console.log(`📁 Output saved to: ${outputPath}`);

        // Store the output path in job data for retrieval
        job.attrs.data.outputPath = outputPath;
        await job.save();
      } catch (error) {
        console.error(
          `❌ Video processing failed for job ${data.jobId}:`,
          error
        );

        const errorMessage =
          error instanceof Error ? error.message : "Unknown processing error";
        job.fail(errorMessage);
        await job.save();

        throw error;
      }
    });

    // Define cleanup job for old processed files
    this.agenda.define("cleanup old files", async (job) => {
      try {
        console.log("🧹 Running file cleanup job");

        // TODO: Implement file cleanup logic
        // This will remove old processed videos and temporary files

        console.log("✅ File cleanup completed");
      } catch (error) {
        console.error("❌ File cleanup failed:", error);
        throw error;
      }
    });

    // Schedule recurring cleanup job (daily at 2 AM)
    this.agenda.every("0 2 * * *", "cleanup old files");
  }

  async addJob(jobData: ProcessingJobData): Promise<string> {
    if (!this.agenda) {
      throw new Error("Queue service not initialized");
    }

    try {
      const job = this.agenda.create("process video", jobData);
      job.unique({ "data.jobId": jobData.jobId });
      job.priority("high");

      await job.save();

      console.log(`📋 Video processing job queued: ${jobData.jobId}`);
      return job.attrs._id?.toString() || "";
    } catch (error) {
      console.error("❌ Failed to queue video processing job:", error);
      throw new Error(
        `Failed to queue job: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async getJobStatus(jobId: string): Promise<any> {
    if (!this.agenda) {
      throw new Error("Queue service not initialized");
    }

    try {
      const jobs = await this.agenda.jobs({ "data.jobId": jobId });

      if (jobs.length === 0) {
        return null;
      }

      const job = jobs[0];
      const attrs = job.attrs;
      const data = attrs.data as ProcessingJobData;

      return {
        id: jobId,
        status: this.getJobStatusFromAttrs(attrs),
        progress: attrs.progress || 0,
        error: attrs.failReason,
        createdAt: attrs.nextRunAt,
        completedAt: attrs.lastFinishedAt,
        failedAt: attrs.failedAt,
        outputPath: data.outputPath,
        processingData: {
          videoPath: data.videoPath,
          framePath: data.framePath,
          startTime: data.startTime,
          duration: data.duration,
        },
      };
    } catch (error) {
      console.error(`❌ Failed to get job status for ${jobId}:`, error);
      throw error;
    }
  }

  private getJobStatusFromAttrs(attrs: any): string {
    if (attrs.failedAt) return "failed";
    if (attrs.lastFinishedAt) return "completed";
    if (attrs.lockedAt) return "processing";
    return "pending";
  }

  /**
   * Get all jobs for a user (for job history)
   */
  async getUserJobs(userId: string, limit: number = 10): Promise<any[]> {
    if (!this.agenda) {
      throw new Error("Queue service not initialized");
    }

    try {
      const jobs = await this.agenda.jobs(
        { "data.userId": userId },
        { limit, sort: { nextRunAt: -1 } }
      );

      return jobs.map((job) => {
        const attrs = job.attrs;
        const data = attrs.data as ProcessingJobData;

        return {
          id: data.jobId,
          status: this.getJobStatusFromAttrs(attrs),
          progress: attrs.progress || 0,
          error: attrs.failReason,
          createdAt: attrs.nextRunAt,
          completedAt: attrs.lastFinishedAt,
          failedAt: attrs.failedAt,
          outputPath: data.outputPath,
        };
      });
    } catch (error) {
      console.error(`❌ Failed to get user jobs for ${userId}:`, error);
      throw error;
    }
  }

  async getJobResult(
    jobId: string
  ): Promise<{ outputPath: string; status: string } | null> {
    if (!this.agenda) {
      throw new Error("Queue service not initialized");
    }

    try {
      const jobs = await this.agenda.jobs({ "data.jobId": jobId });

      if (jobs.length === 0) {
        return null;
      }

      const job = jobs[0];
      const attrs = job.attrs;
      const data = attrs.data as ProcessingJobData;
      const status = this.getJobStatusFromAttrs(attrs);

      if (status === "completed" && data.outputPath) {
        return {
          outputPath: data.outputPath,
          status: status,
        };
      }

      return {
        outputPath: data.outputPath || "",
        status: status,
      };
    } catch (error) {
      console.error(`❌ Failed to get job result for ${jobId}:`, error);
      throw error;
    }
  }

  async cancelJob(jobId: string): Promise<void> {
    if (!this.agenda) {
      throw new Error("Queue service not initialized");
    }

    try {
      const numRemoved = await this.agenda.cancel({ "data.jobId": jobId });
      console.log(`🚫 Cancelled ${numRemoved} job(s) with ID: ${jobId}`);
    } catch (error) {
      console.error(`❌ Failed to cancel job ${jobId}:`, error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    try {
      if (this.agenda) {
        console.log("🔄 Shutting down Agenda.js queue...");
        await this.agenda.stop();
        this.agenda = null;
        this.isInitialized = false;
        console.log("✅ Queue service shut down successfully");
      }
    } catch (error) {
      console.error("❌ Error shutting down queue service:", error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.agenda || !this.isInitialized) {
        return false;
      }

      // Check if agenda is running by checking the database connection
      return await databaseService.healthCheck();
    } catch (error) {
      console.error("❌ Queue service health check failed:", error);
      return false;
    }
  }
}

// Export singleton instance
export const queueService = new AgendaQueueService();

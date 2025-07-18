import Agenda from "agenda";
import { databaseService } from "./database.js";
import { ProcessingJobData } from "../../../shared/src/schemas/job.js";

export interface QueueService {
  addJob(jobData: ProcessingJobData): Promise<string>;
  getJobStatus(jobId: string): Promise<any>;
  cancelJob(jobId: string): Promise<void>;
  initialize(): Promise<void>;
}

export class AgendaQueueService implements QueueService {
  private agenda: Agenda | null = null;
  private isInitialized = false;

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

        // Update job progress
        job.progress(10, 100);
        await job.save();

        // TODO: This will be implemented in task 4.1 and 4.2
        // For now, we'll just simulate the processing
        console.log(`📹 Processing video: ${data.videoPath}`);
        console.log(`🖼️  Adding frame: ${data.framePath}`);
        console.log(
          `⏰ Start time: ${data.startTime}s, Duration: ${data.duration}s`
        );

        // Simulate processing time
        await new Promise((resolve) => setTimeout(resolve, 2000));

        job.progress(50, 100);
        await job.save();

        // Simulate more processing
        await new Promise((resolve) => setTimeout(resolve, 2000));

        job.progress(100, 100);
        await job.save();

        console.log(`✅ Video processing completed: ${data.jobId}`);

        // TODO: Update job status in database and notify user
      } catch (error) {
        console.error(
          `❌ Video processing failed for job ${data.jobId}:`,
          error
        );
        job.fail(
          error instanceof Error ? error.message : "Unknown processing error"
        );
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

      return {
        id: jobId,
        status: this.getJobStatusFromAttrs(attrs),
        progress: attrs.progress || 0,
        error: attrs.failReason,
        createdAt: attrs.nextRunAt,
        completedAt: attrs.lastFinishedAt,
        failedAt: attrs.failedAt,
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

export interface Job {
  id: string;
  userId: string;
  videoFile: {
    originalName: string;
    path: string;
    size: number;
    duration: number;
  };
  frameFile: {
    originalName: string;
    path: string;
    dimensions: { width: number; height: number };
  };
  parameters: {
    startTime: number;
    duration: number;
  };
  status: JobStatus;
  createdAt: Date;
  completedAt?: Date;
  outputPath?: string;
  error?: string;
}

export interface JobStatus {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface ProcessingJobData {
  videoPath: string;
  framePath: string;
  startTime: number;
  duration: number;
  outputPath: string;
  userId: string;
  jobId: string;
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  format: string;
  bitrate: number;
}

// API Request/Response types
export interface UploadResponse {
  success: boolean;
  filePath: string;
  fileName: string;
  fileSize: number;
  metadata?: {
    duration?: number;
    dimensions?: { width: number; height: number };
  };
}

export interface CreateJobRequest {
  videoPath: string;
  framePath: string;
  startTime: number;
  duration: number;
}

export interface CreateJobResponse {
  success: boolean;
  jobId: string;
  message: string;
}

export interface JobStatusResponse {
  success: boolean;
  job: {
    id: string;
    status: "pending" | "processing" | "completed" | "failed";
    progress: number;
    error?: string;
    createdAt: string;
    completedAt?: string;
  };
}

export interface JobResultResponse {
  success: boolean;
  downloadUrl?: string;
  previewUrl?: string;
  error?: string;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
}

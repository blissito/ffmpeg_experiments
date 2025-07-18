import { z } from "zod";

// File upload validation
export const UploadResponseSchema = z.object({
  success: z.boolean(),
  filePath: z.string(),
  fileName: z.string(),
  fileSize: z.number().int().positive(),
  metadata: z
    .object({
      duration: z.number().positive().optional(),
      dimensions: z
        .object({
          width: z.number().int().positive(),
          height: z.number().int().positive(),
        })
        .optional(),
    })
    .optional(),
});

// Job creation validation
export const CreateJobRequestSchema = z.object({
  videoPath: z.string().min(1, "Video path is required"),
  framePath: z.string().min(1, "Frame path is required"),
  startTime: z.number().min(0, "Start time must be non-negative"),
  duration: z.number().positive("Duration must be positive"),
});

export const CreateJobResponseSchema = z.object({
  success: z.boolean(),
  jobId: z.string(),
  message: z.string(),
});

// Job status response validation
export const JobStatusResponseSchema = z.object({
  success: z.boolean(),
  job: z.object({
    id: z.string(),
    status: z.enum(["pending", "processing", "completed", "failed"]),
    progress: z.number().min(0).max(100),
    error: z.string().optional(),
    createdAt: z.string(), // ISO string
    completedAt: z.string().optional(), // ISO string
  }),
});

// Job result response validation
export const JobResultResponseSchema = z.object({
  success: z.boolean(),
  downloadUrl: z.string().url().optional(),
  previewUrl: z.string().url().optional(),
  error: z.string().optional(),
});

// Generic API error validation
export const ApiErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
});

// Type inference from schemas
export type UploadResponse = z.infer<typeof UploadResponseSchema>;
export type CreateJobRequest = z.infer<typeof CreateJobRequestSchema>;
export type CreateJobResponse = z.infer<typeof CreateJobResponseSchema>;
export type JobStatusResponse = z.infer<typeof JobStatusResponseSchema>;
export type JobResultResponse = z.infer<typeof JobResultResponseSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;

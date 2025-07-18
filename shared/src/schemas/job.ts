import { z } from "zod";

// Job status validation
export const JobStatusSchema = z.object({
  id: z.string(),
  status: z.enum(["pending", "processing", "completed", "failed"]),
  progress: z.number().min(0).max(100),
  error: z.string().optional(),
  createdAt: z.date(),
  completedAt: z.date().optional(),
});

// Video metadata validation
export const VideoMetadataSchema = z.object({
  duration: z.number().positive("Duration must be positive"),
  width: z.number().int().positive("Width must be positive"),
  height: z.number().int().positive("Height must be positive"),
  format: z.string().min(1, "Format is required"),
  bitrate: z.number().positive("Bitrate must be positive"),
});

// File validation schemas
export const VideoFileSchema = z.object({
  originalName: z.string().min(1, "Original name is required"),
  path: z.string().min(1, "Path is required"),
  size: z.number().int().positive("Size must be positive"),
  duration: z.number().positive("Duration must be positive"),
});

export const FrameFileSchema = z.object({
  originalName: z.string().min(1, "Original name is required"),
  path: z.string().min(1, "Path is required"),
  dimensions: z.object({
    width: z.number().int().positive("Width must be positive"),
    height: z.number().int().positive("Height must be positive"),
  }),
});

// Processing parameters validation
export const ProcessingParametersSchema = z.object({
  startTime: z.number().min(0, "Start time must be non-negative"),
  duration: z.number().positive("Duration must be positive"),
});

// Main job validation
export const JobSchema = z.object({
  id: z.string(),
  userId: z.string(),
  videoFile: VideoFileSchema,
  frameFile: FrameFileSchema,
  parameters: ProcessingParametersSchema,
  status: JobStatusSchema,
  createdAt: z.date(),
  completedAt: z.date().optional(),
  outputPath: z.string().optional(),
  error: z.string().optional(),
});

// Processing job data for Agenda.js
export const ProcessingJobDataSchema = z.object({
  videoPath: z.string().min(1, "Video path is required"),
  framePath: z.string().min(1, "Frame path is required"),
  startTime: z.number().min(0, "Start time must be non-negative"),
  duration: z.number().positive("Duration must be positive"),
  outputPath: z.string().min(1, "Output path is required"),
  userId: z.string().min(1, "User ID is required"),
  jobId: z.string().min(1, "Job ID is required"),
});

// Type inference from schemas
export type JobStatus = z.infer<typeof JobStatusSchema>;
export type VideoMetadata = z.infer<typeof VideoMetadataSchema>;
export type VideoFile = z.infer<typeof VideoFileSchema>;
export type FrameFile = z.infer<typeof FrameFileSchema>;
export type ProcessingParameters = z.infer<typeof ProcessingParametersSchema>;
export type Job = z.infer<typeof JobSchema>;
export type ProcessingJobData = z.infer<typeof ProcessingJobDataSchema>;

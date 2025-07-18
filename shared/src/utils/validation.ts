import { z } from "zod";

// Generic validation result type
export type ValidationResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: string;
      issues: z.ZodIssue[];
    };

// Generic validation function
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const result = schema.parse(data);
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues.map((issue) => issue.message).join(", "),
        issues: error.issues,
      };
    }
    return {
      success: false,
      error: "Unknown validation error",
      issues: [],
    };
  }
}

// Safe parsing with default values
export function safeParseWithDefault<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  defaultValue: T
): T {
  const result = schema.safeParse(data);
  return result.success ? result.data : defaultValue;
}

// File validation utilities
export const SUPPORTED_VIDEO_FORMATS = ["mp4", "mov", "avi", "mkv", "webm"];
export const SUPPORTED_IMAGE_FORMATS = ["png", "jpg", "jpeg", "gif", "webp"];
export const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

export function validateVideoFile(file: {
  name: string;
  size: number;
}): ValidationResult<boolean> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (!extension || !SUPPORTED_VIDEO_FORMATS.includes(extension)) {
    return {
      success: false,
      error: `Unsupported video format. Supported formats: ${SUPPORTED_VIDEO_FORMATS.join(
        ", "
      )}`,
      issues: [],
    };
  }

  if (file.size > MAX_VIDEO_SIZE) {
    return {
      success: false,
      error: `Video file too large. Maximum size: ${
        MAX_VIDEO_SIZE / (1024 * 1024)
      }MB`,
      issues: [],
    };
  }

  return { success: true, data: true };
}

export function validateImageFile(file: {
  name: string;
  size: number;
}): ValidationResult<boolean> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (!extension || !SUPPORTED_IMAGE_FORMATS.includes(extension)) {
    return {
      success: false,
      error: `Unsupported image format. Supported formats: ${SUPPORTED_IMAGE_FORMATS.join(
        ", "
      )}`,
      issues: [],
    };
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return {
      success: false,
      error: `Image file too large. Maximum size: ${
        MAX_IMAGE_SIZE / (1024 * 1024)
      }MB`,
      issues: [],
    };
  }

  return { success: true, data: true };
}

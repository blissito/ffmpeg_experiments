// File size limits
export const FILE_SIZE_LIMITS = {
  VIDEO_MAX: 500 * 1024 * 1024, // 500MB
  IMAGE_MAX: 10 * 1024 * 1024, // 10MB
} as const;

// Supported file formats
export const SUPPORTED_FORMATS = {
  VIDEO: ["mp4", "mov", "avi", "mkv", "webm"] as const,
  IMAGE: ["png", "jpg", "jpeg", "gif", "webp"] as const,
} as const;

// User quota limits
export const USER_QUOTAS = {
  FREE: {
    MONTHLY_VIDEOS: 5,
    MAX_VIDEO_DURATION: 300, // 5 minutes in seconds
  },
  PREMIUM: {
    MONTHLY_VIDEOS: 100,
    MAX_VIDEO_DURATION: 3600, // 1 hour in seconds
  },
} as const;

// Job processing limits
export const PROCESSING_LIMITS = {
  MAX_QUEUE_SIZE: 100,
  MAX_CONCURRENT_JOBS: 5,
  JOB_TIMEOUT: 30 * 60 * 1000, // 30 minutes in milliseconds
} as const;

// API rate limits
export const RATE_LIMITS = {
  UPLOAD: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 10,
  },
  API: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
  },
} as const;

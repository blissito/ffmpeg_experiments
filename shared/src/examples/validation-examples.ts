// Examples of how to use the validation schemas
import {
  UserRegistrationSchema,
  CreateJobRequestSchema,
  validateData,
  validateVideoFile,
  validateImageFile,
} from "../index.js";

// Example: User registration validation
export function validateUserRegistration(data: unknown) {
  return validateData(UserRegistrationSchema, data);
}

// Example: Job creation validation
export function validateJobCreation(data: unknown) {
  return validateData(CreateJobRequestSchema, data);
}

// Example usage:
/*
const userResult = validateUserRegistration({
  email: "user@example.com",
  password: "securepassword123"
});

if (userResult.success) {
  console.log("Valid user data:", userResult.data);
} else {
  console.error("Validation error:", userResult.error);
}

const jobResult = validateJobCreation({
  videoPath: "/uploads/video.mp4",
  framePath: "/uploads/frame.png",
  startTime: 10,
  duration: 30
});

if (jobResult.success) {
  console.log("Valid job data:", jobResult.data);
} else {
  console.error("Validation error:", jobResult.error);
}

// File validation examples
const videoValidation = validateVideoFile({
  name: "my-video.mp4",
  size: 50 * 1024 * 1024 // 50MB
});

const imageValidation = validateImageFile({
  name: "overlay.png",
  size: 2 * 1024 * 1024 // 2MB
});
*/

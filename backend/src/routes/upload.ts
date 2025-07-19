import { Hono } from "hono";
import path from "path";
import fs from "fs/promises";
import {
  validateVideoFile,
  validateImageFile,
} from "../../../shared/src/utils/validation.js";
import {
  FILE_SIZE_LIMITS,
  SUPPORTED_FORMATS,
} from "../../../shared/src/constants/limits.js";
import { storageService } from "../services/storage.js";

const app = new Hono();

// Ensure upload directory exists
async function ensureUploadDir() {
  const uploadDir = path.join(process.cwd(), "uploads");
  try {
    await fs.mkdir(uploadDir, { recursive: true });
    return uploadDir;
  } catch (error) {
    console.error("Failed to create upload directory:", error);
    throw error;
  }
}

// Generate unique filename
function generateUniqueFilename(originalName: string, prefix: string): string {
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const extension = path.extname(originalName);
  return `${prefix}-${uniqueSuffix}${extension}`;
}

// Video upload endpoint
app.post("/video", async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body.video as File;

    if (!file || !(file instanceof File)) {
      return c.json({ error: "No video file uploaded" }, 400);
    }

    // Validate file size
    if (file.size > FILE_SIZE_LIMITS.VIDEO_MAX) {
      return c.json(
        {
          error: `Video file too large. Maximum size: ${
            FILE_SIZE_LIMITS.VIDEO_MAX / (1024 * 1024)
          }MB`,
        },
        400
      );
    }

    // Validate video file
    const validation = validateVideoFile({
      name: file.name,
      size: file.size,
    });

    if (!validation.success) {
      return c.json({ error: validation.error }, 400);
    }

    // Ensure upload directory exists
    const uploadDir = await ensureUploadDir();

    // Generate unique filename
    const filename = generateUniqueFilename(file.name, "video");
    const filePath = path.join(uploadDir, filename);

    // Save file to disk
    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(filePath, new Uint8Array(arrayBuffer));

    // Upload to S3 storage
    const s3Key = `videos/${filename}`;
    let s3Url: string | undefined;

    try {
      s3Url = await storageService.uploadFile(filePath, s3Key);
      console.log(`✅ Video uploaded to S3: ${s3Url}`);
    } catch (s3Error) {
      console.error(
        "⚠️  Failed to upload to S3, continuing with local storage:",
        s3Error
      );
    }

    // Return file information
    return c.json({
      success: true,
      file: {
        id: path.basename(filename, path.extname(filename)),
        originalName: file.name,
        filename: filename,
        path: filePath,
        s3Key: s3Key,
        s3Url: s3Url,
        size: file.size,
        mimetype: file.type,
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Video upload error:", error);
    return c.json({ error: "Failed to upload video file" }, 500);
  }
});

// Frame/image upload endpoint
app.post("/frame", async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body.frame as File;

    if (!file || !(file instanceof File)) {
      return c.json({ error: "No frame file uploaded" }, 400);
    }

    // Validate file size
    if (file.size > FILE_SIZE_LIMITS.IMAGE_MAX) {
      return c.json(
        {
          error: `Image file too large. Maximum size: ${
            FILE_SIZE_LIMITS.IMAGE_MAX / (1024 * 1024)
          }MB`,
        },
        400
      );
    }

    // Validate image file
    const validation = validateImageFile({
      name: file.name,
      size: file.size,
    });

    if (!validation.success) {
      return c.json({ error: validation.error }, 400);
    }

    // Ensure upload directory exists
    const uploadDir = await ensureUploadDir();

    // Generate unique filename
    const filename = generateUniqueFilename(file.name, "frame");
    const filePath = path.join(uploadDir, filename);

    // Save file to disk
    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(filePath, new Uint8Array(arrayBuffer));

    // Upload to S3 storage
    const s3Key = `frames/${filename}`;
    let s3Url: string | undefined;

    try {
      s3Url = await storageService.uploadFile(filePath, s3Key);
      console.log(`✅ Frame uploaded to S3: ${s3Url}`);
    } catch (s3Error) {
      console.error(
        "⚠️  Failed to upload to S3, continuing with local storage:",
        s3Error
      );
    }

    // Return file information
    return c.json({
      success: true,
      file: {
        id: path.basename(filename, path.extname(filename)),
        originalName: file.name,
        filename: filename,
        path: filePath,
        s3Key: s3Key,
        s3Url: s3Url,
        size: file.size,
        mimetype: file.type,
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Frame upload error:", error);
    return c.json({ error: "Failed to upload frame file" }, 500);
  }
});

// Get upload info endpoint
app.get("/info", (c) => {
  return c.json({
    limits: {
      video: {
        maxSize: FILE_SIZE_LIMITS.VIDEO_MAX,
        maxSizeMB: FILE_SIZE_LIMITS.VIDEO_MAX / (1024 * 1024),
        supportedFormats: SUPPORTED_FORMATS.VIDEO,
      },
      image: {
        maxSize: FILE_SIZE_LIMITS.IMAGE_MAX,
        maxSizeMB: FILE_SIZE_LIMITS.IMAGE_MAX / (1024 * 1024),
        supportedFormats: SUPPORTED_FORMATS.IMAGE,
      },
    },
  });
});

export default app;

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs/promises";
import path from "path";

export interface StorageService {
  uploadFile(filePath: string, key: string): Promise<string>;
  uploadBuffer(
    buffer: Buffer,
    key: string,
    contentType?: string
  ): Promise<string>;
  downloadFile(key: string, localPath: string): Promise<void>;
  deleteFile(key: string): Promise<void>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
  fileExists(key: string): Promise<boolean>;
  getFileSize(key: string): Promise<number>;
}

export class TigrisS3StorageService implements StorageService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    // Initialize S3 client with Tigris configuration
    this.s3Client = new S3Client({
      region: process.env.TIGRIS_REGION || "auto",
      endpoint: process.env.TIGRIS_ENDPOINT || "https://fly.storage.tigris.dev",
      credentials: {
        accessKeyId: process.env.TIGRIS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.TIGRIS_SECRET_ACCESS_KEY || "",
      },
      forcePathStyle: true, // Required for Tigris
    });

    this.bucketName = process.env.TIGRIS_BUCKET_NAME || "video-frame-overlay";
  }

  async uploadFile(filePath: string, key: string): Promise<string> {
    try {
      console.log(`📤 Uploading file to S3: ${key}`);

      // Read file from disk
      const fileBuffer = await fs.readFile(filePath);

      // Determine content type based on file extension
      const contentType = this.getContentType(filePath);

      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
      });

      await this.s3Client.send(command);

      const url = `${process.env.TIGRIS_ENDPOINT}/${this.bucketName}/${key}`;
      console.log(`✅ File uploaded successfully: ${url}`);

      return url;
    } catch (error) {
      console.error(`❌ Failed to upload file ${key}:`, error);
      throw new Error(
        `Failed to upload file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async uploadBuffer(
    buffer: Buffer,
    key: string,
    contentType?: string
  ): Promise<string> {
    try {
      console.log(`📤 Uploading buffer to S3: ${key}`);

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType || "application/octet-stream",
      });

      await this.s3Client.send(command);

      const url = `${process.env.TIGRIS_ENDPOINT}/${this.bucketName}/${key}`;
      console.log(`✅ Buffer uploaded successfully: ${url}`);

      return url;
    } catch (error) {
      console.error(`❌ Failed to upload buffer ${key}:`, error);
      throw new Error(
        `Failed to upload buffer: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async downloadFile(key: string, localPath: string): Promise<void> {
    try {
      console.log(`📥 Downloading file from S3: ${key}`);

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      if (!response.Body) {
        throw new Error("No file content received");
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      const reader = response.Body.transformToWebStream().getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      const buffer = Buffer.concat(chunks);

      // Ensure directory exists
      await fs.mkdir(path.dirname(localPath), { recursive: true });

      // Write file to disk
      await fs.writeFile(localPath, buffer);

      console.log(`✅ File downloaded successfully: ${localPath}`);
    } catch (error) {
      console.error(`❌ Failed to download file ${key}:`, error);
      throw new Error(
        `Failed to download file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      console.log(`🗑️  Deleting file from S3: ${key}`);

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);

      console.log(`✅ File deleted successfully: ${key}`);
    } catch (error) {
      console.error(`❌ Failed to delete file ${key}:`, error);
      throw new Error(
        `Failed to delete file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      console.log(`🔗 Generating signed URL for: ${key}`);

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      console.log(`✅ Signed URL generated: ${signedUrl}`);
      return signedUrl;
    } catch (error) {
      console.error(`❌ Failed to generate signed URL for ${key}:`, error);
      throw new Error(
        `Failed to generate signed URL: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error: any) {
      if (
        error.name === "NotFound" ||
        error.$metadata?.httpStatusCode === 404
      ) {
        return false;
      }
      console.error(`❌ Error checking file existence ${key}:`, error);
      throw error;
    }
  }

  async getFileSize(key: string): Promise<number> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      return response.ContentLength || 0;
    } catch (error) {
      console.error(`❌ Failed to get file size for ${key}:`, error);
      throw new Error(
        `Failed to get file size: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private getContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();

    const contentTypes: Record<string, string> = {
      // Video formats
      ".mp4": "video/mp4",
      ".mov": "video/quicktime",
      ".avi": "video/x-msvideo",
      ".mkv": "video/x-matroska",
      ".webm": "video/webm",

      // Image formats
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".webp": "image/webp",

      // Default
      "": "application/octet-stream",
    };

    return contentTypes[ext] || "application/octet-stream";
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Try to list objects in the bucket (with limit 1)
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: "health-check-dummy-key",
      });

      // This will fail with 404, but if S3 is accessible, we'll get a proper 404
      // If S3 is not accessible, we'll get a connection error
      try {
        await this.s3Client.send(command);
      } catch (error: any) {
        // 404 is expected and means S3 is accessible
        if (
          error.name === "NotFound" ||
          error.$metadata?.httpStatusCode === 404
        ) {
          return true;
        }
        throw error;
      }

      return true;
    } catch (error) {
      console.error("❌ S3 health check failed:", error);
      return false;
    }
  }
}

// Export singleton instance
export const storageService = new TigrisS3StorageService();

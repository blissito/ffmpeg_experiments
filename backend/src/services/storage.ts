export interface StorageService {
  uploadFile(filePath: string, key: string): Promise<string>;
  downloadFile(key: string, localPath: string): Promise<void>;
  deleteFile(key: string): Promise<void>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
}

// Placeholder implementation - will be implemented in later tasks
export class S3StorageService implements StorageService {
  async uploadFile(filePath: string, key: string): Promise<string> {
    throw new Error("Not implemented yet");
  }

  async downloadFile(key: string, localPath: string): Promise<void> {
    throw new Error("Not implemented yet");
  }

  async deleteFile(key: string): Promise<void> {
    throw new Error("Not implemented yet");
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    throw new Error("Not implemented yet");
  }
}

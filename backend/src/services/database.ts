import { MongoClient, Db } from "mongodb";

class DatabaseService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private connectionString: string;

  constructor() {
    console.log("🔍 Debug - MONGODB_URI:", process.env.MONGODB_URI);
    this.connectionString =
      process.env.MONGODB_URI ||
      "mongodb://localhost:27017/video-frame-overlay";
    console.log("🔍 Debug - Connection string:", this.connectionString);
  }

  async connect(): Promise<void> {
    try {
      if (this.client && this.db) {
        // Already connected
        return;
      }

      console.log("🔌 Connecting to MongoDB...");

      this.client = new MongoClient(this.connectionString, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      await this.client.connect();

      // Test the connection
      await this.client.db("admin").command({ ping: 1 });

      this.db = this.client.db();

      console.log("✅ MongoDB connected successfully");
    } catch (error) {
      console.error("❌ MongoDB connection failed:", error);
      throw new Error(
        `Failed to connect to MongoDB: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.close();
        this.client = null;
        this.db = null;
        console.log("🔌 MongoDB disconnected");
      }
    } catch (error) {
      console.error("❌ Error disconnecting from MongoDB:", error);
      throw error;
    }
  }

  getDb(): Db {
    if (!this.db) {
      throw new Error("Database not connected. Call connect() first.");
    }
    return this.db;
  }

  getClient(): MongoClient {
    if (!this.client) {
      throw new Error("Database client not connected. Call connect() first.");
    }
    return this.client;
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.client) {
        return false;
      }

      await this.client.db("admin").command({ ping: 1 });
      return true;
    } catch (error) {
      console.error("❌ MongoDB health check failed:", error);
      return false;
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();

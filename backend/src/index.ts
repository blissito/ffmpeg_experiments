// Bun loads .env automatically from project root
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serveStatic } from "hono/bun";
import { databaseService, queueService } from "./services/index.js";

const app = new Hono();

// Middleware
app.use("*", cors());
app.use("*", logger());

// Initialize services
async function initializeServices() {
  try {
    await databaseService.connect();
    await queueService.initialize();
    console.log("✅ All services initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize services:", error);
    console.warn(
      "⚠️  Server will continue without full service initialization"
    );
    // Don't exit in development, allow server to start
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🔄 Shutting down gracefully...");
  try {
    await queueService.shutdown();
    await databaseService.disconnect();
    console.log("✅ Shutdown complete");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
    process.exit(1);
  }
});

process.on("SIGTERM", async () => {
  console.log("\n🔄 Shutting down gracefully...");
  try {
    await queueService.shutdown();
    await databaseService.disconnect();
    console.log("✅ Shutdown complete");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
    process.exit(1);
  }
});

// API routes first - they take priority
app.get("/api/health", async (c) => {
  const dbHealth = await databaseService.healthCheck();
  const queueHealth = await queueService.healthCheck();
  const storageHealth = await storageService.healthCheck();

  return c.json({
    status: dbHealth && queueHealth && storageHealth ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    services: {
      database: dbHealth ? "healthy" : "unhealthy",
      queue: queueHealth ? "healthy" : "unhealthy",
      storage: storageHealth ? "healthy" : "unhealthy",
    },
  });
});

// Import routes and services
import uploadRoutes from "./routes/upload.js";
import { storageService } from "./services/storage.js";

// API routes
app.route("/api/upload", uploadRoutes);

// Frontend handling
if (process.env.NODE_ENV === "production") {
  // Production: serve static files
  app.use("/*", serveStatic({ root: "./frontend/dist" }));
} else {
  // Development: Vite middleware for hot reloading
  const { createServer } = await import("vite");
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "spa",
    root: "./frontend",
  });

  app.use("*", async (c) => {
    const url = new URL(c.req.url);

    // Skip API routes
    if (url.pathname.startsWith("/api")) {
      return;
    }

    try {
      // Let Vite handle the request
      const template = await vite.transformIndexHtml(
        url.pathname,
        `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Video Frame Overlay</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
      );

      return c.html(template);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      console.error(e);
      return c.text("Internal Server Error", 500);
    }
  });
}

const port = process.env.PORT || 3000;

// Initialize services in background
initializeServices().catch(console.error);

console.log(`🚀 Server running on http://localhost:${port}`);
console.log(`📱 Frontend: http://localhost:${port}`);
console.log(`🔌 API: http://localhost:${port}/api`);

export default {
  port,
  fetch: app.fetch,
};

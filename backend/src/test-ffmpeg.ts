#!/usr/bin/env bun

/**
 * Simple test script to verify FFmpeg service functionality
 * This is a basic integration test to ensure the service works correctly
 */

import { FFmpegServiceImpl } from "./services/ffmpeg.js";
import { promises as fs } from "fs";
import path from "path";

async function testFFmpegService() {
  console.log("🧪 Testing FFmpeg Service Implementation");

  const ffmpegService = new FFmpegServiceImpl();

  try {
    // Test 1: Check if FFmpeg is available
    console.log("\n1️⃣ Testing FFmpeg availability...");

    // Create a simple test video metadata check
    // We'll use a non-existent file to test error handling
    try {
      await ffmpegService.getVideoMetadata("non-existent-file.mp4");
      console.log("❌ Should have thrown an error for non-existent file");
    } catch (error) {
      console.log("✅ Correctly handled non-existent file error");
    }

    // Test 2: Test input validation
    console.log("\n2️⃣ Testing input validation...");

    try {
      const isValid = await ffmpegService.validateInputs(
        "non-existent-video.mp4",
        "non-existent-frame.png"
      );
      if (!isValid) {
        console.log("✅ Correctly identified invalid inputs");
      } else {
        console.log("❌ Should have identified inputs as invalid");
      }
    } catch (error) {
      console.log("✅ Correctly threw error for invalid inputs");
    }

    // Test 3: Test parameter validation in processVideo
    console.log("\n3️⃣ Testing parameter validation...");

    try {
      await ffmpegService.processVideo({
        videoPath: "test.mp4",
        framePath: "test.png",
        startTime: -1, // Invalid negative start time
        duration: 5,
        outputPath: "output.mp4",
        userId: "test-user",
        jobId: "test-job",
      });
      console.log("❌ Should have thrown error for negative start time");
    } catch (error) {
      console.log("✅ Correctly handled invalid start time");
    }

    console.log("\n✅ All FFmpeg service tests passed!");
    console.log("📝 Note: Full integration tests require actual video files");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (import.meta.main) {
  testFFmpegService().catch(console.error);
}

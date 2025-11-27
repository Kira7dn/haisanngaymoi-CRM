#!/usr/bin/env tsx

/**
 * TikTok Worker Startup Script
 *
 * This script initializes and runs the TikTok background worker.
 * The worker handles:
 * - Automatic token refresh for expiring tokens
 * - Analytics sync for TikTok videos
 * - Scheduled checks for token expiration
 *
 * Usage:
 *   npm run worker:tiktok
 *   or
 *   npx tsx --env-file=.env scripts/start-tiktok-worker.ts
 */

import {
  initializeTikTokWorker,
  shutdownTikTokWorker,
  scheduleTokenRefreshCheck,
} from '../infrastructure/queue/tiktok-worker';

async function main() {
  console.log('🚀 Starting TikTok Worker...');
  console.log('━'.repeat(50));

  // Check required environment variables
  const requiredEnvVars = ['REDIS_URL', 'TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET'];
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('Please set these in your .env file');
    process.exit(1);
  }

  try {
    // Initialize the worker
    const worker = initializeTikTokWorker();
    console.log('✅ TikTok Worker initialized successfully');

    // Schedule recurring token refresh check
    await scheduleTokenRefreshCheck();
    console.log('✅ Scheduled hourly token expiration checks');

    console.log('━'.repeat(50));
    console.log('📡 Worker is now listening for jobs...');
    console.log('Press Ctrl+C to stop');
    console.log('━'.repeat(50));

    // Handle graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
      await shutdownTikTokWorker();
      console.log('✅ Worker shutdown complete');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Keep the process running
    await new Promise(() => {});
  } catch (error) {
    console.error('❌ Failed to start TikTok Worker:', error);
    process.exit(1);
  }
}

// Run the worker
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

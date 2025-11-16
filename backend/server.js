// File: FinanceTracker/backend/server.js
import dotenv from 'dotenv';
import { createApp } from './src/app.js';
import { connectDatabase } from './src/config/database.js';
import { config } from './src/config/environment.js';

// Load environment variables
dotenv.config();

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();
    console.log('📦 MongoDB connected successfully');

    // Create Fastify app
    const app = await createApp();

    // Start listening
    await app.listen({ port: config.PORT, host: '0.0.0.0' });
    console.log(`🚀 Server running on port ${config.PORT} in ${config.NODE_ENV} mode`);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
  process.exit(1);
});

startServer();

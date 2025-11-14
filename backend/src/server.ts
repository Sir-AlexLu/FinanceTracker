import { buildApp } from './app';
import { validateEnv, getEnv } from './config/env';
import { startCronJobs } from './jobs';

async function start() {
  try {
    // Validate environment variables first
    validateEnv();
    const env = getEnv();

    // Build Fastify app
    const fastify = await buildApp();

    // Start background jobs
    startCronJobs();

    // Start HTTP server
    await fastify.listen({
      port: env.PORT,
      host: env.HOST,
    });

    // Success banner
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 Finance Tracker API Started Successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📍 Environment:  ${env.NODE_ENV}`);
    console.log(`🌐 Server:       http://${env.HOST}:${env.PORT}`);
    console.log(`💾 Database:     ${env.MONGODB_DB_NAME}`);
    console.log(`🔒 CORS:         ${env.FRONTEND_URL}`);
    console.log(`📊 API Docs:     http://${env.HOST}:${env.PORT}/documentation`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // Graceful shutdown
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
    signals.forEach((signal) => {
      process.on(signal, async () => {
        console.log(`\n📭 Received ${signal}, shutting down gracefully...`);
        await fastify.close();
        console.log('✅ Server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Global error handlers (critical for production)
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the app
start();

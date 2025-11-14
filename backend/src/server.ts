import { buildApp } from './app';
import { validateEnv, getEnv } from './config/env';

async function start() {
  try {
    // Validate environment variables
    validateEnv();
    const env = getEnv();

    // Build Fastify app
    const fastify = await buildApp();

    // Start server
    await fastify.listen({
      port: env.PORT,
      host: env.HOST,
    });

    console.log('');
    console.log('🚀 Finance Tracker API Started Successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📍 Environment: ${env.NODE_ENV}`);
    console.log(`🌐 Server:      http://${env.HOST}:${env.PORT}`);
    console.log(`💾 Database:    ${env.MONGODB_DB_NAME}`);
    console.log(`🔒 CORS:        ${env.FRONTEND_URL}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // Graceful shutdown
    const signals = ['SIGINT', 'SIGTERM'];
    signals.forEach((signal) => {
      process.on(signal, async () => {
        console.log('');
        console.log(`📭 Received ${signal}, closing server gracefully...`);
        await fastify.close();
        console.log('✅ Server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
}

start();

// src/server.ts
import { buildApp } from './app.js';
import { validateEnv } from './config/env.js';
import { startCronJobs } from './jobs/index.js';
import { logger } from './utils/logger.js';

async function start() {
  try {
    validateEnv();

    const app = await buildApp();

    startCronJobs(app);

    const address = await app.listen({
      port: Number(process.env.PORT) || 3001,
      host: process.env.HOST || '0.0.0.0',
    });

    logger.info(
      {
        address,
        env: process.env.NODE_ENV,
        db: process.env.MONGODB_DB_NAME,
        cors: process.env.FRONTEND_URL,
      },
      'Finance Tracker API Started'
    );

    // Graceful shutdown
    const signals = ['SIGINT', 'SIGTERM'] as const;
    for (const signal of signals) {
      process.on(signal, async () => {
        logger.warn(`Received ${signal}. Shutting down...`);
        await app.close();
        logger.info('Server closed gracefully');
        process.exit(0);
      });
    }
  } catch (err) {
    logger.error(err, 'Failed to start server');
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled Rejection');
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error(err, 'Uncaught Exception');
  process.exit(1);
});

start();

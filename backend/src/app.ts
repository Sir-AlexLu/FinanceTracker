// src/app.ts
import Fastify from 'fastify';
import corsPlugin from './plugins/cors.js';
import helmetPlugin from './plugins/helmet.js';
import rateLimitPlugin from './plugins/rateLimit.js';
import jwtPlugin from './plugins/jwt.js';
import sensiblePlugin from './plugins/sensible.js';
import mongoosePlugin from './plugins/mongoose.js';
import routes from './routes/index.js';
import { getEnv } from './config/env.js';
import { logger } from './utils/logger.js';
import type { FastifyInstance } from 'fastify';

export async function buildApp(): Promise<FastifyInstance> {
  const env = getEnv();

  const app = Fastify({
    logger,
    trustProxy: true,
    disableRequestLogging: env.NODE_ENV === 'production',
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'reqId',
    bodyLimit: 1_048_576, // 1MB
    connectionTimeout: 30_000,
    keepAliveTimeout: 5_000,
  });

  // Register core plugins
  await app.register(sensiblePlugin);
  await app.register(corsPlugin);
  await app.register(helmetPlugin);
  await app.register(rateLimitPlugin);
  await app.register(jwtPlugin);
  await app.register(mongoosePlugin);

  // Register all API routes
  await app.register(routes, { prefix: '/api' });

  // Health check
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: env.NODE_ENV,
  }));

  // Root
  app.get('/', async () => ({
    name: 'Finance Tracker API',
    version: '2.0.0',
    status: 'running',
    docs: '/documentation',
  }));

  // 404
  app.setNotFoundHandler((req, reply) => {
    reply.notFound();
  });

  // Global error handler
  app.setErrorHandler((error, req, reply) => {
    logger.error(error, 'Unhandled error');

    const statusCode = error.statusCode ?? 500;
    const message =
      env.NODE_ENV === 'production' && statusCode >= 500
        ? 'Internal Server Error'
        : error.message;

    reply.status(statusCode).send({
      statusCode,
      error: error.name || 'Error',
      message,
    });
  });

  return app;
}

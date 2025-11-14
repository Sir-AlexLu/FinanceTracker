import Fastify, { FastifyInstance } from 'fastify';
import { getEnv } from './config/env';

// Plugins
import corsPlugin from './plugins/cors';
import helmetPlugin from './plugins/helmet';
import rateLimitPlugin from './plugins/rateLimit';
import jwtPlugin from './plugins/jwt';
import sensiblePlugin from './plugins/sensible';
import mongoosePlugin from './plugins/mongoose';

// Routes
import routes from './routes';

export async function buildApp(): Promise<FastifyInstance> {
  const env = getEnv();

  const fastify = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport:
        env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
                colorize: true,
              },
            }
          : undefined,
    },
    trustProxy: true,
    disableRequestLogging: env.NODE_ENV === 'production',
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'reqId',
    bodyLimit: 1048576, // 1MB
    connectionTimeout: 30000,
    keepAliveTimeout: 5000,
  });

  // Register plugins in order
  await fastify.register(sensiblePlugin);
  await fastify.register(corsPlugin);
  await fastify.register(helmetPlugin);
  await fastify.register(rateLimitPlugin);
  await fastify.register(jwtPlugin);
  await fastify.register(mongoosePlugin);

  // Register all routes (from ./routes/index.ts or similar)
  await fastify.register(routes);

  // Health check route - critical for monitoring
  fastify.get('/api/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: env.NODE_ENV,
    };
  });

  // Root route
  fastify.get('/', async () => {
    return {
      name: 'Finance Tracker API',
      version: '1.5.0',
      status: 'running',
      message: 'Welcome to Finance Tracker API',
      docs: '/documentation',
    };
  });

  // 404 handler
  fastify.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: `Route ${request.method}:${request.url} not found`,
    });
  });

  // Global error handler
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);

    const statusCode = error.statusCode || 500;

    // Don't expose internal errors in production
    const message =
      env.NODE_ENV === 'production' && statusCode === 500
        ? 'Internal Server Error'
        : error.message || 'An unexpected error occurred';

    reply.status(statusCode).send({
      statusCode,
      error: error.name || 'Error',
      message,
    });
  });

  return fastify;
}

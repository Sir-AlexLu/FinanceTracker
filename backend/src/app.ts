import Fastify, { FastifyInstance } from 'fastify';
import { getEnv } from './config/env';

// Plugins
import corsPlugin from './plugins/cors';
import helmetPlugin from './plugins/helmet';
import rateLimitPlugin from './plugins/rateLimit';
import jwtPlugin from './plugins/jwt';
import sensiblePlugin from './plugins/sensible';
import mongoosePlugin from './plugins/mongoose';

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

  // Register plugins
  await fastify.register(sensiblePlugin);
  await fastify.register(corsPlugin);
  await fastify.register(helmetPlugin);
  await fastify.register(rateLimitPlugin);
  await fastify.register(jwtPlugin);
  await fastify.register(mongoosePlugin);

  // Health check route
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

  // Error handler
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);

    const statusCode = error.statusCode || 500;

    reply.status(statusCode).send({
      statusCode,
      error: error.name || 'Internal Server Error',
      message: error.message || 'An unexpected error occurred',
    });
  });

  return fastify;
}

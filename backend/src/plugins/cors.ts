import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import { FastifyInstance } from 'fastify';
import { getEnv } from '../config/env';

export default fp(async (fastify: FastifyInstance) => {
  const env = getEnv();

  const allowedOrigins =
    env.NODE_ENV === 'production'
      ? [env.FRONTEND_URL]
      : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'];

  await fastify.register(cors, {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400, // 24 hours
  });

  fastify.log.info('✅ CORS plugin registered');
});

// src/plugins/cors.ts
import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import { getEnv } from '../config/env.js';

export default fp(async (fastify) => {
  const env = getEnv();

  const origins = env.NODE_ENV === 'production'
    ? [env.FRONTEND_URL]
    : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'];

  await fastify.register(cors, {
    origin: (origin, callback) => {
      if (!origin || origins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS policy violation'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86_400,
  });

  fastify.log.info('CORS configured');
});

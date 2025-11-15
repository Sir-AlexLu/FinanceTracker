// src/plugins/rateLimit.ts
import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';
import { getEnv } from '../config/env.js';

export default fp(async (fastify) => {
  const env = getEnv();

  await fastify.register(rateLimit, {
    max: Number(env.RATE_LIMIT_MAX),
    timeWindow: Number(env.RATE_LIMIT_TIMEWINDOW),
    redis: env.REDIS_URL ? { url: env.REDIS_URL } : undefined,
    keyGenerator: (req) => req.ip,
    ban: 3,
    errorResponseBuilder: (req, ctx) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      retryAfter: Math.ceil(ctx.ttl / 1000),
    }),
  });

  fastify.log.info('Rate limiting active');
});

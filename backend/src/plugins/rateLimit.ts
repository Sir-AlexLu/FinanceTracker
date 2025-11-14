import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';
import { FastifyInstance } from 'fastify';
import { getEnv } from '../config/env';

export default fp(async (fastify: FastifyInstance) => {
  const env = getEnv();

  await fastify.register(rateLimit, {
    global: true,
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_TIMEWINDOW,
    cache: 10000,
    allowList: ['127.0.0.1'],
    redis: env.REDIS_URL ? { url: env.REDIS_URL } : undefined,
    keyGenerator: (request) => {
      return (request.headers['x-forwarded-for'] as string) || request.ip || 'unknown';
    },
    errorResponseBuilder: (request, context) => {
      return {
        statusCode: 429,
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
      };
    },
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
    },
  });

  fastify.log.info('✅ Rate limiting plugin registered');
});

// src/plugins/jwt.ts
import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import { getEnv } from '../config/env.js';

export default fp(async (fastify) => {
  const env = getEnv();

  await fastify.register(jwt, {
    secret: env.JWT_ACCESS_SECRET,
    sign: { expiresIn: env.JWT_ACCESS_EXPIRES_IN },
    verify: { maxAge: env.JWT_ACCESS_EXPIRES_IN },
  });

  // Access token decorator
  fastify.decorate('authenticate', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      reply.unauthorized('Invalid or expired access token');
    }
  });

  // Refresh token decorator
  fastify.decorate('verifyRefresh', async (request, reply) => {
    try {
      const token = request.cookies.refreshToken;
      if (!token) throw new Error();
      const payload = fastify.jwt.verify(token, { secret: env.JWT_REFRESH_SECRET });
      request.user = payload;
    } catch {
      reply.unauthorized('Invalid refresh token');
    }
  });

  fastify.log.info('JWT system ready');
});

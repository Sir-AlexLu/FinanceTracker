import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getEnv } from '../config/env';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    user?: {
      userId: string;
      email: string;
    };
  }
}

export default fp(async (fastify: FastifyInstance) => {
  const env = getEnv();

  // Register JWT plugin with namespace for access tokens
  await fastify.register(jwt, {
    secret: env.JWT_ACCESS_SECRET,
    sign: {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    },
    namespace: 'access',
    jwtDecode: true,
  });

  // Register JWT plugin with namespace for refresh tokens
  await fastify.register(jwt, {
    secret: env.JWT_REFRESH_SECRET,
    sign: {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    },
    namespace: 'refresh',
    jwtDecode: true,
  });

  // Decorate with authenticate method
  fastify.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      const token = await request.jwtVerify({ namespace: 'access' });
      request.user = token as { userId: string; email: string };
    } catch (err) {
      reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
    }
  });

  fastify.log.info('✅ JWT authentication plugin registered');
});

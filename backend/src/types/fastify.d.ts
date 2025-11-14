import { FastifyRequest } from 'fastify';
import { z } from 'zod';

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

import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '@/utils/jwt';
import { ApiResponse } from '@/types/common';

export const authenticate = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    await request.jwtVerify();
    const user = verifyToken(request);
    
    if (!user) {
      return reply.status(401).send({
        success: false,
        message: 'Invalid authentication token',
      } as ApiResponse);
    }
    
    request.user = user;
  } catch (err) {
    return reply.status(401).send({
      success: false,
      message: 'Authentication failed',
    } as ApiResponse);
  }
};

// Extend FastifyRequest to include user
declare module 'fastify' {
  export interface FastifyRequest {
    user?: {
      id: string;
      username: string;
    };
  }
}

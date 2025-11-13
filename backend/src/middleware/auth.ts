import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../utils/jwt';
import { ApiResponse } from '../types/common';

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
    
    // Add user to request object
    (request as any).user = user;
  } catch (err) {
    return reply.status(401).send({
      success: false,
      message: 'Authentication failed',
    } as ApiResponse);
  }
};

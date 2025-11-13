import { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from '@/services/auth';
import { LoginRequest, RegisterRequest, RefreshTokenRequest } from '@/types/auth';

export const registerController = async (
  request: FastifyRequest<{ Body: RegisterRequest }>,
  reply: FastifyReply
) => {
  const result = await authService.register(request.body);
  
  if (result.success) {
    return reply.status(201).send(result);
  }
  
  return reply.status(400).send(result);
};

export const loginController = async (
  request: FastifyRequest<{ Body: LoginRequest }>,
  reply: FastifyReply
) => {
  const result = await authService.login(request.body);
  
  if (result.success) {
    return reply.status(200).send(result);
  }
  
  return reply.status(401).send(result);
};

export const refreshTokenController = async (
  request: FastifyRequest<{ Body: RefreshTokenRequest }>,
  reply: FastifyReply
) => {
  const result = await authService.refreshToken(request.body.refreshToken);
  
  if (result.success) {
    return reply.status(200).send(result);
  }
  
  return reply.status(401).send(result);
};

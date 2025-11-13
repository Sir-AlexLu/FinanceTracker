import { FastifyRequest, FastifyReply } from 'fastify';
import { JWTPayload } from '@/types/auth';

export const generateTokens = (user: { id: string; username: string }) => {
  const payload = {
    id: user.id,
    username: user.username,
  };

  const accessToken = {
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
    ...payload,
  };

  const refreshToken = {
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
    ...payload,
  };

  return { accessToken, refreshToken };
};

export const verifyToken = (request: FastifyRequest): JWTPayload | null => {
  try {
    return request.user as JWTPayload;
  } catch (error) {
    return null;
  }
};

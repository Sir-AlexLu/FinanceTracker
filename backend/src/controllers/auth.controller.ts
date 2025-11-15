// src/controllers/auth.controller.ts
import type { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/auth.service.js';
import {
  registerSchema, loginSchema, refreshTokenSchema,
  changePasswordSchema, forgotPasswordSchema, resetPasswordSchema, updateProfileSchema
} from '../schemas/auth.schema.js';
import { logger } from '../utils/logger.js';

export class AuthController {
  private service: AuthService;

  constructor(fastify: any) {
    this.service = new AuthService(fastify);
  }

  register = async (req: FastifyRequest<{ Body: typeof registerSchema['_output'] }>, reply: FastifyReply) => {
    const { email, password, name, phoneNumber } = req.body;
    const ip = req.ip;
    const ua = req.headers['user-agent'];

    const result = await this.service.register(email, password, name, phoneNumber, ip, ua);
    reply.code(201).send({ data: result, message: 'Registered' });
  };

  login = async (req: FastifyRequest<{ Body: typeof loginSchema['_output'] }>, reply: FastifyReply) => {
    const { email, password } = req.body;
    const result = await this.service.login(email, password, req.ip, req.headers['user-agent'] || '');
    reply.send({ data: result, message: 'Logged in' });
  };

  logout = async (req: FastifyRequest<{ Body: typeof refreshTokenSchema['_output'] }>, reply: FastifyReply) => {
    await this.service.logout(req.user.userId, req.body.refreshToken);
    reply.send({ message: 'Logged out' });
  };

  refresh = async (req: FastifyRequest<{ Body: typeof refreshTokenSchema['_output'] }>, reply: FastifyReply) => {
    const tokens = await this.service.refresh(req.body.refreshToken);
    reply.send({ data: tokens, message: 'Refreshed' });
  };

  changePassword = async (req: FastifyRequest<{ Body: typeof changePasswordSchema['_output'] }>, reply: FastifyReply) => {
    await this.service.changePassword(req.user.userId, req.body.currentPassword, req.body.newPassword);
    reply.send({ message: 'Password changed' });
  };

  forgotPassword = async (req: FastifyRequest<{ Body: typeof forgotPasswordSchema['_output'] }>, reply: FastifyReply) => {
    const message = await this.service.forgotPassword(req.body.email);
    reply.send({ message });
  };

  resetPassword = async (req: FastifyRequest<{ Body: typeof resetPasswordSchema['_output'] }>, reply: FastifyReply) => {
    await this.service.resetPassword(req.body.token, req.body.newPassword);
    reply.send({ message: 'Password reset' });
  };

  getProfile = async (req: FastifyRequest, reply: FastifyReply) => {
    const user = await this.service.getProfile(req.user.userId);
    reply.send({ data: user });
  };

  updateProfile = async (req: FastifyRequest<{ Body: typeof updateProfileSchema['_output'] }>, reply: FastifyReply) => {
    const user = await this.service.updateProfile(req.user.userId, req.body);
    reply.send({ data: user, message: 'Profile updated' });
  };
}

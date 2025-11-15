// src/routes/auth.routes.ts
import { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/auth.controller.js';
import {
  registerSchema, loginSchema, refreshTokenSchema,
  changePasswordSchema, forgotPasswordSchema, resetPasswordSchema, updateProfileSchema
} from '../schemas/auth.schema.js';

export default async function authRoutes(fastify: FastifyInstance) {
  const ctrl = new AuthController(fastify);

  fastify.post('/register', { schema: { body: registerSchema } }, ctrl.register);
  fastify.post('/login', {
    schema: { body: loginSchema },
    config: { rateLimit: { max: 5, timeWindow: '15 minutes' } }
  }, ctrl.login);
  fastify.post('/refresh-token', { schema: { body: refreshTokenSchema } }, ctrl.refresh);
  fastify.post('/forgot-password', {
    schema: { body: forgotPasswordSchema },
    config: { rateLimit: { max: 3, timeWindow: '1 hour' } }
  }, ctrl.forgotPassword);
  fastify.post('/reset-password', { schema: { body: resetPasswordSchema } }, ctrl.resetPassword);

  fastify.post('/logout', {
    onRequest: [fastify.authenticate],
    schema: { body: refreshTokenSchema }
  }, ctrl.logout);

  fastify.post('/change-password', {
    onRequest: [fastify.authenticate],
    schema: { body: changePasswordSchema }
  }, ctrl.changePassword);

  fastify.get('/profile', { onRequest: [fastify.authenticate] }, ctrl.getProfile);
  fastify.patch('/profile', {
    onRequest: [fastify.authenticate],
    schema: { body: updateProfileSchema }
  }, ctrl.updateProfile);
}

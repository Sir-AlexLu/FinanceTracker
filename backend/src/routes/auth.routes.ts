import { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/auth.controller';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from '../schemas/auth.schema';

export default async function authRoutes(fastify: FastifyInstance) {
  const authController = new AuthController(fastify);

  // Public routes
  fastify.post(
    '/register',
    {
      schema: {
        body: registerSchema,
        tags: ['Authentication'],
        description: 'Register a new user',
      },
    },
    authController.register.bind(authController)
  );

  fastify.post(
    '/login',
    {
      schema: {
        body: loginSchema,
        tags: ['Authentication'],
        description: 'Login user',
      },
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '15 minutes',
        },
      },
    },
    authController.login.bind(authController)
  );

  fastify.post(
    '/refresh-token',
    {
      schema: {
        body: refreshTokenSchema,
        tags: ['Authentication'],
        description: 'Refresh access token',
      },
    },
    authController.refreshToken.bind(authController)
  );

  fastify.post(
    '/forgot-password',
    {
      schema: {
        body: forgotPasswordSchema,
        tags: ['Authentication'],
        description: 'Request password reset',
      },
      config: {
        rateLimit: {
          max: 3,
          timeWindow: '1 hour',
        },
      },
    },
    authController.forgotPassword.bind(authController)
  );

  fastify.post(
    '/reset-password',
    {
      schema: {
        body: resetPasswordSchema,
        tags: ['Authentication'],
        description: 'Reset password with token',
      },
    },
    authController.resetPassword.bind(authController)
  );

  // Protected routes
  fastify.post(
    '/logout',
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: refreshTokenSchema,
        tags: ['Authentication'],
        description: 'Logout user',
      },
    },
    authController.logout.bind(authController)
  );

  fastify.post(
    '/change-password',
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: changePasswordSchema,
        tags: ['Authentication'],
        description: 'Change password',
      },
    },
    authController.changePassword.bind(authController)
  );

  fastify.get(
    '/profile',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['Authentication'],
        description: 'Get user profile',
      },
    },
    authController.getProfile.bind(authController)
  );

  fastify.patch(
    '/profile',
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: updateProfileSchema,
        tags: ['Authentication'],
        description: 'Update user profile',
      },
    },
    authController.updateProfile.bind(authController)
  );
}

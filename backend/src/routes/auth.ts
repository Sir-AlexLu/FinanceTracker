import { FastifyInstance } from 'fastify';
import { registerController, loginController, refreshTokenController } from '@/controllers/auth';
import { validateBody } from '@/middleware/validation';
import { registerSchema, loginSchema } from '@/utils/validation';

async function authRoutes(fastify: FastifyInstance) {
  // Register route
  fastify.post('/register', {
    preHandler: validateBody(registerSchema)
  }, registerController);
  
  // Login route
  fastify.post('/login', {
    preHandler: validateBody(loginSchema)
  }, loginController);
  
  // Refresh token route
  fastify.post('/refresh', refreshTokenController);
}

export default authRoutes;

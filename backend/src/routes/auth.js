import { register, login, getMe } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

export default async function authRoutes(fastify, options) {
  // Register new user
  fastify.post('/register', {
    schema: {
      body: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
        },
      },
    },
    handler: register,
  });

  // Login user
  fastify.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
    },
    handler: login,
  });

  // Get current user (protected)
  fastify.get('/me', {
    preHandler: [authenticate],
    handler: getMe,
  });
}

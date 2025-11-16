import { register, login, logout, getMe } from '../controllers/auth.controller.js';
import { validateRegister, validateLogin } from '../schemas/auth.schema.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';

export default async function authRoutes(app) {
  // Public routes
  app.post('/register', {
    preHandler: validateRequest({ safeParse: validateRegister }),
    handler: register
  });

  app.post('/login', {
    preHandler: validateRequest({ safeParse: validateLogin }),
    handler: login
  });

  // Protected routes
  app.post('/logout', {
    preHandler: authenticate,
    handler: logout
  });

  app.get('/me', {
    preHandler: authenticate,
    handler: getMe
  });
}

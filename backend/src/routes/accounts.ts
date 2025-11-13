import { FastifyInstance } from 'fastify';
import { authenticate } from '@/middleware/auth';
import {
  getAccountsController,
  getAccountByIdController,
  createAccountController,
  updateAccountController,
  deleteAccountController
} from '@/controllers/accounts';
import { validateBody } from '@/middleware/validation';
import { createAccountSchema, updateAccountSchema } from '@/utils/validation';

async function accountRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', authenticate);
  
  // Get all accounts
  fastify.get('/', getAccountsController);
  
  // Get account by ID
  fastify.get('/:id', getAccountByIdController);
  
  // Create new account
  fastify.post('/', {
    preHandler: validateBody(createAccountSchema)
  }, createAccountController);
  
  // Update account
  fastify.put('/:id', {
    preHandler: validateBody(updateAccountSchema)
  }, updateAccountController);
  
  // Delete account
  fastify.delete('/:id', deleteAccountController);
}

export default accountRoutes;

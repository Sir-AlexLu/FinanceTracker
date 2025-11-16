import {
  getAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccountBalance,
} from '../controllers/accountController.js';
import { authenticate } from '../middleware/auth.js';

export default async function accountRoutes(fastify, options) {
  // All routes require authentication
  fastify.addHook('preHandler', authenticate);

  // Get all accounts
  fastify.get('/', getAccounts);

  // Get single account
  fastify.get('/:id', getAccount);

  // Create new account
  fastify.post('/', {
    schema: {
      body: {
        type: 'object',
        required: ['name', 'type'],
        properties: {
          name: { type: 'string' },
          type: { type: 'string', enum: ['cash', 'bank', 'investment'] },
          balance: { type: 'number', default: 0 },
          currency: { type: 'string', default: 'USD' },
          description: { type: 'string' },
        },
      },
    },
    handler: createAccount,
  });

  // Update account
  fastify.put('/:id', updateAccount);

  // Delete account
  fastify.delete('/:id', deleteAccount);

  // Get account balance
  fastify.get('/:id/balance', getAccountBalance);
}

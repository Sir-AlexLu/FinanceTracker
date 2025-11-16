import {
  getTransactions,
  getTransaction,
  createTransaction,
  transferBetweenAccounts,
  updateTransaction,
  deleteTransaction,
  getAnalytics,
} from '../controllers/transactionController.js';
import { authenticate } from '../middleware/auth.js';

export default async function transactionRoutes(fastify, options) {
  // All routes require authentication
  fastify.addHook('preHandler', authenticate);

  // Get all transactions
  fastify.get('/', getTransactions);

  // Get analytics
  fastify.get('/analytics', getAnalytics);

  // Get single transaction
  fastify.get('/:id', getTransaction);

  // Create new transaction
  fastify.post('/', {
    schema: {
      body: {
        type: 'object',
        required: ['accountId', 'type', 'amount', 'category'],
        properties: {
          accountId: { type: 'string' },
          type: { type: 'string', enum: ['income', 'expense'] },
          amount: { type: 'number', minimum: 0.01 },
          category: { type: 'string' },
          description: { type: 'string' },
          date: { type: 'string' },
        },
      },
    },
    handler: createTransaction,
  });

  // Transfer between accounts
  fastify.post('/transfer', {
    schema: {
      body: {
        type: 'object',
        required: ['fromAccountId', 'toAccountId', 'amount'],
        properties: {
          fromAccountId: { type: 'string' },
          toAccountId: { type: 'string' },
          amount: { type: 'number', minimum: 0.01 },
          description: { type: 'string' },
          date: { type: 'string' },
        },
      },
    },
    handler: transferBetweenAccounts,
  });

  // Update transaction
  fastify.put('/:id', updateTransaction);

  // Delete transaction
  fastify.delete('/:id', deleteTransaction);
}

import { FastifyInstance } from 'fastify';
import { authenticate } from '@/middleware/auth';
import {
  getTransactionsController,
  getRecentTransactionsController,
  getTransactionByIdController,
  createTransactionController,
  updateTransactionController,
  deleteTransactionController
} from '@/controllers/transactions';
import { validateBody, validateQuery } from '@/middleware/validation';
import { 
  createTransactionSchema, 
  updateTransactionSchema,
  transactionFilterSchema 
} from '@/utils/validation';

async function transactionRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', authenticate);
  
  // Get all transactions
  fastify.get('/', {
    preHandler: validateQuery(transactionFilterSchema)
  }, getTransactionsController);
  
  // Get recent transactions
  fastify.get('/recent', getRecentTransactionsController);
  
  // Get transaction by ID
  fastify.get('/:id', getTransactionByIdController);
  
  // Create new transaction
  fastify.post('/', {
    preHandler: validateBody(createTransactionSchema)
  }, createTransactionController);
  
  // Update transaction
  fastify.put('/:id', {
    preHandler: validateBody(updateTransactionSchema)
  }, updateTransactionController);
  
  // Delete transaction
  fastify.delete('/:id', deleteTransactionController);
}

export default transactionRoutes;

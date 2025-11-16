import {
  createTransaction,
  getTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction,
  getSummary
} from '../controllers/transaction.controller.js';
import {
  createTransactionSchema,
  updateTransactionSchema,
  queryTransactionSchema
} from '../schemas/transaction.schema.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';

export default async function transactionRoutes(app) {
  // All routes require authentication
  app.addHook('preHandler', authenticate);

  // Create transaction
  app.post('/', {
    preHandler: validateRequest(createTransactionSchema),
    handler: createTransaction
  });

  // Get all transactions with filters
  app.get('/', {
    preHandler: validateRequest(queryTransactionSchema, 'query'),
    handler: getTransactions
  });

  // Get summary and analytics
  app.get('/summary', {
    handler: getSummary
  });

  // Get single transaction
  app.get('/:id', {
    handler: getTransaction
  });

  // Update transaction
  app.patch('/:id', {
    preHandler: validateRequest(updateTransactionSchema),
    handler: updateTransaction
  });

  // Delete transaction
  app.delete('/:id', {
    handler: deleteTransaction
  });
}

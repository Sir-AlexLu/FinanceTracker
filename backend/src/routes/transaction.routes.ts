import { FastifyInstance } from 'fastify';
import { TransactionController } from '../controllers/transaction.controller';
import {
  createTransactionSchema,
  updateTransactionSchema,
} from '../schemas/transaction.schema';
import { idParamSchema } from '../schemas/common.schema';

export default async function transactionRoutes(fastify: FastifyInstance) {
  const transactionController = new TransactionController();

  // All routes require authentication
  fastify.addHook('onRequest', fastify.authenticate);

  fastify.post(
    '/',
    {
      schema: {
        body: createTransactionSchema,
        description: 'Create a new transaction',
      },
    },
    transactionController.createTransaction.bind(transactionController)
  );

  fastify.get(
    '/',
    {
      schema: {
        description: 'Get transactions with filters',
        querystring: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            accountId: { type: 'string' },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            page: { type: 'number', minimum: 1 },
            limit: { type: 'number', minimum: 1, maximum: 100 },
          },
        },
      },
    },
    transactionController.getTransactions.bind(transactionController)
  );

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
        description: 'Get transaction by ID',
      },
    },
    transactionController.getTransactionById.bind(transactionController)
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        params: idParamSchema,
        body: updateTransactionSchema,
        description: 'Update transaction',
      },
    },
    transactionController.updateTransaction.bind(transactionController)
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
        description: 'Delete transaction',
      },
    },
    transactionController.deleteTransaction.bind(transactionController)
  );
}

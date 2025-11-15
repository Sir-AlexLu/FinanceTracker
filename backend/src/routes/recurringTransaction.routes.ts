import { FastifyInstance } from 'fastify';
import { RecurringTransactionController } from '../controllers/recurringTransaction.controller';
import {
  approveRecurringTransactionSchema,
  skipRecurringTransactionSchema,
  cancelRecurringTransactionSchema,
} from '../schemas/recurringTransaction.schema';

export default async function recurringTransactionRoutes(fastify: FastifyInstance) {
  const recurringTransactionController = new RecurringTransactionController();

  // All routes require authentication
  fastify.addHook('onRequest', fastify.authenticate);

  fastify.get(
    '/pending',
    {
      schema: {
        description: 'Get pending recurring transaction approvals',
      },
    },
    recurringTransactionController.getPendingApprovals.bind(recurringTransactionController)
  );

  fastify.get(
    '/',
    {
      schema: {
        description: 'Get all recurring transactions',
      },
    },
    recurringTransactionController.getRecurringTransactions.bind(recurringTransactionController)
  );

  fastify.post(
    '/approve',
    {
      schema: {
        body: approveRecurringTransactionSchema,
        description: 'Approve recurring transaction',
      },
    },
    recurringTransactionController.approveRecurringTransaction.bind(recurringTransactionController)
  );

  fastify.post(
    '/skip',
    {
      schema: {
        body: skipRecurringTransactionSchema,
        description: 'Skip recurring transaction',
      },
    },
    recurringTransactionController.skipRecurringTransaction.bind(recurringTransactionController)
  );

  fastify.post(
    '/cancel',
    {
      schema: {
        body: cancelRecurringTransactionSchema,
        description: 'Cancel recurring transaction',
      },
    },
    recurringTransactionController.cancelRecurringTransaction.bind(recurringTransactionController)
  );
}

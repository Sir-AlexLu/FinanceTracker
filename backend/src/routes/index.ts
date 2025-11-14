import { FastifyInstance } from 'fastify';
import authRoutes from './auth.routes';
import accountRoutes from './account.routes';
import transactionRoutes from './transaction.routes';
import liabilityRoutes from './liability.routes';
import billRoutes from './bill.routes';
import budgetRoutes from './budget.routes';
import goalRoutes from './goal.routes';
import settlementRoutes from './settlement.routes';
import analyticsRoutes from './analytics.routes';
import notificationRoutes from './notification.routes';
import voiceTransactionRoutes from './voiceTransaction.routes';
import recurringTransactionRoutes from './recurringTransaction.routes';
import healthRoutes from './health.routes';

export default async function routes(fastify: FastifyInstance) {
  // Health check (no /api prefix)
  fastify.register(healthRoutes, { prefix: '/health' });

  // API routes
  fastify.register(authRoutes, { prefix: '/api/auth' });
  fastify.register(accountRoutes, { prefix: '/api/accounts' });
  fastify.register(transactionRoutes, { prefix: '/api/transactions' });
  fastify.register(liabilityRoutes, { prefix: '/api/liabilities' });
  fastify.register(billRoutes, { prefix: '/api/bills' });
  fastify.register(budgetRoutes, { prefix: '/api/budgets' });
  fastify.register(goalRoutes, { prefix: '/api/goals' });
  fastify.register(settlementRoutes, { prefix: '/api/settlements' });
  fastify.register(analyticsRoutes, { prefix: '/api/analytics' });
  fastify.register(notificationRoutes, { prefix: '/api/notifications' });
  fastify.register(voiceTransactionRoutes, { prefix: '/api/voice-transactions' });
  fastify.register(recurringTransactionRoutes, { prefix: '/api/recurring-transactions' });
}

// src/routes/index.ts
import { FastifyInstance } from 'fastify';
import authRoutes from './auth.routes.js';
import accountRoutes from './account.routes.js';
import transactionRoutes from './transaction.routes.js';
import liabilityRoutes from './liability.routes.js';
import billRoutes from './bill.routes.js';
import budgetRoutes from './budget.routes.js';
import goalRoutes from './goal.routes.js';
import settlementRoutes from './settlement.routes.js';
import analyticsRoutes from './analytics.routes.js';
import notificationRoutes from './notification.routes.js';
import voiceTransactionRoutes from './voiceTransaction.routes.js';
import recurringTransactionRoutes from './recurringTransaction.routes.js';
import healthRoutes from './health.routes.js';

export default async function routes(fastify: FastifyInstance) {
  // Public health check
  fastify.register(healthRoutes);

  // API v1
  const api = fastify.register(async (api) => {
    api.register(authRoutes, { prefix: '/auth' });
    api.register(accountRoutes, { prefix: '/accounts' });
    api.register(transactionRoutes, { prefix: '/transactions' });
    api.register(liabilityRoutes, { prefix: '/liabilities' });
    api.register(billRoutes, { prefix: '/bills' });
    api.register(budgetRoutes, { prefix: '/budgets' });
    api.register(goalRoutes, { prefix: '/goals' });
    api.register(settlementRoutes, { prefix: '/settlements' });
    api.register(analyticsRoutes, { prefix: '/analytics' });
    api.register(notificationRoutes, { prefix: '/notifications' });
    api.register(voiceTransactionRoutes, { prefix: '/voice-transactions' });
    api.register(recurringTransactionRoutes, { prefix: '/recurring-transactions' });
  }, { prefix: '/api' });

  fastify.log.info('All routes registered');
}

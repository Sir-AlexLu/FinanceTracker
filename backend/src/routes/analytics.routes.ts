import { FastifyInstance } from 'fastify';
import { AnalyticsController } from '../controllers/analytics.controller';

export default async function analyticsRoutes(fastify: FastifyInstance) {
  const analyticsController = new AnalyticsController();

  // All routes require authentication
  fastify.addHook('onRequest', fastify.authenticate);

  fastify.get(
    '/dashboard',
    {
      schema: {
        description: 'Get dashboard overview',
      },
    },
    analyticsController.getDashboardOverview.bind(analyticsController)
  );

  fastify.get(
    '/income-vs-expenses',
    {
      schema: {
        description: 'Get income vs expenses comparison',
        querystring: {
          type: 'object',
          properties: {
            months: { type: 'string' },
          },
        },
      },
    },
    analyticsController.getIncomeVsExpenses.bind(analyticsController)
  );

  fastify.get(
    '/category-breakdown',
    {
      schema: {
        description: 'Get category-wise spending breakdown',
        querystring: {
          type: 'object',
          properties: {
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    analyticsController.getCategoryBreakdown.bind(analyticsController)
  );

  fastify.get(
    '/spending-trends',
    {
      schema: {
        description: 'Get spending trends',
        querystring: {
          type: 'object',
          properties: {
            days: { type: 'string' },
          },
        },
      },
    },
    analyticsController.getSpendingTrends.bind(analyticsController)
  );

  fastify.get(
    '/insights',
    {
      schema: {
        description: 'Get financial insights',
      },
    },
    analyticsController.getFinancialInsights.bind(analyticsController)
  );
}

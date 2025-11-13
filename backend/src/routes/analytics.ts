import { FastifyInstance } from 'fastify';
import { authenticate } from '@/middleware/auth';
import {
  getAnalyticsController,
  getFinancialSummaryController
} from '@/controllers/analytics';
import { validateQuery } from '@/middleware/validation';
import { analyticsQuerySchema } from '@/utils/validation';

async function analyticsRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', authenticate);
  
  // Get analytics data
  fastify.get('/', {
    preHandler: validateQuery(analyticsQuerySchema)
  }, getAnalyticsController);
  
  // Get financial summary
  fastify.get('/summary', getFinancialSummaryController);
}

export default analyticsRoutes;

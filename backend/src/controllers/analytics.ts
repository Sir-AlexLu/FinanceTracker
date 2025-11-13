import { FastifyRequest, FastifyReply } from 'fastify';
import { analyticsService } from '@/services/analytics';

export const getAnalyticsController = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const userId = (request.user as any).id;
  const result = await analyticsService.getAnalytics(userId, request.query);
  
  return reply.status(result.success ? 200 : 400).send(result);
};

export const getFinancialSummaryController = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const userId = (request.user as any).id;
  const result = await analyticsService.getFinancialSummary(userId);
  
  return reply.status(result.success ? 200 : 400).send(result);
};

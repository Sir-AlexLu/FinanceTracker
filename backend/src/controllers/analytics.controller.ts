import { FastifyRequest, FastifyReply } from 'fastify';
import { AnalyticsService } from '../services/analytics.service';
import { successResponse, errorResponse } from '../utils/responseFormatter';

export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor() {
    this.analyticsService = new AnalyticsService();
  }

  /**
   * Get dashboard overview
   */
  async getDashboardOverview(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = request.user!.userId;

      const overview = await this.analyticsService.getDashboardOverview(userId);

      reply.status(200).send(successResponse(overview));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Get income vs expenses comparison
   */
  async getIncomeVsExpenses(
    request: FastifyRequest<{ Querystring: { months?: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user!.userId;
      const months = request.query.months ? parseInt(request.query.months) : 6;

      const data = await this.analyticsService.getIncomeVsExpenses(userId, months);

      reply.status(200).send(successResponse(data));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Get category-wise spending breakdown
   */
  async getCategoryBreakdown(
    request: FastifyRequest<{ Querystring: { startDate?: string; endDate?: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user!.userId;
      const startDate = request.query.startDate ? new Date(request.query.startDate) : undefined;
      const endDate = request.query.endDate ? new Date(request.query.endDate) : undefined;

      const data = await this.analyticsService.getCategoryBreakdown(userId, startDate, endDate);

      reply.status(200).send(successResponse(data));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Get spending trends
   */
  async getSpendingTrends(
    request: FastifyRequest<{ Querystring: { days?: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user!.userId;
      const days = request.query.days ? parseInt(request.query.days) : 30;

      const data = await this.analyticsService.getSpendingTrends(userId, days);

      reply.status(200).send(successResponse(data));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Get financial insights
   */
  async getFinancialInsights(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = request.user!.userId;

      const insights = await this.analyticsService.getFinancialInsights(userId);

      reply.status(200).send(successResponse(insights));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }
}

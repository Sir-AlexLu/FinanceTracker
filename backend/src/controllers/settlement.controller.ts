import { FastifyRequest, FastifyReply } from 'fastify';
import { SettlementService } from '../services/settlement.service';
import {
  PerformSettlementInput,
  GetSettlementsQuery,
} from '../schemas/settlement.schema';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responseFormatter';

export class SettlementController {
  private settlementService: SettlementService;

  constructor() {
    this.settlementService = new SettlementService();
  }

  /**
   * Perform monthly settlement
   */
  async performSettlement(
    request: FastifyRequest<{ Body: PerformSettlementInput }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user!.userId;
      const { month } = request.body;
      const ipAddress = request.ip;
      const userAgent = request.headers['user-agent'] || 'unknown';

      // Parse month string to Date
      const [year, monthNum] = month.split('-').map(Number);
      const monthDate = new Date(year, monthNum - 1, 1);

      const settlement = await this.settlementService.performMonthlySettlement(
        userId,
        monthDate,
        ipAddress,
        userAgent
      );

      reply.status(201).send(successResponse(settlement, 'Settlement completed successfully'));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Get settlements with filters
   */
  async getSettlements(
    request: FastifyRequest<{ Querystring: any }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user!.userId;
      const filters = {
        periodType: request.query.periodType,
        page: request.query.page ? parseInt(request.query.page) : 1,
        limit: request.query.limit ? parseInt(request.query.limit) : 20,
      };

      const result = await this.settlementService.getSettlements(userId, filters);

      reply.status(200).send(
        paginatedResponse(result.settlements, result.page, result.limit, result.total)
      );
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Get settlement by period
   */
  async getSettlementByPeriod(
    request: FastifyRequest<{ Params: { period: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user!.userId;
      const period = request.params.period;

      const settlement = await this.settlementService.getSettlementByPeriod(userId, period);

      reply.status(200).send(successResponse(settlement));
    } catch (error: any) {
      request.log.error(error);
      reply.status(404).send(errorResponse(error.message));
    }
  }

  /**
   * Check if settlement is needed
   */
  async checkSettlementNeeded(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = request.user!.userId;

      const result = await this.settlementService.checkSettlementNeeded(userId);

      reply.status(200).send(successResponse(result));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }
}

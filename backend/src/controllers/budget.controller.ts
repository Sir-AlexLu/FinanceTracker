import { FastifyRequest, FastifyReply } from 'fastify';
import { BudgetService } from '../services/budget.service';
import {
  CreateBudgetInput,
  UpdateBudgetInput,
  GetBudgetsQuery,
} from '../schemas/budget.schema';
import { BudgetQueryParams } from '../types/query.types';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responseFormatter';

export class BudgetController {
  private budgetService: BudgetService;

  constructor() {
    this.budgetService = new BudgetService();
  }

  /**
   * Create a new budget
   */
  async createBudget(
    request: FastifyRequest<{ Body: CreateBudgetInput }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user.userId;
      const data = request.body;
      const ipAddress = request.ip;
      const userAgent = request.headers['user-agent'] || 'unknown';

      const budget = await this.budgetService.createBudget(userId, data, ipAddress, userAgent);

      reply.status(201).send(successResponse(budget, 'Budget created successfully'));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Get budgets with filters
   */
  async getBudgets(
    request: FastifyRequest<{ Querystring: BudgetQueryParams }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user.userId;
      const filters = {
        isActive: request.query.isActive === 'true' ? true : request.query.isActive === 'false' ? false : undefined,
        category: request.query.category,
        page: request.query.page ? parseInt(request.query.page) : 1,
        limit: request.query.limit ? parseInt(request.query.limit) : 20,
      };

      const result = await this.budgetService.getBudgets(userId, filters);

      reply.status(200).send(
        paginatedResponse(result.budgets, result.page, result.limit, result.total)
      );
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Get active budgets
   */
  async getActiveBudgets(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = request.user.userId;

      const budgets = await this.budgetService.getActiveBudgets(userId);

      reply.status(200).send(successResponse(budgets));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Get budget by ID
   */
  async getBudgetById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user.userId;
      const budgetId = request.params.id;

      const budget = await this.budgetService.getBudgetById(userId, budgetId);

      reply.status(200).send(successResponse(budget));
    } catch (error: any) {
      request.log.error(error);
      reply.status(404).send(errorResponse(error.message));
    }
  }

  /**
   * Update budget
   */
  async updateBudget(
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateBudgetInput }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user.userId;
      const budgetId = request.params.id;
      const data = request.body;
      const ipAddress = request.ip;
      const userAgent = request.headers['user-agent'] || 'unknown';

      const budget = await this.budgetService.updateBudget(
        userId,
        budgetId,
        data,
        ipAddress,
        userAgent
      );

      reply.status(200).send(successResponse(budget, 'Budget updated successfully'));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Delete budget
   */
  async deleteBudget(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user.userId;
      const budgetId = request.params.id;
      const ipAddress = request.ip;
      const userAgent = request.headers['user-agent'] || 'unknown';

      await this.budgetService.deleteBudget(userId, budgetId, ipAddress, userAgent);

      reply.status(200).send(successResponse(null, 'Budget deleted successfully'));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Get budget summary
   */
  async getBudgetSummary(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = request.user.userId;

      const summary = await this.budgetService.getBudgetSummary(userId);

      reply.status(200).send(successResponse(summary));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }
}

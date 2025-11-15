import { FastifyRequest, FastifyReply } from 'fastify';
import { GoalService } from '../services/goal.service';
import {
  CreateGoalInput,
  UpdateGoalInput,
  GetGoalsQuery,
} from '../schemas/goal.schema';
import { GoalQueryParams } from '../types/query.types';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responseFormatter';

export class GoalController {
  private goalService: GoalService;

  constructor() {
    this.goalService = new GoalService();
  }

  /**
   * Create a new goal
   */
  async createGoal(
    request: FastifyRequest<{ Body: CreateGoalInput }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user.userId;
      const data = request.body;
      const ipAddress = request.ip;
      const userAgent = request.headers['user-agent'] || 'unknown';

      const goal = await this.goalService.createGoal(userId, data, ipAddress, userAgent);

      reply.status(201).send(successResponse(goal, 'Goal created successfully'));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Get goals with filters
   */
  async getGoals(
    request: FastifyRequest<{ Querystring: GoalQueryParams }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user.userId;
      const filters = {
        status: request.query.status,
        type: request.query.type,
        page: request.query.page ? parseInt(request.query.page) : 1,
        limit: request.query.limit ? parseInt(request.query.limit) : 20,
      };

      const result = await this.goalService.getGoals(userId, filters);

      reply.status(200).send(
        paginatedResponse(result.goals, result.page, result.limit, result.total)
      );
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Get goal by ID
   */
  async getGoalById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user.userId;
      const goalId = request.params.id;

      const goal = await this.goalService.getGoalById(userId, goalId);

      reply.status(200).send(successResponse(goal));
    } catch (error: any) {
      request.log.error(error);
      reply.status(404).send(errorResponse(error.message));
    }
  }

  /**
   * Update goal
   */
  async updateGoal(
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateGoalInput }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user.userId;
      const goalId = request.params.id;
      const data = request.body;
      const ipAddress = request.ip;
      const userAgent = request.headers['user-agent'] || 'unknown';

      const goal = await this.goalService.updateGoal(
        userId,
        goalId,
        data,
        ipAddress,
        userAgent
      );

      reply.status(200).send(successResponse(goal, 'Goal updated successfully'));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Delete goal
   */
  async deleteGoal(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user.userId;
      const goalId = request.params.id;
      const ipAddress = request.ip;
      const userAgent = request.headers['user-agent'] || 'unknown';

      await this.goalService.deleteGoal(userId, goalId, ipAddress, userAgent);

      reply.status(200).send(successResponse(null, 'Goal deleted successfully'));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Update goal progress
   */
  async updateGoalProgress(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const goalId = request.params.id;

      const goal = await this.goalService.updateGoalProgress(goalId);

      reply.status(200).send(successResponse(goal, 'Goal progress updated successfully'));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Get goal summary
   */
  async getGoalSummary(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = request.user.userId;

      const summary = await this.goalService.getGoalSummary(userId);

      reply.status(200).send(successResponse(summary));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }
}

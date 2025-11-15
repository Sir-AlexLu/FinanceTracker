import { FastifyRequest, FastifyReply } from 'fastify';
import { LiabilityService } from '../services/liability.service';
import {
  CreateLiabilityInput,
  UpdateLiabilityInput,
  MakeLiabilityPaymentInput,
  GetLiabilitiesQuery,
} from '../schemas/liability.schema';
import { LiabilityQueryParams } from '../types/query.types';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responseFormatter';

export class LiabilityController {
  private liabilityService: LiabilityService;

  constructor() {
    this.liabilityService = new LiabilityService();
  }

  /**
   * Create a new liability
   */
  async createLiability(
    request: FastifyRequest<{ Body: CreateLiabilityInput }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user.userId;
      const data = request.body;
      const ipAddress = request.ip;
      const userAgent = request.headers['user-agent'] || 'unknown';

      const liability = await this.liabilityService.createLiability(
        userId,
        data,
        ipAddress,
        userAgent
      );

      reply.status(201).send(successResponse(liability, 'Liability created successfully'));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Make a payment towards liability
   */
  async makePayment(
    request: FastifyRequest<{ Params: { id: string }; Body: MakeLiabilityPaymentInput }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user.userId;
      const liabilityId = request.params.id;
      const data = request.body;
      const ipAddress = request.ip;
      const userAgent = request.headers['user-agent'] || 'unknown';

      const result = await this.liabilityService.makePayment(
        userId,
        liabilityId,
        data,
        ipAddress,
        userAgent
      );

      reply.status(200).send(
        successResponse(
          {
            liability: result.liability,
            transaction: result.transaction,
          },
          'Payment recorded successfully'
        )
      );
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Get liabilities with filters
   */
  async getLiabilities(
    request: FastifyRequest<{ Querystring: LiabilityQueryParams }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user.userId;
      const filters = {
        status: request.query.status,
        page: request.query.page ? parseInt(request.query.page) : 1,
        limit: request.query.limit ? parseInt(request.query.limit) : 20,
      };

      const result = await this.liabilityService.getLiabilities(userId, filters);

      reply.status(200).send(
        paginatedResponse(result.liabilities, result.page, result.limit, result.total)
      );
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Get liability by ID
   */
  async getLiabilityById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user.userId;
      const liabilityId = request.params.id;

      const liability = await this.liabilityService.getLiabilityById(userId, liabilityId);

      reply.status(200).send(successResponse(liability));
    } catch (error: any) {
      request.log.error(error);
      reply.status(404).send(errorResponse(error.message));
    }
  }

  /**
   * Update liability
   */
  async updateLiability(
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateLiabilityInput }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user.userId;
      const liabilityId = request.params.id;
      const data = request.body;
      const ipAddress = request.ip;
      const userAgent = request.headers['user-agent'] || 'unknown';

      const liability = await this.liabilityService.updateLiability(
        userId,
        liabilityId,
        data,
        ipAddress,
        userAgent
      );

      reply.status(200).send(successResponse(liability, 'Liability updated successfully'));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Delete liability
   */
  async deleteLiability(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user.userId;
      const liabilityId = request.params.id;
      const ipAddress = request.ip;
      const userAgent = request.headers['user-agent'] || 'unknown';

      await this.liabilityService.deleteLiability(userId, liabilityId, ipAddress, userAgent);

      reply.status(200).send(successResponse(null, 'Liability deleted successfully'));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Get liability summary
   */
  async getLiabilitySummary(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = request.user.userId;

      const summary = await this.liabilityService.getLiabilitySummary(userId);

      reply.status(200).send(successResponse(summary));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }
  }

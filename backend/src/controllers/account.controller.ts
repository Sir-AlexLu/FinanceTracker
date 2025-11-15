import { FastifyRequest, FastifyReply } from 'fastify';
import { AccountService } from '../services/account.service';
import {
  CreateAccountInput,
  UpdateAccountInput,
  GetAccountByIdInput,
} from '../schemas/account.schema';
import { AccountQueryParams } from '../types/query.types';
import { successResponse, errorResponse } from '../utils/responseFormatter';

export class AccountController {
  private accountService: AccountService;

  constructor() {
    this.accountService = new AccountService();
  }

  /**
   * Create a new account
   */
  async createAccount(
    request: FastifyRequest<{ Body: CreateAccountInput }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user.userId;
      const data = request.body;
      const ipAddress = request.ip;
      const userAgent = request.headers['user-agent'] || 'unknown';

      const account = await this.accountService.createAccount(
        userId,
        data,
        ipAddress,
        userAgent
      );

      reply.status(201).send(successResponse(account, 'Account created successfully'));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Get all accounts
   */
  async getAccounts(
    request: FastifyRequest<{ Querystring: AccountQueryParams }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user.userId;
      const includeInactive = request.query.includeInactive === 'true';

      const accounts = await this.accountService.getAccounts(userId, includeInactive);

      reply.status(200).send(successResponse(accounts));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Get account by ID
   */
  async getAccountById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user.userId;
      const accountId = request.params.id;

      const account = await this.accountService.getAccountById(userId, accountId);

      reply.status(200).send(successResponse(account));
    } catch (error: any) {
      request.log.error(error);
      reply.status(404).send(errorResponse(error.message));
    }
  }

  /**
   * Update account
   */
  async updateAccount(
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateAccountInput }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user.userId;
      const accountId = request.params.id;
      const data = request.body;
      const ipAddress = request.ip;
      const userAgent = request.headers['user-agent'] || 'unknown';

      const account = await this.accountService.updateAccount(
        userId,
        accountId,
        data,
        ipAddress,
        userAgent
      );

      reply.status(200).send(successResponse(account, 'Account updated successfully'));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Delete account
   */
  async deleteAccount(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user.userId;
      const accountId = request.params.id;
      const ipAddress = request.ip;
      const userAgent = request.headers['user-agent'] || 'unknown';

      await this.accountService.deleteAccount(userId, accountId, ipAddress, userAgent);

      reply.status(200).send(successResponse(null, 'Account deleted successfully'));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Get accounts summary
   */
  async getAccountsSummary(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = request.user.userId;

      const summary = await this.accountService.getAccountsSummary(userId);

      reply.status(200).send(successResponse(summary));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }
}

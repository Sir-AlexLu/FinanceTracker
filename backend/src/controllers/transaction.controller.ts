import { FastifyRequest, FastifyReply } from 'fastify';
import { TransactionService } from '../services/transaction.service';
import {
  CreateTransactionInput,
  UpdateTransactionInput,
  GetTransactionsQuery,
} from '../schemas/transaction.schema';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responseFormatter';

export class TransactionController {
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
  }

  /**
   * Create a new transaction
   */
  async createTransaction(
    request: FastifyRequest<{ Body: CreateTransactionInput }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user!.userId;
      const data = request.body;
      const ipAddress = request.ip;
      const userAgent = request.headers['user-agent'] || 'unknown';

      const transaction = await this.transactionService.createTransaction(
        userId,
        data,
        ipAddress,
        userAgent
      );

      reply.status(201).send(successResponse(transaction, 'Transaction created successfully'));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Get transactions with filters
   */
  async getTransactions(
    request: FastifyRequest<{ Querystring: any }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user!.userId;
      const filters = {
        type: request.query.type,
        accountId: request.query.accountId,
        startDate: request.query.startDate,
        endDate: request.query.endDate,
        page: request.query.page ? parseInt(request.query.page) : 1,
        limit: request.query.limit ? parseInt(request.query.limit) : 20,
      };

      const result = await this.transactionService.getTransactions(userId, filters);

      reply.status(200).send(
        paginatedResponse(result.transactions, result.page, result.total, result.total)
      );
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user!.userId;
      const transactionId = request.params.id;

      const transaction = await this.transactionService.getTransactionById(
        userId,
        transactionId
      );

      reply.status(200).send(successResponse(transaction));
    } catch (error: any) {
      request.log.error(error);
      reply.status(404).send(errorResponse(error.message));
    }
  }

  /**
   * Update transaction
   */
  async updateTransaction(
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateTransactionInput }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user!.userId;
      const transactionId = request.params.id;
      const data = request.body;
      const ipAddress = request.ip;
      const userAgent = request.headers['user-agent'] || 'unknown';

      const transaction = await this.transactionService.updateTransaction(
        userId,
        transactionId,
        data,
        ipAddress,
        userAgent
      );

      reply.status(200).send(successResponse(transaction, 'Transaction updated successfully'));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Delete transaction
   */
  async deleteTransaction(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user!.userId;
      const transactionId = request.params.id;
      const ipAddress = request.ip;
      const userAgent = request.headers['user-agent'] || 'unknown';

      await this.transactionService.deleteTransaction(
        userId,
        transactionId,
        ipAddress,
        userAgent
      );

      reply.status(200).send(successResponse(null, 'Transaction deleted successfully'));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }
}

import { FastifyRequest, FastifyReply } from 'fastify';
import { RecurringTransactionService } from '../services/recurringTransaction.service';
import {
  ApproveRecurringTransactionInput,
  SkipRecurringTransactionInput,
  CancelRecurringTransactionInput,
} from '../schemas/recurringTransaction.schema';
import { successResponse, errorResponse } from '../utils/responseFormatter';

export class RecurringTransactionController {
  private recurringTransactionService: RecurringTransactionService;

  constructor() {
    this.recurringTransactionService = new RecurringTransactionService();
  }

  /**
   * Get pending recurring transactions
   */
  async getPendingApprovals(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = request.user!.userId;

      const pending = await this.recurringTransactionService.checkPendingRecurringTransactions(
        userId
      );

      reply.status(200).send(successResponse(pending));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Approve recurring transaction
   */
  async approveRecurringTransaction(
    request: FastifyRequest<{ Body: ApproveRecurringTransactionInput }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user!.userId;
      const { transactionId, modifyAmount } = request.body;
      const ipAddress = request.ip;
      const userAgent = request.headers['user-agent'] || 'unknown';

      const transaction = await this.recurringTransactionService.approveRecurringTransaction(
        transactionId,
        userId,
        modifyAmount,
        ipAddress,
        userAgent
      );

      reply.status(201).send(
        successResponse(transaction, 'Recurring transaction approved and created')
      );
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Skip recurring transaction
   */
  async skipRecurringTransaction(
    request: FastifyRequest<{ Body: SkipRecurringTransactionInput }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user!.userId;
      const { transactionId } = request.body;

      await this.recurringTransactionService.skipRecurringTransaction(transactionId, userId);

      reply.status(200).send(successResponse(null, 'Recurring transaction skipped'));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Cancel recurring transaction
   */
  async cancelRecurringTransaction(
    request: FastifyRequest<{ Body: CancelRecurringTransactionInput }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user!.userId;
      const { transactionId } = request.body;

      await this.recurringTransactionService.cancelRecurringTransaction(transactionId, userId);

      reply.status(200).send(successResponse(null, 'Recurring transaction cancelled'));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Get all recurring transactions
   */
  async getRecurringTransactions(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = request.user!.userId;

      const transactions = await this.recurringTransactionService.getRecurringTransactions(
        userId
      );

      reply.status(200).send(successResponse(transactions));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }
}

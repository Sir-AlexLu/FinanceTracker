import { FastifyRequest, FastifyReply } from 'fastify';
import { VoiceTransactionService } from '../services/voiceTransaction.service';
import {
  ParseVoiceInputInput,
  ConfirmVoiceTransactionInput,
} from '../schemas/voiceTransaction.schema';
import { successResponse, errorResponse } from '../utils/responseFormatter';

export class VoiceTransactionController {
  private voiceTransactionService: VoiceTransactionService;

  constructor() {
    this.voiceTransactionService = new VoiceTransactionService();
  }

  /**
   * Parse voice input
   */
  async parseVoiceInput(
    request: FastifyRequest<{ Body: ParseVoiceInputInput }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user!.userId;
      const { text } = request.body;

      const result = await this.voiceTransactionService.parseVoiceInput(text, userId);

      reply.status(200).send(successResponse(result));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Confirm and create transaction from voice input
   */
  async confirmVoiceTransaction(
    request: FastifyRequest<{ Body: ConfirmVoiceTransactionInput }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user!.userId;
      const { accountId, amount, description, category, type, text } = request.body;
      const ipAddress = request.ip;
      const userAgent = request.headers['user-agent'] || 'unknown';

      const parsedData = {
        type: type as any,
        amount,
        description,
        category: category as any,
        accountId,
        confidence: 100,
      };

      const transaction = await this.voiceTransactionService.createFromVoiceInput(
        userId,
        parsedData,
        accountId,
        ipAddress,
        userAgent
      );

      reply.status(201).send(
        successResponse(transaction, 'Transaction created from voice input successfully')
      );
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Get voice command examples
   */
  async getVoiceCommandExamples(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const examples = this.voiceTransactionService.getVoiceCommandExamples();

      reply.status(200).send(successResponse({ examples }));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }
}

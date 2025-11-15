import { FastifyInstance } from 'fastify';
import { VoiceTransactionController } from '../controllers/voiceTransaction.controller';
import {
  parseVoiceInputSchema,
  confirmVoiceTransactionSchema,
} from '../schemas/voiceTransaction.schema';

export default async function voiceTransactionRoutes(fastify: FastifyInstance) {
  const voiceTransactionController = new VoiceTransactionController();

  // All routes require authentication
  fastify.addHook('onRequest', fastify.authenticate);

  fastify.post(
    '/parse',
    {
      schema: {
        body: parseVoiceInputSchema,
        description: 'Parse voice input into transaction data',
      },
    },
    voiceTransactionController.parseVoiceInput.bind(voiceTransactionController)
  );

  fastify.post(
    '/confirm',
    {
      schema: {
        body: confirmVoiceTransactionSchema,
        description: 'Confirm and create transaction from voice input',
      },
    },
    voiceTransactionController.confirmVoiceTransaction.bind(voiceTransactionController)
  );

  fastify.get(
    '/examples',
    {
      schema: {
        description: 'Get voice command examples',
      },
    },
    voiceTransactionController.getVoiceCommandExamples.bind(voiceTransactionController)
  );
}

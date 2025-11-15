import { FastifyInstance } from 'fastify';
import { SettlementController } from '../controllers/settlement.controller';
import { performSettlementSchema } from '../schemas/settlement.schema';

export default async function settlementRoutes(fastify: FastifyInstance) {
  const settlementController = new SettlementController();

  // All routes require authentication
  fastify.addHook('onRequest', fastify.authenticate);

  fastify.post(
    '/perform',
    {
      schema: {
        body: performSettlementSchema,
        description: 'Perform monthly settlement',
      },
    },
    settlementController.performSettlement.bind(settlementController)
  );

  fastify.get(
    '/',
    {
      schema: {
        description: 'Get settlements with filters',
        querystring: {
          type: 'object',
          properties: {
            periodType: { type: 'string', enum: ['monthly', 'yearly'] },
            page: { type: 'number', minimum: 1 },
            limit: { type: 'number', minimum: 1, maximum: 100 },
          },
        },
      },
    },
    settlementController.getSettlements.bind(settlementController)
  );

  fastify.get(
    '/check',
    {
      schema: {
        description: 'Check if settlement is needed',
      },
    },
    settlementController.checkSettlementNeeded.bind(settlementController)
  );

  fastify.get(
    '/:period',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            period: { type: 'string' },
          },
          required: ['period'],
        },
        description: 'Get settlement by period',
      },
    },
    settlementController.getSettlementByPeriod.bind(settlementController)
  );
}

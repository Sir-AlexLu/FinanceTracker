import { FastifyInstance } from 'fastify';
import { LiabilityController } from '../controllers/liability.controller';
import {
  createLiabilitySchema,
  updateLiabilitySchema,
  makeLiabilityPaymentSchema,
} from '../schemas/liability.schema';
import { idParamSchema } from '../schemas/common.schema';

export default async function liabilityRoutes(fastify: FastifyInstance) {
  const liabilityController = new LiabilityController();

  // All routes require authentication
  fastify.addHook('onRequest', fastify.authenticate);

  fastify.post(
    '/',
    {
      schema: {
        body: createLiabilitySchema,
        tags: ['Liabilities'],
        description: 'Create a new liability',
      },
    },
    liabilityController.createLiability.bind(liabilityController)
  );

  fastify.get(
    '/',
    {
      schema: {
        tags: ['Liabilities'],
        description: 'Get liabilities with filters',
        querystring: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['active', 'partially_paid', 'fully_paid'] },
            page: { type: 'number', minimum: 1 },
            limit: { type: 'number', minimum: 1, maximum: 100 },
          },
        },
      },
    },
    liabilityController.getLiabilities.bind(liabilityController)
  );

  fastify.get(
    '/summary',
    {
      schema: {
        tags: ['Liabilities'],
        description: 'Get liability summary',
      },
    },
    liabilityController.getLiabilitySummary.bind(liabilityController)
  );

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
        tags: ['Liabilities'],
        description: 'Get liability by ID',
      },
    },
    liabilityController.getLiabilityById.bind(liabilityController)
  );

  fastify.post(
    '/:id/payment',
    {
      schema: {
        params: idParamSchema,
        body: makeLiabilityPaymentSchema,
        tags: ['Liabilities'],
        description: 'Make a payment towards liability',
      },
    },
    liabilityController.makePayment.bind(liabilityController)
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        params: idParamSchema,
        body: updateLiabilitySchema,
        tags: ['Liabilities'],
        description: 'Update liability',
      },
    },
    liabilityController.updateLiability.bind(liabilityController)
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
        tags: ['Liabilities'],
        description: 'Delete liability',
      },
    },
    liabilityController.deleteLiability.bind(liabilityController)
  );
}

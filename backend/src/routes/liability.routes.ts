// src/routes/liability.routes.ts
import { FastifyInstance } from 'fastify';
import { LiabilityController } from '../controllers/liability.controller.js';
import { createLiabilitySchema, updateLiabilitySchema, makeLiabilityPaymentSchema } from '../schemas/liability.schema.js';

export default async function liabilityRoutes(fastify: FastifyInstance) {
  const ctrl = new LiabilityController();
  fastify.addHook('onRequest', fastify.authenticate);

  fastify.post('/', { schema: { body: createLiabilitySchema } }, ctrl.create);
  fastify.post('/:id/payment', { schema: { body: makeLiabilityPaymentSchema } }, ctrl.payment);
  fastify.get('/', ctrl.getAll);
  fastify.get('/summary', ctrl.summary);
  fastify.get('/:id', ctrl.getById);
  fastify.patch('/:id', { schema: { body: updateLiabilitySchema } }, ctrl.update);
  fastify.delete('/:id', ctrl.delete);
}

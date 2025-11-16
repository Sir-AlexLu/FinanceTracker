// src/routes/goal.routes.ts
import { FastifyInstance } from 'fastify';
import { GoalController } from '../controllers/goal.controller.js';
import { createGoalSchema, updateGoalSchema } from '../schemas/goal.schema.js';

export default async function goalRoutes(fastify: FastifyInstance) {
  const ctrl = new GoalController();
  fastify.addHook('onRequest', fastify.authenticate);

  fastify.post('/', { schema: { body: createGoalSchema } }, ctrl.create);
  fastify.get('/', ctrl.getAll);
  fastify.get('/summary', ctrl.summary);
  fastify.get('/:id', ctrl.getById);
  fastify.post('/:id/progress', ctrl.progress);
  fastify.patch('/:id', { schema: { body: updateGoalSchema } }, ctrl.update);
  fastify.delete('/:id', ctrl.delete);
}

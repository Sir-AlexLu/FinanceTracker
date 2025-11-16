// src/routes/budget.routes.ts
import { FastifyInstance } from 'fastify';
import { BudgetController } from '../controllers/budget.controller.js';
import { createBudgetSchema, updateBudgetSchema } from '../schemas/budget.schema.js';

export default async function budgetRoutes(fastify: FastifyInstance) {
  const ctrl = new BudgetController();
  fastify.addHook('onRequest', fastify.authenticate);

  fastify.post('/', { schema: { body: createBudgetSchema } }, ctrl.create);
  fastify.get('/', ctrl.getAll);
  fastify.get('/active', ctrl.getActive);
  fastify.get('/summary', ctrl.summary);
  fastify.get('/:id', ctrl.getById);
  fastify.patch('/:id', { schema: { body: updateBudgetSchema } }, ctrl.update);
  fastify.delete('/:id', ctrl.delete);
}

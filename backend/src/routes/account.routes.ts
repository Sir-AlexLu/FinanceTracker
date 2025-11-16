// src/routes/account.routes.ts
import { FastifyInstance } from 'fastify';
import { AccountController } from '../controllers/account.controller.js';
import { createAccountSchema, updateAccountSchema } from '../schemas/account.schema.js';

export default async function accountRoutes(fastify: FastifyInstance) {
  const ctrl = new AccountController();

  fastify.addHook('onRequest', fastify.authenticate);

  fastify.post('/', { schema: { body: createAccountSchema } }, ctrl.create);
  fastify.get('/', ctrl.getAll);
  fastify.get('/summary', ctrl.summary);
  fastify.get('/:id', ctrl.getById);
  fastify.patch('/:id', { schema: { body: updateAccountSchema } }, ctrl.update);
  fastify.delete('/:id', ctrl.delete);
}

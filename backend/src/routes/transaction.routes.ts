// src/routes/transaction.routes.ts
import { FastifyInstance } from 'fastify';
import { TransactionController } from '../controllers/transaction.controller.js';
import { createTransactionSchema, updateTransactionSchema } from '../schemas/transaction.schema.js';

export default async function transactionRoutes(fastify: FastifyInstance) {
  const ctrl = new TransactionController();
  fastify.addHook('onRequest', fastify.authenticate);

  fastify.post('/', { schema: { body: createTransactionSchema } }, ctrl.create);
  fastify.get('/', ctrl.getAll);
  fastify.get('/:id', ctrl.getById);
  fastify.patch('/:id', { schema: { body: updateTransactionSchema } }, ctrl.update);
  fastify.delete('/:id', ctrl.delete);
}

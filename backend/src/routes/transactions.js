'use strict';

const {
  createTransactionSchema,
  updateTransactionSchema,
  getTransactionsSchema,
} = require('../schemas/transaction');
const transactionController = require('../controllers/transactionController');

async function transactionRoutes(fastify, options) {
  // Apply authentication to all routes in this file
  fastify.addHook('preHandler', fastify.authenticate);

  // CRUD routes
  fastify.post('/', { schema: { body: createTransactionSchema } }, transactionController.create);
  fastify.get('/', { schema: { querystring: getTransactionsSchema } }, transactionController.list);
  fastify.get('/:id', transactionController.getById);
  fastify.patch('/:id', { schema: { body: updateTransactionSchema } }, transactionController.update);
  fastify.delete('/:id', transactionController.delete);

  // Summary route
  fastify.get('/summary', transactionController.getSummary);
}

module.exports = transactionRoutes;

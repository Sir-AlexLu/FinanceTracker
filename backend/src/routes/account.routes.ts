import { FastifyInstance } from 'fastify';
import { AccountController } from '../controllers/account.controller';
import {
  createAccountSchema,
  updateAccountSchema,
} from '../schemas/account.schema';
import { idParamSchema } from '../schemas/common.schema';

export default async function accountRoutes(fastify: FastifyInstance) {
  const accountController = new AccountController();

  // All routes require authentication
  fastify.addHook('onRequest', fastify.authenticate);

  fastify.post(
    '/',
    {
      schema: {
        body: createAccountSchema,
        description: 'Create a new account',
      },
    },
    accountController.createAccount.bind(accountController)
  );

  fastify.get(
    '/',
    {
      schema: {
        description: 'Get all accounts',
        querystring: {
          type: 'object',
          properties: {
            includeInactive: { type: 'string', enum: ['true', 'false'] },
          },
        },
      },
    },
    accountController.getAccounts.bind(accountController)
  );

  fastify.get(
    '/summary',
    {
      schema: {
        description: 'Get accounts summary',
      },
    },
    accountController.getAccountsSummary.bind(accountController)
  );

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
        description: 'Get account by ID',
      },
    },
    accountController.getAccountById.bind(accountController)
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        params: idParamSchema,
        body: updateAccountSchema,
        description: 'Update account',
      },
    },
    accountController.updateAccount.bind(accountController)
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
        description: 'Delete account',
      },
    },
    accountController.deleteAccount.bind(accountController)
  );
}

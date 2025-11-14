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
        tags: ['Accounts'],
        description: 'Create a new account',
      },
    },
    accountController.createAccount.bind(accountController)
  );

  fastify.get(
    '/',
    {
      schema: {
        tags: ['Accounts'],
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
        tags: ['Accounts'],
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
        tags: ['Accounts'],
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
        tags: ['Accounts'],
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
        tags: ['Accounts'],
        description: 'Delete account',
      },
    },
    accountController.deleteAccount.bind(accountController)
  );
}

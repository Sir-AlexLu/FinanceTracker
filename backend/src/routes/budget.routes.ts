import { FastifyInstance } from 'fastify';
import { BudgetController } from '../controllers/budget.controller';
import {
  createBudgetSchema,
  updateBudgetSchema,
} from '../schemas/budget.schema';
import { idParamSchema } from '../schemas/common.schema';

export default async function budgetRoutes(fastify: FastifyInstance) {
  const budgetController = new BudgetController();

  // All routes require authentication
  fastify.addHook('onRequest', fastify.authenticate);

  fastify.post(
    '/',
    {
      schema: {
        body: createBudgetSchema,
        tags: ['Budgets'],
        description: 'Create a new budget',
      },
    },
    budgetController.createBudget.bind(budgetController)
  );

  fastify.get(
    '/',
    {
      schema: {
        tags: ['Budgets'],
        description: 'Get budgets with filters',
        querystring: {
          type: 'object',
          properties: {
            isActive: { type: 'string', enum: ['true', 'false'] },
            category: { type: 'string' },
            page: { type: 'number', minimum: 1 },
            limit: { type: 'number', minimum: 1, maximum: 100 },
          },
        },
      },
    },
    budgetController.getBudgets.bind(budgetController)
  );

  fastify.get(
    '/active',
    {
      schema: {
        tags: ['Budgets'],
        description: 'Get active budgets',
      },
    },
    budgetController.getActiveBudgets.bind(budgetController)
  );

  fastify.get(
    '/summary',
    {
      schema: {
        tags: ['Budgets'],
        description: 'Get budget summary',
      },
    },
    budgetController.getBudgetSummary.bind(budgetController)
  );

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
        tags: ['Budgets'],
        description: 'Get budget by ID',
      },
    },
    budgetController.getBudgetById.bind(budgetController)
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        params: idParamSchema,
        body: updateBudgetSchema,
        tags: ['Budgets'],
        description: 'Update budget',
      },
    },
    budgetController.updateBudget.bind(budgetController)
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
        tags: ['Budgets'],
        description: 'Delete budget',
      },
    },
    budgetController.deleteBudget.bind(budgetController)
  );
}

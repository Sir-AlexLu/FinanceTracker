import { FastifyInstance } from 'fastify';
import { GoalController } from '../controllers/goal.controller';
import {
  createGoalSchema,
  updateGoalSchema,
} from '../schemas/goal.schema';
import { idParamSchema } from '../schemas/common.schema';

export default async function goalRoutes(fastify: FastifyInstance) {
  const goalController = new GoalController();

  // All routes require authentication
  fastify.addHook('onRequest', fastify.authenticate);

  fastify.post(
    '/',
    {
      schema: {
        body: createGoalSchema,
        description: 'Create a new goal',
      },
    },
    goalController.createGoal.bind(goalController)
  );

  fastify.get(
    '/',
    {
      schema: {
        description: 'Get goals with filters',
        querystring: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['active', 'completed', 'abandoned', 'paused'] },
            type: { type: 'string' },
            page: { type: 'number', minimum: 1 },
            limit: { type: 'number', minimum: 1, maximum: 100 },
          },
        },
      },
    },
    goalController.getGoals.bind(goalController)
  );

  fastify.get(
    '/summary',
    {
      schema: {
        description: 'Get goal summary',
      },
    },
    goalController.getGoalSummary.bind(goalController)
  );

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
        description: 'Get goal by ID',
      },
    },
    goalController.getGoalById.bind(goalController)
  );

  fastify.post(
    '/:id/progress',
    {
      schema: {
        params: idParamSchema,
        description: 'Update goal progress',
      },
    },
    goalController.updateGoalProgress.bind(goalController)
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        params: idParamSchema,
        body: updateGoalSchema,
        description: 'Update goal',
      },
    },
    goalController.updateGoal.bind(goalController)
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
        description: 'Delete goal',
      },
    },
    goalController.deleteGoal.bind(goalController)
  );
}

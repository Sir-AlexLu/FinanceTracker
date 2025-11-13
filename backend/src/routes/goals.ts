import { FastifyInstance } from 'fastify';
import { authenticate } from '@/middleware/auth';
import {
  getGoalsController,
  getGoalByIdController,
  createGoalController,
  updateGoalController,
  deleteGoalController
} from '@/controllers/goals';
import { validateBody } from '@/middleware/validation';
import { createGoalSchema, updateGoalSchema } from '@/utils/validation';

async function goalRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', authenticate);
  
  // Get all goals
  fastify.get('/', getGoalsController);
  
  // Get goal by ID
  fastify.get('/:id', getGoalByIdController);
  
  // Create new goal
  fastify.post('/', {
    preHandler: validateBody(createGoalSchema)
  }, createGoalController);
  
  // Update goal
  fastify.put('/:id', {
    preHandler: validateBody(updateGoalSchema)
  }, updateGoalController);
  
  // Delete goal
  fastify.delete('/:id', deleteGoalController);
}

export default goalRoutes;

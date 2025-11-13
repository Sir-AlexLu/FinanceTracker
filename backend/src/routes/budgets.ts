import { FastifyInstance } from 'fastify';
import { authenticate } from '@/middleware/auth';
import {
  getBudgetsController,
  getBudgetByIdController,
  createBudgetController,
  updateBudgetController,
  deleteBudgetController
} from '@/controllers/budgets';
import { validateBody } from '@/middleware/validation';
import { createBudgetSchema, updateBudgetSchema } from '@/utils/validation';

async function budgetRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', authenticate);
  
  // Get all budgets
  fastify.get('/', getBudgetsController);
  
  // Get budget by ID
  fastify.get('/:id', getBudgetByIdController);
  
  // Create new budget
  fastify.post('/', {
    preHandler: validateBody(createBudgetSchema)
  }, createBudgetController);
  
  // Update budget
  fastify.put('/:id', {
    preHandler: validateBody(updateBudgetSchema)
  }, updateBudgetController);
  
  // Delete budget
  fastify.delete('/:id', deleteBudgetController);
}

export default budgetRoutes;

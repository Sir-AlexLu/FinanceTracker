import { FastifyInstance } from 'fastify';
import { authenticate } from '@/middleware/auth';
import {
  getSettlementsController,
  getSettlementByIdController,
  createSettlementController,
  updateSettlementController,
  deleteSettlementController,
  getPendingSettlementsController,
  triggerSettlementController
} from '@/controllers/settlements';
import { validateBody } from '@/middleware/validation';
import { createSettlementSchema, updateSettlementSchema } from '@/utils/validation';

async function settlementRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', authenticate);
  
  // Get all settlements
  fastify.get('/', getSettlementsController);
  
  // Get pending settlements
  fastify.get('/pending', getPendingSettlementsController);
  
  // Trigger settlement
  fastify.post('/trigger', triggerSettlementController);
  
  // Get settlement by ID
  fastify.get('/:id', getSettlementByIdController);
  
  // Create new settlement
  fastify.post('/', {
    preHandler: validateBody(createSettlementSchema)
  }, createSettlementController);
  
  // Update settlement
  fastify.put('/:id', {
    preHandler: validateBody(updateSettlementSchema)
  }, updateSettlementController);
  
  // Delete settlement
  fastify.delete('/:id', deleteSettlementController);
}

export default settlementRoutes;

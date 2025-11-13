import { FastifyInstance } from 'fastify';
import { authenticate } from '@/middleware/auth';
import {
  getBillsController,
  getBillByIdController,
  createBillController,
  updateBillController,
  deleteBillController,
  getUpcomingBillsController,
  getOverdueBillsController
} from '@/controllers/bills';
import { validateBody } from '@/middleware/validation';
import { createBillSchema, updateBillSchema } from '@/utils/validation';

async function billRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', authenticate);
  
  // Get all bills
  fastify.get('/', getBillsController);
  
  // Get upcoming bills
  fastify.get('/upcoming', getUpcomingBillsController);
  
  // Get overdue bills
  fastify.get('/overdue', getOverdueBillsController);
  
  // Get bill by ID
  fastify.get('/:id', getBillByIdController);
  
  // Create new bill
  fastify.post('/', {
    preHandler: validateBody(createBillSchema)
  }, createBillController);
  
  // Update bill
  fastify.put('/:id', {
    preHandler: validateBody(updateBillSchema)
  }, updateBillController);
  
  // Delete bill
  fastify.delete('/:id', deleteBillController);
}

export default billRoutes;

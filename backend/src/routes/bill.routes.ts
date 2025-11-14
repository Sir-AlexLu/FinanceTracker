import { FastifyInstance } from 'fastify';
import { BillController } from '../controllers/bill.controller';
import {
  createBillSchema,
  updateBillSchema,
  markBillAsPaidSchema,
} from '../schemas/bill.schema';
import { idParamSchema } from '../schemas/common.schema';

export default async function billRoutes(fastify: FastifyInstance) {
  const billController = new BillController();

  // All routes require authentication
  fastify.addHook('onRequest', fastify.authenticate);

  fastify.post(
    '/',
    {
      schema: {
        body: createBillSchema,
        tags: ['Bills'],
        description: 'Create a new bill',
      },
    },
    billController.createBill.bind(billController)
  );

  fastify.get(
    '/',
    {
      schema: {
        tags: ['Bills'],
        description: 'Get bills with filters',
        querystring: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['upcoming', 'overdue', 'paid', 'partially_paid'] },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            page: { type: 'number', minimum: 1 },
            limit: { type: 'number', minimum: 1, maximum: 100 },
          },
        },
      },
    },
    billController.getBills.bind(billController)
  );

  fastify.get(
    '/upcoming',
    {
      schema: {
        tags: ['Bills'],
        description: 'Get upcoming bills',
      },
    },
    billController.getUpcomingBills.bind(billController)
  );

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
        tags: ['Bills'],
        description: 'Get bill by ID',
      },
    },
    billController.getBillById.bind(billController)
  );

  fastify.get(
    '/:id/approval',
    {
      schema: {
        params: idParamSchema,
        tags: ['Bills'],
        description: 'Get bill payment approval',
      },
    },
    billController.getBillPaymentApproval.bind(billController)
  );

  fastify.post(
    '/:id/pay',
    {
      schema: {
        params: idParamSchema,
        body: markBillAsPaidSchema,
        tags: ['Bills'],
        description: 'Mark bill as paid',
      },
    },
    billController.markAsPaid.bind(billController)
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        params: idParamSchema,
        body: updateBillSchema,
        tags: ['Bills'],
        description: 'Update bill',
      },
    },
    billController.updateBill.bind(billController)
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
        tags: ['Bills'],
        description: 'Delete bill',
      },
    },
    billController.deleteBill.bind(billController)
  );
}

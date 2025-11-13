import { FastifyRequest, FastifyReply } from 'fastify';
import { billsService } from '@/services/bills';

export const getBillsController = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const userId = (request.user as any).id;
  const result = await billsService.getBills(userId);
  
  return reply.status(result.success ? 200 : 400).send(result);
};

export const getBillByIdController = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const userId = (request.user as any).id;
  const { id } = request.params;
  
  const result = await billsService.getBillById(userId, id);
  
  return reply.status(result.success ? 200 : 404).send(result);
};

export const createBillController = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const userId = (request.user as any).id;
  const result = await billsService.createBill(userId, request.body);
  
  return reply.status(result.success ? 201 : 400).send(result);
};

export const updateBillController = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const userId = (request.user as any).id;
  const { id } = request.params;
  
  const result = await billsService.updateBill(userId, id, request.body);
  
  return reply.status(result.success ? 200 : 404).send(result);
};

export const deleteBillController = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const userId = (request.user as any).id;
  const { id } = request.params;
  
  const result = await billsService.deleteBill(userId, id);
  
  return reply.status(result.success ? 200 : 404).send(result);
};

export const getUpcomingBillsController = async (
  request: FastifyRequest<{ Querystring: { days?: string } }>,
  reply: FastifyReply
) => {
  const userId = (request.user as any).id;
  const days = request.query.days ? parseInt(request.query.days) : 7;
  
  const result = await billsService.getUpcomingBills(userId, days);
  
  return reply.status(result.success ? 200 : 400).send(result);
};

export const getOverdueBillsController = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const userId = (request.user as any).id;
  
  const result = await billsService.getOverdueBills(userId);
  
  return reply.status(result.success ? 200 : 400).send(result);
};

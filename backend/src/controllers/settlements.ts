import { FastifyRequest, FastifyReply } from 'fastify';
import { settlementsService } from '@/services/settlements';

export const getSettlementsController = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const userId = (request.user as any).id;
  const result = await settlementsService.getSettlements(userId);
  
  return reply.status(result.success ? 200 : 400).send(result);
};

export const getSettlementByIdController = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const userId = (request.user as any).id;
  const { id } = request.params;
  
  const result = await settlementsService.getSettlementById(userId, id);
  
  return reply.status(result.success ? 200 : 404).send(result);
};

export const createSettlementController = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const userId = (request.user as any).id;
  const result = await settlementsService.createSettlement(userId, request.body);
  
  return reply.status(result.success ? 201 : 400).send(result);
};

export const updateSettlementController = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const userId = (request.user as any).id;
  const { id } = request.params;
  
  const result = await settlementsService.updateSettlement(userId, id, request.body);
  
  return reply.status(result.success ? 200 : 404).send(result);
};

export const deleteSettlementController = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const userId = (request.user as any).id;
  const { id } = request.params;
  
  const result = await settlementsService.deleteSettlement(userId, id);
  
  return reply.status(result.success ? 200 : 404).send(result);
};

export const getPendingSettlementsController = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const userId = (request.user as any).id;
  
  const result = await settlementsService.getPendingSettlements(userId);
  
  return reply.status(result.success ? 200 : 400).send(result);
};

export const triggerSettlementController = async (
  request: FastifyRequest<{ Body: { type: 'monthly' | 'yearly' } }>,
  reply: FastifyReply
) => {
  const userId = (request.user as any).id;
  const { type } = request.body;
  
  const result = await settlementsService.triggerAutoSettlement(userId, type);
  
  return reply.status(result.success ? 201 : 400).send(result);
};

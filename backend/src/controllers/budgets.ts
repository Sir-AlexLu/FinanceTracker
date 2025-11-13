import { FastifyRequest, FastifyReply } from 'fastify';
import { budgetsService } from '@/services/budgets';

export const getBudgetsController = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const userId = (request.user as any).id;
  const result = await budgetsService.getBudgets(userId);
  
  return reply.status(result.success ? 200 : 400).send(result);
};

export const getBudgetByIdController = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const userId = (request.user as any).id;
  const { id } = request.params;
  
  const result = await budgetsService.getBudgetById(userId, id);
  
  return reply.status(result.success ? 200 : 404).send(result);
};

export const createBudgetController = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const userId = (request.user as any).id;
  const result = await budgetsService.createBudget(userId, request.body);
  
  return reply.status(result.success ? 201 : 400).send(result);
};

export const updateBudgetController = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const userId = (request.user as any).id;
  const { id } = request.params;
  
  const result = await budgetsService.updateBudget(userId, id, request.body);
  
  return reply.status(result.success ? 200 : 404).send(result);
};

export const deleteBudgetController = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const userId = (request.user as any).id;
  const { id } = request.params;
  
  const result = await budgetsService.deleteBudget(userId, id);
  
  return reply.status(result.success ? 200 : 404).send(result);
};

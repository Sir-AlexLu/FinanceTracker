import { FastifyRequest, FastifyReply } from 'fastify';
import { goalsService } from '@/services/goals';

export const getGoalsController = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const userId = (request.user as any).id;
  const result = await goalsService.getGoals(userId);
  
  return reply.status(result.success ? 200 : 400).send(result);
};

export const getGoalByIdController = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const userId = (request.user as any).id;
  const { id } = request.params;
  
  const result = await goalsService.getGoalById(userId, id);
  
  return reply.status(result.success ? 200 : 404).send(result);
};

export const createGoalController = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const userId = (request.user as any).id;
  const result = await goalsService.createGoal(userId, request.body);
  
  return reply.status(result.success ? 201 : 400).send(result);
};

export const updateGoalController = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const userId = (request.user as any).id;
  const { id } = request.params;
  
  const result = await goalsService.updateGoal(userId, id, request.body);
  
  return reply.status(result.success ? 200 : 404).send(result);
};

export const deleteGoalController = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const userId = (request.user as any).id;
  const { id } = request.params;
  
  const result = await goalsService.deleteGoal(userId, id);
  
  return reply.status(result.success ? 200 : 404).send(result);
};

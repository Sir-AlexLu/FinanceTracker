import { FastifyRequest, FastifyReply } from 'fastify';
import { transactionsService } from '@/services/transactions';

export const getTransactionsController = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const userId = (request.user as any).id;
  const result = await transactionsService.getTransactions(userId, request.query);
  
  return reply.status(result.success ? 200 : 400).send(result);
};

export const getRecentTransactionsController = async (
  request: FastifyRequest<{ Querystring: { limit?: string } }>,
  reply: FastifyReply
) => {
  const userId = (request.user as any).id;
  const limit = request.query.limit ? parseInt(request.query.limit) : 5;
  
  const result = await transactionsService.getRecentTransactions(userId, limit);
  
  return reply.status(result.success ? 200 : 400).send(result);
};

export const getTransactionByIdController = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const userId = (request.user as any).id;
  const { id } = request.params;
  
  const result = await transactionsService.getTransactionById(userId, id);
  
  return reply.status(result.success ? 200 : 404).send(result);
};

export const createTransactionController = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const userId = (request.user as any).id;
  const result = await transactionsService.createTransaction(userId, request.body);
  
  return reply.status(result.success ? 201 : 400).send(result);
};

export const updateTransactionController = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const userId = (request.user as any).id;
  const { id } = request.params;
  
  const result = await transactionsService.updateTransaction(userId, id, request.body);
  
  return reply.status(result.success ? 200 : 404).send(result);
};

export const deleteTransactionController = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const userId = (request.user as any).id;
  const { id } = request.params;
  
  const result = await transactionsService.deleteTransaction(userId, id);
  
  return reply.status(result.success ? 200 : 404).send(result);
};

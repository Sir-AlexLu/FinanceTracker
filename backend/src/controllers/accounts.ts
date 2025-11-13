import { FastifyRequest, FastifyReply } from 'fastify';
import { accountsService } from '@/services/accounts';

export const getAccountsController = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const userId = (request.user as any).id;
  const result = await accountsService.getAccounts(userId);
  
  return reply.status(result.success ? 200 : 400).send(result);
};

export const getAccountByIdController = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const userId = (request.user as any).id;
  const { id } = request.params;
  
  const result = await accountsService.getAccountById(userId, id);
  
  return reply.status(result.success ? 200 : 404).send(result);
};

export const createAccountController = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const userId = (request.user as any).id;
  const result = await accountsService.createAccount(userId, request.body);
  
  return reply.status(result.success ? 201 : 400).send(result);
};

export const updateAccountController = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const userId = (request.user as any).id;
  const { id } = request.params;
  
  const result = await accountsService.updateAccount(userId, id, request.body);
  
  return reply.status(result.success ? 200 : 404).send(result);
};

export const deleteAccountController = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const userId = (request.user as any).id;
  const { id } = request.params;
  
  const result = await accountsService.deleteAccount(userId, id);
  
  return reply.status(result.success ? 200 : 404).send(result);
};

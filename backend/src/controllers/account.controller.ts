// src/controllers/account.controller.ts
import type { FastifyRequest, FastifyReply } from 'fastify';
import { AccountService } from '../services/account.service.js';
import { createAccountSchema, updateAccountSchema } from '../schemas/account.schema.js';
import { logger } from '../utils/logger.js';

export class AccountController {
  private service = new AccountService();

  create = async (req: FastifyRequest<{ Body: typeof createAccountSchema['_output'] }>, reply: FastifyReply) => {
    const account = await this.service.create(req.user.userId, req.body, req.ip, req.headers['user-agent'] || '');
    reply.code(201).send({ data: account, message: 'Account created' });
  };

  getAll = async (req: FastifyRequest<{ Querystring: { includeInactive?: 'true' | 'false' } }>, reply: FastifyReply) => {
    const accounts = await this.service.getAll(req.user.userId, req.query.includeInactive === 'true');
    reply.send({ data: accounts });
  };

  getById = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const account = await this.service.getById(req.user.userId, req.params.id);
    reply.send({ data: account });
  };

  update = async (req: FastifyRequest<{ Params: { id: string }; Body: typeof updateAccountSchema['_output'] }>, reply: FastifyReply) => {
    const account = await this.service.update(req.user.userId, req.params.id, req.body, req.ip, req.headers['user-agent'] || '');
    reply.send({ data: account, message: 'Account updated' });
  };

  delete = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    await this.service.delete(req.user.userId, req.params.id, req.ip, req.headers['user-agent'] || '');
    reply.send({ message: 'Account deleted/deactivated' });
  };

  summary = async (req: FastifyRequest, reply: FastifyReply) => {
    const summary = await this.service.getSummary(req.user.userId);
    reply.send({ data: summary });
  };
}

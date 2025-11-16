// src/controllers/transaction.controller.ts
import type { FastifyRequest, FastifyReply } from 'fastify';
import { TransactionService } from '../services/transaction.service.js';
import { createTransactionSchema, updateTransactionSchema } from '../schemas/transaction.schema.js';
import { logger } from '../utils/logger.js';

export class TransactionController {
  private svc = new TransactionService();

  create = async (req: FastifyRequest<{ Body: typeof createTransactionSchema['_output'] }>, reply: FastifyReply) => {
    const tx = await this.svc.create(req.user.userId, req.body, req.ip, req.headers['user-agent'] || '');
    reply.code(201).send({ data: tx, message: 'Created' });
  };

  getAll = async (req: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) => {
    const result = await this.svc.getAll(req.user.userId, req.query);
    reply.send({ data: result.transactions, meta: { page: result.page, total: result.total, totalPages: result.totalPages } });
  };

  getById = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const tx = await this.svc.getById(req.user.userId, req.params.id); // add getById if needed
    reply.send({ data: tx });
  };

  update = async (req: FastifyRequest<{ Params: { id: string }; Body: typeof updateTransactionSchema['_output'] }>, reply: FastifyReply) => {
    const tx = await this.svc.update(req.user.userId, req.params.id, req.body, req.ip, req.headers['user-agent'] || '');
    reply.send({ data: tx, message: 'Updated' });
  };

  delete = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    await this.svc.delete(req.user.userId, req.params.id, req.ip, req.headers['user-agent'] || '');
    reply.send({ message: 'Deleted' });
  };
}

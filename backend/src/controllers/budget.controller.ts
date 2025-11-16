// src/controllers/budget.controller.ts
import type { FastifyRequest, FastifyReply } from 'fastify';
import { BudgetService } from '../services/budget.service.js';
import { createBudgetSchema, updateBudgetSchema } from '../schemas/budget.schema.js';
import { logger } from '../utils/logger.js';

export class BudgetController {
  private svc = new BudgetService();

  create = async (req: FastifyRequest<{ Body: typeof createBudgetSchema['_output'] }>, reply: FastifyReply) => {
    const budget = await this.svc.create(req.user.userId, req.body, req.ip, req.headers['user-agent'] || '');
    reply.code(201).send({ data: budget, message: 'Created' });
  };

  getAll = async (req: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) => {
    const result = await this.svc.getAll(req.user.userId, req.query);
    reply.send({ data: result.budgets, meta: { page: result.page, total: result.total, totalPages: result.totalPages } });
  };

  getActive = async (req: FastifyRequest, reply: FastifyReply) => {
    const budgets = await this.svc.getActive(req.user.userId);
    reply.send({ data: budgets });
  };

  getById = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const budget = await this.svc.getById(req.user.userId, req.params.id);
    reply.send({ data: budget });
  };

  update = async (req: FastifyRequest<{ Params: { id: string }; Body: typeof updateBudgetSchema['_output'] }>, reply: FastifyReply) => {
    const budget = await this.svc.update(req.user.userId, req.params.id, req.body, req.ip, req.headers['user-agent'] || '');
    reply.send({ data: budget, message: 'Updated' });
  };

  delete = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    await this.svc.delete(req.user.userId, req.params.id, req.ip, req.headers['user-agent'] || '');
    reply.send({ message: 'Deleted' });
  };

  summary = async (req: FastifyRequest, reply: FastifyReply) => {
    const summary = await this.svc.getSummary(req.user.userId);
    reply.send({ data: summary });
  };
}

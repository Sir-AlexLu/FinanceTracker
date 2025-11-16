// src/controllers/goal.controller.ts
import type { FastifyRequest, FastifyReply } from 'fastify';
import { GoalService } from '../services/goal.service.js';
import { createGoalSchema, updateGoalSchema } from '../schemas/goal.schema.js';
import { logger } from '../utils/logger.js';

export class GoalController {
  private svc = new GoalService();

  create = async (req: FastifyRequest<{ Body: typeof createGoalSchema['_output'] }>, reply: FastifyReply) => {
    const goal = await this.svc.create(req.user.userId, req.body, req.ip, req.headers['user-agent'] || '');
    reply.code(201).send({ data: goal, message: 'Created' });
  };

  getAll = async (req: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) => {
    const result = await this.svc.getAll(req.user.userId, req.query);
    reply.send({ data: result.goals, meta: { page: result.page, total: result.total, totalPages: result.totalPages } });
  };

  getById = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const goal = await this.svc.getById(req.user.userId, req.params.id);
    reply.send({ data: goal });
  };

  update = async (req: FastifyRequest<{ Params: { id: string }; Body: typeof updateGoalSchema['_output'] }>, reply: FastifyReply) => {
    const goal = await this.svc.update(req.user.userId, req.params.id, req.body, req.ip, req.headers['user-agent'] || '');
    reply.send({ data: goal, message: 'Updated' });
  };

  delete = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    await this.svc.delete(req.user.userId, req.params.id, req.ip, req.headers['user-agent'] || '');
    reply.send({ message: 'Deleted' });
  };

  progress = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const goal = await this.svc.updateProgress(req.params.id);
    reply.send({ data: goal, message: 'Progress updated' });
  };

  summary = async (req: FastifyRequest, reply: FastifyReply) => {
    const summary = await this.svc.getSummary(req.user.userId);
    reply.send({ data: summary });
  };
}

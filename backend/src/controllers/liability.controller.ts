// src/controllers/liability.controller.ts
import type { FastifyRequest, FastifyReply } from 'fastify';
import { LiabilityService } from '../services/liability.service.js';
import { createLiabilitySchema, updateLiabilitySchema, makeLiabilityPaymentSchema } from '../schemas/liability.schema.js';

export class LiabilityController {
  private svc = new LiabilityService();

  create = async (req: FastifyRequest<{ Body: typeof createLiabilitySchema['_output'] }>, reply: FastifyReply) => {
    const liability = await this.svc.create(req.user.userId, req.body, req.ip, req.headers['user-agent'] || '');
    reply.code(201).send({ data: liability, message: 'Created' });
  };

  payment = async (req: FastifyRequest<{ Params: { id: string }; Body: typeof makeLiabilityPaymentSchema['_output'] }>, reply: FastifyReply) => {
    const result = await this.svc.makePayment(req.user.userId, req.params.id, req.body, req.ip, req.headers['user-agent'] || '');
    reply.send({ data: result, message: 'Paid' });
  };

  getAll = async (req: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) => {
    const result = await this.svc.getAll(req.user.userId, req.query);
    reply.send({ data: result.liabilities, meta: { page: result.page, total: result.total, totalPages: result.totalPages } });
  };

  getById = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const liability = await this.svc.getById(req.user.userId, req.params.id);
    reply.send({ data: liability });
  };

  update = async (req: FastifyRequest<{ Params: { id: string }; Body: typeof updateLiabilitySchema['_output'] }>, reply: FastifyReply) => {
    const liability = await this.svc.update(req.user.userId, req.params.id, req.body, req.ip, req.headers['user-agent'] || '');
    reply.send({ data: liability, message: 'Updated' });
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

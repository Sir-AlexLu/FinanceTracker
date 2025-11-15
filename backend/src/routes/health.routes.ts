// src/routes/health.routes.ts
import { FastifyInstance } from 'fastify';
import mongoose from 'mongoose';

export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (request, reply) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const uptime = process.uptime();

    return reply.send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
      database: dbStatus,
      environment: process.env.NODE_ENV,
    });
  });
}

import { FastifyInstance } from 'fastify';
import mongoose from 'mongoose';

export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/',
    {
      schema: {
        tags: ['Health'],
        description: 'Health check endpoint',
      },
    },
    async (request, reply) => {
      const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: dbStatus,
        environment: process.env.NODE_ENV || 'development',
        version: '1.5.0',
      };
    }
  );
}

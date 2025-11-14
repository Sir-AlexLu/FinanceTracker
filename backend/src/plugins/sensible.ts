import fp from 'fastify-plugin';
import sensible from '@fastify/sensible';
import { FastifyInstance } from 'fastify';

export default fp(async (fastify: FastifyInstance) => {
  await fastify.register(sensible);
  fastify.log.info('✅ Sensible plugin registered');
});

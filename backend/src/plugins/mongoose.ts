import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import mongoose from 'mongoose';
import { getEnv } from '../config/env';

export default fp(async (fastify: FastifyInstance) => {
  const env = getEnv();

  try {
    await mongoose.connect(env.MONGODB_URI, {
      dbName: env.MONGODB_DB_NAME,
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      retryWrites: true,
      retryReads: true,
    });

    fastify.log.info('✅ MongoDB connected successfully');

    // Error handling
    mongoose.connection.on('error', (err) => {
      fastify.log.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      fastify.log.warn('⚠️  MongoDB disconnected');
    });

    // Graceful shutdown
    fastify.addHook('onClose', async () => {
      await mongoose.connection.close();
      fastify.log.info('🔌 MongoDB connection closed');
    });
  } catch (error) {
    fastify.log.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
});

// src/plugins/mongoose.ts
import fp from 'fastify-plugin';
import mongoose from 'mongoose';
import { getEnv } from '../config/env.js';

export default fp(async (fastify) => {
  const env = getEnv();

  try {
    await mongoose.connect(env.MONGODB_URI, {
      dbName: env.MONGODB_DB_NAME,
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45_000,
      serverSelectionTimeoutMS: 5_000,
      retryWrites: true,
      retryReads: true,
    });

    fastify.log.info('MongoDB connected');

    mongoose.connection.on('error', (err) => {
      fastify.log.error(err, 'MongoDB error');
    });

    mongoose.connection.on('disconnected', () => {
      fastify.log.warn('MongoDB disconnected');
    });

    fastify.addHook('onClose', async () => {
      await mongoose.disconnect();
      fastify.log.info('MongoDB disconnected');
    });
  } catch (err) {
    fastify.log.error(err, 'MongoDB connection failed');
    throw err;
  }
});

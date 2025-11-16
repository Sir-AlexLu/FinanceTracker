import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import accountRoutes from './routes/accounts.js';
import transactionRoutes from './routes/transactions.js';

// Load environment variables
dotenv.config();

// Initialize Fastify
const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'error' : 'info',
  },
});

// Register CORS
await fastify.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
});

// Register JWT
await fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  sign: {
    expiresIn: '7d',
  },
});

// Connect to MongoDB
await connectDB();

// Health check route
fastify.get('/', async (request, reply) => {
  return {
    success: true,
    message: '🚀 Finance Tracker API',
    version: '1.0.0',
    status: 'running',
  };
});

fastify.get('/health', async (request, reply) => {
  return {
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  };
});

// Register API routes
await fastify.register(authRoutes, { prefix: '/api/auth' });
await fastify.register(accountRoutes, { prefix: '/api/accounts' });
await fastify.register(transactionRoutes, { prefix: '/api/transactions' });

// 404 handler
fastify.setNotFoundHandler((request, reply) => {
  reply.code(404).send({
    success: false,
    message: 'Route not found',
  });
});

// Error handler
fastify.setErrorHandler(errorHandler);

// Start server
const start = async () => {
  try {
    const port = process.env.PORT || 3001;
    const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
    
    await fastify.listen({ port, host });
    console.log(`
╔══════════════════════════════════════╗
║  🚀 Finance Tracker API Started      ║
║  📡 Port: ${port}                        ║
║  🌍 Environment: ${process.env.NODE_ENV || 'development'}         ║
║  ✅ Status: Running                  ║
╚══════════════════════════════════════╝
    `);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

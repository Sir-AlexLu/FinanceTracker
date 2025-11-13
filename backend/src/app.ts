import fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { fastifyHelmet } from '@fastify/helmet';
import fastifyCors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Import routes
import { connectDB } from './utils/database';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import accountRoutes from './routes/accounts';
import transactionRoutes from './routes/transactions';
import budgetRoutes from './routes/budgets';
import goalRoutes from './routes/goals';
import billRoutes from './routes/bills';
import settlementRoutes from './routes/settlements';
import analyticsRoutes from './routes/analytics';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Fastify instance
const app: FastifyInstance = fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

// Register plugins
app.register(fastifyHelmet);
app.register(fastifyCors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
});
app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'fallback-secret',
});
app.register(fastifyRateLimit, {
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  timeWindow: `${process.env.RATE_LIMIT_TIME_WINDOW || '15'}m`,
});
app.register(fastifyMultipart, {
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
  },
});
app.register(fastifyStatic, {
  root: path.join(__dirname, '../uploads'),
  prefix: '/uploads/',
});

// Register routes
app.register(authRoutes, { prefix: '/api/auth' });
app.register(accountRoutes, { prefix: '/api/accounts' });
app.register(transactionRoutes, { prefix: '/api/transactions' });
app.register(budgetRoutes, { prefix: '/api/budgets' });
app.register(goalRoutes, { prefix: '/api/goals' });
app.register(billRoutes, { prefix: '/api/bills' });
app.register(settlementRoutes, { prefix: '/api/settlements' });
app.register(analyticsRoutes, { prefix: '/api/analytics' });

// Health check endpoint
app.get('/health', async (request, reply) => {
  return { success: true, message: 'Server is running' };
});

// Error handler
app.setErrorHandler(errorHandler);

// Connect to database
connectDB();

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001');
    const host = process.env.HOST || '0.0.0.0';
    
    await app.listen({ port, host });
    app.log.info(`Server listening on http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();

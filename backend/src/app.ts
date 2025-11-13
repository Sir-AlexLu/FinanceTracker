import fastify from 'fastify';
import { fastifyHelmet } from '@fastify/helmet';
import fastifyCors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Determine if we're in production
const isProduction = process.env.NODE_ENV === 'production';

// Import configuration based on environment
const config = isProduction 
  ? require('./config/production').productionConfig 
  : {
      port: parseInt(process.env.PORT || '3001'),
      host: process.env.HOST || '0.0.0.0',
      mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/finance-tracker',
      },
      jwt: {
        secret: process.env.JWT_SECRET || 'fallback-secret',
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        refreshSecret: process.env.REFRESH_TOKEN_SECRET || 'fallback-refresh-secret',
        refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
      },
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
      },
      rateLimit: {
        max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
        timeWindow: `${process.env.RATE_LIMIT_TIME_WINDOW || '15'}m`,
      },
      upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
      },
      logging: {
        level: process.env.LOG_LEVEL || 'info',
      },
    };

// Create Fastify instance with production-optimized settings
const app = fastify({
  logger: {
    level: config.logging.level,
    // In production, use a more structured logger
    ...(isProduction && {
      prettyPrint: false,
      serializers: {
        req(req) {
          return {
            method: req.method,
            url: req.url,
            headers: {
              'user-agent': req.headers['user-agent'],
            },
            hostname: req.hostname,
            remoteAddress: req.ip,
            remotePort: req.socket.remotePort,
          };
        },
      },
    }),
  },
  // Trust proxy for deployment behind reverse proxy
  trustProxy: true,
  // Enable body size limit
  bodyLimit: 1048576, // 1MB
});

// Register plugins with production-optimized settings
app.register(fastifyHelmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  // Hide X-Powered-By header in production
  hidePoweredBy: isProduction,
});

app.register(fastifyCors, {
  origin: config.cors.origin,
  credentials: config.cors.credentials,
});

app.register(fastifyJwt, {
  secret: config.jwt.secret,
});

app.register(fastifyRateLimit, {
  max: config.rateLimit.max,
  timeWindow: config.rateLimit.timeWindow,
  // In production, use Redis for distributed rate limiting if available
  ...(isProduction && {
    redis: process.env.REDIS_URL,
  }),
});

app.register(fastifyMultipart, {
  limits: {
    fileSize: config.upload.maxFileSize,
  },
});

app.register(fastifyStatic, {
  root: path.join(__dirname, '../uploads'),
  prefix: '/uploads/',
  // Cache static files in production
  cacheControl: isProduction,
  maxAge: isProduction ? 3600 : 0,
});

// Import routes
import { connectDB } from '@/utils/database';
import { errorHandler } from '@/middleware/errorHandler';
import authRoutes from '@/routes/auth';
import accountRoutes from '@/routes/accounts';
import transactionRoutes from '@/routes/transactions';
import budgetRoutes from '@/routes/budgets';
import goalRoutes from '@/routes/goals';
import billRoutes from '@/routes/bills';
import settlementRoutes from '@/routes/settlements';
import analyticsRoutes from '@/routes/analytics';

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
  return { 
    success: true, 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  };
});

// Error handler
app.setErrorHandler(errorHandler);

// Connect to database
connectDB();

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}. Starting graceful shutdown...`);
  
  try {
    await app.close();
    console.log('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const start = async () => {
  try {
    await app.listen({ 
      port: config.port, 
      host: config.host 
    });
    
    console.log(`Server listening on http://${config.host}:${config.port}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

// Only start server if this file is run directly
if (require.main === module) {
  start();
}

export default app;

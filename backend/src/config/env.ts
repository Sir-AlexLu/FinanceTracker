import { z } from 'zod';

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000').transform(Number),
  HOST: z.string().default('0.0.0.0'),

  // Database
  MONGODB_URI: z.string().url('Invalid MongoDB URI'),
  MONGODB_DB_NAME: z.string().min(1, 'Database name is required'),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT Access Secret must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT Refresh Secret must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // CORS
  FRONTEND_URL: z.string().url('Invalid Frontend URL'),

  // Security
  BCRYPT_ROUNDS: z.string().default('12').transform(Number),
  RATE_LIMIT_MAX: z.string().default('100').transform(Number),
  RATE_LIMIT_TIMEWINDOW: z.string().default('900000').transform(Number),

  // Encryption
  ENCRYPTION_KEY: z.string().length(64, 'Encryption key must be exactly 64 characters'),

  // Features
  ENABLE_AUDIT_LOG: z
    .string()
    .default('true')
    .transform((val) => val === 'true'),
  ENABLE_CRON_JOBS: z
    .string()
    .default('true')
    .transform((val) => val === 'true'),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Optional Redis
  REDIS_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

export function validateEnv(): Env {
  try {
    env = envSchema.parse(process.env);
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.error('❌ Error validating environment variables:', error);
    }
    process.exit(1);
  }
}

export function getEnv(): Env {
  if (!env) {
    env = validateEnv();
  }
  return env;
}

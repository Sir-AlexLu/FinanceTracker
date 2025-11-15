// src/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1024).max(65535).default(5000),
  HOST: z.string().default('0.0.0.0'),

  // Database
  MONGODB_URI: z.string().url(),
  MONGODB_DB_NAME: z.string().min(1),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // CORS
  FRONTEND_URL: z.string().url(),

  // Security
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(14).default(12),
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(100),
  RATE_LIMIT_TIMEWINDOW: z.coerce.number().int().min(1000).default(900_000), // 15min

  // Encryption
  ENCRYPTION_KEY: z.string().length(64),

  // Features
  ENABLE_AUDIT_LOG: z.coerce.boolean().default(true),
  ENABLE_CRON_JOBS: z.coerce.boolean().default(true),

  // Logging
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),

  // Optional
  REDIS_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function validateEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Invalid environment variables:');
    result.error.errors.forEach((err) => {
      console.error(`  • ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }

  cachedEnv = result.data;
  return cachedEnv;
}

export function getEnv(): Env {
  return validateEnv();
}

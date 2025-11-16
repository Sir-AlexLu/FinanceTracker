// File: FinanceTracker/backend/src/config/environment.js
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/financetracker',
  JWT_SECRET: process.env.JWT_SECRET || 'default-secret-change-in-production',
  JWT_EXPIRY: '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3001',
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || 'localhost',
  BCRYPT_ROUNDS: 10
};

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];

if (config.NODE_ENV === 'production') {
  requiredEnvVars.push('CLIENT_URL');
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
}

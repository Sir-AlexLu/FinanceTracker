// src/utils/logger.ts
import pino from 'pino';

const isProd = process.env.NODE_ENV === 'production';

export const logger = pino(
  {
    level: process.env.LOG_LEVEL ?? (isProd ? 'info' : 'debug'),
    transport: !isProd
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  },
  isProd ? pino.destination(1) : undefined
);

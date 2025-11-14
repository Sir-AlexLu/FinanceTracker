export const DEFAULT_ACCOUNT_NAMES = {
  cash: 'Cash Account',
  bank: 'Bank Account',
  savings: 'Savings Account',
  investments: 'Investment Account',
  loans: 'Loan Account',
} as const;

export const MAX_LOGIN_ATTEMPTS = 5;
export const ACCOUNT_LOCK_DURATION = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 20,
  maxLimit: 100,
} as const;

export const SETTLEMENT_PERIODS = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
} as const;

export const PASSWORD_RESET_EXPIRY = 10 * 60 * 1000; // 10 minutes

export const CRON_SCHEDULES = {
  DAILY_NOTIFICATIONS: '0 9 * * *', // 9 AM daily
  MONTHLY_SETTLEMENT: '0 0 1 * *', // 12 AM on 1st of every month
  BILL_REMINDERS: '0 8 * * *', // 8 AM daily
  CLEANUP_EXPIRED_TOKENS: '0 0 * * *', // 12 AM daily
} as const;

export const AUDIT_LOG_RETENTION_DAYS = 90;

export const FILE_EXPORT_LIMITS = {
  MAX_TRANSACTIONS: 10000,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
} as const;

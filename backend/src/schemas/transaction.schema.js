// File: FinanceTracker/backend/src/schemas/transaction.schema.js
import { z } from 'zod';
import { CATEGORIES } from '../models/Transaction.js';

const transactionBaseSchema = z.object({
  type: z.enum(['income', 'expense'], {
    errorMap: () => ({ message: 'Type must be either income or expense' })
  }),
  amount: z
    .number()
    .positive('Amount must be positive')
    .min(0.01, 'Amount must be at least 0.01')
    .max(1000000000, 'Amount is too large'),
  category: z.string(),
  description: z
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .optional(),
  date: z
    .string()
    .datetime()
    .or(z.date())
    .transform(val => new Date(val))
    .optional()
});

export const createTransactionSchema = transactionBaseSchema.refine(
  (data) => {
    if (data.type === 'income') {
      return CATEGORIES.INCOME.includes(data.category);
    } else {
      return CATEGORIES.EXPENSE.includes(data.category);
    }
  },
  {
    message: 'Invalid category for the selected transaction type',
    path: ['category']
  }
);

export const updateTransactionSchema = transactionBaseSchema.partial().refine(
  (data) => {
    if (data.type && data.category) {
      if (data.type === 'income') {
        return CATEGORIES.INCOME.includes(data.category);
      } else {
        return CATEGORIES.EXPENSE.includes(data.category);
      }
    }
    return true;
  },
  {
    message: 'Invalid category for the selected transaction type',
    path: ['category']
  }
);

export const queryTransactionSchema = z.object({
  type: z.enum(['income', 'expense']).optional(),
  category: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sort: z.enum(['date', '-date', 'amount', '-amount']).default('-date')
});

export const validateCreateTransaction = (data) => {
  return createTransactionSchema.safeParse(data);
};

export const validateUpdateTransaction = (data) => {
  return updateTransactionSchema.safeParse(data);
};

export const validateQueryTransaction = (data) => {
  return queryTransactionSchema.safeParse(data);
};

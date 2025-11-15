import { z } from 'zod';
import { objectIdSchema } from '../utils/validation';
import {
  TransactionType,
  IncomeCategory,
  ExpenseCategory,
} from '../types/models.types';

// Recurring config schema
const recurringConfigSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  interval: z.number().int().min(1).max(365),
  endDate: z.string().datetime().optional(),
  requiresApproval: z.boolean().default(true),
});

// Create transaction schema
export const createTransactionSchema = z
  .object({
    type: z.nativeEnum(TransactionType),
    incomeCategory: z.nativeEnum(IncomeCategory).optional(),
    expenseCategory: z.nativeEnum(ExpenseCategory).optional(),
    amount: z.number().min(0.01, 'Amount must be greater than 0'),
    accountId: objectIdSchema,
    destinationAccountId: objectIdSchema.optional(),
    description: z.string().min(1).max(200).trim(),
    date: z.string().datetime().optional(),
    notes: z.string().max(500).trim().optional(),
    tags: z.array(z.string().trim().toLowerCase()).optional(),
    isRecurring: z.boolean().default(false),
    recurringConfig: recurringConfigSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.type === TransactionType.INCOME) {
        return !!data.incomeCategory;
      }
      return true;
    },
    {
      message: 'Income category is required for income transactions',
      path: ['incomeCategory'],
    }
  )
  .refine(
    (data) => {
      if (data.type === TransactionType.EXPENSE) {
        return !!data.expenseCategory;
      }
      return true;
    },
    {
      message: 'Expense category is required for expense transactions',
      path: ['expenseCategory'],
    }
  )
  .refine(
    (data) => {
      if (data.type === TransactionType.TRANSFER) {
        return !!data.destinationAccountId;
      }
      return true;
    },
    {
      message: 'Destination account is required for transfer transactions',
      path: ['destinationAccountId'],
    }
  )
  .refine(
    (data) => {
      if (data.type === TransactionType.TRANSFER) {
        return data.accountId !== data.destinationAccountId;
      }
      return true;
    },
    {
      message: 'Cannot transfer to the same account',
      path: ['destinationAccountId'],
    }
  )
  .refine(
    (data) => {
      if (data.isRecurring) {
        return !!data.recurringConfig;
      }
      return true;
    },
    {
      message: 'Recurring configuration is required for recurring transactions',
      path: ['recurringConfig'],
    }
  )
  .refine(
    (data) => {
      if (data.isRecurring) {
        return data.type !== TransactionType.TRANSFER && data.type !== TransactionType.LIABILITY;
      }
      return true;
    },
    {
      message: 'Recurring transactions cannot be transfers or liabilities',
      path: ['isRecurring'],
    }
  );

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

// Update transaction schema
export const updateTransactionSchema = z.object({
  amount: z.number().min(0.01).optional(),
  description: z.string().min(1).max(200).trim().optional(),
  date: z.string().datetime().optional(),
  notes: z.string().max(500).trim().optional(),
  tags: z.array(z.string().trim().toLowerCase()).optional(),
});

export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

// Get transactions query schema
export const getTransactionsQuerySchema = z.object({
  type: z.nativeEnum(TransactionType).optional(),
  accountId: objectIdSchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export type GetTransactionsQuery = z.infer<typeof getTransactionsQuerySchema>;

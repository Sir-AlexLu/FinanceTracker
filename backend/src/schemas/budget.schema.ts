import { z } from 'zod';
import { ExpenseCategory } from '../types/models.types';

// Create budget schema
export const createBudgetSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  category: z.nativeEnum(ExpenseCategory),
  amount: z.number().min(0.01, 'Budget amount must be greater than 0'),
  period: z.enum(['weekly', 'monthly', 'yearly']),
  startDate: z.string().datetime(),
  alertThreshold: z.number().min(0).max(100).default(80),
  notes: z.string().max(500).trim().optional(),
});

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;

// Update budget schema
export const updateBudgetSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  amount: z.number().min(0.01).optional(),
  alertThreshold: z.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
  notes: z.string().max(500).trim().optional(),
});

export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;

// Get budgets query schema
export const getBudgetsQuerySchema = z.object({
  isActive: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  category: z.nativeEnum(ExpenseCategory).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export type GetBudgetsQuery = z.infer<typeof getBudgetsQuerySchema>;

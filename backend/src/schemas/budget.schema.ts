// src/schemas/budget.schema.ts
import { z } from 'zod';
import { ExpenseCategory } from '../types/models.types.js';

export const createBudgetSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  category: z.nativeEnum(ExpenseCategory),
  amount: z.number().min(0.01),
  period: z.enum(['weekly', 'monthly', 'yearly']),
  startDate: z.string().datetime(),
  alertThreshold: z.number().min(0).max(100).default(80),
  notes: z.string().max(500).trim().optional(),
});

export const updateBudgetSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  amount: z.number().min(0.01).optional(),
  alertThreshold: z.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
  notes: z.string().max(500).trim().optional(),
});

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;

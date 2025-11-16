// src/schemas/goal.schema.ts
import { z } from 'zod';
import { objectIdSchema } from='../utils/validation.js';
import { ExpenseCategory } from '../types/models.types.js';
import { GoalType } from '../models/Goal.js';

export const createGoalSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  type: z.nativeEnum(GoalType),
  description: z.string().max(500).trim().optional(),
  targetAmount: z.number().min(0.01),
  targetDate: z.string().datetime(),
  linkedAccountId: objectIdSchema.optional(),
  linkedLiabilityId: objectIdSchema.optional(),
  linkedCategory: z.nativeEnum(ExpenseCategory).optional(),
  reminderFrequency: z.enum(['weekly', 'monthly', 'none']).default('monthly'),
  notes: z.string().max(500).trim().optional(),
})
.refine(d => [GoalType.SAVINGS, GoalType.INVESTMENT].includes(d.type) ? !!d.linkedAccountId : true, { path: ['linkedAccountId'] })
.refine(d => d.type === GoalType.DEBT_PAYOFF ? !!d.linkedLiabilityId : true, { path: ['linkedLiabilityId'] })
.refine(d => d.type === GoalType.EXPENSE_REDUCTION ? !!d.linkedCategory : true, { path: ['linkedCategory'] });

export const updateGoalSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  description: z.string().max(500).trim().optional(),
  targetAmount: z.number().min(0.01).optional(),
  targetDate: z.string().datetime().optional(),
  status: z.enum(['active', 'completed', 'abandoned', 'paused']).optional(),
  reminderFrequency: z.enum(['weekly', 'monthly', 'none']).optional(),
  notes: z.string().max(500).trim().optional(),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;

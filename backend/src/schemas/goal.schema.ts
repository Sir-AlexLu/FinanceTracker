import { z } from 'zod';
import { objectIdSchema } from '../utils/validation';
import { ExpenseCategory } from '../types/models.types';
import { GoalType } from '../models/Goal';

// Create goal schema
export const createGoalSchema = z
  .object({
    name: z.string().min(1).max(100).trim(),
    type: z.nativeEnum(GoalType),
    description: z.string().max(500).trim().optional(),
    targetAmount: z.number().min(0.01, 'Target amount must be greater than 0'),
    targetDate: z.string().datetime(),
    linkedAccountId: objectIdSchema.optional(),
    linkedLiabilityId: objectIdSchema.optional(),
    linkedCategory: z.nativeEnum(ExpenseCategory).optional(),
    reminderFrequency: z.enum(['weekly', 'monthly', 'none']).default('monthly'),
    notes: z.string().max(500).trim().optional(),
  })
  .refine(
    (data) => {
      if (data.type === GoalType.SAVINGS || data.type === GoalType.INVESTMENT) {
        return !!data.linkedAccountId;
      }
      return true;
    },
    {
      message: 'Savings and Investment goals must have a linked account',
      path: ['linkedAccountId'],
    }
  )
  .refine(
    (data) => {
      if (data.type === GoalType.DEBT_PAYOFF) {
        return !!data.linkedLiabilityId;
      }
      return true;
    },
    {
      message: 'Debt payoff goals must have a linked liability',
      path: ['linkedLiabilityId'],
    }
  )
  .refine(
    (data) => {
      if (data.type === GoalType.EXPENSE_REDUCTION) {
        return !!data.linkedCategory;
      }
      return true;
    },
    {
      message: 'Expense reduction goals must have a linked category',
      path: ['linkedCategory'],
    }
  );

export type CreateGoalInput = z.infer<typeof createGoalSchema>;

// Update goal schema
export const updateGoalSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  description: z.string().max(500).trim().optional(),
  targetAmount: z.number().min(0.01).optional(),
  targetDate: z.string().datetime().optional(),
  status: z.enum(['active', 'completed', 'abandoned', 'paused']).optional(),
  reminderFrequency: z.enum(['weekly', 'monthly', 'none']).optional(),
  notes: z.string().max(500).trim().optional(),
});

export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;

// Get goals query schema
export const getGoalsQuerySchema = z.object({
  status: z.enum(['active', 'completed', 'abandoned', 'paused']).optional(),
  type: z.nativeEnum(GoalType).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export type GetGoalsQuery = z.infer<typeof getGoalsQuerySchema>;

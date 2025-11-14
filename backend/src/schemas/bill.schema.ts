import { z } from 'zod';
import { objectIdSchema } from '../utils/validation';
import { ExpenseCategory } from '../types/models.types';

// Recurring pattern schema
const recurringPatternSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  interval: z.number().int().min(1).max(365),
  endDate: z.string().datetime().optional(),
});

// Create bill schema
export const createBillSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  category: z.nativeEnum(ExpenseCategory),
  dueDate: z.string().datetime(),
  isRecurring: z.boolean().default(false),
  recurringPattern: recurringPatternSchema.optional(),
  defaultAccountId: objectIdSchema.optional(),
  reminderDays: z.array(z.number().int().min(0).max(30)).default([3, 1]),
  notes: z.string().max(500).trim().optional(),
});

export type CreateBillInput = z.infer<typeof createBillSchema>;

// Update bill schema
export const updateBillSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  amount: z.number().min(0.01).optional(),
  category: z.nativeEnum(ExpenseCategory).optional(),
  dueDate: z.string().datetime().optional(),
  defaultAccountId: objectIdSchema.optional(),
  reminderDays: z.array(z.number().int().min(0).max(30)).optional(),
  notes: z.string().max(500).trim().optional(),
});

export type UpdateBillInput = z.infer<typeof updateBillSchema>;

// Mark bill as paid schema
export const markBillAsPaidSchema = z.object({
  accountId: objectIdSchema,
  amount: z.number().min(0.01).optional(),
  notes: z.string().max(200).trim().optional(),
});

export type MarkBillAsPaidInput = z.infer<typeof markBillAsPaidSchema>;

// Get bills query schema
export const getBillsQuerySchema = z.object({
  status: z.enum(['upcoming', 'overdue', 'paid', 'partially_paid']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export type GetBillsQuery = z.infer<typeof getBillsQuerySchema>;

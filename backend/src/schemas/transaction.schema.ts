// src/schemas/transaction.schema.ts
import { z } from 'zod';
import { objectIdSchema } from '../utils/validation.js';
import { TransactionType, IncomeCategory, ExpenseCategory } from '../types/models.types.js';

const recurring = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  interval: z.number().int().min(1).max(365),
  endDate: z.string().datetime().optional(),
  requiresApproval: z.boolean().default(true),
});

export const createTransactionSchema = z.object({
  type: z.nativeEnum(TransactionType),
  incomeCategory: z.nativeEnum(IncomeCategory).optional(),
  expenseCategory: z.nativeEnum(ExpenseCategory).optional(),
  amount: z.number().min(0.01),
  accountId: objectIdSchema,
  destinationAccountId: objectIdSchema.optional(),
  description: z.string().min(1).max(200).trim(),
  date: z.string().datetime().optional(),
  notes: z.string().max(500).trim().optional(),
  tags: z.array(z.string().trim().toLowerCase()).optional(),
  isRecurring: z.boolean().default(false),
  recurringConfig: recurring.optional(),
})
.refine(d => d.type !== TransactionType.INCOME || !!d.incomeCategory, { path: ['incomeCategory'] })
.refine(d => d.type !== TransactionType.EXPENSE || !!d.expenseCategory, { path: ['expenseCategory'] })
.refine(d => d.type !== TransactionType.TRANSFER || !!d.destinationAccountId, { path: ['destinationAccountId'] })
.refine(d => d.type !== TransactionType.TRANSFER || d.accountId !== d.destinationAccountId, { path: ['destinationAccountId'] })
.refine(d => !d.isRecurring || !!d.recurringConfig, { path: ['recurringConfig'] })
.refine(d => !d.isRecurring || ![TransactionType.TRANSFER, TransactionType.LIABILITY].includes(d.type), { path: ['isRecurring'] });

export const updateTransactionSchema = z.object({
  amount: z.number().min(0.01).optional(),
  description: z.string().min(1).max(200).trim().optional(),
  date: z.string().datetime().optional(),
  notes: z.string().max(500).trim().optional(),
  tags: z.array(z.string().trim().toLowerCase()).optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

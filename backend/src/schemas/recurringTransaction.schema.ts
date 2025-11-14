import { z } from 'zod';
import { objectIdSchema } from '../utils/validation';

// Approve recurring transaction schema
export const approveRecurringTransactionSchema = z.object({
  transactionId: objectIdSchema,
  modifyAmount: z.number().min(0.01).optional(),
});

export type ApproveRecurringTransactionInput = z.infer<
  typeof approveRecurringTransactionSchema
>;

// Skip recurring transaction schema
export const skipRecurringTransactionSchema = z.object({
  transactionId: objectIdSchema,
});

export type SkipRecurringTransactionInput = z.infer<typeof skipRecurringTransactionSchema>;

// Cancel recurring transaction schema
export const cancelRecurringTransactionSchema = z.object({
  transactionId: objectIdSchema,
});

export type CancelRecurringTransactionInput = z.infer<
  typeof cancelRecurringTransactionSchema
>;

import { z } from 'zod';
import { objectIdSchema } from '../utils/validation';

// Create liability schema
export const createLiabilitySchema = z.object({
  description: z.string().min(1).max(200).trim(),
  totalAmount: z.number().min(0.01, 'Total amount must be greater than 0'),
  creditor: z.string().min(1).max(100).trim(),
  accountId: objectIdSchema.optional(),
  expectedPaymentDate: z.string().datetime().optional(),
  notes: z.string().max(500).trim().optional(),
  tags: z.array(z.string().trim().toLowerCase()).optional(),
});

export type CreateLiabilityInput = z.infer<typeof createLiabilitySchema>;

// Update liability schema
export const updateLiabilitySchema = z.object({
  description: z.string().min(1).max(200).trim().optional(),
  expectedPaymentDate: z.string().datetime().optional(),
  notes: z.string().max(500).trim().optional(),
  tags: z.array(z.string().trim().toLowerCase()).optional(),
});

export type UpdateLiabilityInput = z.infer<typeof updateLiabilitySchema>;

// Make liability payment schema
export const makeLiabilityPaymentSchema = z.object({
  amount: z.number().min(0.01, 'Payment amount must be greater than 0'),
  accountId: objectIdSchema,
  notes: z.string().max(200).trim().optional(),
});

export type MakeLiabilityPaymentInput = z.infer<typeof makeLiabilityPaymentSchema>;

// Get liabilities query schema
export const getLiabilitiesQuerySchema = z.object({
  status: z.enum(['active', 'partially_paid', 'fully_paid']).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export type GetLiabilitiesQuery = z.infer<typeof getLiabilitiesQuerySchema>;

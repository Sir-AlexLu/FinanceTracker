// src/schemas/liability.schema.ts
import { z } from 'zod';
import { objectIdSchema } from '../utils/validation.js';

export const createLiabilitySchema = z.object({
  description: z.string().min(1).max(200).trim(),
  totalAmount: z.number().min(0.01),
  creditor: z.string().min(1).max(100).trim(),
  accountId: objectIdSchema.optional(),
  expectedPaymentDate: z.string().datetime().optional(),
  notes: z.string().max(500).trim().optional(),
  tags: z.array(z.string().trim().toLowerCase()).optional(),
});

export const updateLiabilitySchema = z.object({
  description: z.string().min(1).max(200).trim().optional(),
  expectedPaymentDate: z.string().datetime().optional(),
  notes: z.string().max(500).trim().optional(),
  tags: z.array(z.string().trim().toLowerCase()).optional(),
});

export const makeLiabilityPaymentSchema = z.object({
  amount: z.number().min(0.01),
  accountId: objectIdSchema,
  notes: z.string().max(200).trim().optional(),
});

export type CreateLiabilityInput = z.infer<typeof createLiabilitySchema>;
export type UpdateLiabilityInput = z.infer<typeof updateLiabilitySchema>;
export type MakeLiabilityPaymentInput = z.infer<typeof makeLiabilityPaymentSchema>;

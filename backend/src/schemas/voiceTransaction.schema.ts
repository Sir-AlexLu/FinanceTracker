import { z } from 'zod';
import { objectIdSchema } from '../utils/validation';

// Parse voice input schema
export const parseVoiceInputSchema = z.object({
  text: z
    .string()
    .min(5, 'Voice input too short')
    .max(500, 'Voice input too long')
    .trim(),
});

export type ParseVoiceInputInput = z.infer<typeof parseVoiceInputSchema>;

// Confirm voice transaction schema
export const confirmVoiceTransactionSchema = z.object({
  text: z.string().min(5).max(500).trim(),
  accountId: objectIdSchema,
  amount: z.number().min(0.01),
  description: z.string().min(1).max(200).trim(),
  category: z.string().min(1),
  type: z.enum(['income', 'expense']),
});

export type ConfirmVoiceTransactionInput = z.infer<typeof confirmVoiceTransactionSchema>;

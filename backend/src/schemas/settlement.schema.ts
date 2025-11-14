import { z } from 'zod';

// Perform settlement schema
export const performSettlementSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in format YYYY-MM'),
});

export type PerformSettlementInput = z.infer<typeof performSettlementSchema>;

// Get settlements query schema
export const getSettlementsQuerySchema = z.object({
  periodType: z.enum(['monthly', 'yearly']).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export type GetSettlementsQuery = z.infer<typeof getSettlementsQuerySchema>;

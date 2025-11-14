import { z } from 'zod';
import { objectIdSchema, paginationSchema } from '../utils/validation';

// Pagination query schema
export const paginationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().positive().default(1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().positive().max(100).default(20)),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

// ID param schema
export const idParamSchema = z.object({
  id: objectIdSchema,
});

export type IdParam = z.infer<typeof idParamSchema>;

// Date range query schema
export const dateRangeQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type DateRangeQuery = z.infer<typeof dateRangeQuerySchema>;

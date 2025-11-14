import { z } from 'zod';
import { objectIdSchema } from '../utils/validation';
import { NotificationType } from '../models/Notification';

// Get notifications query schema
export const getNotificationsQuerySchema = z.object({
  isRead: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  type: z.nativeEnum(NotificationType).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export type GetNotificationsQuery = z.infer<typeof getNotificationsQuerySchema>;

// Mark as read schema
export const markAsReadSchema = z.object({
  notificationId: objectIdSchema,
});

export type MarkAsReadInput = z.infer<typeof markAsReadSchema>;

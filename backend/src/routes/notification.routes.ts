import { FastifyInstance } from 'fastify';
import { NotificationController } from '../controllers/notification.controller';
import { idParamSchema } from '../schemas/common.schema';

export default async function notificationRoutes(fastify: FastifyInstance) {
  const notificationController = new NotificationController();

  // All routes require authentication
  fastify.addHook('onRequest', fastify.authenticate);

  fastify.get(
    '/',
    {
      schema: {
        tags: ['Notifications'],
        description: 'Get notifications',
        querystring: {
          type: 'object',
          properties: {
            isRead: { type: 'string', enum: ['true', 'false'] },
            type: { type: 'string' },
            page: { type: 'number', minimum: 1 },
            limit: { type: 'number', minimum: 1, maximum: 100 },
          },
        },
      },
    },
    notificationController.getNotifications.bind(notificationController)
  );

  fastify.get(
    '/unread-count',
    {
      schema: {
        tags: ['Notifications'],
        description: 'Get unread notification count',
      },
    },
    notificationController.getUnreadCount.bind(notificationController)
  );

  fastify.patch(
    '/:id/read',
    {
      schema: {
        params: idParamSchema,
        tags: ['Notifications'],
        description: 'Mark notification as read',
      },
    },
    notificationController.markAsRead.bind(notificationController)
  );

  fastify.post(
    '/mark-all-read',
    {
      schema: {
        tags: ['Notifications'],
        description: 'Mark all notifications as read',
      },
    },
    notificationController.markAllAsRead.bind(notificationController)
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
        tags: ['Notifications'],
        description: 'Delete notification',
      },
    },
    notificationController.deleteNotification.bind(notificationController)
  );
}

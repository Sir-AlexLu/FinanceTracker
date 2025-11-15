import { FastifyRequest, FastifyReply } from 'fastify';
import { NotificationService } from '../services/notification.service';
import { GetNotificationsQuery } from '../schemas/notification.schema';
import { NotificationQueryParams } from '../types/query.types';
import { successResponse, errorResponse } from '../utils/responseFormatter';

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Get user notifications
   */
  async getNotifications(
    request: FastifyRequest<{ Querystring: NotificationQueryParams }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user.userId;
      const filters = {
        isRead: request.query.isRead === 'true' ? true : request.query.isRead === 'false' ? false : undefined,
        type: request.query.type,
        page: request.query.page ? parseInt(request.query.page) : 1,
        limit: request.query.limit ? parseInt(request.query.limit) : 20,
      };

      const result = await this.notificationService.getNotifications(userId, filters);

      reply.status(200).send(successResponse(result));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user.userId;
      const notificationId = request.params.id;

      const notification = await this.notificationService.markAsRead(userId, notificationId);

      reply.status(200).send(successResponse(notification, 'Notification marked as read'));
    } catch (error: any) {
      request.log.error(error);
      reply.status(404).send(errorResponse(error.message));
    }
  }

  /**
   * Mark all as read
   */
  async markAllAsRead(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = request.user.userId;

      const count = await this.notificationService.markAllAsRead(userId);

      reply.status(200).send(
        successResponse({ count }, `${count} notification(s) marked as read`)
      );
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user.userId;
      const notificationId = request.params.id;

      await this.notificationService.deleteNotification(userId, notificationId);

      reply.status(200).send(successResponse(null, 'Notification deleted successfully'));
    } catch (error: any) {
      request.log.error(error);
      reply.status(404).send(errorResponse(error.message));
    }
  }

  /**
   * Get unread count
   */
  async getUnreadCount(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = request.user.userId;

      const count = await this.notificationService.getUnreadCount(userId);

      reply.status(200).send(successResponse({ count }));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }
}

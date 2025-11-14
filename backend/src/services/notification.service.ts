import { Notification, INotification, NotificationType } from '../models/Notification';
import mongoose from 'mongoose';

export class NotificationService {
  /**
   * Get user notifications
   */
  async getNotifications(
    userId: string,
    filters: {
      isRead?: boolean;
      type?: NotificationType;
      page?: number;
      limit?: number;
    }
  ): Promise<{ notifications: INotification[]; total: number; unreadCount: number }> {
    try {
      const query: any = { userId };

      if (filters.isRead !== undefined) {
        query.isRead = filters.isRead;
      }

      if (filters.type) {
        query.type = filters.type;
      }

      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Notification.countDocuments(query),
        Notification.countDocuments({ userId, isRead: false }),
      ]);

      return { notifications, total, unreadCount };
    } catch (error: any) {
      throw new Error(`Failed to get notifications: ${error.message}`);
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(userId: string, notificationId: string): Promise<INotification> {
    try {
      const notification = await Notification.findOne({
        _id: notificationId,
        userId,
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      notification.isRead = true;
      notification.readAt = new Date();

      await notification.save();

      return notification;
    } catch (error: any) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
  }

  /**
   * Mark all as read
   */
  async markAllAsRead(userId: string): Promise<number> {
    try {
      const result = await Notification.updateMany(
        { userId, isRead: false },
        { $set: { isRead: true, readAt: new Date() } }
      );

      return result.modifiedCount;
    } catch (error: any) {
      throw new Error(`Failed to mark all as read: ${error.message}`);
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    try {
      const result = await Notification.findOneAndDelete({
        _id: notificationId,
        userId,
      });

      if (!result) {
        throw new Error('Notification not found');
      }
    } catch (error: any) {
      throw new Error(`Failed to delete notification: ${error.message}`);
    }
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      return await Notification.countDocuments({ userId, isRead: false });
    } catch (error: any) {
      throw new Error(`Failed to get unread count: ${error.message}`);
    }
  }
}

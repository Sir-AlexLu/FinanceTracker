import mongoose, { Schema, Document } from 'mongoose';

export enum NotificationType {
  BILL_DUE = 'bill_due',
  BUDGET_THRESHOLD = 'budget_threshold',
  GOAL_MILESTONE = 'goal_milestone',
  LIABILITY_REMINDER = 'liability_reminder',
  SETTLEMENT_READY = 'settlement_ready',
  ANOMALY_DETECTED = 'anomaly_detected',
  INSIGHT_AVAILABLE = 'insight_available',
  RECURRING_TRANSACTION_APPROVAL = 'recurring_transaction_approval',
  BILL_PAYMENT_APPROVAL = 'bill_payment_approval',
}

export enum NotificationPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export interface INotificationAction {
  label: string;
  action: string;
  url?: string;
  params?: Record<string, any>;
}

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  isRead: boolean;
  readAt?: Date;
  actionUrl?: string;
  actions?: INotificationAction[];
  metadata?: Record<string, any>;
  relatedResourceId?: mongoose.Types.ObjectId;
  relatedResourceType?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationActionSchema = new Schema<INotificationAction>(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      trim: true,
    },
    params: {
      type: Map,
      of: Schema.Types.Mixed,
    },
  },
  { _id: false }
);

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: [true, 'Notification type is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    priority: {
      type: String,
      enum: Object.values(NotificationPriority),
      default: NotificationPriority.MEDIUM,
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
    actionUrl: {
      type: String,
      trim: true,
    },
    actions: [NotificationActionSchema],
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
    },
    relatedResourceId: {
      type: Schema.Types.ObjectId,
    },
    relatedResourceType: {
      type: String,
      trim: true,
      enum: [
        'Bill',
        'Budget',
        'Goal',
        'Liability',
        'Transaction',
        'Settlement',
        'Account',
      ],
    },
    expiresAt: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, priority: 1, isRead: 1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Pre-save hook: Set readAt when marking as read
NotificationSchema.pre('save', function (next) {
  if (this.isModified('isRead') && this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});

// Static method: Mark multiple notifications as read
NotificationSchema.statics.markAsRead = async function (
  userId: mongoose.Types.ObjectId,
  notificationIds: mongoose.Types.ObjectId[]
) {
  return this.updateMany(
    {
      _id: { $in: notificationIds },
      userId,
      isRead: false,
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    }
  );
};

// Static method: Mark all as read
NotificationSchema.statics.markAllAsRead = async function (
  userId: mongoose.Types.ObjectId
) {
  return this.updateMany(
    {
      userId,
      isRead: false,
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    }
  );
};

// Static method: Delete expired notifications
NotificationSchema.statics.deleteExpired = async function () {
  const now = new Date();
  return this.deleteMany({
    expiresAt: { $lt: now },
  });
};

// Static method: Get unread count
NotificationSchema.statics.getUnreadCount = async function (
  userId: mongoose.Types.ObjectId
) {
  return this.countDocuments({
    userId,
    isRead: false,
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }],
  });
};

export const Notification = mongoose.model<INotification>(
  'Notification',
  NotificationSchema
);

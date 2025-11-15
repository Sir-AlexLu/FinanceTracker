import mongoose, { Schema, Document, Model } from 'mongoose';

export enum AuditAction {
  // Authentication
  LOGIN = 'login',
  LOGOUT = 'logout',
  REGISTER = 'register',
  PASSWORD_CHANGE = 'password_change',
  PASSWORD_RESET = 'password_reset',
  TOKEN_REFRESH = 'token_refresh',
  LOGIN_FAILED = 'login_failed',

  // Account
  ACCOUNT_CREATE = 'account_create',
  ACCOUNT_UPDATE = 'account_update',
  ACCOUNT_DELETE = 'account_delete',
  ACCOUNT_DEACTIVATE = 'account_deactivate',

  // Transaction
  TRANSACTION_CREATE = 'transaction_create',
  TRANSACTION_UPDATE = 'transaction_update',
  TRANSACTION_DELETE = 'transaction_delete',

  // Liability
  LIABILITY_CREATE = 'liability_create',
  LIABILITY_UPDATE = 'liability_update',
  LIABILITY_PAYMENT = 'liability_payment',
  LIABILITY_DELETE = 'liability_delete',

  // Bill
  BILL_CREATE = 'bill_create',
  BILL_UPDATE = 'bill_update',
  BILL_DELETE = 'bill_delete',
  BILL_PAYMENT = 'bill_payment',

  // Budget
  BUDGET_CREATE = 'budget_create',
  BUDGET_UPDATE = 'budget_update',
  BUDGET_DELETE = 'budget_delete',

  // Goal
  GOAL_CREATE = 'goal_create',
  GOAL_UPDATE = 'goal_update',
  GOAL_DELETE = 'goal_delete',
  GOAL_COMPLETE = 'goal_complete',

  // Settlement
  SETTLEMENT_CREATE = 'settlement_create',
  SETTLEMENT_EXECUTE = 'settlement_execute',

  // Data Export
  DATA_EXPORT_CSV = 'data_export_csv',
  DATA_EXPORT_PDF = 'data_export_pdf',

  // Security
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
}

export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export interface IAuditLog extends Document {
  _id: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  action: AuditAction;
  severity: AuditSeverity;
  resource: string;
  resourceId?: mongoose.Types.ObjectId;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  requestId?: string;
  statusCode?: number;
  errorMessage?: string;
  timestamp: Date;
}

// Interface for static methods
interface IAuditLogModel extends Model<IAuditLog> {
  log(data: {
    userId?: mongoose.Types.ObjectId | string;
    action: AuditAction;
    severity?: AuditSeverity;
    resource: string;
    resourceId?: mongoose.Types.ObjectId | string;
    details?: Record<string, any>;
    ipAddress: string;
    userAgent: string;
    requestId?: string;
    statusCode?: number;
    errorMessage?: string;
  }): Promise<IAuditLog>;

  getUserActivity(userId: mongoose.Types.ObjectId, limit?: number): Promise<IAuditLog[]>;

  getSecurityEvents(userId?: mongoose.Types.ObjectId, hours?: number): Promise<IAuditLog[]>;

  getFailedLoginAttempts(ipAddress: string, minutes?: number): Promise<number>;
}

const AuditLogSchema = new Schema<IAuditLog, IAuditLogModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    action: {
      type: String,
      enum: Object.values(AuditAction),
      required: [true, 'Action is required'],
      index: true,
    },
    severity: {
      type: String,
      enum: Object.values(AuditSeverity),
      default: AuditSeverity.INFO,
      index: true,
    },
    resource: {
      type: String,
      required: [true, 'Resource is required'],
      trim: true,
      index: true,
    },
    resourceId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    details: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      required: [true, 'IP address is required'],
      trim: true,
      index: true,
    },
    userAgent: {
      type: String,
      required: [true, 'User agent is required'],
      trim: true,
    },
    requestId: {
      type: String,
      trim: true,
      index: true,
    },
    statusCode: {
      type: Number,
      min: 100,
      max: 599,
    },
    errorMessage: {
      type: String,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

// Compound indexes for efficient queries
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ severity: 1, timestamp: -1 });
AuditLogSchema.index({ ipAddress: 1, timestamp: -1 });

// TTL index - auto-delete logs older than 90 days
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

// Static method: Create audit log
AuditLogSchema.statics.log = async function (data: {
  userId?: mongoose.Types.ObjectId | string;
  action: AuditAction;
  severity?: AuditSeverity;
  resource: string;
  resourceId?: mongoose.Types.ObjectId | string;
  details?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  requestId?: string;
  statusCode?: number;
  errorMessage?: string;
}): Promise<IAuditLog> {
  return this.create({
    userId: data.userId,
    action: data.action,
    severity: data.severity || AuditSeverity.INFO,
    resource: data.resource,
    resourceId: data.resourceId,
    details: data.details || {},
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    requestId: data.requestId,
    statusCode: data.statusCode,
    errorMessage: data.errorMessage,
    timestamp: new Date(),
  });
};

// Static method: Get user activity
AuditLogSchema.statics.getUserActivity = async function (
  userId: mongoose.Types.ObjectId,
  limit: number = 50
): Promise<IAuditLog[]> {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .select('-details -userAgent');
};

// Static method: Get security events
AuditLogSchema.statics.getSecurityEvents = async function (
  userId?: mongoose.Types.ObjectId,
  hours: number = 24
): Promise<IAuditLog[]> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const query: any = {
    timestamp: { $gte: since },
    $or: [
      { severity: { $in: [AuditSeverity.WARNING, AuditSeverity.CRITICAL] } },
      {
        action: {
          $in: [
            AuditAction.LOGIN_FAILED,
            AuditAction.SUSPICIOUS_ACTIVITY,
            AuditAction.RATE_LIMIT_EXCEEDED,
          ],
        },
      },
    ],
  };

  if (userId) {
    query.userId = userId;
  }

  return this.find(query).sort({ timestamp: -1 });
};

// Static method: Get failed login attempts
AuditLogSchema.statics.getFailedLoginAttempts = async function (
  ipAddress: string,
  minutes: number = 15
): Promise<number> {
  const since = new Date(Date.now() - minutes * 60 * 1000);

  return this.countDocuments({
    action: AuditAction.LOGIN_FAILED,
    ipAddress,
    timestamp: { $gte: since },
  });
};

export const AuditLog = mongoose.model<IAuditLog, IAuditLogModel>('AuditLog', AuditLogSchema);

import mongoose, { Schema, Document } from 'mongoose';
import {
  TransactionType,
  IncomeCategory,
  ExpenseCategory,
} from '../types/models.types';

export interface IRecurringConfig {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: Date;
  lastExecuted?: Date;
  nextExecution?: Date;
  requiresApproval: boolean;
  isApproved?: boolean;
  approvedAt?: Date;
}

export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: TransactionType;

  // Categories
  incomeCategory?: IncomeCategory;
  expenseCategory?: ExpenseCategory;

  // Amount and accounts
  amount: number;
  accountId: mongoose.Types.ObjectId;
  destinationAccountId?: mongoose.Types.ObjectId;

  // Liability tracking
  isLiabilityPayment: boolean;
  liabilityId?: mongoose.Types.ObjectId;

  // Details
  description: string;
  date: Date;
  notes?: string;
  tags?: string[];

  // Recurring
  isRecurring: boolean;
  recurringConfig?: IRecurringConfig;

  // Settlement
  settlementPeriod?: string;
  isSettled: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const RecurringConfigSchema = new Schema<IRecurringConfig>(
  {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      required: true,
    },
    interval: {
      type: Number,
      required: true,
      min: 1,
      max: 365,
    },
    endDate: {
      type: Date,
    },
    lastExecuted: {
      type: Date,
    },
    nextExecution: {
      type: Date,
      required: true,
    },
    requiresApproval: {
      type: Boolean,
      default: true,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    approvedAt: {
      type: Date,
    },
  },
  { _id: false }
);

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(TransactionType),
      required: [true, 'Transaction type is required'],
    },
    incomeCategory: {
      type: String,
      enum: Object.values(IncomeCategory),
    },
    expenseCategory: {
      type: String,
      enum: Object.values(ExpenseCategory),
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      required: [true, 'Account is required'],
      index: true,
    },
    destinationAccountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
    },
    isLiabilityPayment: {
      type: Boolean,
      default: false,
    },
    liabilityId: {
      type: Schema.Types.ObjectId,
      ref: 'Liability',
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringConfig: RecurringConfigSchema,
    settlementPeriod: {
      type: String,
      index: true,
    },
    isSettled: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, type: 1, date: -1 });
TransactionSchema.index({ userId: 1, isSettled: 1 });
TransactionSchema.index({ userId: 1, 'recurringConfig.nextExecution': 1 });
TransactionSchema.index({ accountId: 1, date: -1 });
TransactionSchema.index({ userId: 1, settlementPeriod: 1 });

// Validation pre-save hook
TransactionSchema.pre('save', function (next) {
  // Validate income transactions must have income category
  if (this.type === TransactionType.INCOME && !this.incomeCategory) {
    return next(new Error('Income category is required for income transactions'));
  }

  // Validate expense transactions must have expense category
  if (this.type === TransactionType.EXPENSE && !this.expenseCategory) {
    return next(new Error('Expense category is required for expense transactions'));
  }

  // Validate transfer transactions must have destination account
  if (this.type === TransactionType.TRANSFER && !this.destinationAccountId) {
    return next(new Error('Destination account is required for transfer transactions'));
  }

  // Validate transfer cannot be to same account
  if (
    this.type === TransactionType.TRANSFER &&
    this.accountId.equals(this.destinationAccountId!)
  ) {
    return next(new Error('Cannot transfer to the same account'));
  }

  // Validate liability payment must have liability ID
  if (this.isLiabilityPayment && !this.liabilityId) {
    return next(new Error('Liability ID is required for liability payments'));
  }

  // Validate recurring config
  if (this.isRecurring && !this.recurringConfig) {
    return next(new Error('Recurring configuration is required for recurring transactions'));
  }

  // Validate recurring transaction cannot be a transfer or liability
  if (this.isRecurring && (this.type === TransactionType.TRANSFER || this.type === TransactionType.LIABILITY)) {
    return next(new Error('Recurring transactions cannot be transfers or liabilities'));
  }

  next();
});

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);

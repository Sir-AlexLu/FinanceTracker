import mongoose, { Schema, Document } from 'mongoose';
import { ExpenseCategory } from '../types/models.types';

export interface IRecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: Date;
}

export interface IBillPayment {
  transactionId: mongoose.Types.ObjectId;
  amount: number;
  date: Date;
  accountId: mongoose.Types.ObjectId;
  notes?: string;
}

export interface IBill extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  amount: number;
  category: ExpenseCategory;
  dueDate: Date;
  isRecurring: boolean;
  recurringPattern?: IRecurringPattern;
  status: 'upcoming' | 'overdue' | 'paid' | 'partially_paid';
  paidAmount: number;
  paymentHistory: IBillPayment[];
  defaultAccountId?: mongoose.Types.ObjectId;
  reminderDays: number[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RecurringPatternSchema = new Schema<IRecurringPattern>(
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
  },
  { _id: false }
);

const BillPaymentSchema = new Schema<IBillPayment>(
  {
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [200, 'Payment notes cannot exceed 200 characters'],
    },
  },
  { _id: false }
);

const BillSchema = new Schema<IBill>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Bill name is required'],
      trim: true,
      maxlength: [100, 'Bill name cannot exceed 100 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    category: {
      type: String,
      enum: Object.values(ExpenseCategory),
      required: [true, 'Category is required'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
      index: true,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringPattern: RecurringPatternSchema,
    status: {
      type: String,
      enum: ['upcoming', 'overdue', 'paid', 'partially_paid'],
      default: 'upcoming',
      index: true,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, 'Paid amount cannot be negative'],
    },
    paymentHistory: [BillPaymentSchema],
    defaultAccountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
    },
    reminderDays: {
      type: [Number],
      default: [3, 1], // 3 days before, 1 day before
      validate: {
        validator: function (days: number[]) {
          return days.every((day) => day >= 0 && day <= 30);
        },
        message: 'Reminder days must be between 0 and 30',
      },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
BillSchema.index({ userId: 1, status: 1 });
BillSchema.index({ userId: 1, dueDate: 1 });
BillSchema.index({ userId: 1, isRecurring: 1 });

// Pre-save hook: Validate recurring pattern if recurring
BillSchema.pre('save', function (next) {
  if (this.isRecurring && !this.recurringPattern) {
    return next(new Error('Recurring pattern is required for recurring bills'));
  }

  // Auto-update status based on paid amount
  if (this.paidAmount >= this.amount) {
    this.status = 'paid';
  } else if (this.paidAmount > 0) {
    this.status = 'partially_paid';
  } else if (this.dueDate < new Date() && this.status !== 'paid') {
    this.status = 'overdue';
  } else {
    this.status = 'upcoming';
  }

  // Validate paid amount doesn't exceed bill amount
  if (this.paidAmount > this.amount) {
    return next(new Error('Paid amount cannot exceed bill amount'));
  }

  next();
});

export const Bill = mongoose.model<IBill>('Bill', BillSchema);

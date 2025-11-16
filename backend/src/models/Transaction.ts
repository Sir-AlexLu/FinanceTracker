// src/models/Transaction.ts
import mongoose, { Schema, Document } from 'mongoose';
import { TransactionType, IncomeCategory, ExpenseCategory } from '../types/models.types.js';

export interface IRecurringConfig {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: Date;
  lastExecuted?: Date;
  nextExecution: Date;
  requiresApproval: boolean;
  isApproved?: boolean;
  approvedAt?: Date;
}

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: TransactionType;
  incomeCategory?: IncomeCategory;
  expenseCategory?: ExpenseCategory;
  amount: number;
  accountId: mongoose.Types.ObjectId;
  destinationAccountId?: mongoose.Types.ObjectId;
  isLiabilityPayment: boolean;
  liabilityId?: mongoose.Types.ObjectId;
  description: string;
  date: Date;
  notes?: string;
  tags?: string[];
  isRecurring: boolean;
  recurringConfig?: IRecurringConfig;
  settlementPeriod: string;
  isSettled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RecurringConfigSchema = new Schema<IRecurringConfig>(
  {
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'], required: true },
    interval: { type: Number, min: 1, max: 365, required: true },
    endDate: Date,
    lastExecuted: Date,
    nextExecution: { type: Date, required: true },
    requiresApproval: { type: Boolean, default: true },
    isApproved: { type: Boolean, default: false },
    approvedAt: Date,
  },
  { _id: false }
);

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: Object.values(TransactionType), required: true },
    incomeCategory: { type: String, enum: Object.values(IncomeCategory) },
    expenseCategory: { type: String, enum: Object.values(ExpenseCategory) },
    amount: { type: Number, required: true, min: 0.01 },
    accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
    destinationAccountId: { type: Schema.Types.ObjectId, ref: 'Account' },
    isLiabilityPayment: { type: Boolean, default: false },
    liabilityId: { type: Schema.Types.ObjectId, ref: 'Liability' },
    description: { type: String, required: true, trim: true, maxlength: 200 },
    date: { type: Date, required: true, default: Date.now, index: true },
    notes: { type: String, trim: true, maxlength: 500 },
    tags: [{ type: String, trim: true, lowercase: true }],
    isRecurring: { type: Boolean, default: false },
    recurringConfig: RecurringConfigSchema,
    settlementPeriod: { type: String, index: true },
    isSettled: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Indexes
TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, type: 1, date: -1 });
TransactionSchema.index({ userId: 1, isSettled: 1 });
TransactionSchema.index({ userId: 1, 'recurringConfig.nextExecution': 1 });
TransactionSchema.index({ accountId: 1, date: -1 });
TransactionSchema.index({ userId: 1, settlementPeriod: 1 });

// Pre-save
TransactionSchema.pre('save', function (next) {
  if (this.type === TransactionType.INCOME && !this.incomeCategory) return next(new Error('Income category required'));
  if (this.type === TransactionType.EXPENSE && !this.expenseCategory) return next(new Error('Expense category required'));
  if (this.type === TransactionType.TRANSFER && !this.destinationAccountId) return next(new Error('Destination required'));
  if (this.type === TransactionType.TRANSFER && this.accountId.equals(this.destinationAccountId!)) return next(new Error('Same account transfer'));
  if (this.isLiabilityPayment && !this.liabilityId) return next(new Error('Liability ID required'));
  if (this.isRecurring && !this.recurringConfig) return next(new Error('Recurring config required'));
  if (this.isRecurring && [TransactionType.TRANSFER, TransactionType.LIABILITY].includes(this.type)) return next(new Error('Recurring not allowed for transfers/liabilities'));
  next();
});

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);

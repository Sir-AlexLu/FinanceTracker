// src/models/Budget.ts
import mongoose, { Schema, Document } from 'mongoose';
import { ExpenseCategory } from '../types/models.types.js';

export interface IBudget extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  category: ExpenseCategory;
  amount: number;
  spent: number;
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  alertThreshold: number;
  notes?: string;
  remaining: number;
  percentageUsed: number;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema = new Schema<IBudget>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    category: { type: String, enum: Object.values(ExpenseCategory), required: true },
    amount: { type: Number, required: true, min: 0.01 },
    spent: { type: Number, default: 0, min: 0 },
    period: { type: String, enum: ['weekly', 'monthly', 'yearly'], required: true },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
    alertThreshold: { type: Number, default: 80, min: 0, max: 100 },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

// Indexes
BudgetSchema.index({ userId: 1, isActive: 1 });
BudgetSchema.index({ userId: 1, category: 1, startDate: -1 });
BudgetSchema.index({ userId: 1, endDate: 1 });

// Pre-save
BudgetSchema.pre('save', function (next) {
  if (this.endDate <= this.startDate) return next(new Error('End date must be after start date'));
  if (this.spent > this.amount) console.warn(`Budget exceeded: ${this.spent}/${this.amount}`);
  next();
});

// Virtuals
BudgetSchema.virtual('remaining').get(function () {
  return Math.max(0, this.amount - this.spent);
});

BudgetSchema.virtual('percentageUsed').get(function () {
  return Math.min(100, (this.spent / this.amount) * 100);
});

BudgetSchema.set('toJSON', { virtuals: true });
BudgetSchema.set('toObject', { virtuals: true });

export const Budget = mongoose.model<IBudget>('Budget', BudgetSchema);

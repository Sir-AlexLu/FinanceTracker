import mongoose, { Schema, Document } from 'mongoose';
import { ExpenseCategory } from '../types/models.types';

export interface IBudget extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  category: ExpenseCategory;
  amount: number;
  spent: number;
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  alertThreshold: number; // Percentage (e.g., 80 means alert at 80% spent)
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema = new Schema<IBudget>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Budget name is required'],
      trim: true,
      maxlength: [100, 'Budget name cannot exceed 100 characters'],
    },
    category: {
      type: String,
      enum: Object.values(ExpenseCategory),
      required: [true, 'Category is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Budget amount is required'],
      min: [0.01, 'Budget amount must be greater than 0'],
    },
    spent: {
      type: Number,
      default: 0,
      min: [0, 'Spent amount cannot be negative'],
    },
    period: {
      type: String,
      enum: ['weekly', 'monthly', 'yearly'],
      required: [true, 'Budget period is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      index: true,
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    alertThreshold: {
      type: Number,
      default: 80,
      min: [0, 'Alert threshold cannot be negative'],
      max: [100, 'Alert threshold cannot exceed 100'],
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
BudgetSchema.index({ userId: 1, isActive: 1 });
BudgetSchema.index({ userId: 1, category: 1, startDate: -1 });
BudgetSchema.index({ userId: 1, endDate: 1 });

// Pre-save validation
BudgetSchema.pre('save', function (next) {
  // Validate end date is after start date
  if (this.endDate <= this.startDate) {
    return next(new Error('End date must be after start date'));
  }

  // Validate spent doesn't exceed amount (warning, not error)
  if (this.spent > this.amount) {
    console.warn(`Budget ${this.name} exceeded: ${this.spent}/${this.amount}`);
  }

  next();
});

// Virtual property: remaining amount
BudgetSchema.virtual('remaining').get(function () {
  return Math.max(0, this.amount - this.spent);
});

// Virtual property: percentage used
BudgetSchema.virtual('percentageUsed').get(function () {
  return Math.min(100, (this.spent / this.amount) * 100);
});

// Ensure virtuals are included in JSON
BudgetSchema.set('toJSON', { virtuals: true });
BudgetSchema.set('toObject', { virtuals: true });

export const Budget = mongoose.model<IBudget>('Budget', BudgetSchema);

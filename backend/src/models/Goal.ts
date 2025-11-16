// src/models/Goal.ts
import mongoose, { Schema, Document } from 'mongoose';
import { ExpenseCategory } from '../types/models.types.js';

export enum GoalType {
  SAVINGS = 'savings',
  INVESTMENT = 'investment',
  DEBT_PAYOFF = 'debt_payoff',
  EXPENSE_REDUCTION = 'expense_reduction',
}

export interface IGoalMilestone {
  percentage: number;
  amount: number;
  targetDate: Date;
  achievedDate?: Date;
  isAchieved: boolean;
}

export interface IGoalProgress {
  percentage: number;
  monthlyTarget: number;
  monthlyContribution: number;
  isOnTrack: boolean;
  projectedCompletionDate: Date;
}

export interface IGoal extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  type: GoalType;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  startDate: Date;
  targetDate: Date;
  linkedAccountId?: mongoose.Types.ObjectId;
  linkedLiabilityId?: mongoose.Types.ObjectId;
  linkedCategory?: ExpenseCategory;
  progress: IGoalProgress;
  milestones: IGoalMilestone[];
  status: 'active' | 'completed' | 'abandoned' | 'paused';
  completedAt?: Date;
  reminderFrequency: 'weekly' | 'monthly' | 'none';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const Milestone = new Schema<IGoalMilestone>(
  {
    percentage: { type: Number, required: true, min: 0, max: 100 },
    amount: { type: Number, required: true, min: 0 },
    targetDate: { type: Date, required: true },
    achievedDate: Date,
    isAchieved: { type: Boolean, default: false },
  },
  { _id: false }
);

const Progress = new Schema<IGoalProgress>(
  {
    percentage: { type: Number, default: 0, min: 0, max: 100 },
    monthlyTarget: { type: Number, default: 0 },
    monthlyContribution: { type: Number, default: 0 },
    isOnTrack: { type: Boolean, default: true },
    projectedCompletionDate: { type: Date, required: true },
  },
  { _id: false }
);

const GoalSchema = new Schema<IGoal>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    type: { type: String, enum: Object.values(GoalType), required: true },
    description: { type: String, trim: true, maxlength: 500 },
    targetAmount: { type: Number, required: true, min: 0.01 },
    currentAmount: { type: Number, default: 0, min: 0 },
    startDate: { type: Date, required: true, default: Date.now },
    targetDate: { type: Date, required: true, index: true },
    linkedAccountId: { type: Schema.Types.ObjectId, ref: 'Account' },
    linkedLiabilityId: { type: Schema.Types.ObjectId, ref: 'Liability' },
    linkedCategory: { type: String, enum: Object.values(ExpenseCategory) },
    progress: { type: Progress, required: true },
    milestones: [Milestone],
    status: { type: String, enum: ['active', 'completed', 'abandoned', 'paused'], default: 'active', index: true },
    completedAt: Date,
    reminderFrequency: { type: String, enum: ['weekly', 'monthly', 'none'], default: 'monthly' },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

// Indexes
GoalSchema.index({ userId: 1, status: 1 });
GoalSchema.index({ userId: 1, type: 1 });
GoalSchema.index({ userId: 1, targetDate: 1 });

// Pre-save
GoalSchema.pre('save', function (next) {
  if (this.targetDate <= this.startDate) return next(new Error('Target date must be after start date'));

  if ([GoalType.SAVINGS, GoalType.INVESTMENT].includes(this.type) && !this.linkedAccountId)
    return next(new Error('Linked account required'));

  if (this.type === GoalType.DEBT_PAYOFF && !this.linkedLiabilityId)
    return next(new Error('Linked liability required'));

  if (this.type === GoalType.EXPENSE_REDUCTION && !this.linkedCategory)
    return next(new Error('Linked category required'));

  // Auto-complete
  if (this.currentAmount >= this.targetAmount && this.status === 'active') {
    this.status = 'completed';
    this.completedAt = new Date();
  }

  // Progress
  this.progress.percentage = Math.min(100, (this.currentAmount / this.targetAmount) * 100);

  const now = new Date();
  const monthsLeft = Math.max(1, (this.targetDate.getTime() - now.getTime()) / (30 * 24 * 60 * 60 * 1000));
  this.progress.monthlyTarget = (this.targetAmount - this.currentAmount) / monthsLeft;

  if (this.progress.monthlyContribution > 0) {
    const monthsToGo = (this.targetAmount - this.currentAmount) / this.progress.monthlyContribution;
    this.progress.projectedCompletionDate = new Date(now.getTime() + monthsToGo * 30 * 24 * 60 * 60 * 1000);
  } else {
    this.progress.projectedCompletionDate = this.targetDate;
  }

  const expected = ((now.getTime() - this.startDate.getTime()) / (this.targetDate.getTime() - this.startDate.getTime())) * 100;
  this.progress.isOnTrack = this.progress.percentage >= expected;

  // Milestones
  this.milestones.forEach(m => {
    if (this.currentAmount >= m.amount && !m.isAchieved) {
      m.isAchieved = true;
      m.achievedDate = new Date();
    }
  });

  next();
});

export const Goal = mongoose.model<IGoal>('Goal', GoalSchema);

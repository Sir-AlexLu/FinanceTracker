import mongoose, { Schema, Document } from 'mongoose';
import { AccountType, ExpenseCategory } from '../types/models.types';

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
  _id: mongoose.Types.ObjectId;
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

const GoalMilestoneSchema = new Schema<IGoalMilestone>(
  {
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    targetDate: {
      type: Date,
      required: true,
    },
    achievedDate: {
      type: Date,
    },
    isAchieved: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const GoalProgressSchema = new Schema<IGoalProgress>(
  {
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    monthlyTarget: {
      type: Number,
      default: 0,
    },
    monthlyContribution: {
      type: Number,
      default: 0,
    },
    isOnTrack: {
      type: Boolean,
      default: true,
    },
    projectedCompletionDate: {
      type: Date,
      required: true,
    },
  },
  { _id: false }
);

const GoalSchema = new Schema<IGoal>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Goal name is required'],
      trim: true,
      maxlength: [100, 'Goal name cannot exceed 100 characters'],
    },
    type: {
      type: String,
      enum: Object.values(GoalType),
      required: [true, 'Goal type is required'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    targetAmount: {
      type: Number,
      required: [true, 'Target amount is required'],
      min: [0.01, 'Target amount must be greater than 0'],
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: [0, 'Current amount cannot be negative'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      default: Date.now,
    },
    targetDate: {
      type: Date,
      required: [true, 'Target date is required'],
      index: true,
    },
    linkedAccountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
    },
    linkedLiabilityId: {
      type: Schema.Types.ObjectId,
      ref: 'Liability',
    },
    linkedCategory: {
      type: String,
      enum: Object.values(ExpenseCategory),
    },
    progress: {
      type: GoalProgressSchema,
      required: true,
      default: () => ({
        percentage: 0,
        monthlyTarget: 0,
        monthlyContribution: 0,
        isOnTrack: true,
        projectedCompletionDate: new Date(),
      }),
    },
    milestones: [GoalMilestoneSchema],
    status: {
      type: String,
      enum: ['active', 'completed', 'abandoned', 'paused'],
      default: 'active',
      index: true,
    },
    completedAt: {
      type: Date,
    },
    reminderFrequency: {
      type: String,
      enum: ['weekly', 'monthly', 'none'],
      default: 'monthly',
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
GoalSchema.index({ userId: 1, status: 1 });
GoalSchema.index({ userId: 1, type: 1 });
GoalSchema.index({ userId: 1, targetDate: 1 });

// Pre-save validation and auto-calculations
GoalSchema.pre('save', function (next) {
  // Validate target date is after start date
  if (this.targetDate <= this.startDate) {
    return next(new Error('Target date must be after start date'));
  }

  // Validate linked fields based on goal type
  if (
    (this.type === GoalType.SAVINGS || this.type === GoalType.INVESTMENT) &&
    !this.linkedAccountId
  ) {
    return next(new Error(`${this.type} goals must have a linked account`));
  }

  if (this.type === GoalType.DEBT_PAYOFF && !this.linkedLiabilityId) {
    return next(new Error('Debt payoff goals must have a linked liability'));
  }

  if (this.type === GoalType.EXPENSE_REDUCTION && !this.linkedCategory) {
    return next(new Error('Expense reduction goals must have a linked category'));
  }

  // Auto-update status based on current amount
  if (this.currentAmount >= this.targetAmount && this.status === 'active') {
    this.status = 'completed';
    this.completedAt = new Date();
  }

  // Calculate progress percentage
  this.progress.percentage = Math.min(
    100,
    (this.currentAmount / this.targetAmount) * 100
  );

  // Calculate monthly target
  const now = new Date();
  const monthsRemaining = Math.max(
    1,
    (this.targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
  this.progress.monthlyTarget = (this.targetAmount - this.currentAmount) / monthsRemaining;

  // Calculate projected completion date
  if (this.progress.monthlyContribution > 0) {
    const remainingAmount = this.targetAmount - this.currentAmount;
    const monthsToComplete = remainingAmount / this.progress.monthlyContribution;
    this.progress.projectedCompletionDate = new Date(
      now.getTime() + monthsToComplete * 30 * 24 * 60 * 60 * 1000
    );
  } else {
    this.progress.projectedCompletionDate = this.targetDate;
  }

  // Check if on track
  const expectedProgress =
    ((now.getTime() - this.startDate.getTime()) /
      (this.targetDate.getTime() - this.startDate.getTime())) *
    100;
  this.progress.isOnTrack = this.progress.percentage >= expectedProgress;

  // Check and update milestones
  this.milestones.forEach((milestone) => {
    if (this.currentAmount >= milestone.amount && !milestone.isAchieved) {
      milestone.isAchieved = true;
      milestone.achievedDate = new Date();
    }
  });

  next();
});

export const Goal = mongoose.model<IGoal>('Goal', GoalSchema);

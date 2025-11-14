import mongoose, { Schema, Document } from 'mongoose';
import { AccountType, IncomeCategory, ExpenseCategory } from '../types/models.types';

export interface IAccountSnapshot {
  accountId: mongoose.Types.ObjectId;
  accountName: string;
  accountType: AccountType;
  openingBalance: number;
  closingBalance: number;
  totalInflow: number;
  totalOutflow: number;
}

export interface ILiabilitySnapshot {
  liabilityId: mongoose.Types.ObjectId;
  description: string;
  creditor: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
}

export interface ISettlementSummary {
  totalIncome: number;
  totalExpenses: number;
  totalTransfers: number;
  netCashFlow: number;
  incomeByCategory: Record<string, number>;
  expensesByCategory: Record<string, number>;
}

export interface ILiabilitySummary {
  openingLiabilities: ILiabilitySnapshot[];
  newLiabilities: ILiabilitySnapshot[];
  paidLiabilities: ILiabilitySnapshot[];
  carryForwardLiabilities: ILiabilitySnapshot[];
  totalLiabilityAmount: number;
  totalLiabilityPaid: number;
  totalLiabilityRemaining: number;
}

export interface ISettlement extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  period: string; // "2024-01" for monthly, "2024" for yearly
  periodType: 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  summary: ISettlementSummary;
  accounts: IAccountSnapshot[];
  liabilities: ILiabilitySummary;
  isSettled: boolean;
  settledAt?: Date;
  settledBy: 'auto' | 'manual';
  carryForwardBalance: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSnapshotSchema = new Schema<IAccountSnapshot>(
  {
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
    },
    accountName: {
      type: String,
      required: true,
    },
    accountType: {
      type: String,
      enum: Object.values(AccountType),
      required: true,
    },
    openingBalance: {
      type: Number,
      required: true,
      default: 0,
    },
    closingBalance: {
      type: Number,
      required: true,
      default: 0,
    },
    totalInflow: {
      type: Number,
      default: 0,
    },
    totalOutflow: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const LiabilitySnapshotSchema = new Schema<ILiabilitySnapshot>(
  {
    liabilityId: {
      type: Schema.Types.ObjectId,
      ref: 'Liability',
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    creditor: {
      type: String,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paidAmount: {
      type: Number,
      required: true,
    },
    remainingAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const SettlementSummarySchema = new Schema<ISettlementSummary>(
  {
    totalIncome: {
      type: Number,
      required: true,
      default: 0,
    },
    totalExpenses: {
      type: Number,
      required: true,
      default: 0,
    },
    totalTransfers: {
      type: Number,
      default: 0,
    },
    netCashFlow: {
      type: Number,
      required: true,
      default: 0,
    },
    incomeByCategory: {
      type: Map,
      of: Number,
      default: () => {
        const categories: Record<string, number> = {};
        Object.values(IncomeCategory).forEach((cat) => {
          categories[cat] = 0;
        });
        return categories;
      },
    },
    expensesByCategory: {
      type: Map,
      of: Number,
      default: () => {
        const categories: Record<string, number> = {};
        Object.values(ExpenseCategory).forEach((cat) => {
          categories[cat] = 0;
        });
        return categories;
      },
    },
  },
  { _id: false }
);

const LiabilitySummarySchema = new Schema<ILiabilitySummary>(
  {
    openingLiabilities: [LiabilitySnapshotSchema],
    newLiabilities: [LiabilitySnapshotSchema],
    paidLiabilities: [LiabilitySnapshotSchema],
    carryForwardLiabilities: [LiabilitySnapshotSchema],
    totalLiabilityAmount: {
      type: Number,
      default: 0,
    },
    totalLiabilityPaid: {
      type: Number,
      default: 0,
    },
    totalLiabilityRemaining: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const SettlementSchema = new Schema<ISettlement>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    period: {
      type: String,
      required: [true, 'Period is required'],
      index: true,
    },
    periodType: {
      type: String,
      enum: ['monthly', 'yearly'],
      required: [true, 'Period type is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    summary: {
      type: SettlementSummarySchema,
      required: true,
    },
    accounts: [AccountSnapshotSchema],
    liabilities: {
      type: LiabilitySummarySchema,
      required: true,
    },
    isSettled: {
      type: Boolean,
      default: false,
      index: true,
    },
    settledAt: {
      type: Date,
    },
    settledBy: {
      type: String,
      enum: ['auto', 'manual'],
      default: 'manual',
    },
    carryForwardBalance: {
      type: Number,
      required: true,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
SettlementSchema.index({ userId: 1, period: 1 }, { unique: true });
SettlementSchema.index({ userId: 1, periodType: 1, createdAt: -1 });
SettlementSchema.index({ userId: 1, isSettled: 1 });

// Pre-save validation
SettlementSchema.pre('save', function (next) {
  // Validate end date is after start date
  if (this.endDate <= this.startDate) {
    return next(new Error('End date must be after start date'));
  }

  // Validate period format
  if (this.periodType === 'monthly') {
    // Format: YYYY-MM
    if (!/^\d{4}-\d{2}$/.test(this.period)) {
      return next(new Error('Monthly period must be in format YYYY-MM'));
    }
  } else if (this.periodType === 'yearly') {
    // Format: YYYY
    if (!/^\d{4}$/.test(this.period)) {
      return next(new Error('Yearly period must be in format YYYY'));
    }
  }

  // Calculate net cash flow
  this.summary.netCashFlow = this.summary.totalIncome - this.summary.totalExpenses;

  // Calculate carry forward balance (sum of all closing balances)
  this.carryForwardBalance = this.accounts.reduce(
    (sum, account) => sum + account.closingBalance,
    0
  );

  // If marking as settled, set settled timestamp
  if (this.isSettled && !this.settledAt) {
    this.settledAt = new Date();
  }

  next();
});

export const Settlement = mongoose.model<ISettlement>('Settlement', SettlementSchema);

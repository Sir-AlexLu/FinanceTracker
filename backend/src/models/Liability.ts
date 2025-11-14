import mongoose, { Schema, Document } from 'mongoose';

export interface ILiabilityPayment {
  transactionId: mongoose.Types.ObjectId;
  amount: number;
  date: Date;
  accountId: mongoose.Types.ObjectId;
  notes?: string;
}

export interface ILiability extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  description: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  creditor: string;
  accountId?: mongoose.Types.ObjectId;
  createdDate: Date;
  expectedPaymentDate?: Date;
  status: 'active' | 'partially_paid' | 'fully_paid';
  payments: ILiabilityPayment[];
  carriedForwardFrom?: string;
  settlementPeriod: string;
  notes?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const LiabilityPaymentSchema = new Schema<ILiabilityPayment>(
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

const LiabilitySchema = new Schema<ILiability>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0.01, 'Total amount must be greater than 0'],
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, 'Paid amount cannot be negative'],
    },
    remainingAmount: {
      type: Number,
      required: true,
    },
    creditor: {
      type: String,
      required: [true, 'Creditor name is required'],
      trim: true,
      maxlength: [100, 'Creditor name cannot exceed 100 characters'],
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
    },
    createdDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    expectedPaymentDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['active', 'partially_paid', 'fully_paid'],
      default: 'active',
      index: true,
    },
    payments: [LiabilityPaymentSchema],
    carriedForwardFrom: {
      type: String,
      trim: true,
    },
    settlementPeriod: {
      type: String,
      required: [true, 'Settlement period is required'],
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
  },
  {
    timestamps: true,
  }
);

// Compound indexes
LiabilitySchema.index({ userId: 1, status: 1 });
LiabilitySchema.index({ userId: 1, settlementPeriod: 1 });
LiabilitySchema.index({ userId: 1, createdDate: -1 });

// Pre-save hook: Auto-update remaining amount and status
LiabilitySchema.pre('save', function (next) {
  // Calculate remaining amount
  this.remainingAmount = this.totalAmount - this.paidAmount;

  // Auto-update status based on payment
  if (this.remainingAmount <= 0) {
    this.status = 'fully_paid';
    this.remainingAmount = 0; // Ensure it's exactly 0
  } else if (this.paidAmount > 0) {
    this.status = 'partially_paid';
  } else {
    this.status = 'active';
  }

  // Validate paid amount doesn't exceed total
  if (this.paidAmount > this.totalAmount) {
    return next(new Error('Paid amount cannot exceed total amount'));
  }

  next();
});

export const Liability = mongoose.model<ILiability>('Liability', LiabilitySchema);

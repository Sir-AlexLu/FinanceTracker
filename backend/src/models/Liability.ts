// src/models/Liability.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ILiabilityPayment {
  transactionId: mongoose.Types.ObjectId;
  amount: number;
  date: Date;
  accountId: mongoose.Types.ObjectId;
  notes?: string;
}

export interface ILiability extends Document {
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

const Payment = new Schema<ILiabilityPayment>(
  {
    transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction', required: true },
    amount: { type: Number, required: true, min: 0.01 },
    date: { type: Date, required: true, default: Date.now },
    accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    notes: { type: String, trim: true, maxlength: 200 },
  },
  { _id: false }
);

const LiabilitySchema = new Schema<ILiability>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    description: { type: String, required: true, trim: true, maxlength: 200 },
    totalAmount: { type: Number, required: true, min: 0.01 },
    paidAmount: { type: Number, default: 0, min: 0 },
    remainingAmount: { type: Number, required: true },
    creditor: { type: String, required: true, trim: true, maxlength: 100 },
    accountId: { type: Schema.Types.ObjectId, ref: 'Account' },
    createdDate: { type: Date, required: true, default: Date.now },
    expectedPaymentDate: Date,
    status: { type: String, enum: ['active', 'partially_paid', 'fully_paid'], default: 'active', index: true },
    payments: [Payment],
    carriedForwardFrom: String,
    settlementPeriod: { type: String, required: true, index: true },
    notes: { type: String, trim: true, maxlength: 500 },
    tags: [{ type: String, trim: true, lowercase: true }],
  },
  { timestamps: true }
);

// Indexes
LiabilitySchema.index({ userId: 1, status: 1 });
LiabilitySchema.index({ userId: 1, settlementPeriod: 1 });
LiabilitySchema.index({ userId: 1, createdDate: -1 });

// Pre-save
LiabilitySchema.pre('save', function (next) {
  this.remainingAmount = this.totalAmount - this.paidAmount;
  if (this.paidAmount > this.totalAmount) return next(new Error('Paid > total'));

  if (this.remainingAmount <= 0) {
    this.status = 'fully_paid';
    this.remainingAmount = 0;
  } else if (this.paidAmount > 0) {
    this.status = 'partially_paid';
  } else {
    this.status = 'active';
  }

  next();
});

export const Liability = mongoose.model<ILiability>('Liability', LiabilitySchema);

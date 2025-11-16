// src/models/Account.ts
import mongoose, { Schema, Document } from 'mongoose';
import { AccountType, BankConnectionType } from '../types/models.types.js';
import { DEFAULT_ACCOUNT_NAMES } from '../config/constants.js';

export interface IBankConnection {
  type: BankConnectionType;
  upiAddress?: string;
  upiName?: string;
  accountNumber?: string;
  accountHolderName?: string;
  ifscCode?: string;
  bankName?: string;
}

export interface IAccountMetadata {
  defaultName: string;
  lastTransactionAt?: Date;
  lastSettlementDate?: Date;
}

export interface IAccount extends Document {
  userId: mongoose.Types.ObjectId;
  type: AccountType;
  name: string;
  balance: number;
  openingBalance: number;
  connection?: IBankConnection;
  isActive: boolean;
  metadata: IAccountMetadata;
  createdAt: Date;
  updatedAt: Date;
}

const BankConnectionSchema = new Schema<IBankConnection>(
  {
    type: { type: String, enum: Object.values(BankConnectionType), required: true },
    upiAddress: { type: String, trim: true, match: [/^[\w.-]+@[\w.-]+$/, 'Invalid UPI'] },
    upiName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    accountHolderName: { type: String, trim: true },
    ifscCode: { type: String, trim: true, uppercase: true, match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC'] },
    bankName: { type: String, trim: true },
  },
  { _id: false }
);

const AccountSchema = new Schema<IAccount>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: Object.values(AccountType), required: true },
    name: { type: String, required: true, trim: true, maxlength: 50 },
    balance: { type: Number, required: true, default: 0 },
    openingBalance: { type: Number, default: 0 },
    connection: { type: BankConnectionSchema },
    isActive: { type: Boolean, default: true, index: true },
    metadata: {
      defaultName: { type: String, required: true },
      lastTransactionAt: Date,
      lastSettlementDate: Date,
    },
  },
  { timestamps: true }
);

// Indexes
AccountSchema.index({ userId: 1, isActive: 1 });
AccountSchema.index({ userId: 1, type: 1 });
AccountSchema.index({ userId: 1, createdAt: -1 });

// Pre-save
AccountSchema.pre('save', function (next) {
  if ((this.type === AccountType.BANK || this.type === AccountType.SAVINGS) && !this.connection) {
    return next(new Error('Bank/Savings require connection'));
  }

  if (this.connection?.type === BankConnectionType.UPI) {
    if (!this.connection.upiAddress || !this.connection.upiName) {
      return next(new Error('UPI requires address & name'));
    }
  }

  if (this.connection?.type === BankConnectionType.BANK_DETAILS) {
    if (!this.connection.accountNumber || !this.connection.accountHolderName || !this.connection.ifscCode || !this.connection.bankName) {
      return next(new Error('Bank details incomplete'));
    }
  }

  this.metadata.defaultName = this.metadata.defaultName || DEFAULT_ACCOUNT_NAMES[this.type];

  if (this.type !== AccountType.LOANS && this.balance < 0) {
    return next(new Error('Non-loan balance cannot be negative'));
  }

  next();
});

export const Account = mongoose.model<IAccount>('Account', AccountSchema);

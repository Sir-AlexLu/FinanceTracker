import mongoose, { Schema, Document } from 'mongoose';
import { AccountType, BankConnectionType } from '../types/models.types';
import { DEFAULT_ACCOUNT_NAMES } from '../config/constants';

export interface IBankConnection {
  type: BankConnectionType;
  // UPI
  upiAddress?: string;
  upiName?: string;
  // Bank Details
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
  _id: mongoose.Types.ObjectId;
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
    type: {
      type: String,
      enum: Object.values(BankConnectionType),
      required: true,
    },
    // UPI fields
    upiAddress: {
      type: String,
      trim: true,
      match: [/^[\w.-]+@[\w.-]+$/, 'Invalid UPI address format'],
    },
    upiName: {
      type: String,
      trim: true,
    },
    // Bank details fields
    accountNumber: {
      type: String,
      trim: true,
    },
    accountHolderName: {
      type: String,
      trim: true,
    },
    ifscCode: {
      type: String,
      trim: true,
      uppercase: true,
      match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format'],
    },
    bankName: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const AccountSchema = new Schema<IAccount>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(AccountType),
      required: [true, 'Account type is required'],
    },
    name: {
      type: String,
      required: [true, 'Account name is required'],
      trim: true,
      maxlength: [50, 'Account name cannot exceed 50 characters'],
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
    },
    openingBalance: {
      type: Number,
      default: 0,
    },
    connection: {
      type: BankConnectionSchema,
      required: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    metadata: {
      defaultName: {
        type: String,
        required: true,
      },
      lastTransactionAt: {
        type: Date,
      },
      lastSettlementDate: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
AccountSchema.index({ userId: 1, isActive: 1 });
AccountSchema.index({ userId: 1, type: 1 });
AccountSchema.index({ userId: 1, createdAt: -1 });

// Validation: Bank/Savings accounts must have connection details
AccountSchema.pre('save', function (next) {
  if (
    (this.type === AccountType.BANK || this.type === AccountType.SAVINGS) &&
    !this.connection
  ) {
    next(new Error('Bank and Savings accounts must have connection details'));
    return;
  }

  // Validate UPI connection
  if (this.connection?.type === BankConnectionType.UPI) {
    if (!this.connection.upiAddress || !this.connection.upiName) {
      next(new Error('UPI address and name are required for UPI connection'));
      return;
    }
  }

  // Validate Bank Details connection
  if (this.connection?.type === BankConnectionType.BANK_DETAILS) {
    if (
      !this.connection.accountNumber ||
      !this.connection.accountHolderName ||
      !this.connection.ifscCode ||
      !this.connection.bankName
    ) {
      next(new Error('All bank details are required for bank connection'));
      return;
    }
  }

  // Set default name if not provided
  if (!this.metadata.defaultName) {
    this.metadata.defaultName = DEFAULT_ACCOUNT_NAMES[this.type];
  }

  next();
});

// Prevent negative balance for non-loan accounts
AccountSchema.pre('save', function (next) {
  if (this.type !== AccountType.LOANS && this.balance < 0) {
    next(new Error('Account balance cannot be negative'));
    return;
  }
  next();
});

export const Account = mongoose.model<IAccount>('Account', AccountSchema);

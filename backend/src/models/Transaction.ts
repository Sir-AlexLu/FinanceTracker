import mongoose, { Schema } from 'mongoose';
import { ITransaction } from '@/types/database';

const transactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['income', 'expense', 'transfer', 'liability'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
    },
    toAccountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
    },
    tags: [{
      type: String,
      trim: true,
    }],
    notes: {
      type: String,
      trim: true,
    },
    attachments: [{
      type: String,
    }],
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringTransactionId: {
      type: Schema.Types.ObjectId,
      ref: 'RecurringTransaction',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ITransaction>('Transaction', transactionSchema);

import mongoose, { Schema } from 'mongoose';
import { IBill } from '@/types/database';

const recurringPatternSchema = new Schema({
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: true,
  },
  interval: {
    type: Number,
    required: true,
    min: 1,
  },
  endDate: {
    type: Date,
  },
});

const billSchema = new Schema<IBill>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringPattern: {
      type: recurringPatternSchema,
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IBill>('Bill', billSchema);

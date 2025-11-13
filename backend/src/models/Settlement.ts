import mongoose, { Schema } from 'mongoose';
import { ISettlement } from '@/types/database';

const settlementSchema = new Schema<ISettlement>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['monthly', 'yearly'],
      required: true,
    },
    period: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    totalIncome: {
      type: Number,
      required: true,
      min: 0,
    },
    totalExpense: {
      type: Number,
      required: true,
      min: 0,
    },
    netAmount: {
      type: Number,
      required: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ISettlement>('Settlement', settlementSchema);

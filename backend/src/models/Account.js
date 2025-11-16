import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Account name is required'],
      trim: true,
      maxlength: 50,
    },
    type: {
      type: String,
      enum: {
        values: ['cash', 'bank', 'investment'],
        message: 'Type must be cash, bank, or investment',
      },
      required: [true, 'Account type is required'],
    },
    balance: {
      type: Number,
      default: 0,
      // Store as cents to avoid floating point issues
      get: (v) => (v / 100).toFixed(2),
      set: (v) => Math.round(v * 100),
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      maxlength: 3,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// Compound index for userId queries
accountSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Account', accountSchema);

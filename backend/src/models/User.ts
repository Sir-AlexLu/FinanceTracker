import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getEnv } from '../config/env';
import { MAX_LOGIN_ATTEMPTS, ACCOUNT_LOCK_DURATION } from '../config/constants';

export interface IUserPreferences {
  currency: string;
  dateFormat: string;
  notifications: {
    email: boolean;
    push: boolean;
    billReminders: boolean;
    budgetAlerts: boolean;
    goalMilestones: boolean;
  };
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  name: string;
  phoneNumber?: string;

  // Security
  refreshTokens: string[];
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  failedLoginAttempts: number;
  lockUntil?: Date;
  lastLoginAt?: Date;
  lastLoginIP?: string;

  // Settings
  preferences: IUserPreferences;

  // Status
  isActive: boolean;
  isVerified: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  generatePasswordResetToken(): string;
  isLocked(): boolean;
  incLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't return password by default
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    phoneNumber: {
      type: String,
      trim: true,
      match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number'],
    },
    refreshTokens: [
      {
        type: String,
        select: false,
      },
    ],
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    lastLoginAt: {
      type: Date,
    },
    lastLoginIP: {
      type: String,
    },
    preferences: {
      currency: {
        type: String,
        default: 'INR',
        enum: ['INR'], // Can be extended later
      },
      dateFormat: {
        type: String,
        default: 'DD/MM/YYYY',
        enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'],
      },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        billReminders: { type: Boolean, default: true },
        budgetAlerts: { type: Boolean, default: true },
        goalMilestones: { type: Boolean, default: true },
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance and queries
UserSchema.index({ email: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ isActive: 1, isVerified: 1 });
UserSchema.index({ lockUntil: 1 }, { sparse: true });

// Hash password before saving
UserSchema.pre('save', async function (next) {
  // Only hash if password is modified
  if (!this.isModified('password')) return next();

  try {
    const env = getEnv();
    const salt = await bcrypt.genSalt(env.BCRYPT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Error comparing passwords');
  }
};

// Generate password reset token
UserSchema.methods.generatePasswordResetToken = function (): string {
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash token before saving to database
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Set expiry to 10 minutes
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);

  return resetToken; // Return unhashed token to send to user
};

// Check if account is locked
UserSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

// Increment login attempts
UserSchema.methods.incLoginAttempts = async function (): Promise<void> {
  // If lock has expired, restart count at 1
  if (this.lockUntil && this.lockUntil < new Date()) {
    await this.updateOne({
      $set: { failedLoginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
    return;
  }

  const updates: any = { $inc: { failedLoginAttempts: 1 } };

  // Lock account after max attempts
  const attemptsLeft = MAX_LOGIN_ATTEMPTS - this.failedLoginAttempts - 1;
  if (attemptsLeft <= 0) {
    updates.$set = {
      lockUntil: new Date(Date.now() + ACCOUNT_LOCK_DURATION),
    };
  }

  await this.updateOne(updates);
};

// Reset login attempts after successful login
UserSchema.methods.resetLoginAttempts = async function (): Promise<void> {
  await this.updateOne({
    $set: { failedLoginAttempts: 0 },
    $unset: { lockUntil: 1 },
  });
};

export const User = mongoose.model<IUser>('User', UserSchema);

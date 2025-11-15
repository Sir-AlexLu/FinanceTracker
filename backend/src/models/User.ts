// src/models/User.ts
import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getEnv } from '../config/env.js';

const MAX_LOGIN_ATTEMPTS = 5;
const ACCOUNT_LOCK_DURATION = 30 * 60 * 1000; // 30 mins

export interface IUserPreferences {
  currency: 'INR';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  notifications: {
    email: boolean;
    push: boolean;
    billReminders: boolean;
    budgetAlerts: boolean;
    goalMilestones: boolean;
  };
}

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  phoneNumber?: string;

  refreshTokens: string[];
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  failedLoginAttempts: number;
  lockUntil?: Date;
  lastLoginAt?: Date;
  lastLoginIP?: string;

  preferences: IUserPreferences;

  isActive: boolean;
  isVerified: boolean;

  createdAt: Date;
  updatedAt: Date;

  comparePassword(candidate: string): Promise<boolean>;
  generatePasswordResetToken(): string;
  isLocked(): boolean;
  incLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    phoneNumber: {
      type: String,
      trim: true,
      match: [/^[0-9]{10}$/, 'Invalid phone number'],
    },
    refreshTokens: [{ type: String, select: false }],
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    lastLoginAt: { type: Date },
    lastLoginIP: { type: String },
    preferences: {
      currency: { type: String, enum: ['INR'], default: 'INR' },
      dateFormat: {
        type: String,
        enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'],
        default: 'DD/MM/YYYY',
      },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        billReminders: { type: Boolean, default: true },
        budgetAlerts: { type: Boolean, default: true },
        goalMilestones: { type: Boolean, default: true },
      },
    },
    isActive: { type: Boolean, default: true, index: true },
    isVerified: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ isActive: 1, isVerified: 1 });
UserSchema.index({ lockUntil: 1 }, { sparse: true });

// Hash password
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const env = getEnv();
  this.password = await bcrypt.hash(this.password, env.BCRYPT_ROUNDS);
  next();
});

// Methods
UserSchema.methods.comparePassword = async function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

UserSchema.methods.generatePasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
  return token;
};

UserSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

UserSchema.methods.incLoginAttempts = async function () {
  if (this.lockUntil && this.lockUntil < new Date()) {
    await this.updateOne({ $set: { failedLoginAttempts: 1 }, $unset: { lockUntil: 1 } });
    return;
  }

  const updates: any = { $inc: { failedLoginAttempts: 1 } };
  if (this.failedLoginAttempts + 1 >= MAX_LOGIN_ATTEMPTS) {
    updates.$set = { lockUntil: new Date(Date.now() + ACCOUNT_LOCK_DURATION) };
  }
  await this.updateOne(updates);
};

UserSchema.methods.resetLoginAttempts = async function () {
  await this.updateOne({ $set: { failedLoginAttempts: 0 }, $unset: { lockUntil: 1 } });
};

export const User = mongoose.model<IUser>('User', UserSchema);

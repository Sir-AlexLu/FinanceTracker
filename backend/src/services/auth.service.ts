// src/services/auth.service.ts
import crypto from 'crypto';
import { User, IUser } from '../models/User.js';
import { getEnv } from '../config/env.js';
import { logger } from '../utils/logger.js';
import type { FastifyInstance } from 'fastify';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  constructor(private fastify: FastifyInstance) {}

  async register(
    email: string,
    password: string,
    name: string,
    phoneNumber?: string,
    ip?: string,
    ua?: string
  ): Promise<{ user: Partial<IUser>; tokens: TokenPair }> {
    const existing = await User.findOne({ email });
    if (existing) throw new Error('Email already in use');

    const user = await User.create({ email, password, name, phoneNumber });
    const tokens = await this.generateTokens(user._id.toString(), email);

    await User.findByIdAndUpdate(user._id, { $push: { refreshTokens: tokens.refreshToken } });

    logger.info({ userId: user._id, ip, ua }, 'User registered');

    const safeUser = user.toObject();
    delete (safeUser as any).password;
    return { user: safeUser, tokens };
  }

  async login(email: string, password: string, ip: string, ua: string): Promise<{ user: Partial<IUser>; tokens: TokenPair }> {
    const user = await User.findOne({ email }).select('+password');
    if (!user) throw new Error('Invalid credentials');

    if (user.isLocked()) {
      const mins = Math.ceil((user.lockUntil!.getTime() - Date.now()) / 60000);
      throw new Error(`Account locked. Try again in ${mins} minute${mins > 1 ? 's' : ''}.`);
    }

    if (!user.isActive) throw new Error('Account deactivated');

    const valid = await user.comparePassword(password);
    if (!valid) {
      await user.incLoginAttempts();
      logger.warn({ userId: user._id, ip }, 'Failed login');
      throw new Error('Invalid credentials');
    }

    await user.resetLoginAttempts();
    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date(), lastLoginIP: ip });

    const tokens = await this.generateTokens(user._id.toString(), email);
    await User.findByIdAndUpdate(user._id, { $push: { refreshTokens: tokens.refreshToken } });

    logger.info({ userId: user._id, ip }, 'Login successful');

    const safeUser = user.toObject();
    delete (safeUser as any).password;
    delete (safeUser as any).refreshTokens;
    return { user: safeUser, tokens };
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { $pull: { refreshTokens: refreshToken } });
    logger.info({ userId }, 'Logout');
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    const payload = this.fastify.jwt.verify(refreshToken, { secret: getEnv().JWT_REFRESH_SECRET }) as { userId: string };
    const user = await User.findOne({ _id: payload.userId, refreshTokens: refreshToken, isActive: true });
    if (!user) throw new Error('Invalid refresh token');

    const tokens = await this.generateTokens(user._id.toString(), user.email);
    await User.findByIdAndUpdate(user._id, {
      $pull: { refreshTokens: refreshToken },
      $push: { refreshTokens: tokens.refreshToken },
    });

    return tokens;
  }

  async changePassword(userId: string, current: string, newPass: string): Promise<void> {
    const user = await User.findById(userId).select('+password');
    if (!user) throw new Error('User not found');

    const valid = await user.comparePassword(current);
    if (!valid) throw new Error('Current password incorrect');

    user.password = newPass;
    await user.save();
    await User.findByIdAndUpdate(userId, { $set: { refreshTokens: [] } });

    logger.info({ userId }, 'Password changed');
  }

  async forgotPassword(email: string): Promise<string> {
    const user = await User.findOne({ email, isActive: true });
    if (!user) return 'If account exists, reset link sent.';

    const token = user.generatePasswordResetToken();
    await user.save();

    logger.info({ userId: user._id }, 'Password reset requested');
    return token; // REMOVE IN PROD
  }

  async resetPassword(token: string, newPass: string): Promise<void> {
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hash,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) throw new Error('Invalid or expired token');

    user.password = newPass;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    await User.findByIdAndUpdate(user._id, { $set: { refreshTokens: [] } });

    logger.info({ userId: user._id }, 'Password reset');
  }

  async getProfile(userId: string): Promise<Partial<IUser>> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    const safe = user.toObject();
    delete (safe as any).password;
    return safe;
  }

  async updateProfile(userId: string, data: any): Promise<Partial<IUser>> {
    const user = await User.findByIdAndUpdate(userId, data, { new: true, runValidators: true });
    if (!user) throw new Error('User not found');
    const safe = user.toObject();
    delete (safe as any).password;
    return safe;
  }

  private async generateTokens(userId: string, email: string): Promise<TokenPair> {
    const payload = { userId, email };
    const access = this.fastify.jwt.sign(payload, { expiresIn: getEnv().JWT_ACCESS_EXPIRES_IN });
    const refresh = this.fastify.jwt.sign(payload, { secret: getEnv().JWT_REFRESH_SECRET, expiresIn: getEnv().JWT_REFRESH_EXPIRES_IN });
    return { accessToken: access, refreshToken: refresh };
  }
}

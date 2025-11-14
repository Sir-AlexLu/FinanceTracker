import crypto from 'crypto';
import { User, IUser } from '../models/User';
import { AuditLog, AuditAction, AuditSeverity } from '../models/AuditLog';
import { getEnv } from '../config/env';
import { hashPassword, comparePassword } from '../utils/encryption';
import { TokenPair } from '../types/models.types';
import { FastifyInstance } from 'fastify';
import mongoose from 'mongoose';

export class AuthService {
  private fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
  }

  /**
   * Register a new user
   */
  async register(
    email: string,
    password: string,
    name: string,
    phoneNumber?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ user: IUser; tokens: TokenPair }> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Create user (password will be hashed in pre-save hook)
      const user = await User.create({
        email,
        password,
        name,
        phoneNumber,
        isVerified: false, // Email verification can be added later
        isActive: true,
      });

      // Generate tokens
      const tokens = await this.generateTokenPair(user._id.toString(), user.email);

      // Save refresh token
      await User.findByIdAndUpdate(user._id, {
        $push: { refreshTokens: tokens.refreshToken },
      });

      // Audit log
      if (ipAddress && userAgent) {
        await AuditLog.log({
          userId: user._id,
          action: AuditAction.REGISTER,
          resource: 'User',
          resourceId: user._id,
          details: { email: user.email, name: user.name },
          ipAddress,
          userAgent,
          statusCode: 201,
        });
      }

      // Remove password from response
      const userObject = user.toObject();
      delete (userObject as any).password;

      return { user: userObject as IUser, tokens };
    } catch (error: any) {
      this.fastify.log.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(
    email: string,
    password: string,
    ipAddress: string,
    userAgent: string
  ): Promise<{ user: IUser; tokens: TokenPair }> {
    try {
      // Find user with password field
      const user = await User.findOne({ email }).select('+password');

      if (!user) {
        // Audit failed login
        await AuditLog.log({
          action: AuditAction.LOGIN_FAILED,
          severity: AuditSeverity.WARNING,
          resource: 'User',
          details: { email, reason: 'User not found' },
          ipAddress,
          userAgent,
          statusCode: 401,
        });

        throw new Error('Invalid email or password');
      }

      // Check if account is locked
      if (user.isLocked()) {
        const lockUntil = user.lockUntil!;
        const minutesLeft = Math.ceil((lockUntil.getTime() - Date.now()) / 60000);

        await AuditLog.log({
          userId: user._id,
          action: AuditAction.LOGIN_FAILED,
          severity: AuditSeverity.WARNING,
          resource: 'User',
          details: { email, reason: 'Account locked', minutesLeft },
          ipAddress,
          userAgent,
          statusCode: 423,
        });

        throw new Error(
          `Account is locked due to too many failed login attempts. Try again in ${minutesLeft} minutes.`
        );
      }

      // Check if account is active
      if (!user.isActive) {
        await AuditLog.log({
          userId: user._id,
          action: AuditAction.LOGIN_FAILED,
          severity: AuditSeverity.WARNING,
          resource: 'User',
          details: { email, reason: 'Account deactivated' },
          ipAddress,
          userAgent,
          statusCode: 403,
        });

        throw new Error('Account has been deactivated');
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        // Increment failed login attempts
        await user.incLoginAttempts();

        await AuditLog.log({
          userId: user._id,
          action: AuditAction.LOGIN_FAILED,
          severity: AuditSeverity.WARNING,
          resource: 'User',
          details: {
            email,
            reason: 'Invalid password',
            failedAttempts: user.failedLoginAttempts + 1,
          },
          ipAddress,
          userAgent,
          statusCode: 401,
        });

        throw new Error('Invalid email or password');
      }

      // Reset failed login attempts on successful login
      await user.resetLoginAttempts();

      // Update last login info
      await User.findByIdAndUpdate(user._id, {
        lastLoginAt: new Date(),
        lastLoginIP: ipAddress,
      });

      // Generate tokens
      const tokens = await this.generateTokenPair(user._id.toString(), user.email);

      // Save refresh token
      await User.findByIdAndUpdate(user._id, {
        $push: { refreshTokens: tokens.refreshToken },
      });

      // Audit successful login
      await AuditLog.log({
        userId: user._id,
        action: AuditAction.LOGIN,
        resource: 'User',
        resourceId: user._id,
        details: { email: user.email },
        ipAddress,
        userAgent,
        statusCode: 200,
      });

      // Remove sensitive fields
      const userObject = user.toObject();
      delete (userObject as any).password;
      delete (userObject as any).refreshTokens;

      return { user: userObject as IUser, tokens };
    } catch (error: any) {
      this.fastify.log.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(
    userId: string,
    refreshToken: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    try {
      // Remove refresh token
      await User.findByIdAndUpdate(userId, {
        $pull: { refreshTokens: refreshToken },
      });

      // Audit logout
      await AuditLog.log({
        userId: new mongoose.Types.ObjectId(userId),
        action: AuditAction.LOGOUT,
        resource: 'User',
        resourceId: new mongoose.Types.ObjectId(userId),
        details: {},
        ipAddress,
        userAgent,
        statusCode: 200,
      });
    } catch (error: any) {
      this.fastify.log.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenPair> {
    try {
      // Verify refresh token
      const decoded = this.fastify.jwt.verify(refreshToken, {
        namespace: 'refresh',
      }) as { userId: string; email: string };

      // Check if refresh token exists in database
      const user = await User.findOne({
        _id: decoded.userId,
        refreshTokens: refreshToken,
        isActive: true,
      });

      if (!user) {
        throw new Error('Invalid refresh token');
      }

      // Generate new token pair
      const tokens = await this.generateTokenPair(user._id.toString(), user.email);

      // Replace old refresh token with new one
      await User.findByIdAndUpdate(user._id, {
        $pull: { refreshTokens: refreshToken },
        $push: { refreshTokens: tokens.refreshToken },
      });

      return tokens;
    } catch (error: any) {
      this.fastify.log.error('Refresh token error:', error);
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    try {
      const user = await User.findById(userId).select('+password');

      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isPasswordValid = await user.comparePassword(currentPassword);

      if (!isPasswordValid) {
        await AuditLog.log({
          userId: user._id,
          action: AuditAction.PASSWORD_CHANGE,
          severity: AuditSeverity.WARNING,
          resource: 'User',
          resourceId: user._id,
          details: { reason: 'Invalid current password' },
          ipAddress,
          userAgent,
          statusCode: 401,
        });

        throw new Error('Current password is incorrect');
      }

      // Update password (will be hashed in pre-save hook)
      user.password = newPassword;
      await user.save();

      // Clear all refresh tokens (logout from all devices)
      await User.findByIdAndUpdate(userId, {
        $set: { refreshTokens: [] },
      });

      // Audit password change
      await AuditLog.log({
        userId: user._id,
        action: AuditAction.PASSWORD_CHANGE,
        resource: 'User',
        resourceId: user._id,
        details: { message: 'Password changed successfully' },
        ipAddress,
        userAgent,
        statusCode: 200,
      });
    } catch (error: any) {
      this.fastify.log.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string, ipAddress: string, userAgent: string): Promise<string> {
    try {
      const user = await User.findOne({ email, isActive: true });

      if (!user) {
        // Don't reveal if user exists
        this.fastify.log.warn(`Password reset requested for non-existent email: ${email}`);
        return 'If an account exists with this email, a password reset link has been sent.';
      }

      // Generate reset token
      const resetToken = user.generatePasswordResetToken();
      await user.save();

      // Audit password reset request
      await AuditLog.log({
        userId: user._id,
        action: AuditAction.PASSWORD_RESET,
        resource: 'User',
        resourceId: user._id,
        details: { email },
        ipAddress,
        userAgent,
        statusCode: 200,
      });

      // In production, send email with reset token
      // For now, return the token (REMOVE IN PRODUCTION)
      this.fastify.log.info(`Password reset token for ${email}: ${resetToken}`);

      return resetToken; // In production, don't return this
    } catch (error: any) {
      this.fastify.log.error('Forgot password error:', error);
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(
    token: string,
    newPassword: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    try {
      // Hash the token to compare with stored hash
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Find user with valid reset token
      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: new Date() },
        isActive: true,
      }).select('+password +passwordResetToken +passwordResetExpires');

      if (!user) {
        throw new Error('Invalid or expired password reset token');
      }

      // Update password
      user.password = newPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      // Clear all refresh tokens
      await User.findByIdAndUpdate(user._id, {
        $set: { refreshTokens: [] },
      });

      // Audit password reset
      await AuditLog.log({
        userId: user._id,
        action: AuditAction.PASSWORD_RESET,
        resource: 'User',
        resourceId: user._id,
        details: { message: 'Password reset successful' },
        ipAddress,
        userAgent,
        statusCode: 200,
      });
    } catch (error: any) {
      this.fastify.log.error('Reset password error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    data: {
      name?: string;
      phoneNumber?: string;
      preferences?: any;
    }
  ): Promise<IUser> {
    try {
      const updateData: any = {};

      if (data.name) updateData.name = data.name;
      if (data.phoneNumber) updateData.phoneNumber = data.phoneNumber;
      if (data.preferences) {
        // Merge preferences
        if (data.preferences.currency)
          updateData['preferences.currency'] = data.preferences.currency;
        if (data.preferences.dateFormat)
          updateData['preferences.dateFormat'] = data.preferences.dateFormat;
        if (data.preferences.notifications) {
          Object.keys(data.preferences.notifications).forEach((key) => {
            updateData[`preferences.notifications.${key}`] =
              data.preferences.notifications[key];
          });
        }
      }

      const user = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true,
      });

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error: any) {
      this.fastify.log.error('Update profile error:', error);
      throw error;
    }
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<IUser> {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error: any) {
      this.fastify.log.error('Get profile error:', error);
      throw error;
    }
  }

  /**
   * Generate JWT token pair
   */
  private async generateTokenPair(userId: string, email: string): Promise<TokenPair> {
    const payload = { userId, email };

    const accessToken = this.fastify.jwt.sign(payload, {
      namespace: 'access',
    });

    const refreshToken = this.fastify.jwt.sign(payload, {
      namespace: 'refresh',
    });

    return { accessToken, refreshToken };
  }
}

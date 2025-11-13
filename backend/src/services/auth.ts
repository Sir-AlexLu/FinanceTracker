import User from '@/models/User';
import { LoginRequest, RegisterRequest, LoginResponse, RefreshTokenResponse } from '@/types/auth';
import { generateTokens } from '@/utils/jwt';
import { ApiResponse } from '@/types/common';

export class AuthService {
  async register(userData: RegisterRequest): Promise<ApiResponse<LoginResponse>> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          { username: userData.username },
          { email: userData.email }
        ]
      });

      if (existingUser) {
        return {
          success: false,
          message: 'User with this username or email already exists',
        };
      }

      // Create new user
      const user = new User(userData);
      await user.save();

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens({
        id: user._id.toString(),
        username: user.username,
      });

      return {
        success: true,
        data: {
          user: {
            id: user._id.toString(),
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar,
          },
          token: accessToken,
          refreshToken,
          expiresIn: 15 * 60, // 15 minutes in seconds
        },
        message: 'User registered successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Registration failed',
      };
    }
  }

  async login(loginData: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    try {
      // Find user by username
      const user = await User.findOne({ 
        username: loginData.username, 
        isActive: true 
      });

      if (!user) {
        return {
          success: false,
          message: 'Invalid username or password',
        };
      }

      // Check password
      const isPasswordValid = await user.comparePassword(loginData.password);
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Invalid username or password',
        };
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens({
        id: user._id.toString(),
        username: user.username,
      });

      return {
        success: true,
        data: {
          user: {
            id: user._id.toString(),
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar,
          },
          token: accessToken,
          refreshToken,
          expiresIn: 15 * 60, // 15 minutes in seconds
        },
        message: 'Login successful',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Login failed',
      };
    }
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<RefreshTokenResponse>> {
    try {
      // Verify refresh token (this would be implemented with JWT verification)
      // For now, we'll assume it's valid and extract the user ID
      
      // Find user
      const user = await User.findOne({ isActive: true });
      if (!user) {
        return {
          success: false,
          message: 'Invalid refresh token',
        };
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = generateTokens({
        id: user._id.toString(),
        username: user.username,
      });

      return {
        success: true,
        data: {
          token: accessToken,
          refreshToken: newRefreshToken,
          expiresIn: 15 * 60, // 15 minutes in seconds
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Token refresh failed',
      };
    }
  }
}

export const authService = new AuthService();

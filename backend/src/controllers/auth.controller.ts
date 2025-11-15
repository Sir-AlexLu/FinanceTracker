import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/auth.service';
import {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  ChangePasswordInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  UpdateProfileInput,
} from '../schemas/auth.schema';
import { successResponse, errorResponse } from '../utils/responseFormatter';

export class AuthController {
  private authService: AuthService;

  constructor(fastify: any) {
    this.authService = new AuthService(fastify);
  }

  /**
   * Register a new user
   */
  async register(
    request: FastifyRequest<{ Body: RegisterInput }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { email, password, name, phoneNumber } = request.body;
      const ipAddress = request.ip;
      const userAgent = request.headers['user-agent'] || 'unknown';

      const result = await this.authService.register(
        email,
        password,
        name,
        phoneNumber,
        ipAddress,
        userAgent
      );

      reply.status(201).send(
        successResponse(
          {
            user: result.user,
            tokens: result.tokens,
          },
          'User registered successfully'
        )
      );
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Login user
   */
  async login(
    request: FastifyRequest<{ Body: LoginInput }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { email, password } = request.body;
      const ipAddress = request.ip;
      const userAgent = request.headers['user-agent'] || 'unknown';

      const result = await this.authService.login(email, password, ipAddress, userAgent);

      reply.status(200).send(
        successResponse(
          {
            user: result.user,
            tokens: result.tokens,
          },
          'Login successful'
        )
      );
    } catch (error: any) {
      request.log.error(error);
      const statusCode = error.message.includes('locked') ? 423 : 401;
      reply.status(statusCode).send(errorResponse(error.message));
    }
  }

  /**
   * Logout user
   */
  async logout(
    request: FastifyRequest<{ Body: RefreshTokenInput }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { refreshToken } = request.body;
      const userId = request.user.userId;
      const ipAddress = request.ip;
      const userAgent = request.headers['user-agent'] || 'unknown';

      await this.authService.logout(userId, refreshToken, ipAddress, userAgent);

      reply.status(200).send(successResponse(null, 'Logout successful'));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(
    request: FastifyRequest<{ Body: RefreshTokenInput }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { refreshToken } = request.body;

      const tokens = await this.authService.refreshAccessToken(refreshToken);

      reply.status(200).send(successResponse(tokens, 'Token refreshed successfully'));
    } catch (error: any) {
      request.log.error(error);
      reply.status(401).send(errorResponse(error.message));
    }
  }

  /**
   * Change password
   */
  async changePassword(
    request: FastifyRequest<{ Body: ChangePasswordInput }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { currentPassword, newPassword } = request.body;
      const userId = request.user.userId;
      const ipAddress = request.ip;
      const userAgent = request.headers['user-agent'] || 'unknown';

      await this.authService.changePassword(
        userId,
        currentPassword,
        newPassword,
        ipAddress,
        userAgent
      );

      reply.status(200).send(successResponse(null, 'Password changed successfully'));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Forgot password
   */
  async forgotPassword(
    request: FastifyRequest<{ Body: ForgotPasswordInput }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { email } = request.body;
      const ipAddress = request.ip;
      const userAgent = request.headers['user-agent'] || 'unknown';

      const message = await this.authService.forgotPassword(email, ipAddress, userAgent);

      reply.status(200).send(successResponse({ message }));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Reset password
   */
  async resetPassword(
    request: FastifyRequest<{ Body: ResetPasswordInput }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { token, newPassword } = request.body;
      const ipAddress = request.ip;
      const userAgent = request.headers['user-agent'] || 'unknown';

      await this.authService.resetPassword(token, newPassword, ipAddress, userAgent);

      reply.status(200).send(successResponse(null, 'Password reset successfully'));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }

  /**
   * Get user profile
   */
  async getProfile(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = request.user.userId;

      const user = await this.authService.getProfile(userId);

      reply.status(200).send(successResponse(user));
    } catch (error: any) {
      request.log.error(error);
      reply.status(404).send(errorResponse(error.message));
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(
    request: FastifyRequest<{ Body: UpdateProfileInput }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = request.user.userId;
      const data = request.body;

      const user = await this.authService.updateProfile(userId, data);

      reply.status(200).send(successResponse(user, 'Profile updated successfully'));
    } catch (error: any) {
      request.log.error(error);
      reply.status(400).send(errorResponse(error.message));
    }
  }
}

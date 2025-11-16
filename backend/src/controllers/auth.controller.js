// File: FinanceTracker/backend/src/controllers/auth.controller.js
import { User } from '../models/User.js';
import { generateToken, setAuthCookie, clearAuthCookie } from '../utils/jwt.js';
import { formatSuccessResponse, formatErrorResponse, sanitizeUser } from '../utils/helpers.js';

export const register = async (request, reply) => {
  try {
    const { email, password, name } = request.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return reply.status(409).send(
        formatErrorResponse('User already exists', 'An account with this email already exists')
      );
    }

    // Create new user
    const user = new User({
      email,
      passwordHash: password,
      name
    });

    await user.save();

    // Generate token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email
    });

    // Set auth cookie
    setAuthCookie(reply, token);

    return reply.status(201).send(
      formatSuccessResponse(
        {
          user: sanitizeUser(user),
          token
        },
        'Registration successful'
      )
    );
  } catch (error) {
    console.error('Registration error:', error);
    return reply.status(500).send(
      formatErrorResponse('Registration failed', 'Unable to create account')
    );
  }
};

export const login = async (request, reply) => {
  try {
    const { email, password } = request.body;

    // Find user with password field
    const user = await User.findOne({ email }).select('+passwordHash');
    
    if (!user) {
      return reply.status(401).send(
        formatErrorResponse('Invalid credentials', 'Email or password is incorrect')
      );
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return reply.status(401).send(
        formatErrorResponse('Invalid credentials', 'Email or password is incorrect')
      );
    }

    // Generate token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email
    });

    // Set auth cookie
    setAuthCookie(reply, token);

    return reply.send(
      formatSuccessResponse(
        {
          user: sanitizeUser(user),
          token
        },
        'Login successful'
      )
    );
  } catch (error) {
    console.error('Login error:', error);
    return reply.status(500).send(
      formatErrorResponse('Login failed', 'Unable to authenticate')
    );
  }
};

export const logout = async (request, reply) => {
  try {
    clearAuthCookie(reply);
    
    return reply.send(
      formatSuccessResponse(null, 'Logout successful')
    );
  } catch (error) {
    console.error('Logout error:', error);
    return reply.status(500).send(
      formatErrorResponse('Logout failed', 'Unable to logout')
    );
  }
};

export const getMe = async (request, reply) => {
  try {
    const user = await User.findById(request.user.userId);
    
    if (!user) {
      return reply.status(404).send(
        formatErrorResponse('User not found', 'Your account could not be found')
      );
    }

    return reply.send(
      formatSuccessResponse(
        { user: sanitizeUser(user) },
        'User retrieved successfully'
      )
    );
  } catch (error) {
    console.error('Get user error:', error);
    return reply.status(500).send(
      formatErrorResponse('Failed to get user', 'Unable to retrieve user information')
    );
  }
};

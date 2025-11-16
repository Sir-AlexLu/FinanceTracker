import User from '../models/User.js';

// Register new user
export const register = async (request, reply) => {
  try {
    const { name, email, password } = request.body;

    // Validation
    if (!name || !email || !password) {
      return reply.code(400).send({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    if (password.length < 6) {
      return reply.code(400).send({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return reply.code(400).send({
        success: false,
        message: 'Email already registered',
      });
    }

    // Create new user
    const user = await User.create({ name, email, password });

    // Generate token
    const token = request.server.jwt.sign({
      id: user._id,
      email: user.email,
    });

    reply.code(201).send({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
        token,
      },
    });
  } catch (error) {
    reply.code(500).send({
      success: false,
      message: error.message,
    });
  }
};

// Login user
export const login = async (request, reply) => {
  try {
    const { email, password } = request.body;

    // Validation
    if (!email || !password) {
      return reply.code(400).send({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return reply.code(401).send({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return reply.code(401).send({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate token
    const token = request.server.jwt.sign({
      id: user._id,
      email: user.email,
    });

    reply.send({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
        token,
      },
    });
  } catch (error) {
    reply.code(500).send({
      success: false,
      message: error.message,
    });
  }
};

// Get current user
export const getMe = async (request, reply) => {
  try {
    const user = await User.findById(request.user.id);

    if (!user) {
      return reply.code(404).send({
        success: false,
        message: 'User not found',
      });
    }

    reply.send({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    reply.code(500).send({
      success: false,
      message: error.message,
    });
  }
};

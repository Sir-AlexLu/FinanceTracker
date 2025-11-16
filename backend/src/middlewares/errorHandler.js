// File: FinanceTracker/backend/src/middlewares/errorHandler.js
export const errorHandler = (error, request, reply) => {
  // Log error
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
    body: request.body
  });

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message
    }));
    
    return reply.status(400).send({
      success: false,
      error: 'Validation failed',
      errors
    });
  }

  // Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return reply.status(409).send({
      success: false,
      error: 'Duplicate entry',
      message: `A record with this ${field} already exists`
    });
  }

  // Mongoose cast error
  if (error.name === 'CastError') {
    return reply.status(400).send({
      success: false,
      error: 'Invalid data',
      message: `Invalid ${error.path}: ${error.value}`
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return reply.status(401).send({
      success: false,
      error: 'Invalid token',
      message: 'Your authentication token is invalid'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return reply.status(401).send({
      success: false,
      error: 'Token expired',
      message: 'Your session has expired. Please login again'
    });
  }

  // Rate limit error
  if (error.statusCode === 429) {
    return reply.status(429).send({
      success: false,
      error: 'Too many requests',
      message: 'Please wait before making another request'
    });
  }

  // CORS error
  if (error.message && error.message.includes('CORS')) {
    return reply.status(403).send({
      success: false,
      error: 'CORS error',
      message: 'Cross-origin request blocked'
    });
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 
    ? 'An unexpected error occurred' 
    : error.message;

  return reply.status(statusCode).send({
    success: false,
    error: 'Server error',
    message
  });
};

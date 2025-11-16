export const errorHandler = (error, request, reply) => {
  console.error('❌ Error:', error);

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((err) => err.message);
    return reply.code(400).send({
      success: false,
      message: 'Validation Error',
      errors,
    });
  }

  // Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return reply.code(400).send({
      success: false,
      message: `This ${field} is already registered`,
    });
  }

  // Mongoose cast error (invalid ID)
  if (error.name === 'CastError') {
    return reply.code(400).send({
      success: false,
      message: 'Invalid ID format',
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return reply.code(401).send({
      success: false,
      message: 'Invalid token',
    });
  }

  if (error.name === 'TokenExpiredError') {
    return reply.code(401).send({
      success: false,
      message: 'Token expired',
    });
  }

  // Fastify validation error
  if (error.validation) {
    return reply.code(400).send({
      success: false,
      message: 'Validation Error',
      errors: error.validation,
    });
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  reply.code(statusCode).send({
    success: false,
    message,
  });
};

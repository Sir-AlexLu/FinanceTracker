import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '@/types/common';

export const errorHandler = (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  request.log.error(error);
  
  // Validation errors
  if (error.validation) {
    return reply.status(400).send({
      success: false,
      message: 'Validation Error',
      error: error.message,
    } as ApiResponse);
  }
  
  // JWT errors
  if (error.statusCode === 401) {
    return reply.status(401).send({
      success: false,
      message: 'Authentication error',
      error: error.message,
    } as ApiResponse);
  }
  
  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const errors = Object.values(error as any).map((val: any) => val.message);
    return reply.status(400).send({
      success: false,
      message: 'Validation Error',
      error: errors.join(', '),
    } as ApiResponse);
  }
  
  // Mongoose duplicate key error
  if (error.name === 'MongoServerError' && (error as any).code === 11000) {
    const field = Object.keys((error as any).keyValue)[0];
    return reply.status(400).send({
      success: false,
      message: `${field} already exists`,
    } as ApiResponse);
  }
  
  // Default error
  return reply.status(500).send({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined,
  } as ApiResponse);
};

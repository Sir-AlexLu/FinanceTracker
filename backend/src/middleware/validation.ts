import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodSchema } from 'zod';
import { ApiResponse } from '@/types/common';

export const validateBody = (schema: ZodSchema) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      request.body = schema.parse(request.body);
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        message: 'Validation Error',
        error: error.errors?.map((e: any) => e.message).join(', ') || error.message,
      } as ApiResponse);
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      request.query = schema.parse(request.query);
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        message: 'Validation Error',
        error: error.errors?.map((e: any) => e.message).join(', ') || error.message,
      } as ApiResponse);
    }
  };
};

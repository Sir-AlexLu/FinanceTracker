import { ApiResponse, PaginatedResponse } from '../types/common.types';

export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
  };
}

export function errorResponse(message: string, error?: string): ApiResponse {
  return {
    success: false,
    message,
    error,
  };
}

export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

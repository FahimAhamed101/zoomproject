import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/errors';
import { ApiResponse } from '../types';

export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    } as ApiResponse);
  }

  // Default error
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  } as ApiResponse);
};

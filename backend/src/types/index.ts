import { Request } from 'express';

export interface JWTPayload {
  id: string;
  email: string;
  type: 'user' | 'admin';
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
  admin?: JWTPayload;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

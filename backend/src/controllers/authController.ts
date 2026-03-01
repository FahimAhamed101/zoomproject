import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { ApiResponse } from '../types';

export const authController = {
  // Register
  async register(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName } = req.body;

      const user = await authService.registerUser(email, password, firstName, lastName);

      res.status(201).json({
        success: true,
        message: 'User registered successfully. Please verify your email.',
        data: user,
      } as ApiResponse);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message,
      } as ApiResponse);
    }
  },

  // Login
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const result = await authService.loginUser(email, password);

      res.status(200).json({
        success: true,
        data: result,
      } as ApiResponse);
    } catch (error) {
      res.status(401).json({
        success: false,
        error: (error as Error).message,
      } as ApiResponse);
    }
  },

  // Verify email
  async verifyEmail(req: Request, res: Response) {
    try {
      const token = (req.body?.token || req.query?.token) as string | undefined;

      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'Invalid verification token',
        } as ApiResponse);
      }

      const result = await authService.verifyEmail(token);

      res.status(200).json({
        success: true,
        data: result,
      } as ApiResponse);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message,
      } as ApiResponse);
    }
  },

  // Request password reset
  async requestPasswordReset(req: Request, res: Response) {
    try {
      const { email } = req.body;

      const result = await authService.requestPasswordReset(email);

      res.status(200).json({
        success: true,
        data: result,
      } as ApiResponse);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message,
      } as ApiResponse);
    }
  },

  // Reset password
  async resetPassword(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body;

      const result = await authService.resetPassword(token, newPassword);

      res.status(200).json({
        success: true,
        data: result,
      } as ApiResponse);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message,
      } as ApiResponse);
    }
  },
};

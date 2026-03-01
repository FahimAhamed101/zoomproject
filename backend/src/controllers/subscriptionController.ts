import { Response } from 'express';
import { adminAuthService } from '../services/adminAuthService';
import { subscriptionService } from '../services/subscriptionService';
import { AuthRequest, ApiResponse } from '../types';

export const adminAuthController = {
  // Admin registration
  async register(req: AuthRequest, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required',
        } as ApiResponse);
      }

      const result = await adminAuthService.registerAdmin(email, password);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Admin registered successfully',
      } as ApiResponse);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message,
      } as ApiResponse);
    }
  },

  // Admin login
  async login(req: AuthRequest, res: Response) {
    try {
      const { email, password } = req.body;

      const result = await adminAuthService.adminLogin(email, password);

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

  // Get admin profile
  async getProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.admin) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const admin = await adminAuthService.getAdminProfile(req.admin.id);

      res.status(200).json({
        success: true,
        data: admin,
      } as ApiResponse);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message,
      } as ApiResponse);
    }
  },
};

export const subscriptionController = {
  // Get all packages
  async getAllPackages(req: AuthRequest, res: Response) {
    try {
      if (!req.admin) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }

      const packages = await subscriptionService.getAllPackages(req.admin.id);

      res.status(200).json({
        success: true,
        data: packages,
      } as ApiResponse);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message,
      } as ApiResponse);
    }
  },

  // Create package
  async createPackage(req: AuthRequest, res: Response) {
    try {
      if (!req.admin) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }

      const data = req.body;
      const pkg = await subscriptionService.createPackage(data, req.admin.id);

      res.status(201).json({
        success: true,
        data: pkg,
      } as ApiResponse);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message,
      } as ApiResponse);
    }
  },

  // Update package
  async updatePackage(req: AuthRequest, res: Response) {
    try {
      if (!req.admin) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }

      const { id } = req.params;
      const data = req.body;

      const pkg = await subscriptionService.updatePackage(id, data, req.admin.id);

      res.status(200).json({
        success: true,
        data: pkg,
      } as ApiResponse);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message,
      } as ApiResponse);
    }
  },

  // Delete package
  async deletePackage(req: AuthRequest, res: Response) {
    try {
      if (!req.admin) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }

      const { id } = req.params;

      await subscriptionService.deletePackage(id, req.admin.id);

      res.status(200).json({
        success: true,
        message: 'Package deleted successfully',
      } as ApiResponse);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message,
      } as ApiResponse);
    }
  },

  // Get all public packages (for users)
  async getPublicPackages(req: AuthRequest, res: Response) {
    try {
      const packages = await subscriptionService.getAllPublicPackages();

      res.status(200).json({
        success: true,
        data: packages,
      } as ApiResponse);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message,
      } as ApiResponse);
    }
  },
};

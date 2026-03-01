import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AuthenticationError } from '../utils/errors';
import { JWTPayload, AuthRequest } from '../types';

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      throw new AuthenticationError('No token provided');
    }

    const decoded = verifyToken(token);
    
    if (decoded.type === 'user') {
      req.user = decoded;
    } else if (decoded.type === 'admin') {
      req.admin = decoded;
    } else {
      throw new AuthenticationError('Invalid token type');
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const requireUser = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'User authentication required' });
  }
  next();
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.admin) {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  next();
};

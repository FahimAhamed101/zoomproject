import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

export const generateToken = (
  payload: JWTPayload,
  expiresIn: jwt.SignOptions['expiresIn'] = '24h'
): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

export const generateEmailVerificationToken = (userId: string): string => {
  return jwt.sign({ userId, type: 'email-verification' }, JWT_SECRET, { expiresIn: '24h' });
};

export const generatePasswordResetToken = (userId: string): string => {
  return jwt.sign({ userId, type: 'password-reset' }, JWT_SECRET, { expiresIn: '1h' });
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export const verifyEmailToken = (token: string): { userId: string } => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.type !== 'email-verification') {
      throw new Error('Invalid token type');
    }
    return { userId: decoded.userId };
  } catch (error) {
    throw new Error('Invalid email verification token');
  }
};

export const verifyPasswordResetToken = (token: string): { userId: string } => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.type !== 'password-reset') {
      throw new Error('Invalid token type');
    }
    return { userId: decoded.userId };
  } catch (error) {
    throw new Error('Invalid password reset token');
  }
};

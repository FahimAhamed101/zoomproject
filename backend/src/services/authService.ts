import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import {
  ValidationError,
  ConflictError,
  NotFoundError,
  AuthenticationError,
} from '../utils/errors';
import {
  generateToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  verifyEmailToken,
  verifyPasswordResetToken,
} from '../utils/jwt';
import { sendEmailVerificationEmail, sendPasswordResetEmail } from '../utils/email';

const prisma = new PrismaClient();

export const authService = {

  async registerUser(email: string, password: string, firstName?: string, lastName?: string) {

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    
    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      throw new ValidationError(
        'Password must contain uppercase letters, lowercase letters, and numbers'
      );
    }

  
    const hashedPassword = await bcryptjs.hash(password, 10);


    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
      },
    });

    const emailVerificationToken = generateEmailVerificationToken(user.id);
    const emailVerificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken,
        emailVerificationTokenExpiry,
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationLink = `${frontendUrl}/verify-email?token=${encodeURIComponent(
      emailVerificationToken
    )}`;
    await sendEmailVerificationEmail(email, verificationLink);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  },


  async loginUser(email: string, password: string) {
 
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

   
    const isPasswordValid = await bcryptjs.compare(password, user.password);

    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password');
    }


    const token = generateToken(
      {
        id: user.id,
        email: user.email,
        type: 'user',
      },
      '7d'
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified,
      },
    };
  },

  
  async verifyEmail(token: string) {
    try {
      const { userId } = verifyEmailToken(token);

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundError('User');
      }

      if (user.emailVerified) {
        return { success: true, message: 'Email already verified' };
      }

      if (!user.emailVerificationToken || user.emailVerificationToken !== token) {
        throw new ValidationError('Invalid email verification token');
      }

      if (
        user.emailVerificationTokenExpiry &&
        new Date() > user.emailVerificationTokenExpiry
      ) {
        throw new ValidationError('Email verification token has expired');
      }

      // Update user as verified
      await prisma.user.update({
        where: { id: userId },
        data: {
          emailVerified: true,
          emailVerificationToken: null,
          emailVerificationTokenExpiry: null,
        },
      });

      return { success: true, message: 'Email verified successfully' };
    } catch (error) {
      throw new ValidationError('Invalid email verification token');
    }
  },


  async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
    
      return { success: true, message: 'If email exists, reset link sent' };
    }

    const resetToken = generatePasswordResetToken(user.id);


    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetTokenExpiry: new Date(Date.now() + 3600000), // 1 hour
      },
    });


    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
    await sendPasswordResetEmail(email, resetLink);

    return { success: true, message: 'If email exists, reset link sent' };
  },


  async resetPassword(token: string, newPassword: string) {
    try {
      const { userId } = verifyPasswordResetToken(token);

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundError('User');
      }

    
      if (user.passwordResetToken !== token || !user.passwordResetTokenExpiry) {
        throw new ValidationError('Invalid password reset token');
      }

      if (new Date() > user.passwordResetTokenExpiry) {
        throw new ValidationError('Password reset token has expired');
      }

     
      if (newPassword.length < 8) {
        throw new ValidationError('Password must be at least 8 characters long');
      }

     
      const hashedPassword = await bcryptjs.hash(newPassword, 10);

   
      await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetTokenExpiry: null,
        },
      });

      return { success: true, message: 'Password reset successfully' };
    } catch (error) {
      throw new ValidationError('Invalid password reset token');
    }
  },

  
  async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        emailVerified: true,
        createdAt: true,
        currentSubscription: {
          include: { package: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  },


  async updateUserProfile(userId: string, data: any) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName || user.firstName,
        lastName: data.lastName || user.lastName,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        emailVerified: true,
      },
    });

    return updated;
  },
};

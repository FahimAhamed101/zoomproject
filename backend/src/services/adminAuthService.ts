import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../utils/errors';
import { generateToken } from '../utils/jwt';

const prisma = new PrismaClient();

export const adminAuthService = {
  // Admin login
  async adminLogin(email: string, password: string) {
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Find admin
    const admin = await prisma.admin.findUnique({
      where: { email: normalizedEmail },
    });

    if (!admin) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcryptjs.compare(password, admin.password);

    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Generate token
    const token = generateToken(
      {
        id: admin.id,
        email: admin.email,
        type: 'admin',
      },
      '7d'
    );

    return {
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        role: 'admin',
      },
      user: {
        id: admin.id,
        email: admin.email,
        role: 'admin',
      },
    };
  },

  // Admin registration
  async registerAdmin(email: string, password: string) {
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      throw new ValidationError('Email and password are required');
    }

    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingAdmin) {
      throw new ConflictError('Admin with this email already exists');
    }

    // Prevent the same email from being both a regular user and an admin
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictError('This email is already used by a regular user');
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create admin
    const admin = await prisma.admin.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
      },
    });

    // Generate token
    const token = generateToken(
      {
        id: admin.id,
        email: admin.email,
        type: 'admin',
      },
      '7d'
    );

    return {
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        role: 'admin',
      },
      user: {
        id: admin.id,
        email: admin.email,
        role: 'admin',
      },
    };
  },

  // Get admin profile
  async getAdminProfile(adminId: string) {
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    if (!admin) {
      throw new NotFoundError('Admin');
    }

    return admin;
  },
};

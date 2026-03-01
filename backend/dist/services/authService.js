"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const errors_1 = require("../utils/errors");
const jwt_1 = require("../utils/jwt");
const email_1 = require("../utils/email");
const prisma = new client_1.PrismaClient();
exports.authService = {
    async registerUser(email, password, firstName, lastName) {
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            throw new errors_1.ConflictError('User with this email already exists');
        }
        if (password.length < 8) {
            throw new errors_1.ValidationError('Password must be at least 8 characters long');
        }
        if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
            throw new errors_1.ValidationError('Password must contain uppercase letters, lowercase letters, and numbers');
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
            },
        });
        const emailVerificationToken = (0, jwt_1.generateEmailVerificationToken)(user.id);
        const emailVerificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerificationToken,
                emailVerificationTokenExpiry,
            },
        });
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const verificationLink = `${frontendUrl}/verify-email?token=${encodeURIComponent(emailVerificationToken)}`;
        await (0, email_1.sendEmailVerificationEmail)(email, verificationLink);
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
        };
    },
    async loginUser(email, password) {
        const user = await prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            throw new errors_1.AuthenticationError('Invalid email or password');
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            throw new errors_1.AuthenticationError('Invalid email or password');
        }
        const token = (0, jwt_1.generateToken)({
            id: user.id,
            email: user.email,
            type: 'user',
        }, '7d');
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
    async verifyEmail(token) {
        try {
            const { userId } = (0, jwt_1.verifyEmailToken)(token);
            const user = await prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                throw new errors_1.NotFoundError('User');
            }
            if (user.emailVerified) {
                return { success: true, message: 'Email already verified' };
            }
            if (!user.emailVerificationToken || user.emailVerificationToken !== token) {
                throw new errors_1.ValidationError('Invalid email verification token');
            }
            if (user.emailVerificationTokenExpiry &&
                new Date() > user.emailVerificationTokenExpiry) {
                throw new errors_1.ValidationError('Email verification token has expired');
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
        }
        catch (error) {
            throw new errors_1.ValidationError('Invalid email verification token');
        }
    },
    async requestPasswordReset(email) {
        const user = await prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            return { success: true, message: 'If email exists, reset link sent' };
        }
        const resetToken = (0, jwt_1.generatePasswordResetToken)(user.id);
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordResetToken: resetToken,
                passwordResetTokenExpiry: new Date(Date.now() + 3600000), // 1 hour
            },
        });
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const resetLink = `${frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
        await (0, email_1.sendPasswordResetEmail)(email, resetLink);
        return { success: true, message: 'If email exists, reset link sent' };
    },
    async resetPassword(token, newPassword) {
        try {
            const { userId } = (0, jwt_1.verifyPasswordResetToken)(token);
            const user = await prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                throw new errors_1.NotFoundError('User');
            }
            if (user.passwordResetToken !== token || !user.passwordResetTokenExpiry) {
                throw new errors_1.ValidationError('Invalid password reset token');
            }
            if (new Date() > user.passwordResetTokenExpiry) {
                throw new errors_1.ValidationError('Password reset token has expired');
            }
            if (newPassword.length < 8) {
                throw new errors_1.ValidationError('Password must be at least 8 characters long');
            }
            const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
            await prisma.user.update({
                where: { id: userId },
                data: {
                    password: hashedPassword,
                    passwordResetToken: null,
                    passwordResetTokenExpiry: null,
                },
            });
            return { success: true, message: 'Password reset successfully' };
        }
        catch (error) {
            throw new errors_1.ValidationError('Invalid password reset token');
        }
    },
    async getUserProfile(userId) {
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
            throw new errors_1.NotFoundError('User');
        }
        return user;
    },
    async updateUserProfile(userId, data) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new errors_1.NotFoundError('User');
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

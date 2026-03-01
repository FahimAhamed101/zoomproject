"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuthService = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const errors_1 = require("../utils/errors");
const jwt_1 = require("../utils/jwt");
const prisma = new client_1.PrismaClient();
exports.adminAuthService = {
    // Admin login
    async adminLogin(email, password) {
        const normalizedEmail = email?.trim().toLowerCase();
        if (!normalizedEmail || !password) {
            throw new errors_1.AuthenticationError('Invalid email or password');
        }
        // Find admin
        const admin = await prisma.admin.findUnique({
            where: { email: normalizedEmail },
        });
        if (!admin) {
            throw new errors_1.AuthenticationError('Invalid email or password');
        }
        // Verify password
        const isPasswordValid = await bcryptjs_1.default.compare(password, admin.password);
        if (!isPasswordValid) {
            throw new errors_1.AuthenticationError('Invalid email or password');
        }
        // Generate token
        const token = (0, jwt_1.generateToken)({
            id: admin.id,
            email: admin.email,
            type: 'admin',
        }, '7d');
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
    async registerAdmin(email, password) {
        const normalizedEmail = email?.trim().toLowerCase();
        if (!normalizedEmail || !password) {
            throw new errors_1.ValidationError('Email and password are required');
        }
        if (password.length < 8) {
            throw new errors_1.ValidationError('Password must be at least 8 characters long');
        }
        // Check if admin already exists
        const existingAdmin = await prisma.admin.findUnique({
            where: { email: normalizedEmail },
        });
        if (existingAdmin) {
            throw new errors_1.ConflictError('Admin with this email already exists');
        }
        // Prevent the same email from being both a regular user and an admin
        const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (existingUser) {
            throw new errors_1.ConflictError('This email is already used by a regular user');
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Create admin
        const admin = await prisma.admin.create({
            data: {
                email: normalizedEmail,
                password: hashedPassword,
            },
        });
        // Generate token
        const token = (0, jwt_1.generateToken)({
            id: admin.id,
            email: admin.email,
            type: 'admin',
        }, '7d');
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
    async getAdminProfile(adminId) {
        const admin = await prisma.admin.findUnique({
            where: { id: adminId },
            select: {
                id: true,
                email: true,
                createdAt: true,
            },
        });
        if (!admin) {
            throw new errors_1.NotFoundError('Admin');
        }
        return admin;
    },
};

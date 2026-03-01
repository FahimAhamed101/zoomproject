"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const authService_1 = require("../services/authService");
exports.authController = {
    // Register
    async register(req, res) {
        try {
            const { email, password, firstName, lastName } = req.body;
            const user = await authService_1.authService.registerUser(email, password, firstName, lastName);
            res.status(201).json({
                success: true,
                message: 'User registered successfully. Please verify your email.',
                data: user,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    },
    // Login
    async login(req, res) {
        try {
            const { email, password } = req.body;
            const result = await authService_1.authService.loginUser(email, password);
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            res.status(401).json({
                success: false,
                error: error.message,
            });
        }
    },
    // Verify email
    async verifyEmail(req, res) {
        try {
            const token = (req.body?.token || req.query?.token);
            if (!token) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid verification token',
                });
            }
            const result = await authService_1.authService.verifyEmail(token);
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    },
    // Request password reset
    async requestPasswordReset(req, res) {
        try {
            const { email } = req.body;
            const result = await authService_1.authService.requestPasswordReset(email);
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    },
    // Reset password
    async resetPassword(req, res) {
        try {
            const { token, newPassword } = req.body;
            const result = await authService_1.authService.resetPassword(token, newPassword);
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    },
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionController = exports.adminAuthController = void 0;
const adminAuthService_1 = require("../services/adminAuthService");
const subscriptionService_1 = require("../services/subscriptionService");
exports.adminAuthController = {
    // Admin registration
    async register(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Email and password are required',
                });
            }
            const result = await adminAuthService_1.adminAuthService.registerAdmin(email, password);
            res.status(201).json({
                success: true,
                data: result,
                message: 'Admin registered successfully',
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    },
    // Admin login
    async login(req, res) {
        try {
            const { email, password } = req.body;
            const result = await adminAuthService_1.adminAuthService.adminLogin(email, password);
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
    // Get admin profile
    async getProfile(req, res) {
        try {
            if (!req.admin) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }
            const admin = await adminAuthService_1.adminAuthService.getAdminProfile(req.admin.id);
            res.status(200).json({
                success: true,
                data: admin,
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
exports.subscriptionController = {
    // Get all packages
    async getAllPackages(req, res) {
        try {
            if (!req.admin) {
                return res.status(403).json({ success: false, error: 'Forbidden' });
            }
            const packages = await subscriptionService_1.subscriptionService.getAllPackages(req.admin.id);
            res.status(200).json({
                success: true,
                data: packages,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    },
    // Create package
    async createPackage(req, res) {
        try {
            if (!req.admin) {
                return res.status(403).json({ success: false, error: 'Forbidden' });
            }
            const data = req.body;
            const pkg = await subscriptionService_1.subscriptionService.createPackage(data, req.admin.id);
            res.status(201).json({
                success: true,
                data: pkg,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    },
    // Update package
    async updatePackage(req, res) {
        try {
            if (!req.admin) {
                return res.status(403).json({ success: false, error: 'Forbidden' });
            }
            const { id } = req.params;
            const data = req.body;
            const pkg = await subscriptionService_1.subscriptionService.updatePackage(id, data, req.admin.id);
            res.status(200).json({
                success: true,
                data: pkg,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    },
    // Delete package
    async deletePackage(req, res) {
        try {
            if (!req.admin) {
                return res.status(403).json({ success: false, error: 'Forbidden' });
            }
            const { id } = req.params;
            await subscriptionService_1.subscriptionService.deletePackage(id, req.admin.id);
            res.status(200).json({
                success: true,
                message: 'Package deleted successfully',
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    },
    // Get all public packages (for users)
    async getPublicPackages(req, res) {
        try {
            const packages = await subscriptionService_1.subscriptionService.getAllPublicPackages();
            res.status(200).json({
                success: true,
                data: packages,
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

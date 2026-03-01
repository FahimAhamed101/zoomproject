"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const subscriptionController_1 = require("../controllers/subscriptionController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Admin authentication
router.post('/register', subscriptionController_1.adminAuthController.register);
// Backward compatibility for clients calling the misspelled endpoint.
router.post('/regsiter', subscriptionController_1.adminAuthController.register);
router.post('/login', subscriptionController_1.adminAuthController.login);
router.get('/profile', auth_1.authMiddleware, auth_1.requireAdmin, subscriptionController_1.adminAuthController.getProfile);
// Subscription packages management (admin only)
router.get('/packages', auth_1.authMiddleware, auth_1.requireAdmin, subscriptionController_1.subscriptionController.getAllPackages);
router.post('/packages', auth_1.authMiddleware, auth_1.requireAdmin, subscriptionController_1.subscriptionController.createPackage);
router.put('/packages/:id', auth_1.authMiddleware, auth_1.requireAdmin, subscriptionController_1.subscriptionController.updatePackage);
router.delete('/packages/:id', auth_1.authMiddleware, auth_1.requireAdmin, subscriptionController_1.subscriptionController.deletePackage);
// Get public packages (for users)
router.get('/public-packages', subscriptionController_1.subscriptionController.getPublicPackages);
exports.default = router;

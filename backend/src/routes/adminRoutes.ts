import { Router } from 'express';
import { adminAuthController, subscriptionController } from '../controllers/subscriptionController';
import { authMiddleware, requireAdmin } from '../middleware/auth';

const router = Router();

// Admin authentication
router.post('/register', adminAuthController.register);
// Backward compatibility for clients calling the misspelled endpoint.
router.post('/regsiter', adminAuthController.register);
router.post('/login', adminAuthController.login);
router.get('/profile', authMiddleware, requireAdmin, adminAuthController.getProfile);

// Subscription packages management (admin only)
router.get('/packages', authMiddleware, requireAdmin, subscriptionController.getAllPackages);
router.post('/packages', authMiddleware, requireAdmin, subscriptionController.createPackage);
router.put('/packages/:id', authMiddleware, requireAdmin, subscriptionController.updatePackage);
router.delete('/packages/:id', authMiddleware, requireAdmin, subscriptionController.deletePackage);

// Get public packages (for users)
router.get('/public-packages', subscriptionController.getPublicPackages);

export default router;

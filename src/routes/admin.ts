import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as adminController from '../controllers/adminController';

const router = Router();

// All admin routes require enterprise tier or admin role
router.use(authenticate);
router.use(authorize('enterprise', 'done-for-you'));

router.get('/users', adminController.getAllUsers);
router.get('/stats', adminController.getPlatformStats);
router.get('/activity', adminController.getRecentActivity);
router.patch('/users/:userId/tier', adminController.updateUserTier);
router.post('/users/:userId/suspend', adminController.suspendUser);

export default router;

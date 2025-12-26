import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as authController from '../controllers/authController';
import * as contentController from '../controllers/contentController';
import * as voiceController from '../controllers/voiceController';
import * as schedulerController from '../controllers/schedulerController';
import adminRoutes from './admin';
import paymentRoutes from './payment';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/profile', authenticate, authController.getProfile);

// Content routes
router.post('/content/generate', authenticate, contentController.generateContent);
router.get('/content', authenticate, contentController.listContent);
router.get('/content/:id', authenticate, contentController.getContent);
router.patch('/content/:id/status', authenticate, contentController.updateContentStatus);
router.delete('/content/:id', authenticate, contentController.deleteContent);

// Trends and ideas
router.get('/trends', authenticate, contentController.getTrends);
router.get('/content/ideas', authenticate, contentController.getContentIdeas);

// Voice profile routes
router.post('/voice/analyze', authenticate, voiceController.analyzeVoice);
router.get('/voice/profile', authenticate, voiceController.getVoiceProfile);
router.put('/voice/profile', authenticate, voiceController.updateVoiceProfile);
router.get('/voice/suggestions', authenticate, voiceController.getVoiceSuggestions);

// Scheduler routes
router.post('/schedule', authenticate, schedulerController.schedulePost);
router.get('/schedule', authenticate, schedulerController.getScheduledPosts);
router.delete('/schedule/:id', authenticate, schedulerController.cancelScheduledPost);
router.patch('/schedule/:id', authenticate, schedulerController.reschedulePost);

// Admin routes
router.use('/admin', adminRoutes);

// Payment routes
router.use('/payment', paymentRoutes);

export default router;

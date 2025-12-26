import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as paymentController from '../controllers/paymentController';

const router = Router();

router.post('/checkout', authenticate, paymentController.createCheckoutSession);
router.post('/cancel', authenticate, paymentController.cancelSubscription);
router.post('/webhook', paymentController.handleWebhook);

export default router;

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { StripeService } from '../services/payment/StripeService';
import Stripe from 'stripe';
import logger from '../config/logger';

export const createCheckoutSession = async (req: AuthRequest, res: Response) => {
  try {
    const { tier } = req.body;

    const successUrl = `${process.env.FRONTEND_URL}/dashboard?payment=success`;
    const cancelUrl = `${process.env.FRONTEND_URL}/pricing?payment=cancelled`;

    const checkoutUrl = await StripeService.createCheckoutSession(
      req.user!.id,
      tier,
      successUrl,
      cancelUrl
    );

    res.json({ url: checkoutUrl });
  } catch (error: any) {
    logger.error('Create checkout session error', { error: error.message });
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
};

export const handleWebhook = async (req: any, res: Response) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2024-11-20.acacia',
    });

    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret!);

    await StripeService.handleWebhook(event);

    res.json({ received: true });
  } catch (error: any) {
    logger.error('Webhook error', { error: error.message });
    res.status(400).json({ error: 'Webhook error' });
  }
};

export const cancelSubscription = async (req: AuthRequest, res: Response) => {
  try {
    await StripeService.cancelSubscription(req.user!.id);

    res.json({ message: 'Subscription cancelled' });
  } catch (error: any) {
    logger.error('Cancel subscription error', { error: error.message });
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

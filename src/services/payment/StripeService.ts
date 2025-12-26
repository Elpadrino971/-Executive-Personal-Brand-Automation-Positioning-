import Stripe from 'stripe';
import { query } from '../../config/database';
import logger from '../../config/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

export class StripeService {
  /**
   * Create a new customer
   */
  static async createCustomer(userId: number, email: string, name: string): Promise<string> {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: { userId: userId.toString() },
    });

    await query(
      'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
      [customer.id, userId]
    );

    logger.info('Stripe customer created', { userId, customerId: customer.id });
    return customer.id;
  }

  /**
   * Create a checkout session for subscription
   */
  static async createCheckoutSession(
    userId: number,
    tier: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<string> {
    const priceIds = {
      starter: process.env.STRIPE_PRICE_STARTER,
      professional: process.env.STRIPE_PRICE_PROFESSIONAL,
      enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
    };

    const priceId = priceIds[tier as keyof typeof priceIds];
    if (!priceId) {
      throw new Error('Invalid tier');
    }

    const user = await query('SELECT email, stripe_customer_id FROM users WHERE id = $1', [userId]);
    if (!user.rows[0]) {
      throw new Error('User not found');
    }

    let customerId = user.rows[0].stripe_customer_id;
    if (!customerId) {
      customerId = await this.createCustomer(userId, user.rows[0].email, '');
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId: userId.toString(), tier },
    });

    return session.url!;
  }

  /**
   * Handle webhook events
   */
  static async handleWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
    }
  }

  private static async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = parseInt(session.metadata?.userId || '0');
    const tier = session.metadata?.tier;

    if (!userId || !tier) return;

    await query(
      `INSERT INTO subscriptions (user_id, tier, price_cents, posts_limit, start_date, end_date, is_active)
       VALUES ($1, $2, $3, $4, NOW(), NOW() + INTERVAL '1 month', true)
       ON CONFLICT (user_id)
       DO UPDATE SET tier = $2, is_active = true, start_date = NOW(), end_date = NOW() + INTERVAL '1 month'`,
      [userId, tier, session.amount_total, this.getPostsLimit(tier)]
    );

    await query('UPDATE users SET tier = $1, status = $2 WHERE id = $3', [tier, 'active', userId]);

    logger.info('Subscription activated', { userId, tier });
  }

  private static async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;
    const user = await query('SELECT id FROM users WHERE stripe_customer_id = $1', [customerId]);

    if (user.rows[0]) {
      const status = subscription.status === 'active' ? 'active' : 'inactive';
      await query('UPDATE users SET status = $1 WHERE id = $2', [status, user.rows[0].id]);
    }
  }

  private static async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;
    const user = await query('SELECT id FROM users WHERE stripe_customer_id = $1', [customerId]);

    if (user.rows[0]) {
      await query(
        'UPDATE users SET status = $1, tier = $2 WHERE id = $3',
        ['inactive', 'starter', user.rows[0].id]
      );
      await query('UPDATE subscriptions SET is_active = false WHERE user_id = $1', [user.rows[0].id]);
    }
  }

  private static async handlePaymentFailed(invoice: Stripe.Invoice) {
    logger.error('Payment failed', { invoiceId: invoice.id, customerId: invoice.customer });
    // TODO: Send email notification
  }

  private static getPostsLimit(tier: string): number {
    const limits: any = {
      starter: 20,
      professional: 50,
      enterprise: 150,
    };
    return limits[tier] || 20;
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(userId: number): Promise<void> {
    const user = await query('SELECT stripe_customer_id FROM users WHERE id = $1', [userId]);
    if (!user.rows[0]?.stripe_customer_id) return;

    const subscriptions = await stripe.subscriptions.list({
      customer: user.rows[0].stripe_customer_id,
      status: 'active',
    });

    for (const subscription of subscriptions.data) {
      await stripe.subscriptions.cancel(subscription.id);
    }

    logger.info('Subscription cancelled', { userId });
  }
}

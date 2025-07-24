import Stripe from 'stripe';

// Use test mode if STRIPE_TEST_MODE is set to 'true'
const isTestMode = process.env.STRIPE_TEST_MODE === 'true';
const stripeKey = isTestMode ? process.env.STRIPE_TEST_SECRET_KEY : process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeKey);

console.log(`🔧 Cancel Subscription Mode: ${isTestMode ? 'TEST' : 'LIVE'}`);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { subscriptionId } = req.body;

  if (!subscriptionId) {
    return res.status(400).json({ error: 'Missing subscription ID' });
  }

  try {
    // Cancel the subscription at the end of the current period
    const canceledSubscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    res.json({ success: true, subscription: canceledSubscription });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
} 
import Stripe from 'stripe';

// Use test mode if STRIPE_TEST_MODE is set to 'true'
const isTestMode = process.env.STRIPE_TEST_MODE === 'true';
const stripeKey = isTestMode ? process.env.STRIPE_TEST_SECRET_KEY : process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeKey);

console.log(`🔧 Cancel Subscription Mode: ${isTestMode ? 'TEST' : 'LIVE'}`);

export default async function handler(req, res) {
  console.log('🔔 Cancel subscription webhook received:', req.method);
  
  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { subscriptionId } = req.body;
  console.log('📋 Cancel request body:', req.body);

  if (!subscriptionId) {
    console.log('❌ Missing subscription ID');
    return res.status(400).json({ error: 'Missing subscription ID' });
  }

  try {
    console.log(`🔄 Canceling subscription: ${subscriptionId}`);
    
    // Cancel the subscription at the end of the current period
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    console.log(`✅ Subscription ${subscriptionId} will be canceled at period end`);
    console.log('📋 Updated subscription:', {
      id: subscription.id,
      status: subscription.status,
      cancel_at_period_end: subscription.cancel_at_period_end,
      current_period_end: subscription.current_period_end
    });

    res.json({ 
      success: true, 
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end,
        current_period_end: subscription.current_period_end
      }
    });
  } catch (error) {
    console.error('❌ Error canceling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription', details: error.message });
  }
} 
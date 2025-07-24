import Stripe from 'stripe';

// Use test mode if STRIPE_TEST_MODE is set to 'true'
const isTestMode = process.env.STRIPE_TEST_MODE === 'true';
const stripeKey = isTestMode ? process.env.STRIPE_TEST_SECRET_KEY : process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeKey);

console.log(`🔧 Get Subscription Mode: ${isTestMode ? 'TEST' : 'LIVE'}`);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { customer, subscription } = req.query;

  if (!customer || !subscription) {
    return res.status(400).json({ error: 'Missing customer or subscription ID' });
  }

  try {
    // Fetch the subscription details
    const subscriptionData = await stripe.subscriptions.retrieve(subscription);
    
    // Verify the customer matches
    if (subscriptionData.customer !== customer) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(subscriptionData);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
} 
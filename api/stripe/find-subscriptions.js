import Stripe from 'stripe';

// Use test mode if STRIPE_TEST_MODE is set to 'true'
const isTestMode = process.env.STRIPE_TEST_MODE === 'true';
const stripeKey = isTestMode ? process.env.STRIPE_TEST_SECRET_KEY : process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeKey);

console.log(`🔧 Find Subscriptions Mode: ${isTestMode ? 'TEST' : 'LIVE'}`);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // First, find customers with this email
    const customers = await stripe.customers.list({
      email: email,
      limit: 10,
    });

    if (customers.data.length === 0) {
      return res.json({ subscriptions: [] });
    }

    // Get subscriptions for all customers with this email
    const allSubscriptions = [];
    
    for (const customer of customers.data) {
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        limit: 100,
      });
      
      // Add customer email to each subscription for display
      const subscriptionsWithEmail = subscriptions.data.map(sub => ({
        ...sub,
        customer_email: customer.email,
      }));
      
      allSubscriptions.push(...subscriptionsWithEmail);
    }

    // Filter to only show active or recently canceled subscriptions
    const relevantSubscriptions = allSubscriptions.filter(sub => 
      sub.status === 'active' || 
      sub.status === 'canceled' || 
      sub.status === 'past_due'
    );

    console.log(`Found ${relevantSubscriptions.length} subscriptions for email: ${email}`);
    
    // Log subscription details for debugging
    relevantSubscriptions.forEach((sub, index) => {
      console.log(`Subscription ${index + 1}:`, {
        id: sub.id,
        status: sub.status,
        amount: sub.items?.data?.[0]?.price?.unit_amount,
        interval: sub.items?.data?.[0]?.price?.recurring?.interval,
        current_period_end: sub.current_period_end
      });
    });

    res.json({ 
      subscriptions: relevantSubscriptions,
      total_customers: customers.data.length
    });
  } catch (error) {
    console.error('Error finding subscriptions:', error);
    res.status(500).json({ error: 'Failed to find subscriptions' });
  }
} 
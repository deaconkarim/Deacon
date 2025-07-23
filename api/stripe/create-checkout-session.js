import Stripe from 'stripe';
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { organization_id, amount, donor_email, fund_designation, campaign_id } = req.body;
  
  // Validate required fields
  if (!organization_id || !amount || !donor_email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Validate amount
  if (amount < 50) { // Minimum $0.50
    return res.status(400).json({ error: 'Amount must be at least $0.50' });
  }

  try {
    // Look up the church's Stripe account
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('stripe_account_id, name')
      .eq('id', organization_id)
      .single();
    
    if (orgError) {
      console.error('Supabase error:', orgError);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!org?.stripe_account_id) {
      return res.status(400).json({ error: 'Church is not onboarded with Stripe Connect' });
    }

    // Optionally set a platform fee (e.g., 2.9% + 30c)
    const application_fee_amount = Math.round(amount * 0.029 + 30); // in cents

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Donation to ${org.name}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: donor_email,
      metadata: {
        organization_id,
        fund_designation: fund_designation || '',
        campaign_id: campaign_id || '',
      },
      success_url: `${req.headers.origin || 'https://getdeacon.com'}/donate/success`,
      cancel_url: `${req.headers.origin || 'https://getdeacon.com'}/donate/cancel`,
      payment_intent_data: {
        application_fee_amount,
        transfer_data: {
          destination: org.stripe_account_id,
        },
        metadata: {
          organization_id,
          fund_designation: fund_designation || '',
          campaign_id: campaign_id || '',
        },
      },
    }, {
      stripeAccount: org.stripe_account_id,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ 
      error: 'An error occurred with our connection to Stripe. Request was retried 2 times.',
      details: err.message 
    });
  }
};
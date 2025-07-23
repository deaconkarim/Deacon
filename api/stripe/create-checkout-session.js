import Stripe from 'stripe';
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async (req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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

  let mainAccount = null;
  let org = null;

  try {
    // Look up the church's Stripe account from the organizations table
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('stripe_account_id, name')
      .eq('id', organization_id)
      .single();
    
    if (orgError) {
      console.error('Supabase error:', orgError);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!orgData?.stripe_account_id) {
      return res.status(400).json({ error: 'Church is not onboarded with Stripe Connect' });
    }

    org = orgData;
    console.log(`Creating checkout session for church: ${org.name} (${org.stripe_account_id})`);

    // Get the main Stripe account ID to check if it's the same as the church's account
    mainAccount = await stripe.accounts.retrieve();
    const isSameAccount = mainAccount.id === org.stripe_account_id;

    console.log(`Main account: ${mainAccount.id}, Church account: ${org.stripe_account_id}, Same account: ${isSameAccount}`);

    // Build the session creation object
    const sessionData = {
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
    };

    // For Stripe Connect, we need to be more careful about transfer_data
    // Only add transfer_data if we're sure the accounts are different AND the church account is a connected account
    if (!isSameAccount) {
      // Double-check that the church account is actually a connected account
      try {
        const churchAccount = await stripe.accounts.retrieve(org.stripe_account_id);
        console.log(`Church account type: ${churchAccount.type}, charges_enabled: ${churchAccount.charges_enabled}`);
        
        if (churchAccount.type === 'express' || churchAccount.type === 'standard') {
          const application_fee_amount = Math.round(amount * 0.029 + 30); // in cents
          sessionData.payment_intent_data = {
            application_fee_amount,
            transfer_data: {
              destination: org.stripe_account_id,
            },
            metadata: {
              organization_id,
              fund_designation: fund_designation || '',
              campaign_id: campaign_id || '',
            },
          };
          console.log(`Will transfer ${amount} cents to church account: ${org.stripe_account_id}`);
        } else {
          console.log(`Church account is not a connected account type, skipping transfer_data`);
        }
      } catch (accountError) {
        console.log(`Could not retrieve church account details, skipping transfer_data:`, accountError.message);
      }
    } else {
      console.log(`Donation will go directly to main account (no transfer needed)`);
    }

    // Create the checkout session from the MAIN account (not the church account)
    // This way we can transfer TO the church account
    const session = await stripe.checkout.sessions.create(sessionData);

    console.log(`Checkout session created: ${session.id}`);
    
    // Return detailed response for debugging
    return res.json({ 
      url: session.url,
      debug: {
        main_account_id: mainAccount.id,
        church_account_id: org.stripe_account_id,
        is_same_account: isSameAccount,
        has_transfer_data: !!sessionData.payment_intent_data,
        session_id: session.id,
        organization_name: org.name
      }
    });
  } catch (err) {
    console.error('Stripe error:', err);
    
    // Ensure we always return valid JSON
    return res.status(500).json({ 
      error: 'An error occurred with our connection to Stripe. Request was retried 2 times.',
      details: err.message,
      debug: {
        main_account_id: mainAccount?.id || 'unknown',
        church_account_id: org?.stripe_account_id || 'unknown',
        is_same_account: mainAccount?.id === org?.stripe_account_id,
        organization_name: org?.name || 'unknown'
      }
    });
  }
};
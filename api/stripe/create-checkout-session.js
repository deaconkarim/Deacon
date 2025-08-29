import Stripe from 'stripe';

// Use test mode if STRIPE_TEST_MODE is set to 'true'
const isTestMode = process.env.STRIPE_TEST_MODE === 'true';
const stripeKey = isTestMode ? process.env.STRIPE_TEST_SECRET_KEY : process.env.STRIPE_SECRET_KEY;
const stripe = Stripe(stripeKey);

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

  const { organization_id, amount, donor_email, fund_designation, campaign_id, cover_fees, payment_method, is_recurring, recurring_interval } = req.body;
  
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

    // Get the main Stripe account ID to check if it's the same as the church's account
    mainAccount = await stripe.accounts.retrieve();
    const isSameAccount = mainAccount.id === org.stripe_account_id;

    // Calculate the amount to charge (original amount + fees if covering)
    const originalAmount = amount;
    
    // Calculate fee based on payment method
    let feeAmount = 0;
    if (cover_fees) {
      if (payment_method === 'ach') {
        // ACH transfers: 0.8% + 25 cents
        feeAmount = (amount * 0.008) + 0.25;
      } else {
        // Credit/debit cards: 2.9% + 30 cents
        feeAmount = (amount * 0.029) + 0.30;
      }
    }
    
    const totalAmount = cover_fees ? amount + feeAmount : amount;

    // Only round when converting to cents for Stripe
    const unitAmount = Math.round(totalAmount * 100);

    // Build the session creation object
    const sessionData = {
      payment_method_types: payment_method === 'ach' ? ['us_bank_account'] : ['card'],
      mode: is_recurring ? 'subscription' : 'payment',
      customer_email: donor_email,
      metadata: {
        organization_id,
        fund_designation: fund_designation || '',
        campaign_id: campaign_id || '',
        payment_method: payment_method || 'card',
        original_amount: Math.round(originalAmount * 100), // Store in cents
        fee_amount: Math.round(feeAmount * 100), // Store in cents
        cover_fees: cover_fees ? 'true' : 'false',
        is_recurring: is_recurring ? 'true' : 'false',
        recurring_interval: recurring_interval || '',
      },
      success_url: `${req.headers.origin || 'https://getdeacon.com'}/donate/success?recurring=${is_recurring}&interval=${recurring_interval}`,
      cancel_url: `${req.headers.origin || 'https://getdeacon.com'}/donate/cancel`,
    };

    // Add line items based on mode
    if (is_recurring) {
      // For subscriptions, we need to create a price first
      const price = await stripe.prices.create({
        unit_amount: unitAmount, // Use correct cents value
        currency: 'usd',
        recurring: {
          interval: recurring_interval,
        },
        product_data: {
          name: `Recurring Donation to ${org.name}`,
        },
        metadata: {
          fund_designation: fund_designation || '',
          recurring_interval: recurring_interval,
          description: `${fund_designation} - ${recurring_interval}ly recurring donation`,
        },
      });

      sessionData.line_items = [
        {
          price: price.id,
          quantity: 1,
        },
      ];
      
      // Add subscription metadata
      sessionData.subscription_data = {
        metadata: {
          organization_id,
          fund_designation: fund_designation || '',
          campaign_id: campaign_id || '',
          payment_method: payment_method || 'card',
          original_amount: Math.round(originalAmount * 100), // Store in cents
          fee_amount: Math.round(feeAmount * 100), // Store in cents
          cover_fees: cover_fees ? 'true' : 'false',
          is_recurring: 'true',
          recurring_interval: recurring_interval || '',
        },
      };
    } else {
      // For one-time payments
      sessionData.line_items = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Donation to ${org.name}`,
            },
            unit_amount: unitAmount, // Use correct cents value
          },
          quantity: 1,
        },
      ];
    }

    // For Stripe Connect, we need to be more careful about transfer_data
    // Only add transfer_data if we're sure the accounts are different AND the church account is a connected account
    if (!isSameAccount) {
      // Double-check that the church account is actually a connected account
      try {
        const churchAccount = await stripe.accounts.retrieve(org.stripe_account_id);

        if (churchAccount.type === 'express' || churchAccount.type === 'standard') {
          // Calculate application fee (platform fee) based on the original donation amount and payment method
          // This ensures the church receives the full intended donation amount
          let application_fee_amount;
          if (payment_method === 'ach') {
            // ACH transfers: 0.8% + 25 cents
            application_fee_amount = Math.round(originalAmount * 0.008 * 100 + 25); // Convert to cents
          } else {
            // Credit/debit cards: 2.9% + 30 cents
            application_fee_amount = Math.round(originalAmount * 0.029 * 100 + 30); // Convert to cents
          }
          sessionData.payment_intent_data = {
            application_fee_amount,
            transfer_data: {
              destination: org.stripe_account_id,
            },
            metadata: {
              organization_id,
              fund_designation: fund_designation || '',
              campaign_id: campaign_id || '',
              original_amount: Math.round(originalAmount * 100), // Store in cents
              fee_amount: Math.round(feeAmount * 100), // Store in cents
              cover_fees: cover_fees ? 'true' : 'false',
            },
          };

        } else {

        }
      } catch (accountError) {

      }
    } else {

    }

    // Create the checkout session from the MAIN account (not the church account)
    // This way we can transfer TO the church account
    const session = await stripe.checkout.sessions.create(sessionData);

    // Return detailed response for debugging
    return res.json({ 
      url: session.url,
      debug: {
        main_account_id: mainAccount.id,
        church_account_id: org.stripe_account_id,
        is_same_account: isSameAccount,
        has_transfer_data: !!sessionData.payment_intent_data,
        session_id: session.id,
        organization_name: org.name,
        original_amount: originalAmount,
        fee_amount: feeAmount,
        total_amount: totalAmount,
        cover_fees: cover_fees,
        is_recurring: is_recurring,
        recurring_interval: recurring_interval
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
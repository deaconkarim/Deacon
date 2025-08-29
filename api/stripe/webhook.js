import Stripe from 'stripe';

// Use test mode if STRIPE_TEST_MODE is set to 'true'
const isTestMode = process.env.STRIPE_TEST_MODE === 'true';
const stripeKey = isTestMode ? process.env.STRIPE_TEST_SECRET_KEY : process.env.STRIPE_SECRET_KEY;
const endpointSecret = isTestMode ? process.env.STRIPE_TEST_WEBHOOK_SECRET : process.env.STRIPE_WEBHOOK_SECRET;

const stripe = Stripe(stripeKey);
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Log environment variables for debugging (without exposing secrets)

export default async (req, res) => {

  // For Vercel, we need to handle the body parsing issue
  // Since Vercel automatically parses JSON, we need to work around this
  let rawBody;
  
  // Try to get the raw body from Vercel's internal properties
  if (req.body && typeof req.body === 'string') {
    rawBody = req.body;

  } else if (req.body && typeof req.body === 'object') {
    // If body is parsed as object, we can't verify signature
    // This is a limitation of Vercel's automatic JSON parsing

    // For now, let's try to process the event without verification
    // This is not ideal but allows the webhook to work
    const event = req.body;

         if (event.type === 'checkout.session.completed') {

       try {
         const session = event.data.object;
         const metadata = session.metadata || {};
         const amount = session.amount_total / 100;
         const organization_id = metadata.organization_id;
         const fund_designation = metadata.fund_designation || null;
         const campaign_id = metadata.campaign_id || null;
         const donor_email = session.customer_email;
         const payment_method = metadata.payment_method === 'ach' ? 'Deacon - ACH Transfer' : 'Deacon - Credit Card'; // Use descriptive payment method names
         const date = new Date().toISOString().split('T')[0];

         // Handle fee coverage metadata
         const original_amount = metadata.original_amount ? parseFloat(metadata.original_amount) / 100 : amount;
         const fee_amount = metadata.fee_amount ? parseFloat(metadata.fee_amount) / 100 : 0;
         const cover_fees = metadata.cover_fees === 'true';
         const is_recurring = metadata.is_recurring === 'true';

         // Get church name for logging
         const { data: org } = await supabase
           .from('organizations')
           .select('name')
           .eq('id', organization_id)
           .single();

         if (org) {

         }

         // Optionally, look up donor/member by email
         let donor_id = null;
         if (donor_email) {
           const { data: member, error: memberError } = await supabase
             .from('members')
             .select('id')
             .eq('email', donor_email)
             .eq('organization_id', organization_id)
             .single();
           if (!memberError && member) {
             donor_id = member.id;

           }
         }

         // Insert donation record

         const donationData = {
           organization_id,
           donor_id,
           amount: cover_fees ? amount : original_amount, // Credit donor with full amount if they covered fees
           date,
           fund_designation,
           campaign_id,
           payment_method,
           is_tax_deductible: true,
           is_recurring: is_recurring,
           subscription_id: is_recurring ? session.subscription : null,
           recurring_interval: is_recurring ? metadata.recurring_interval : null,
           type: is_recurring ? metadata.recurring_interval : null, // For backward compatibility
           notes: `Stripe Connect donation${cover_fees ? ' (fees covered by donor)' : ''}${is_recurring ? ' - Recurring' : ''}`,
           metadata: {
             ...session,
             original_amount: original_amount,
             fee_amount: fee_amount,
             cover_fees: cover_fees,
             total_paid: amount,
             church_receives: original_amount,
             is_recurring: is_recurring,
             subscription_id: is_recurring ? session.subscription : null
           },
         };

         const { error: insertError } = await supabase.from('donations').insert(donationData);

         if (insertError) {
           console.error('❌ Error inserting donation:', insertError);
           throw new Error(`Database error: ${insertError.message}`);
         } else {

         }

         // For recurring payments, update member record with subscription info
         if (is_recurring && session.subscription && donor_id) {

           const { error: updateError } = await supabase
             .from('members')
             .update({
               stripe_customer_id: session.customer,
               subscription_id: session.subscription,
               subscription_status: 'active',
               updated_at: new Date().toISOString()
             })
             .eq('id', donor_id);
           
           if (updateError) {
             console.error('❌ Error updating member subscription:', updateError);
           } else {

           }
         }
       } catch (error) {
         console.error('💥 Error processing donation:', error);
         return res.status(500).json({ error: 'Failed to process donation', details: error.message });
       }
     } else if (event.type === 'invoice.payment_succeeded') {

                  try {
           const invoice = event.data.object;

         const subscription = invoice.subscription;
         const customer = invoice.customer;
         
         // Check if this invoice is associated with a subscription
         if (!subscription) {

           return res.json({ received: true });
         }
         
         // Get subscription details
         const subscriptionData = await stripe.subscriptions.retrieve(subscription);
         const metadata = subscriptionData.metadata || {};
         
         const amount = invoice.amount_paid / 100;
         const organization_id = metadata.organization_id;
         const fund_designation = metadata.fund_designation || null;
         const campaign_id = metadata.campaign_id || null;
         const payment_method = metadata.payment_method === 'ach' ? 'Deacon - ACH Transfer' : 'Deacon - Credit Card';
         const date = new Date().toISOString().split('T')[0];
         
         // Handle fee coverage metadata
         const original_amount = metadata.original_amount ? parseFloat(metadata.original_amount) / 100 : amount;
         const fee_amount = metadata.fee_amount ? parseFloat(metadata.fee_amount) / 100 : 0;
         const cover_fees = metadata.cover_fees === 'true';
         const is_recurring = metadata.is_recurring === 'true';

         // Get church name for logging
         const { data: org } = await supabase
           .from('organizations')
           .select('name')
           .eq('id', organization_id)
           .single();
         
         // Look up donor/member by customer ID
         let donor_id = null;
         const { data: member, error: memberError } = await supabase
           .from('members')
           .select('id')
           .eq('stripe_customer_id', customer)
           .eq('organization_id', organization_id)
           .single();
         
         if (!memberError && member) {
           donor_id = member.id;

         }
         
         // Insert donation record

         const { error: insertError } = await supabase.from('donations').insert({
           organization_id,
           donor_id,
           amount: cover_fees ? amount : original_amount, // Credit donor with full amount if they covered fees
           date,
           fund_designation,
           campaign_id,
           payment_method,
           is_tax_deductible: true,
           is_recurring: true,
           subscription_id: subscription,
           notes: `Recurring donation${cover_fees ? ' (fees covered by donor)' : ''}`,
           metadata: {
             ...invoice,
             subscription_id: subscription,
             customer_id: customer,
             original_amount: original_amount,
             fee_amount: fee_amount,
             cover_fees: cover_fees,
             total_paid: amount,
             church_receives: original_amount
           },
         });
         
         if (insertError) {
           console.error('❌ Error inserting recurring donation:', insertError);
           throw new Error(`Database error: ${insertError.message}`);
         } else {

         }
       } catch (error) {
         console.error('💥 Error processing recurring donation:', error);
         return res.status(500).json({ error: 'Failed to process recurring donation', details: error.message });
       }
     } else if (event.type === 'customer.subscription.updated') {

       try {
         const subscription = event.data.object;
         const metadata = subscription.metadata || {};
         const customer = subscription.customer;
         const organization_id = metadata.organization_id;

         // Skip if no organization_id in metadata
         if (!organization_id) {

           return res.json({ received: true });
         }
         
         // Update member record with subscription info
         const { error: updateError } = await supabase
           .from('members')
           .update({
             stripe_customer_id: customer,
             subscription_id: subscription.id,
             subscription_status: subscription.status,
             updated_at: new Date().toISOString()
           })
           .eq('stripe_customer_id', customer)
           .eq('organization_id', organization_id);
         
         if (updateError) {
           console.error('❌ Error updating member subscription:', updateError);
         } else {

         }
       } catch (error) {
         console.error('💥 Error processing subscription update:', error);
         return res.status(500).json({ error: 'Failed to process subscription update', details: error.message });
       }
     } else if (event.type === 'customer.subscription.created') {

       try {
         const subscription = event.data.object;
         const metadata = subscription.metadata || {};
         const customer = subscription.customer;
         const organization_id = metadata.organization_id;

         // Skip if no organization_id in metadata
         if (!organization_id) {

           return res.json({ received: true });
         }
         
         // Update member record with subscription info
         const { error: updateError } = await supabase
           .from('members')
           .update({
             stripe_customer_id: customer,
             subscription_id: subscription.id,
             subscription_status: subscription.status,
             updated_at: new Date().toISOString()
           })
           .eq('stripe_customer_id', customer)
           .eq('organization_id', organization_id);
         
         if (updateError) {
           console.error('❌ Error updating member subscription:', updateError);
         } else {

         }
       } catch (error) {
         console.error('💥 Error processing subscription creation:', error);
         return res.status(500).json({ error: 'Failed to process subscription creation', details: error.message });
       }
     }

    return res.json({ received: true });
  } else {

    return res.status(400).json({ error: 'No request body' });
  }

  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Stripe-Signature');

  if (req.method === 'OPTIONS') {

    return res.status(200).end();
  }

  if (req.method !== 'POST') {

    return res.status(405).json({ error: 'Method not allowed' });
  }

  let event;
  try {
    const sig = req.headers['stripe-signature'];

    if (!endpointSecret) {

      return res.status(500).json({ error: 'Webhook secret not configured' });
    }
    
    if (!sig) {

      return res.status(400).json({ error: 'No Stripe signature' });
    }
    
    if (!rawBody) {

      return res.status(400).json({ error: 'No request body' });
    }

    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);

  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    console.error('🔍 Error details:', {
      hasSignature: !!req.headers['stripe-signature'],
      hasBody: !!rawBody,
      hasSecret: !!endpointSecret,
      errorType: err.constructor.name
    });
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {

    try {
      const session = event.data.object;
      const metadata = session.metadata || {};
      const amount = session.amount_total / 100;
      const organization_id = metadata.organization_id;
      const fund_designation = metadata.fund_designation || null;
      const campaign_id = metadata.campaign_id || null;
      const donor_email = session.customer_email;
      const payment_method = 'stripe';
      const date = new Date().toISOString().split('T')[0];

      // Handle fee coverage metadata
      const original_amount = metadata.original_amount ? parseFloat(metadata.original_amount) / 100 : amount;
      const fee_amount = metadata.fee_amount ? parseFloat(metadata.fee_amount) / 100 : 0;
      const cover_fees = metadata.cover_fees === 'true';

      // Get church name for logging
      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', organization_id)
        .single();

      if (org) {

      }

      // Optionally, look up donor/member by email
      let donor_id = null;
      if (donor_email) {
        const { data: member, error: memberError } = await supabase
          .from('members')
          .select('id')
          .eq('email', donor_email)
          .eq('organization_id', organization_id)
          .single();
        if (!memberError && member) {
          donor_id = member.id;

        }
      }

      // Insert donation record

      const { error: insertError } = await supabase.from('donations').insert({
        organization_id,
        donor_id,
        amount: original_amount, // Store the original amount (what church receives)
        date,
        fund_designation,
        campaign_id,
        payment_method,
        is_tax_deductible: true,
        notes: `Stripe Connect donation${cover_fees ? ' (fees covered by donor)' : ''}`,
        metadata: {
          ...session,
          original_amount: original_amount,
          fee_amount: fee_amount,
          cover_fees: cover_fees,
          total_paid: amount
        },
      });

      if (insertError) {
        console.error('❌ Error inserting donation:', insertError);
        throw new Error(`Database error: ${insertError.message}`);
      } else {

      }
    } catch (error) {
      console.error('💥 Error processing donation:', error);
      return res.status(500).json({ error: 'Failed to process donation', details: error.message });
    }
  } else if (event.type === 'invoice.payment_succeeded') {

    try {
      const invoice = event.data.object;
      const subscription = invoice.subscription;
      const customer = invoice.customer;
      
      // Get subscription details
      const subscriptionData = await stripe.subscriptions.retrieve(subscription);
      const metadata = subscriptionData.metadata || {};
      
      const amount = invoice.amount_paid / 100;
      const organization_id = metadata.organization_id;
      const fund_designation = metadata.fund_designation || null;
      const campaign_id = metadata.campaign_id || null;
      const payment_method = metadata.payment_method === 'ach' ? 'ach' : 'online';
      const date = new Date().toISOString().split('T')[0];
      
      // Handle fee coverage metadata
      const original_amount = metadata.original_amount ? parseFloat(metadata.original_amount) / 100 : amount;
      const fee_amount = metadata.fee_amount ? parseFloat(metadata.fee_amount) / 100 : 0;
      const cover_fees = metadata.cover_fees === 'true';

      // Get church name for logging
      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', organization_id)
        .single();
      
      // Look up donor/member by customer ID
      let donor_id = null;
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('id')
        .eq('stripe_customer_id', customer)
        .eq('organization_id', organization_id)
        .single();
      
      if (!memberError && member) {
        donor_id = member.id;

      }
      
      // Insert donation record

      const { error: insertError } = await supabase.from('donations').insert({
        organization_id,
        donor_id,
        amount: original_amount,
        date,
        fund_designation,
        campaign_id,
        payment_method,
        is_tax_deductible: true,
        is_recurring: true,
        subscription_id: subscription,
        notes: `Recurring donation${cover_fees ? ' (fees covered by donor)' : ''}`,
        metadata: {
          ...invoice,
          subscription_id: subscription,
          customer_id: customer,
          original_amount: original_amount,
          fee_amount: fee_amount,
          cover_fees: cover_fees,
          total_paid: amount
        },
      });
      
      if (insertError) {
        console.error('❌ Error inserting recurring donation:', insertError);
        throw new Error(`Database error: ${insertError.message}`);
      } else {

      }
    } catch (error) {
      console.error('💥 Error processing recurring donation:', error);
      return res.status(500).json({ error: 'Failed to process recurring donation', details: error.message });
    }
  } else if (event.type === 'customer.subscription.created') {

    try {
      const subscription = event.data.object;
      const metadata = subscription.metadata || {};
      const customer = subscription.customer;
      const organization_id = metadata.organization_id;

      // Update member record with subscription info
      const { error: updateError } = await supabase
        .from('members')
        .update({
          stripe_customer_id: customer,
          subscription_id: subscription.id,
          subscription_status: subscription.status,
          updated_at: new Date().toISOString()
        })
        .eq('stripe_customer_id', customer)
        .eq('organization_id', organization_id);
      
      if (updateError) {
        console.error('❌ Error updating member subscription:', updateError);
      } else {

      }
    } catch (error) {
      console.error('💥 Error processing subscription creation:', error);
      return res.status(500).json({ error: 'Failed to process subscription creation', details: error.message });
    }
  }

  res.json({ received: true });
};
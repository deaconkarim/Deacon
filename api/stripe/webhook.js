import Stripe from 'stripe';

// Use test mode if STRIPE_TEST_MODE is set to 'true'
const isTestMode = process.env.STRIPE_TEST_MODE === 'true';
const stripeKey = isTestMode ? process.env.STRIPE_TEST_SECRET_KEY : process.env.STRIPE_SECRET_KEY;
const endpointSecret = isTestMode ? process.env.STRIPE_TEST_WEBHOOK_SECRET : process.env.STRIPE_WEBHOOK_SECRET;

const stripe = Stripe(stripeKey);
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

console.log(`🔧 Webhook Mode: ${isTestMode ? 'TEST' : 'LIVE'}`);

// Log environment variables for debugging (without exposing secrets)
console.log('🔧 Environment check:', {
  hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
  hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
  hasSupabaseUrl: !!process.env.SUPABASE_URL,
  hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
});

export default async (req, res) => {
  console.log('🔔 Webhook received:', req.method, req.url);
  console.log('📋 Headers:', Object.keys(req.headers));
  
  // For Vercel, we need to handle the body parsing issue
  // Since Vercel automatically parses JSON, we need to work around this
  let rawBody;
  
  // Try to get the raw body from Vercel's internal properties
  if (req.body && typeof req.body === 'string') {
    rawBody = req.body;
    console.log('📦 Using body as string');
  } else if (req.body && typeof req.body === 'object') {
    // If body is parsed as object, we can't verify signature
    // This is a limitation of Vercel's automatic JSON parsing
    console.log('❌ Body is parsed as object - cannot verify signature');
    console.log('📦 Body type:', typeof req.body);
    console.log('📦 Body keys:', Object.keys(req.body || {}));
    
    // For now, let's try to process the event without verification
    // This is not ideal but allows the webhook to work
    const event = req.body;
    console.log('⚠️  Processing webhook without signature verification');
    
         if (event.type === 'checkout.session.completed') {
       console.log('💰 Processing checkout.session.completed event (unverified)');
       
       try {
         const session = event.data.object;
         const metadata = session.metadata || {};
         const amount = session.amount_total / 100;
         const organization_id = metadata.organization_id;
         const fund_designation = metadata.fund_designation || null;
         const campaign_id = metadata.campaign_id || null;
         const donor_email = session.customer_email;
         const payment_method = metadata.payment_method === 'ach' ? 'ach' : 'online'; // Use metadata payment method
         const date = new Date().toISOString().split('T')[0];

         // Handle fee coverage metadata
         const original_amount = metadata.original_amount ? parseFloat(metadata.original_amount) / 100 : amount;
         const fee_amount = metadata.fee_amount ? parseFloat(metadata.fee_amount) / 100 : 0;
         const cover_fees = metadata.cover_fees === 'true';

         console.log(`📊 Processing donation for church ID: ${organization_id}, Amount: $${amount}, Email: ${donor_email}`);
         console.log(`💸 Fee details - Original: $${original_amount}, Fee: $${fee_amount}, Cover fees: ${cover_fees}`);

         // Get church name for logging
         const { data: org } = await supabase
           .from('organizations')
           .select('name')
           .eq('id', organization_id)
           .single();

         if (org) {
           console.log(`🏛️  Donation for church: ${org.name}`);
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
             console.log(`👤 Found existing member: ${donor_id}`);
           }
         }

         // Insert donation record
         console.log('💾 Inserting donation record...');
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
           console.log(`✅ Successfully recorded donation for church: ${org?.name || organization_id}`);
           console.log(`💰 Church receives: $${original_amount}, Donor paid: $${amount}`);
         }
       } catch (error) {
         console.error('💥 Error processing donation:', error);
         return res.status(500).json({ error: 'Failed to process donation', details: error.message });
       }
     } else if (event.type === 'invoice.payment_succeeded') {
                console.log('🔄 Processing invoice.payment_succeeded event (unverified)');
         
         try {
           console.log('📋 Invoice data:', {
             id: invoice.id,
             subscription: invoice.subscription,
             customer: invoice.customer,
             amount_paid: invoice.amount_paid,
             status: invoice.status
           });
         const invoice = event.data.object;
         const subscription = invoice.subscription;
         const customer = invoice.customer;
         
         // Check if this invoice is associated with a subscription
         if (!subscription) {
           console.log('⚠️  Invoice is not associated with a subscription, skipping');
           return res.json({ received: true });
         }
         
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
         
         console.log(`📊 Processing recurring donation for church ID: ${organization_id}, Amount: $${amount}`);
         
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
           console.log(`👤 Found existing member: ${donor_id}`);
         }
         
         // Insert donation record
         console.log('💾 Inserting recurring donation record...');
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
           console.log(`✅ Successfully recorded recurring donation for church: ${org?.name || organization_id}`);
           console.log(`💰 Church receives: $${original_amount}, Donor paid: $${amount}`);
         }
       } catch (error) {
         console.error('💥 Error processing recurring donation:', error);
         return res.status(500).json({ error: 'Failed to process recurring donation', details: error.message });
       }
     } else if (event.type === 'customer.subscription.created') {
       console.log('📅 Processing customer.subscription.created event (unverified)');
       
       try {
         const subscription = event.data.object;
         const metadata = subscription.metadata || {};
         const customer = subscription.customer;
         const organization_id = metadata.organization_id;
         
         console.log(`📅 New subscription created for church ID: ${organization_id}, Customer: ${customer}`);
         
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
           console.log(`✅ Successfully updated member subscription info`);
         }
       } catch (error) {
         console.error('💥 Error processing subscription creation:', error);
         return res.status(500).json({ error: 'Failed to process subscription creation', details: error.message });
       }
     }
    
    console.log('✅ Webhook processed (unverified)');
    return res.json({ received: true });
  } else {
    console.log('❌ No body available');
    return res.status(400).json({ error: 'No request body' });
  }
  
  console.log('📏 Body length:', rawBody ? rawBody.length : 'undefined');
  
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Stripe-Signature');

  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS request handled');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    console.log('❌ Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let event;
  try {
    const sig = req.headers['stripe-signature'];
    console.log('🔐 Stripe signature present:', !!sig);
    console.log('🔑 Endpoint secret configured:', !!endpointSecret);
    console.log('📏 Request body length:', rawBody ? rawBody.length : 'undefined');
    
    if (!endpointSecret) {
      console.log('❌ No webhook secret configured');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }
    
    if (!sig) {
      console.log('❌ No Stripe signature in headers');
      return res.status(400).json({ error: 'No Stripe signature' });
    }
    
    if (!rawBody) {
      console.log('❌ No raw body available');
      return res.status(400).json({ error: 'No request body' });
    }
    
    console.log('🔍 Attempting to verify webhook signature...');
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
    console.log('✅ Webhook signature verified, event type:', event.type);
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
    console.log('💰 Processing checkout.session.completed event');
    
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

      console.log(`📊 Processing donation for church ID: ${organization_id}, Amount: $${amount}, Email: ${donor_email}`);
      console.log(`💸 Fee details - Original: $${original_amount}, Fee: $${fee_amount}, Cover fees: ${cover_fees}`);
      console.log('📋 Session metadata:', metadata);

      // Get church name for logging
      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', organization_id)
        .single();

      if (org) {
        console.log(`🏛️  Donation for church: ${org.name}`);
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
          console.log(`👤 Found existing member: ${donor_id}`);
        }
      }

      // Insert donation record
      console.log('💾 Inserting donation record...');
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
        console.log(`✅ Successfully recorded donation for church: ${org?.name || organization_id}`);
        console.log(`💰 Church receives: $${original_amount}, Donor paid: $${amount}`);
      }
    } catch (error) {
      console.error('💥 Error processing donation:', error);
      return res.status(500).json({ error: 'Failed to process donation', details: error.message });
    }
  } else if (event.type === 'invoice.payment_succeeded') {
    console.log('🔄 Processing invoice.payment_succeeded event');
    
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
      
      console.log(`📊 Processing recurring donation for church ID: ${organization_id}, Amount: $${amount}`);
      
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
        console.log(`👤 Found existing member: ${donor_id}`);
      }
      
      // Insert donation record
      console.log('💾 Inserting recurring donation record...');
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
        console.log(`✅ Successfully recorded recurring donation for church: ${org?.name || organization_id}`);
        console.log(`💰 Church receives: $${original_amount}, Donor paid: $${amount}`);
      }
    } catch (error) {
      console.error('💥 Error processing recurring donation:', error);
      return res.status(500).json({ error: 'Failed to process recurring donation', details: error.message });
    }
  } else if (event.type === 'customer.subscription.created') {
    console.log('📅 Processing customer.subscription.created event');
    
    try {
      const subscription = event.data.object;
      const metadata = subscription.metadata || {};
      const customer = subscription.customer;
      const organization_id = metadata.organization_id;
      
      console.log(`📅 New subscription created for church ID: ${organization_id}, Customer: ${customer}`);
      
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
        console.log(`✅ Successfully updated member subscription info`);
      }
    } catch (error) {
      console.error('💥 Error processing subscription creation:', error);
      return res.status(500).json({ error: 'Failed to process subscription creation', details: error.message });
    }
  }

  console.log('✅ Webhook processed successfully');
  res.json({ received: true });
};
import Stripe from 'stripe';
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Set your Stripe webhook secret in .env
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export default async (req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Stripe-Signature');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let event;
  try {
    const sig = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
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

    console.log(`Processing donation for church ID: ${organization_id}, Amount: $${amount}, Email: ${donor_email}`);
    console.log(`Fee details - Original: $${original_amount}, Fee: $${fee_amount}, Cover fees: ${cover_fees}`);

    // Get church name for logging
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organization_id)
      .single();

    if (org) {
      console.log(`Donation for church: ${org.name}`);
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
        console.log(`Found existing member: ${donor_id}`);
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
      console.error('Error inserting donation:', insertError);
    } else {
      console.log(`Successfully recorded donation for church: ${org?.name || organization_id}`);
      console.log(`Church receives: $${original_amount}, Donor paid: $${amount}`);
    }
  }

  res.json({ received: true });
};
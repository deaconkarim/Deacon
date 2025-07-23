import Stripe from 'stripe';
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Set your Stripe webhook secret in .env
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export default async (req, res) => {
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

    // Optionally, look up donor/member by email
    let donor_id = null;
    if (donor_email) {
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('id')
        .eq('email', donor_email)
        .eq('organization_id', organization_id)
        .single();
      if (!memberError && member) donor_id = member.id;
    }

    // Insert donation record
    await supabase.from('donations').insert({
      organization_id,
      donor_id,
      amount,
      date,
      fund_designation,
      campaign_id,
      payment_method,
      is_tax_deductible: true,
      notes: 'Stripe Connect donation',
      metadata: session,
    });
  }

  res.json({ received: true });
};
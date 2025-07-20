import { Deacon } from '@deacon-ai/sdk';

const deacon = new Deacon({
  apiKey: process.env.DEACON_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, currency, payment_method, metadata } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Create payment intent with Deacon
    const paymentIntent = await deacon.paymentIntents.create({
      amount: amount, // Amount in cents
      currency: currency || 'usd',
      payment_method_types: [payment_method === 'card' ? 'card' : 'ach'],
      metadata: {
        fund_designation: metadata.fund_designation,
        donor_name: metadata.donor_name,
        donor_email: metadata.donor_email,
        notes: metadata.notes,
        is_anonymous: metadata.is_anonymous.toString(),
        type: 'donation'
      },
      description: `Donation to ${metadata.fund_designation} fund`,
      receipt_email: metadata.donor_email || undefined,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.status(200).json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      status: paymentIntent.status
    });

  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create payment intent',
      details: error.message 
    });
  }
}
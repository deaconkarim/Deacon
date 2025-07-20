import { Deacon } from '@deacon-ai/sdk';

const deacon = new Deacon({
  apiKey: process.env.DEACON_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { payment_intent_id, payment_method_data } = req.body;

    if (!payment_intent_id) {
      return res.status(400).json({ error: 'Payment intent ID is required' });
    }

    // Retrieve the payment intent
    const paymentIntent = await deacon.paymentIntents.retrieve(payment_intent_id);

    if (paymentIntent.status === 'succeeded') {
      return res.status(200).json({
        payment_intent_id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency
      });
    }

    // Process the payment based on payment method
    let paymentMethod;
    
    if (payment_method_data.card_number) {
      // Credit card payment
      paymentMethod = await deacon.paymentMethods.create({
        type: 'card',
        card: {
          number: payment_method_data.card_number,
          exp_month: parseInt(payment_method_data.expiry_month),
          exp_year: parseInt(payment_method_data.expiry_year),
          cvc: payment_method_data.cvv,
        },
        billing_details: {
          name: payment_method_data.cardholder_name,
        },
      });
    } else {
      // ACH payment - would redirect to bank
      return res.status(200).json({
        payment_intent_id: paymentIntent.id,
        status: 'requires_action',
        next_action: {
          type: 'redirect_to_url',
          redirect_to_url: {
            url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/ach-redirect?payment_intent_id=${payment_intent_id}`,
            return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/donate/success`
          }
        }
      });
    }

    // Confirm the payment intent with the payment method
    const confirmedPaymentIntent = await deacon.paymentIntents.confirm(
      payment_intent_id,
      {
        payment_method: paymentMethod.id,
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/donate/success`,
      }
    );

    if (confirmedPaymentIntent.status === 'requires_action') {
      return res.status(200).json({
        payment_intent_id: confirmedPaymentIntent.id,
        status: confirmedPaymentIntent.status,
        next_action: confirmedPaymentIntent.next_action
      });
    }

    if (confirmedPaymentIntent.status === 'succeeded') {
      return res.status(200).json({
        payment_intent_id: confirmedPaymentIntent.id,
        status: confirmedPaymentIntent.status,
        amount: confirmedPaymentIntent.amount,
        currency: confirmedPaymentIntent.currency
      });
    }

    return res.status(400).json({
      error: 'Payment failed',
      status: confirmedPaymentIntent.status,
      last_payment_error: confirmedPaymentIntent.last_payment_error
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({ 
      error: 'Payment processing failed',
      details: error.message 
    });
  }
}
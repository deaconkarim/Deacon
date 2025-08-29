// Test script to verify recurring payments setup
// Run this to check your configuration

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testRecurringPayments() {

  // 1. Check database schema

  try {
    const { data: donations, error } = await supabase
      .from('donations')
      .select('is_recurring, subscription_id, recurring_interval')
      .limit(1);
    
    if (error) {

    } else {

    }
  } catch (err) {

  }

  // 2. Check environment variables

  const requiredVars = [
    'STRIPE_TEST_MODE',
    'STRIPE_TEST_SECRET_KEY',
    'STRIPE_TEST_WEBHOOK_SECRET',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {

  } else {

  }

  // 3. Check organizations with Stripe accounts

  try {
    const { data: orgs, error } = await supabase
      .from('organizations')
      .select('id, name, stripe_account_id')
      .not('stripe_account_id', 'is', null);

    if (error) {

    } else if (orgs.length === 0) {

    } else {

      orgs.forEach(org => {

      });
    }
  } catch (err) {

  }

  // 4. Check recent donations

  try {
    const { data: donations, error } = await supabase
      .from('donations')
      .select('id, amount, date, is_recurring, subscription_id, payment_method')
      .order('date', { ascending: false })
      .limit(5);

    if (error) {

    } else if (donations.length === 0) {

    } else {

      donations.forEach(donation => {
        const recurring = donation.is_recurring ? '🔄' : '💳';

        if (donation.subscription_id) {

        }
      });
    }
  } catch (err) {

  }

  // 5. Check members with subscriptions

  try {
    const { data: members, error } = await supabase
      .from('members')
      .select('id, email, stripe_customer_id, subscription_id, subscription_status')
      .not('subscription_id', 'is', null);

    if (error) {

    } else if (members.length === 0) {

    } else {

      members.forEach(member => {

      });
    }
  } catch (err) {

  }

}

// Run the test
testRecurringPayments().catch(console.error); 
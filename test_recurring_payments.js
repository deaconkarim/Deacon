// Test script to verify recurring payments setup
// Run this to check your configuration

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testRecurringPayments() {
  console.log('🧪 Testing Recurring Payments Setup...\n');

  // 1. Check database schema
  console.log('1️⃣ Checking database schema...');
  try {
    const { data: donations, error } = await supabase
      .from('donations')
      .select('is_recurring, subscription_id, recurring_interval')
      .limit(1);
    
    if (error) {
      console.log('❌ Database schema issue:', error.message);
    } else {
      console.log('✅ Database schema looks good');
    }
  } catch (err) {
    console.log('❌ Database connection issue:', err.message);
  }

  // 2. Check environment variables
  console.log('\n2️⃣ Checking environment variables...');
  const requiredVars = [
    'STRIPE_TEST_MODE',
    'STRIPE_TEST_SECRET_KEY',
    'STRIPE_TEST_WEBHOOK_SECRET',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log('❌ Missing environment variables:', missingVars);
  } else {
    console.log('✅ All required environment variables are set');
    console.log(`🔧 Test mode: ${process.env.STRIPE_TEST_MODE === 'true' ? 'ENABLED' : 'DISABLED'}`);
  }

  // 3. Check organizations with Stripe accounts
  console.log('\n3️⃣ Checking organizations with Stripe accounts...');
  try {
    const { data: orgs, error } = await supabase
      .from('organizations')
      .select('id, name, stripe_account_id')
      .not('stripe_account_id', 'is', null);

    if (error) {
      console.log('❌ Error fetching organizations:', error.message);
    } else if (orgs.length === 0) {
      console.log('⚠️  No organizations found with Stripe accounts');
      console.log('   You need to update an organization with a test Stripe account ID');
    } else {
      console.log(`✅ Found ${orgs.length} organization(s) with Stripe accounts:`);
      orgs.forEach(org => {
        console.log(`   - ${org.name}: ${org.stripe_account_id}`);
      });
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }

  // 4. Check recent donations
  console.log('\n4️⃣ Checking recent donations...');
  try {
    const { data: donations, error } = await supabase
      .from('donations')
      .select('id, amount, date, is_recurring, subscription_id, payment_method')
      .order('date', { ascending: false })
      .limit(5);

    if (error) {
      console.log('❌ Error fetching donations:', error.message);
    } else if (donations.length === 0) {
      console.log('⚠️  No donations found in database');
    } else {
      console.log(`✅ Found ${donations.length} recent donation(s):`);
      donations.forEach(donation => {
        const recurring = donation.is_recurring ? '🔄' : '💳';
        console.log(`   ${recurring} $${donation.amount} on ${donation.date} (${donation.payment_method})`);
        if (donation.subscription_id) {
          console.log(`      Subscription: ${donation.subscription_id}`);
        }
      });
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }

  // 5. Check members with subscriptions
  console.log('\n5️⃣ Checking members with subscriptions...');
  try {
    const { data: members, error } = await supabase
      .from('members')
      .select('id, email, stripe_customer_id, subscription_id, subscription_status')
      .not('subscription_id', 'is', null);

    if (error) {
      console.log('❌ Error fetching members:', error.message);
    } else if (members.length === 0) {
      console.log('⚠️  No members found with subscriptions');
    } else {
      console.log(`✅ Found ${members.length} member(s) with subscriptions:`);
      members.forEach(member => {
        console.log(`   - ${member.email}: ${member.subscription_status} (${member.subscription_id})`);
      });
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }

  console.log('\n🎯 Next Steps:');
  console.log('1. Set STRIPE_TEST_MODE=true in your environment');
  console.log('2. Create a test Stripe connected account');
  console.log('3. Update your organization with the test account ID');
  console.log('4. Set up test webhook endpoint');
  console.log('5. Test a recurring donation');
  console.log('6. Check webhook logs for invoice.payment_succeeded events');
}

// Run the test
testRecurringPayments().catch(console.error); 
# Stripe Test Mode Setup Guide

## Environment Variables for Test Mode

Add these environment variables to your `.env` file or Vercel deployment:

```bash
# Test Mode Toggle
STRIPE_TEST_MODE=true

# Test Mode Keys (get these from Stripe Dashboard > Developers > API Keys)
STRIPE_TEST_SECRET_KEY=sk_test_...
STRIPE_TEST_WEBHOOK_SECRET=whsec_test_...

# Keep your live keys for production
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...
```

## Setting Up Test Mode

### 1. Get Test API Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Switch to "Test mode" (toggle in top right)
3. Go to Developers > API Keys
4. Copy your test secret key

### 2. Set Up Test Webhook
1. In test mode, go to Developers > Webhooks
2. Click "Add endpoint"
3. URL: `https://your-domain.vercel.app/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.created`
5. Copy the webhook signing secret

### 3. Create Test Connected Account
1. In test mode, go to Connect > Accounts
2. Click "Add account"
3. Choose "Express" or "Standard"
4. Complete the onboarding process
5. Copy the account ID (starts with `acct_test_`)

### 4. Update Database
```sql
-- Update your organization with the test account ID
UPDATE organizations 
SET stripe_account_id = 'acct_test_your_test_account_id'
WHERE id = 'your_org_id';
```

## Test Mode Features

### ✅ What Works in Test Mode:
- All payment processing (no real charges)
- Webhook events
- Subscription creation and management
- Database recording
- Connected account transfers

### 🔧 Test Card Numbers:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Insufficient funds**: `4000 0000 0000 9995`

### 🏦 Test Bank Account (ACH):
- **Success**: `110000000` (routing), `000123456789` (account)

## Troubleshooting Recurring Payments

If recurring payments aren't updating in the database:

### 1. Check Webhook Events
```bash
# In Stripe Dashboard > Developers > Webhooks
# Look for these events:
- customer.subscription.created
- invoice.payment_succeeded
```

### 2. Check Database Schema
```sql
-- Run the migration if not done
-- supabase/migrations/20250125000001_add_recurring_donations.sql
```

### 3. Check Webhook Logs
```bash
# In Vercel Dashboard > Functions > api/stripe/webhook
# Look for these log messages:
- "Processing invoice.payment_succeeded event"
- "Successfully recorded recurring donation"
```

### 4. Test Webhook Manually
```bash
# Use Stripe CLI to test webhooks locally
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Switching Between Test and Live

### To Test Mode:
```bash
STRIPE_TEST_MODE=true
```

### To Live Mode:
```bash
STRIPE_TEST_MODE=false
# or remove STRIPE_TEST_MODE entirely
```

## Connected Account Requirements

### ✅ Test Mode Connected Accounts:
- Work exactly like live accounts
- Can process test payments
- Can receive transfers
- No real money involved

### 🔧 Setup Process:
1. Create test connected account
2. Complete onboarding (fake business info)
3. Update your organization's `stripe_account_id`
4. Test the full flow

## Common Issues

### Issue: "Church is not onboarded with Stripe Connect"
**Solution**: Update the organization's `stripe_account_id` in the database

### Issue: Webhook not receiving events
**Solution**: 
1. Check webhook endpoint URL is correct
2. Verify webhook secret matches
3. Check Vercel function logs

### Issue: Recurring payments not recording
**Solution**:
1. Check webhook events in Stripe Dashboard
2. Verify database schema is updated
3. Check webhook logs for errors

## Testing Checklist

- [ ] Set `STRIPE_TEST_MODE=true`
- [ ] Add test API keys to environment
- [ ] Set up test webhook endpoint
- [ ] Create test connected account
- [ ] Update organization with test account ID
- [ ] Test one-time donation
- [ ] Test recurring donation
- [ ] Verify database records
- [ ] Test subscription management 
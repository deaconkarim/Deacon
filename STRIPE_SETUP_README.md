# 🏦 Deacon Platform Stripe Setup Guide

This guide will walk you through setting up your main Stripe account for Deacon, enabling Stripe Connect, and configuring your environment for seamless multi-church donations and payouts.

---

## 1. **Create a Stripe Account for Deacon**

1. Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Sign up with your Deacon business email.
3. Complete the business verification steps (business details, bank account, etc.).
4. Once your account is active, you’ll be taken to the Stripe Dashboard.

---

## 2. **Enable Stripe Connect**

1. In the Stripe Dashboard, go to **Settings** (bottom left).
2. Under **Payments & Payouts**, click **Connect settings**.
3. Click **Get started** and follow the prompts to enable Stripe Connect for your platform.
4. Choose **“Platform or marketplace”** when asked about your business model.
5. Select **Express** accounts (recommended for best UX for churches).
6. Complete any additional compliance steps Stripe requires.

---

## 3. **Get Your API Keys**

1. In the Stripe Dashboard, go to **Developers → API keys**.
2. Copy your **Secret key** (starts with `sk_test_...` for test mode, or `sk_live_...` for live).
3. (Optional) Copy your **Publishable key** if you need it for frontend (not required for backend-only).

---

## 4. **Set Up Webhooks**

1. In the Stripe Dashboard, go to **Developers → Webhooks**.
2. Click **Add endpoint**.
3. Set the endpoint URL to:  
   `https://your-deacon-domain.com/api/stripe/webhook`  
   (Replace with your actual deployed URL)
4. Select these events (at minimum):
   - `checkout.session.completed`
   - `account.updated`
   - `account.application.authorized`
   - `account.application.deauthorized`
   - `payout.paid`
5. Click **Add endpoint**.
6. Copy the **Signing secret** (`whsec_...`) for this webhook.

---

## 🚨 Required Webhook Events (Test & Live Mode)

For your Stripe integration to work fully (including recurring and one-time donations), your webhook endpoint must listen for these events in **both test and live mode**:

- `checkout.session.completed`
- `invoice.payment_succeeded`
- `customer.subscription.created`

(And, for Connect platforms, optionally:
- `account.updated`
- `account.application.authorized`
- `account.application.deauthorized`
- `payout.paid`
)

**Be sure to set up these events for both your test and live webhook endpoints in the Stripe Dashboard.**

---

## 5. **Configure Environment Variables**

### **For Production (Live Mode):**
In your Vercel (or other deployment) dashboard, set these environment variables:

| Name                      | Value (example)                | Description                        |
|---------------------------|--------------------------------|------------------------------------|
| `STRIPE_SECRET_KEY`       | `sk_live_...`                  | Your Stripe live secret key        |
| `STRIPE_WEBHOOK_SECRET`   | `whsec_...`                    | Webhook signing secret             |
| `SUPABASE_URL`            | `https://xxxx.supabase.co`     | Your Supabase project URL          |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...`                     | Supabase service role key          |

### **For Development (Test Mode):**
For testing without real charges, add these additional variables:

| Name                      | Value (example)                | Description                        |
|---------------------------|--------------------------------|------------------------------------|
| `STRIPE_TEST_MODE`        | `true`                         | Enable test mode                   |
| `STRIPE_TEST_SECRET_KEY`  | `sk_test_...`                  | Your Stripe test secret key        |
| `STRIPE_TEST_WEBHOOK_SECRET` | `whsec_test_...`            | Test webhook signing secret        |

**Remember:**
- Use test keys for development, live keys for production.
- Never expose your secret key or service role key in frontend code.
- When `STRIPE_TEST_MODE=true`, the system uses test keys automatically.

---

## 6. **Test the Integration**

1. Go to your Deacon admin dashboard.
2. In **Church Settings**, try connecting a test church to Stripe (use Stripe’s test onboarding).
3. Make a test donation using Stripe’s test card numbers.
4. Confirm the donation appears in your dashboard and the connected account receives the funds (in test mode).

---

## 6.5. **Test Mode Setup (Optional)**

For development and testing without real charges, follow these steps:

### **Setting Up Test Mode:**

1. **Get Test API Keys:**
   - Go to [Stripe Dashboard](https://dashboard.stripe.com/)
   - Switch to "Test mode" (toggle in top right)
   - Go to Developers > API Keys
   - Copy your test secret key

2. **Set Up Test Webhook:**
   - In test mode, go to Developers > Webhooks
   - Click "Add endpoint"
   - URL: `https://your-domain.vercel.app/api/stripe/webhook`
   - Select events:
     - `checkout.session.completed`
     - `invoice.payment_succeeded`
     - `customer.subscription.created`
   - Copy the webhook signing secret

3. **Create Test Connected Account:**
   - In test mode, go to Connect > Accounts
   - Click "Add account"
   - Choose "Express" or "Standard"
   - Complete the onboarding process (use fake business info)
   - Copy the account ID (starts with `acct_test_`)

4. **Update Database:**
   ```sql
   -- Update your organization with the test account ID
   UPDATE organizations 
   SET stripe_account_id = 'acct_test_your_test_account_id'
   WHERE id = 'your_org_id';
   ```

### **Testing the Flow:**

1. Go to your Deacon admin dashboard.
2. In **Church Settings**, try connecting a test church to Stripe.
3. Make a test donation using Stripe's test card numbers:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - **ACH Success**: Routing `110000000`, Account `000123456789`
4. Test recurring donations (monthly, weekly, etc.)
5. Confirm the donation appears in your dashboard and the connected account receives the funds (in test mode).

---

## 7. **Go Live**

- When ready, switch your environment variables to use your **live** Stripe keys.
- Double-check your webhook endpoint is set to your production URL.
- Onboard real churches and start accepting real donations!

---

## 8. **Support & Troubleshooting**

### **Common Issues:**

**Issue: "Church is not onboarded with Stripe Connect"**
- Solution: Update the organization's `stripe_account_id` in the database

**Issue: Webhook not receiving events**
- Check webhook endpoint URL is correct
- Verify webhook secret matches
- Check Vercel function logs

**Issue: Recurring payments not recording in database**
- Check webhook events in Stripe Dashboard for `invoice.payment_succeeded`
- Verify database schema is updated (run migration)
- Check webhook logs for errors

**Issue: Test mode not working**
- Ensure `STRIPE_TEST_MODE=true` is set
- Verify test API keys are configured
- Check that test connected account is set up

### **Testing Recurring Payments:**

1. **Check Webhook Events:**
   - In Stripe Dashboard > Developers > Webhooks
   - Look for `customer.subscription.created` and `invoice.payment_succeeded` events

2. **Verify Database Schema:**
   ```sql
   -- Check if recurring columns exist
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'donations' AND column_name IN ('is_recurring', 'subscription_id');
   ```

3. **Check Webhook Logs:**
   - In Vercel Dashboard > Functions > api/stripe/webhook
   - Look for "Processing invoice.payment_succeeded event" messages

### **Resources:**

- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [Stripe Dashboard](https://dashboard.stripe.com/)
- [Deacon Support Email](mailto:support@yourapp.com)
- If you see errors, check your Vercel logs and Stripe Dashboard for details.

---

## **FAQ**

**Q: Why do I need Stripe Connect?**  
A: Stripe Connect allows Deacon to route donations directly to each church’s bank account, while tracking all payments and fees.

**Q: Is this secure?**  
A: Yes! All sensitive data is handled by Stripe. Deacon never stores bank or card details.

**Q: Can I test before going live?**  
A: Yes! Use Stripe’s test mode and test cards to simulate the full flow.

---

**You’re ready to power Deacon with Stripe Connect!**  
If you need help, reach out to support or your developer.
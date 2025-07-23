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

## 5. **Configure Environment Variables**

In your Vercel (or other deployment) dashboard, set these environment variables:

| Name                      | Value (example)                | Description                        |
|---------------------------|--------------------------------|------------------------------------|
| `STRIPE_SECRET_KEY`       | `sk_test_...` or `sk_live_...` | Your Stripe secret key             |
| `STRIPE_WEBHOOK_SECRET`   | `whsec_...`                    | Webhook signing secret             |
| `SUPABASE_URL`            | `https://xxxx.supabase.co`     | Your Supabase project URL          |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...`                     | Supabase service role key          |

**Remember:**
- Use test keys for development, live keys for production.
- Never expose your secret key or service role key in frontend code.

---

## 6. **Test the Integration**

1. Go to your Deacon admin dashboard.
2. In **Church Settings**, try connecting a test church to Stripe (use Stripe’s test onboarding).
3. Make a test donation using Stripe’s test card numbers.
4. Confirm the donation appears in your dashboard and the connected account receives the funds (in test mode).

---

## 7. **Go Live**

- When ready, switch your environment variables to use your **live** Stripe keys.
- Double-check your webhook endpoint is set to your production URL.
- Onboard real churches and start accepting real donations!

---

## 8. **Support & Troubleshooting**

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
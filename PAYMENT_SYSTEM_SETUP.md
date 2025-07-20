# Complete Payment System Setup Guide

## 🚀 Overview

This guide will help you set up a complete payment processing system for your church using Deacon for payment processing, Resend for email notifications, and Supabase for data storage.

## 📋 Prerequisites

- Node.js 18+ installed
- A Deacon account for payment processing
- A Resend account for email services
- A Supabase project for database
- Domain name (for production)

## 🔧 Step 1: Environment Setup

### 1.1 Install Dependencies

```bash
npm install
```

### 1.2 Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Deacon Payment Processing
DEACON_API_KEY=your_deacon_api_key
DEACON_WEBHOOK_SECRET=your_deacon_webhook_secret

# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key
CHURCH_ADMIN_EMAIL=admin@yourchurch.com

# Application Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NODE_ENV=development
```

## 🔗 Step 2: Deacon Payment Setup

### 2.1 Create Deacon Account

1. Go to [Deacon](https://deacon.ai) and create an account
2. Complete your business verification
3. Get your API keys from the dashboard

### 2.2 Configure Webhooks

Set up webhooks in your Deacon dashboard:

```
Webhook URL: https://yourdomain.com/api/payments/webhook
Events: payment_intent.succeeded, payment_intent.payment_failed
```

### 2.3 Test Payment Processing

Use these test card numbers:
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Expired**: 4000 0000 0000 0069

## 📧 Step 3: Email Setup (Resend)

### 3.1 Create Resend Account

1. Go to [Resend](https://resend.com) and create an account
2. Verify your domain (donations@yourchurch.com)
3. Get your API key

### 3.2 Configure Email Templates

The system automatically sends:
- **Donor Receipts**: Professional donation receipts
- **Admin Notifications**: New donation alerts
- **Campaign Updates**: Fund-specific notifications

## 🗄️ Step 4: Database Setup

### 4.1 Supabase Configuration

Create a new Supabase project and run this SQL:

```sql
-- Create donations table
CREATE TABLE donations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  amount DECIMAL(10,2) NOT NULL,
  fund_designation VARCHAR(50) NOT NULL,
  donor_name VARCHAR(255),
  donor_email VARCHAR(255),
  donor_phone VARCHAR(20),
  notes TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  payment_intent_id VARCHAR(255),
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_donations_created_at ON donations(created_at);
CREATE INDEX idx_donations_fund_designation ON donations(fund_designation);
CREATE INDEX idx_donations_payment_status ON donations(payment_status);

-- Enable Row Level Security
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Donations are viewable by authenticated users" ON donations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Donations are insertable by authenticated users" ON donations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

### 4.2 Database Functions

Create these helper functions:

```sql
-- Function to get donation statistics
CREATE OR REPLACE FUNCTION get_donation_stats(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  total_amount DECIMAL(10,2),
  total_count BIGINT,
  fund_breakdown JSON
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(amount), 0) as total_amount,
    COUNT(*) as total_count,
    json_agg(
      json_build_object(
        'fund', fund_designation,
        'amount', fund_total,
        'count', fund_count
      )
    ) as fund_breakdown
  FROM (
    SELECT 
      fund_designation,
      SUM(amount) as fund_total,
      COUNT(*) as fund_count
    FROM donations 
    WHERE payment_status = 'completed'
      AND (start_date IS NULL OR created_at >= start_date)
      AND (end_date IS NULL OR created_at <= end_date)
    GROUP BY fund_designation
  ) fund_stats;
END;
$$ LANGUAGE plpgsql;
```

## 🚀 Step 5: Application Setup

### 5.1 Development Server

```bash
npm run dev
```

### 5.2 Production Build

```bash
npm run build
npm start
```

## 🧪 Step 6: Testing

### 6.1 Test Payment Flow

1. Navigate to `/donate`
2. Enter donation amount ($10.00)
3. Select fund (General Fund)
4. Fill in donor information
5. Use test card: 4242 4242 4242 4242
6. Complete payment
7. Verify email receipt

### 6.2 Test QR Code Generation

1. Go to `/donations`
2. Click "Generate QR Code"
3. Select fund and add notes
4. Generate and test scanning

### 6.3 Test QR Code Scanning

1. Generate a QR code
2. Use phone camera to scan
3. Verify it opens donation page
4. Test donation flow

## 🔒 Step 7: Security & Compliance

### 7.1 PCI Compliance

- All payment data is processed by Deacon (PCI DSS Level 1)
- No card data stored on your servers
- Encrypted transmission (TLS 1.3)

### 7.2 Data Protection

- Donor information encrypted at rest
- Anonymous donation option available
- GDPR-compliant data handling
- Automatic data retention policies

### 7.3 Security Headers

Add to your `next.config.js`:

```javascript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};
```

## 📊 Step 8: Monitoring & Analytics

### 8.1 Payment Monitoring

Set up alerts for:
- Failed payments
- High-value donations
- Unusual activity patterns

### 8.2 Email Notifications

Configure admin notifications for:
- New donations over $100
- Failed payment attempts
- Weekly donation summaries

## 🎯 Step 9: Customization

### 9.1 Fund Configuration

Edit `fundOptions` in components to match your church's funds:

```javascript
const fundOptions = [
  { value: 'general', label: 'General Fund', icon: Heart, color: 'bg-blue-100 text-blue-800' },
  { value: 'tithes', label: 'Tithes', icon: Gift, color: 'bg-green-100 text-green-800' },
  { value: 'building', label: 'Building Fund', icon: Building, color: 'bg-purple-100 text-purple-800' },
  { value: 'missions', label: 'Missions', icon: Target, color: 'bg-orange-100 text-orange-800' },
  { value: 'youth', label: 'Youth Ministry', icon: Users, color: 'bg-pink-100 text-pink-800' }
];
```

### 9.2 Email Templates

Customize email templates in `/api/emails/donation-confirmation.js`:

- Church branding
- Custom messaging
- Additional information

### 9.3 Receipt Customization

Modify receipt format in the email template:
- Church logo
- Tax ID information
- Contact details

## 🚨 Troubleshooting

### Common Issues

1. **Payment Declined**
   - Check card details
   - Verify Deacon API key
   - Check webhook configuration

2. **Email Not Sending**
   - Verify Resend API key
   - Check domain verification
   - Review email logs

3. **QR Code Not Working**
   - Test URL generation
   - Verify routing configuration
   - Check mobile compatibility

### Debug Mode

Enable debug logging:

```javascript
// Add to .env.local
DEBUG=true
NODE_ENV=development
```

## 📞 Support

For technical support:
- Check Deacon documentation
- Review Resend email logs
- Monitor Supabase dashboard
- Check browser console for errors

## 🎉 Success!

Your church now has a complete payment processing system with:

✅ **Secure Payment Processing** - Deacon integration  
✅ **Professional Email Receipts** - Resend integration  
✅ **QR Code Donations** - Easy mobile giving  
✅ **Database Tracking** - Supabase integration  
✅ **Admin Dashboard** - Complete donation management  
✅ **Compliance Ready** - PCI DSS, GDPR compliant  

Your members can now donate securely online, via QR codes, or through mobile devices!
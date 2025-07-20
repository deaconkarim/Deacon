# 🎯 Square Integration for Deacon

A comprehensive Square payment integration for the Deacon Church Management System, enabling organizations to accept online donations through customizable public donation pages.

## 📋 Overview

This integration allows churches to:
- Configure Square payment processing settings
- Create custom donation URLs for public fundraising
- Process secure online donations through Square
- Track and manage donation analytics
- Integrate with existing donation management system

## 🚀 Key Features

### 💳 Square Payment Processing
- **Secure Payment Processing**: Integrated with Square Web SDK
- **Multiple Payment Methods**: Credit cards, debit cards, digital wallets
- **PCI Compliance**: Square handles all sensitive payment data
- **Real-time Processing**: Instant payment confirmation
- **Error Handling**: Comprehensive error handling and user feedback

### 🔗 Custom Donation URLs
- **Public Donation Pages**: Create shareable donation URLs
- **Custom Branding**: Organization logo and colors
- **Campaign Integration**: Link donations to specific campaigns
- **Suggested Amounts**: Pre-set donation amounts for quick giving
- **Custom Messages**: Personalized messages for each donation page

### 📊 Analytics & Reporting
- **Real-time Analytics**: Live donation tracking
- **Donor Insights**: Track unique donors and giving patterns
- **Campaign Performance**: Monitor campaign progress
- **Export Capabilities**: Export data for external analysis

### 🏢 Organization Management
- **Square Settings**: Configure application ID, location ID, and access tokens
- **Environment Support**: Sandbox and production environments
- **Webhook Integration**: Optional webhook support for real-time updates
- **Security**: Encrypted storage of sensitive credentials

## 🏗️ Database Schema

### Square Settings Table
```sql
CREATE TABLE public.square_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    application_id TEXT NOT NULL,
    location_id TEXT NOT NULL,
    access_token TEXT,
    environment TEXT DEFAULT 'sandbox',
    is_active BOOLEAN DEFAULT false,
    webhook_url TEXT,
    webhook_secret TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id)
);
```

### Donation URLs Table
```sql
CREATE TABLE public.donation_urls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    name TEXT NOT NULL,
    description TEXT,
    slug TEXT NOT NULL UNIQUE,
    campaign_id UUID REFERENCES public.donation_campaigns(id),
    suggested_amounts DECIMAL(12,2)[] DEFAULT '{}',
    custom_message TEXT,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Square Donations Table
```sql
CREATE TABLE public.square_donations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    donation_url_id UUID NOT NULL REFERENCES public.donation_urls(id),
    donor_name TEXT,
    donor_email TEXT,
    amount DECIMAL(12,2) NOT NULL,
    square_payment_id TEXT NOT NULL,
    square_transaction_id TEXT,
    fund_designation TEXT DEFAULT 'general',
    message TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'completed',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔧 Setup Instructions

### 1. Square Developer Account Setup

1. **Create Square Developer Account**
   - Visit [Square Developer Dashboard](https://developer.squareup.com/)
   - Create a new developer account
   - Complete account verification

2. **Create Square Application**
   - Navigate to "Applications" in the developer dashboard
   - Click "New Application"
   - Name your application (e.g., "Deacon Church Donations")
   - Select "Web Payments" as the application type

3. **Get Application Credentials**
   - Copy your Application ID (starts with `sq0idp-`)
   - Note your Location ID (starts with `LQ`)
   - Generate an Access Token (starts with `EAAA`)

### 2. Database Migration

Apply the Square integration migration:

```bash
# Apply the Square integration migration
psql -d your_database < supabase/migrations/20250128000000_add_square_integration.sql
```

### 3. Frontend Dependencies

Install the Square Web SDK:

```bash
cd frontend
npm install @square/web-sdk
```

### 4. Environment Configuration

Add Square environment variables to your deployment:

```env
# Square Configuration
SQUARE_APPLICATION_ID=your_application_id
SQUARE_LOCATION_ID=your_location_id
SQUARE_ACCESS_TOKEN=your_access_token
SQUARE_ENVIRONMENT=sandbox  # or production
```

## 📱 Usage Guide

### For Church Administrators

#### 1. Configure Square Settings

1. Navigate to **Square Settings** in the admin panel
2. Enter your Square Application ID and Location ID
3. Add your Square Access Token
4. Select environment (Sandbox for testing, Production for live)
5. Enable the integration
6. Save settings

#### 2. Create Donation URLs

1. In Square Settings, click **"Create URL"**
2. Enter a name for your donation page
3. Add an optional description
4. Link to a campaign (optional)
5. Add suggested donation amounts (optional)
6. Include a custom message (optional)
7. Set as active
8. Save the URL

#### 3. Share Donation URLs

- Copy the generated URL
- Share via email, social media, or website
- Use QR codes for in-person sharing
- Embed in church website

### For Donors

#### 1. Access Donation Page

- Visit the shared donation URL
- View organization branding and campaign information
- See suggested donation amounts

#### 2. Make a Donation

1. Enter donation amount
2. Fill in personal information
3. Select fund designation
4. Add optional message
5. Choose anonymous option if desired
6. Enter payment information
7. Submit donation

#### 3. Confirmation

- Receive immediate confirmation
- Get email receipt
- See donation reflected in campaign progress

## 🎨 UI Components

### Square Settings Page
- **Configuration Form**: Application ID, Location ID, Access Token
- **Environment Toggle**: Sandbox vs Production
- **Security Features**: Hidden sensitive fields with show/hide
- **Donation URL Management**: Create, edit, delete URLs
- **Analytics Dashboard**: Real-time donation statistics

### Public Donation Page
- **Organization Branding**: Logo, colors, custom styling
- **Campaign Progress**: Visual progress bars and statistics
- **Donation Form**: Amount input, donor information, payment
- **Square Web SDK**: Integrated payment processing
- **Success/Error States**: Clear feedback for users

## 🔐 Security Features

### Data Protection
- **Encrypted Storage**: Sensitive credentials encrypted at rest
- **Row Level Security**: Organization-based data isolation
- **Access Control**: Permission-based feature access
- **Audit Trail**: Track all configuration changes

### Payment Security
- **PCI Compliance**: Square handles all payment data
- **Tokenization**: Payment tokens instead of raw data
- **Encrypted Communication**: HTTPS for all transactions
- **Fraud Protection**: Square's built-in fraud detection

## 📊 Analytics & Reporting

### Real-time Metrics
- **Total Donations**: Sum of all processed donations
- **Donation Count**: Number of individual donations
- **Unique Donors**: Count of unique donor emails
- **Average Donation**: Mean donation amount
- **URL Performance**: Donations by donation URL

### Campaign Tracking
- **Progress Monitoring**: Real-time campaign progress
- **Goal Achievement**: Percentage of goal completion
- **Donor Engagement**: Donor retention and patterns
- **Fund Analysis**: Breakdown by fund designation

## 🔄 Integration Points

### Existing Donation System
- **Unified Dashboard**: Square donations appear in main donations view
- **Batch Processing**: Square donations can be included in batches
- **Receipt Generation**: Automatic receipt creation
- **Tax Reporting**: Integration with tax year summaries

### Campaign Management
- **Campaign Linking**: Donations linked to specific campaigns
- **Progress Updates**: Real-time campaign progress updates
- **Goal Tracking**: Automatic goal achievement monitoring

## 🛠️ Technical Implementation

### Frontend Architecture
- **React Components**: Modular, reusable components
- **Square Web SDK**: Client-side payment processing
- **State Management**: React hooks for local state
- **Error Handling**: Comprehensive error boundaries

### Backend Services
- **Square Service**: API wrapper for Square operations
- **Database Integration**: Supabase for data persistence
- **Webhook Support**: Real-time payment notifications
- **Analytics Engine**: Real-time data processing

### API Endpoints
```javascript
// Square Settings
GET /api/square/settings
PUT /api/square/settings

// Donation URLs
GET /api/donation-urls
POST /api/donation-urls
PUT /api/donation-urls/:id
DELETE /api/donation-urls/:id

// Public Donation Page
GET /api/donation-urls/:slug
POST /api/square/process-donation

// Analytics
GET /api/square/analytics
```

## 🚀 Deployment

### Production Checklist
- [ ] Square application configured for production
- [ ] Production credentials updated in settings
- [ ] Webhook URLs configured (if using)
- [ ] SSL certificates installed
- [ ] Error monitoring configured
- [ ] Analytics tracking enabled

### Testing
- [ ] Sandbox environment tested
- [ ] Payment processing verified
- [ ] Error scenarios tested
- [ ] Mobile responsiveness confirmed
- [ ] Cross-browser compatibility checked

## 📈 Performance Optimization

### Frontend Optimizations
- **Lazy Loading**: Square SDK loaded on demand
- **Code Splitting**: Separate bundles for donation pages
- **Caching**: Static assets cached appropriately
- **Compression**: Gzip compression for faster loading

### Backend Optimizations
- **Database Indexes**: Optimized queries with proper indexing
- **Connection Pooling**: Efficient database connections
- **Caching Strategy**: Redis caching for frequently accessed data
- **CDN Integration**: Static assets served via CDN

## 🔧 Troubleshooting

### Common Issues

#### Payment Processing Errors
- **Invalid Credentials**: Verify Application ID, Location ID, and Access Token
- **Environment Mismatch**: Ensure sandbox/production consistency
- **Network Issues**: Check internet connectivity and firewall settings

#### Donation URL Issues
- **404 Errors**: Verify URL slug exists and is active
- **Styling Problems**: Check CSS conflicts and responsive design
- **Form Validation**: Ensure all required fields are completed

#### Analytics Problems
- **Missing Data**: Check database connections and permissions
- **Incorrect Totals**: Verify calculation logic and data integrity
- **Real-time Updates**: Ensure webhook configuration is correct

### Debug Mode
Enable debug logging for troubleshooting:

```javascript
// In squareService.js
const DEBUG_MODE = process.env.NODE_ENV === 'development';

if (DEBUG_MODE) {
  console.log('Square API Request:', requestData);
  console.log('Square API Response:', responseData);
}
```

## 📚 API Documentation

### Square Settings API
```javascript
// Get organization Square settings
const settings = await getSquareSettings();

// Update Square settings
const updatedSettings = await updateSquareSettings({
  application_id: 'sq0idp-...',
  location_id: 'LQ...',
  access_token: 'EAAA...',
  environment: 'production',
  is_active: true
});
```

### Donation URLs API
```javascript
// Get all donation URLs for organization
const urls = await getDonationUrls();

// Create new donation URL
const newUrl = await createDonationUrl({
  name: 'General Donations',
  description: 'Support our church ministry',
  campaign_id: 'campaign-uuid',
  suggested_amounts: [25, 50, 100, 250],
  custom_message: 'Thank you for your generosity!'
});

// Get public donation URL by slug
const publicUrl = await getDonationUrlBySlug('general-donations');
```

### Payment Processing API
```javascript
// Process Square donation
const donation = await processSquareDonation({
  donation_url_id: 'url-uuid',
  organization_id: 'org-uuid',
  donor_name: 'John Doe',
  donor_email: 'john@example.com',
  amount: 100.00,
  square_payment_id: 'payment-id',
  square_transaction_id: 'transaction-id',
  fund_designation: 'general',
  message: 'Thank you!',
  is_anonymous: false
});
```

## 🎯 Benefits

### For Churches
- **Increased Giving**: Easy online donation process
- **Reduced Administrative Burden**: Automated payment processing
- **Better Donor Experience**: Professional, secure donation pages
- **Improved Tracking**: Real-time donation analytics
- **Cost Effective**: Lower processing fees than traditional methods

### For Donors
- **Convenient Giving**: 24/7 online donation capability
- **Secure Transactions**: PCI-compliant payment processing
- **Immediate Confirmation**: Real-time donation confirmation
- **Tax Benefits**: Automatic receipt generation
- **Mobile Friendly**: Works perfectly on all devices

### For Administrators
- **Centralized Management**: All donations in one system
- **Real-time Insights**: Live donation tracking and analytics
- **Customizable Pages**: Branded donation experiences
- **Integration**: Seamless connection with existing systems
- **Scalability**: Handles growth without additional infrastructure

## 🔮 Future Enhancements

### Phase 2 Features
- **Recurring Donations**: Automated monthly/yearly giving
- **Digital Wallets**: Apple Pay, Google Pay integration
- **Advanced Analytics**: Machine learning insights
- **Email Automation**: Automated thank you emails
- **Social Sharing**: Built-in social media integration

### Phase 3 Features
- **Mobile App**: Dedicated mobile donation app
- **QR Code Generation**: Automatic QR codes for URLs
- **Multi-language Support**: International language support
- **Advanced Reporting**: Custom report builder
- **API Integration**: Third-party system integrations

## 📞 Support

### Documentation
- [Square Developer Documentation](https://developer.squareup.com/docs)
- [Square Web SDK Guide](https://developer.squareup.com/docs/web-payments)
- [Deacon Integration Guide](link-to-deacon-docs)

### Technical Support
- **Square Support**: [Square Developer Support](https://developer.squareup.com/support)
- **Deacon Support**: Contact development team
- **Community Forum**: [Deacon Community](link-to-community)

### Emergency Contacts
- **Square Emergency**: 1-800-SQUARE-1
- **Deacon Emergency**: emergency@deacon.com

---

*This Square integration represents a significant enhancement to the Deacon Church Management System, providing enterprise-level online donation capabilities with professional-grade security and user experience.*
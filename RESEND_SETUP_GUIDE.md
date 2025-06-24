# Resend Email Setup Guide

This guide will help you set up Resend for SMTP email functionality in your Supabase project.

## Prerequisites

1. A Resend account (sign up at [resend.com](https://resend.com))
2. Your Resend API key
3. A verified domain (or use sandbox domain for testing)

## Step 1: Get Resend API Key

1. **Sign up for Resend**: Go to [resend.com](https://resend.com) and create an account
2. **Get your API key**: 
   - Go to the API Keys section in your dashboard
   - Create a new API key
   - Copy the key (starts with `re_`)

## Step 2: Verify Your Domain (Optional but Recommended)

1. **Add a domain**: In your Resend dashboard, go to Domains
2. **Add your domain**: Enter your domain (e.g., `yourchurch.com`)
3. **Configure DNS**: Add the required DNS records as shown in the dashboard
4. **Wait for verification**: This can take up to 24 hours

## Step 3: Configure Supabase Environment Variables

### For Production (Supabase Dashboard):

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variable:
   - **Name**: `RESEND_API_KEY`
   - **Value**: Your Resend API key (starts with `re_`)

### For Local Development:

Create a `.env.local` file in your frontend directory:

```env
# Resend Configuration
RESEND_API_KEY=your_resend_api_key_here

# Church Configuration
VITE_CHURCH_NAME="Your Church Name"
VITE_ADMIN_EMAIL="noreply@yourdomain.com"
```

## Step 4: Update Configuration Files

The following files have been updated for you:

### 1. `supabase/config.toml`
- SMTP configuration updated to use Resend
- Email templates configured

### 2. Email Templates Created:
- `supabase/templates/invite.html` - Welcome/invite emails
- `supabase/templates/confirmation.html` - Email confirmation
- `supabase/templates/recovery.html` - Password reset
- `supabase/templates/magic_link.html` - Magic link sign-in

## Step 5: Customize Email Settings

Update the following in `supabase/config.toml`:

```toml
[auth.email.smtp]
admin_email = "noreply@yourdomain.com"  # Change to your domain
sender_name = "Your Church Name"        # Change to your church name
```

## Step 6: Deploy Configuration

### For Local Development:
```bash
# Start Supabase with new configuration
supabase start
```

### For Production:
```bash
# Deploy the configuration
supabase db push
```

## Step 7: Test Email Functionality

### Test User Registration:
1. Go to your app's registration page
2. Create a new user account
3. Check if confirmation email is received

### Test Password Reset:
1. Go to the login page
2. Click "Forgot Password"
3. Enter your email
4. Check if reset email is received

### Test Magic Link:
1. Go to the login page
2. Click "Sign in with Magic Link"
3. Enter your email
4. Check if magic link email is received

## Step 8: Monitor Email Delivery

### In Resend Dashboard:
1. Go to your Resend dashboard
2. Check the **Activity** section to see email delivery status
3. Monitor bounce rates and delivery issues

### In Supabase Dashboard:
1. Go to your Supabase project
2. Check **Authentication** → **Users** for user status
3. Monitor email confirmation rates

## Troubleshooting

### Common Issues:

1. **Emails not sending**:
   - Check if `RESEND_API_KEY` is set correctly
   - Verify domain is verified in Resend
   - Check Supabase logs for errors

2. **Emails going to spam**:
   - Ensure domain is properly verified
   - Set up SPF and DKIM records
   - Use a professional sender name

3. **Template variables not working**:
   - Check template syntax (uses Go template syntax)
   - Verify variable names match Supabase's expected format

### Testing with Sandbox Domain:

If you haven't verified your domain yet, you can use Resend's sandbox domain for testing:

```toml
[auth.email.smtp]
admin_email = "onboarding@resend.dev"  # Use sandbox domain
```

## Email Template Variables

The following variables are available in email templates:

- `{{ .ConfirmationURL }}` - The confirmation/reset link
- `{{ .Email }}` - The user's email address
- `{{ .ChurchName }}` - Your church name (from config)

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for all sensitive data
3. **Rotate API keys** regularly
4. **Monitor email activity** for suspicious patterns
5. **Set up proper DNS records** for your domain

## Next Steps

After setting up Resend:

1. **Customize email templates** to match your church's branding
2. **Set up email analytics** to track engagement
3. **Configure email preferences** for users
4. **Test all email flows** thoroughly
5. **Monitor delivery rates** and optimize as needed

## Support

- **Resend Documentation**: [docs.resend.com](https://docs.resend.com)
- **Supabase Auth Documentation**: [supabase.com/docs/guides/auth](https://supabase.com/docs/guides/auth)
- **Email Template Reference**: [supabase.com/docs/guides/auth/auth-email-templates](https://supabase.com/docs/guides/auth/auth-email-templates) 
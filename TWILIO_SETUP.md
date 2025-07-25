# Twilio SMS Setup Guide

This guide will help you set up Twilio SMS functionality for your Deacon.

## Prerequisites

1. A Twilio account (sign up at [twilio.com](https://www.twilio.com))
2. A Twilio phone number
3. Your Twilio Account SID and Auth Token

## Step 1: Get Twilio Credentials

1. Log into your Twilio Console
2. Go to the Dashboard
3. Copy your **Account SID** and **Auth Token**
4. Note your Twilio phone number

## Step 2: Configure Environment Variables

Add these environment variables to your Supabase project:

### In Supabase Dashboard:
1. Go to Settings > Environment Variables
2. Add the following variables:

```
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=your_twilio_phone_number_here
```

### For Local Development:
Create a `.env.local` file in your frontend directory:

```env
VITE_TWILIO_ACCOUNT_SID=your_account_sid_here
VITE_TWILIO_AUTH_TOKEN=your_auth_token_here
VITE_TWILIO_PHONE_NUMBER=your_twilio_phone_number_here
```

## Step 3: Configure Webhook URL

1. In your Twilio Console, go to Phone Numbers > Manage > Active numbers
2. Click on your phone number
3. In the "Messaging" section, set the webhook URL for incoming messages:
   ```
   https://your-project-ref.supabase.co/functions/v1/receive-sms
   ```
4. Set the HTTP method to POST

## Step 4: Deploy Edge Functions

Deploy the SMS functions to Supabase:

```bash
# Navigate to your project directory
cd /path/to/your/church-app

# Deploy the functions
supabase functions deploy send-sms
supabase functions deploy receive-sms
supabase functions deploy seed-sms-templates
```

## Step 5: Seed Default Templates

Run the template seeding function to create default SMS templates:

```bash
# Call the seed function
curl -X POST https://your-project-ref.supabase.co/functions/v1/seed-sms-templates \
  -H "Authorization: Bearer your-anon-key"
```

## Step 6: Test the Setup

1. Go to your app's SMS page (`/sms`)
2. Try sending a test message
3. Check the conversation history
4. Verify templates are loaded

## Database Tables

The following tables should already be created in your database:

- `sms_conversations` - Organizes SMS communications
- `sms_messages` - Stores individual SMS messages
- `sms_templates` - Stores reusable message templates

## Features Available

### 1. Prayer Request SMS
- Automatically sends prayer requests to prayer team members
- Creates conversation threads for each request
- Tracks delivery status

### 2. Event Reminders
- Send event reminders to members
- Uses templates with dynamic variables
- Tracks who received the reminders

### 3. Emergency Notifications
- Send urgent messages to all members
- High-priority messaging system
- Immediate delivery tracking

### 4. General SMS Management
- View all conversations
- Send individual messages
- Manage message templates
- Track delivery status

## Troubleshooting

### Common Issues:

1. **Messages not sending**
   - Check Twilio credentials
   - Verify phone number format (+1234567890)
   - Check function logs in Supabase

2. **Webhook not receiving messages**
   - Verify webhook URL is correct
   - Check function deployment status
   - Test webhook endpoint

3. **Template variables not working**
   - Ensure variables are in `{variable_name}` format
   - Check template syntax
   - Verify variable names match

### Debug Steps:

1. Check Supabase function logs:
   ```bash
   supabase functions logs send-sms
   supabase functions logs receive-sms
   ```

2. Test Twilio credentials:
   ```bash
   curl -X POST https://your-project-ref.supabase.co/functions/v1/send-sms \
     -H "Content-Type: application/json" \
     -d '{"to": "+1234567890", "body": "Test message"}'
   ```

## Security Notes

- Never commit Twilio credentials to version control
- Use environment variables for all sensitive data
- Regularly rotate your Twilio Auth Token
- Monitor SMS usage to control costs

## Cost Considerations

- Twilio charges per SMS sent/received
- Monitor usage in Twilio Console
- Set up usage alerts
- Consider bulk messaging for cost efficiency

## Support

For issues with:
- **Twilio**: Contact Twilio Support
- **Supabase Functions**: Check Supabase documentation
- **App Integration**: Check function logs and database queries 
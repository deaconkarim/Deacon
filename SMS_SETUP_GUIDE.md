# SMS Setup Guide - Getting SMS Responses Working

## Current Status ✅

Your SMS setup is **partially working**:
- ✅ SMS functions are deployed to Supabase
- ✅ Twilio credentials are configured
- ✅ SMS sending is working (tested successfully)
- ❌ SMS receiving/webhook is not configured

## What You Need to Do

### 1. Configure Twilio Webhook URL

1. **Log into your Twilio Console**: https://console.twilio.com/
2. **Go to Phone Numbers**: Phone Numbers > Manage > Active numbers
3. **Click on your phone number**: +1 (925) 304-3799
4. **Configure Webhook**:
   - In the "Messaging" section, set the webhook URL for incoming messages:
   ```
   https://cccxexvoahyeookqmxpl.supabase.co/functions/v1/receive-sms
   ```
   - Set the HTTP method to **POST**
   - Save the configuration

### 2. Test with Real Phone Numbers

You cannot test SMS with fake numbers like +1234567890. You need:

1. **Your own phone number** (for testing)
2. **Real member phone numbers** in your database
3. **Valid US phone numbers** in +1XXXXXXXXXX format

### 3. Add Test Members to Database

Add some test members with real phone numbers:

```sql
-- Add test members with real phone numbers
INSERT INTO members (firstname, lastname, phone, email, status, organization_id)
VALUES 
  ('Test', 'User1', '+15551234567', 'test1@example.com', 'active', 'your-org-id'),
  ('Test', 'User2', '+15559876543', 'test2@example.com', 'active', 'your-org-id');
```

### 4. Test the Complete Flow

1. **Send a message** from your app to a real phone number
2. **Reply to that message** from the phone
3. **Check your app** - the response should appear in the SMS conversations

## Troubleshooting Steps

### If SMS Sending Works But No Responses:

1. **Check Twilio Webhook URL**:
   - Verify the webhook URL is correct in Twilio console
   - Make sure it's set to POST method
   - Test the webhook URL directly

2. **Check Function Logs**:
   - Go to Supabase Dashboard > Edge Functions
   - Click on `receive-sms` function
   - Check the logs for any errors

3. **Test Webhook Manually**:
   ```bash
   curl -X POST https://cccxexvoahyeookqmxpl.supabase.co/functions/v1/receive-sms \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "From=%2B15551234567&To=%2B19253043799&Body=Test%20response&MessageSid=test123"
   ```

### If Nothing Works:

1. **Verify Twilio Account**:
   - Check if your Twilio account is active
   - Verify you have credits for SMS
   - Check if your phone number is properly configured

2. **Check Environment Variables**:
   - Verify all Twilio variables are set in Supabase
   - Make sure the phone number format is correct

3. **Test with Twilio Console**:
   - Try sending a test message directly from Twilio console
   - Check if the webhook receives the response

## Expected Behavior

Once configured correctly:

1. **Sending SMS**: Works immediately (already working)
2. **Receiving SMS**: 
   - When someone texts your Twilio number
   - The message appears in your app's SMS conversations
   - You can reply from the app
   - The conversation thread is maintained

## Cost Considerations

- **Sending SMS**: ~$0.0075 per message (US)
- **Receiving SMS**: Usually free
- **Webhook calls**: Free (included in Supabase plan)

## Next Steps

1. Configure the Twilio webhook URL
2. Add real test phone numbers to your database
3. Test the complete send/receive flow
4. Monitor the function logs for any issues

## Support

If you're still having issues:
1. Check the Supabase function logs
2. Verify Twilio webhook configuration
3. Test with real phone numbers
4. Check your Twilio account status and credits 
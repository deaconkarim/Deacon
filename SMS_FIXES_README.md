# SMS Messaging System Fixes

This document outlines the fixes implemented to resolve issues with outgoing SMS messages not creating new conversations and incoming SMS responses not being routed to the correct conversations.

## Issues Fixed

### 1. Outgoing Messages Not Creating New Conversations
**Problem**: When sending outgoing SMS messages, the system was always creating new conversations instead of finding existing ones for the same recipient.

**Root Cause**: The `sendMessage` function in `smsService.js` had logic that always created new conversations without properly checking for existing ones.

**Solution**: 
- Modified the conversation creation logic to first search for existing conversations by member ID or phone number
- Added proper conversation finding logic that checks for member-based conversations first, then phone number-based conversations
- Only creates new conversations when no existing ones are found

### 2. Response Handling Not Working Correctly
**Problem**: When people responded to SMS messages, the responses were not being routed to the most recent conversation that person was a part of.

**Root Cause**: The `receive-sms` function had overly complex and unreliable logic for finding the correct conversation for incoming responses.

**Solution**:
- Simplified and improved the conversation finding logic in the `receive-sms` function
- Implemented a three-strategy approach:
  1. **Member-based**: Find conversations where the responding member has messages
  2. **Phone-based**: Find conversations with messages to/from the responding phone number
  3. **Digit matching**: Fallback to flexible phone number digit matching
- Prioritizes conversations by most recent message activity, not just creation date

### 3. Missing Organization ID Support
**Problem**: The core SMS tables (`sms_conversations` and `sms_messages`) were missing `organization_id` columns, causing issues with multi-tenant data isolation.

**Solution**:
- Added `organization_id` columns to both tables
- Created migration to add the columns and proper indexes
- Updated all SMS functions to properly handle organization_id
- Created backfill script for existing data

## Files Modified

### Database Schema
- `supabase/migrations/20250110000000_add_organization_id_to_sms_tables.sql` - New migration adding organization_id columns

### Backend Functions
- `supabase/functions/receive-sms/index.ts` - Improved conversation finding logic
- `frontend/src/lib/smsService.js` - Fixed conversation creation and finding logic

### Utility Scripts
- `backfill_sms_organization_id.js` - Script to backfill organization_id for existing data
- `test_sms_fixes.js` - Test script to verify fixes work correctly

## How to Apply the Fixes

### 1. Run the Database Migration
```bash
cd supabase
npx supabase db push
```

### 2. Backfill Existing Data (if needed)
```bash
node backfill_sms_organization_id.js
```

### 3. Test the Fixes
```bash
node test_sms_fixes.js
```

### 4. Deploy the Updated Functions
```bash
cd supabase
npx supabase functions deploy receive-sms
```

## Technical Details

### Conversation Finding Logic

#### For Outgoing Messages (`smsService.js`)
1. **Member-based search**: Look for conversations where the target member has existing messages
2. **Phone-based search**: Look for conversations with messages to the target phone number
3. **Create new**: Only if no existing conversation is found

#### For Incoming Responses (`receive-sms`)
1. **Member-based**: Find conversations where the responding member has messages, ordered by most recent activity
2. **Phone-based**: Find conversations with messages to/from the responding phone number, ordered by most recent activity  
3. **Digit matching**: Fallback to flexible phone number digit matching for edge cases

### Phone Number Handling
- Supports multiple phone number formats (with/without country code, with/without formatting)
- Normalizes phone numbers for consistent matching
- Handles both exact matches and digit-only matches

### Organization ID Handling
- All new conversations and messages include organization_id
- Existing data can be backfilled using the provided script
- Functions properly handle cases where organization_id might be missing

## Testing

The `test_sms_fixes.js` script verifies:
1. Database schema changes are applied correctly
2. Conversation creation and finding logic works
3. Phone number matching functions properly
4. Response routing logic finds the correct conversations

## Expected Behavior After Fixes

### Outgoing Messages
- First message to a person creates a new conversation
- Subsequent messages to the same person use the existing conversation
- Group messages use existing group conversations or create new ones
- Multi-recipient messages create appropriate conversations

### Incoming Responses
- Responses go to the most recent conversation the person was involved in
- Works for individual, group, and multi-recipient conversations
- Handles phone number format variations correctly
- Creates new conversations only when no existing ones are found

## Monitoring and Debugging

### Logs to Watch
- `smsService.js`: Look for "Found existing conversation" vs "New conversation created"
- `receive-sms`: Look for "Found most recent conversation" messages
- Check for any "Could not determine organization_id" warnings

### Common Issues
1. **Phone number format mismatches**: Ensure consistent phone number formatting
2. **Missing organization_id**: Run the backfill script if needed
3. **Member lookup failures**: Check that members have proper user_id and organization associations

## Rollback Plan

If issues arise:
1. Revert the function deployments to previous versions
2. The database migration can be reverted if needed (though this would require data migration)
3. Monitor logs for any regressions in conversation handling

## Future Improvements

1. **Performance**: Add more specific indexes for phone number matching
2. **Caching**: Implement conversation caching to reduce database queries
3. **Analytics**: Add tracking for conversation routing success rates
4. **Testing**: Add automated tests for SMS conversation flows
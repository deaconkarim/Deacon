# SMS Event Reminders Feature

This feature allows administrators to set up automatic SMS reminders for events that will be sent to selected groups at specified times before the event.

## Features

### 1. Event Creation/Editing with SMS Reminders
- **Enable SMS Reminders**: Toggle to enable SMS reminders for an event
- **Reminder Timing**: Set multiple reminder times (e.g., 24 hours before, 1 hour before)
- **Group Selection**: Choose which groups to send reminders to
- **Automatic Scheduling**: Reminders are automatically scheduled when events are created/updated

### 2. Automatic Reminder Processing
- **Cron Job**: Runs every 5 minutes to check for due reminders
- **Database Function**: `send_scheduled_sms_reminders()` processes all scheduled reminders
- **Error Handling**: Failed reminders are marked and logged
- **Status Tracking**: All reminder attempts are tracked with timestamps

### 3. Manual Management
- **Test Reminders**: Send test reminders immediately
- **Cancel Reminders**: Cancel scheduled reminders
- **Status Monitoring**: View status of all scheduled reminders for an event

## Database Schema

### New Tables

#### `event_sms_reminders`
Tracks individual scheduled reminders:
- `id`: UUID primary key
- `event_id`: Reference to events table
- `organization_id`: Reference to organizations table
- `group_id`: Reference to groups table
- `reminder_type`: Type of reminder ('before_event', 'day_of', 'follow_up')
- `scheduled_time`: When the reminder should be sent
- `sent_at`: When the reminder was actually sent (if sent)
- `status`: Current status ('scheduled', 'sent', 'cancelled', 'failed')
- `message_content`: The message that will be/was sent

### New Event Fields
Added to the `events` table:
- `enable_sms_reminders`: Boolean flag to enable SMS reminders
- `sms_reminder_timing`: JSON array of timing configurations
- `sms_reminder_groups`: JSON array of group IDs to send to

### Example JSON Structure

#### `sms_reminder_timing`
```json
[
  {"value": 24, "unit": "hours"},
  {"value": 1, "unit": "hours"},
  {"value": 30, "unit": "minutes"}
]
```

#### `sms_reminder_groups`
```json
[
  {"id": "group-uuid-1"},
  {"id": "group-uuid-2"}
]
```

## Database Functions

### `schedule_event_sms_reminders(p_event_id, p_organization_id)`
- Called automatically via trigger when events are created/updated
- Calculates reminder times based on event start date and timing configuration
- Creates individual reminder records for each group/timing combination
- Only schedules reminders for future times

### `send_scheduled_sms_reminders()`
- Called by cron job every 5 minutes
- Processes all reminders where `scheduled_time <= NOW()`
- Sends SMS to all active members in each group
- Updates reminder status to 'sent' or 'failed'

### `trigger_reminder_processing()`
- Manual trigger for testing
- Returns status message
- Useful for debugging and testing

## Frontend Components

### `EventForm.jsx`
Enhanced with SMS reminder options:
- Checkbox to enable SMS reminders
- Dynamic timing configuration (add/remove multiple timings)
- Group selection with checkboxes
- Visual feedback showing selected configuration

### `SMSReminderStatus.jsx`
Management component for viewing and managing reminders:
- Lists all scheduled reminders for an event
- Shows status, timing, and group information
- Allows cancelling scheduled reminders
- Provides test reminder functionality

## Service Functions

### `smsService.js` Extensions
New functions added:
- `scheduleEventReminders(eventId)`: Schedule reminders for an event
- `getEventReminders(eventId)`: Get all reminders for an event
- `cancelEventReminder(reminderId)`: Cancel a specific reminder
- `sendEventReminderManually(eventId, groupIds, message)`: Send immediate reminders
- `getScheduledReminders()`: Get all scheduled reminders for organization

## Usage Example

### Creating an Event with SMS Reminders

1. **Create/Edit Event**: In the event form, check "Enable SMS Reminders"
2. **Set Timing**: Add reminder timings (e.g., 24 hours before, 1 hour before)
3. **Select Groups**: Choose which groups should receive reminders
4. **Save Event**: Reminders are automatically scheduled

### Message Template
Default reminder message format:
```
Reminder: [Event Title] is coming up on [Day, Month DD, YYYY at HH:MM AM] at [Location]. We look forward to seeing you there!
```

### Testing Reminders
- Use the "Test" button in the SMS Reminder Status component
- Test messages include "TEST:" prefix to distinguish from real reminders
- Test reminders are sent immediately regardless of scheduled time

## Error Handling

### Common Issues
1. **No Phone Numbers**: Members without phone numbers are skipped
2. **Invalid Groups**: Non-existent groups are ignored
3. **Past Events**: Reminders for past times are not scheduled
4. **SMS Service Errors**: Failed sends are logged but don't stop processing

### Monitoring
- View reminder status in the SMS Reminder Status component
- Check the `scheduled_reminders_status` view for system-wide monitoring
- Failed reminders are marked with error details

## Installation & Setup

### Database Migrations
1. Apply migration `20250129000000_add_sms_event_reminders.sql`
2. Apply migration `20250129000001_setup_sms_reminder_cron.sql`

### Dependencies
- Existing SMS service must be configured
- Groups and group memberships must exist
- Members must have valid phone numbers

### Permissions
- Users can manage reminders for their organization only
- RLS policies ensure data isolation between organizations

## Monitoring & Maintenance

### Views for Monitoring
- `scheduled_reminders_status`: Shows all reminders with calculated status
- Use to identify overdue or failed reminders

### Manual Processing
```sql
-- Manually trigger reminder processing
SELECT trigger_reminder_processing();

-- View overdue reminders
SELECT * FROM scheduled_reminders_status WHERE actual_status = 'overdue';

-- Cancel all scheduled reminders for an event
UPDATE event_sms_reminders 
SET status = 'cancelled' 
WHERE event_id = 'your-event-id' AND status = 'scheduled';
```

## Configuration

### Cron Schedule
Currently set to run every 5 minutes. Can be adjusted by updating the cron job:
```sql
SELECT cron.unschedule('process-sms-reminders');
SELECT cron.schedule('process-sms-reminders', '*/1 * * * *', 'SELECT send_scheduled_sms_reminders();');
```

### Message Customization
Default message template is in the `schedule_event_sms_reminders` function. To customize:
1. Update the function with new message template
2. Re-deploy the function

## Security Considerations

- All SMS reminder data is protected by RLS policies
- Only organization members can view/manage their organization's reminders
- Phone numbers are never exposed in logs
- Test reminders are clearly marked to prevent confusion

## Future Enhancements

Potential improvements:
1. **Custom Message Templates**: Allow custom reminder messages per event
2. **Follow-up Reminders**: Send reminders after events for feedback
3. **Reminder Analytics**: Track open rates and responses
4. **A/B Testing**: Test different reminder timings and messages
5. **Personalization**: Include member-specific information in reminders
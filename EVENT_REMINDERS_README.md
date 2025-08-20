# Event SMS Reminders System

This document describes the comprehensive SMS reminder system for events that has been added to the church management application.

## Overview

The event reminders system allows church administrators to configure and automatically send SMS reminders to members about upcoming events. The system supports multiple reminder types, target audiences, and timing configurations.

## Features

### 🎯 **Flexible Targeting**
- **All Members**: Send reminders to all active members with phone numbers
- **Specific Groups**: Target members belonging to specific groups (e.g., Youth Group, Prayer Team)
- **Specific Members**: Select individual members to receive reminders
- **RSVP Attendees**: Only send to members who have RSVP'd as attending
- **RSVP Declined**: Send to members who have declined the event

### ⏰ **Configurable Timing**
- Set reminders to send any number of hours before an event (1-168 hours)
- Multiple reminders per event (e.g., 24 hours and 2 hours before)
- Automatic scheduling based on event start time

### 📝 **Customizable Messages**
- Template-based messaging with variable substitution
- Available variables:
  - `{event_title}` - Event name
  - `{event_time}` - Event start time (e.g., "10:00 AM")
  - `{event_date}` - Event date (e.g., "12/25/2024")
  - `{event_location}` - Event location
  - `{hours_until_event}` - Hours until event starts
  - `{member_name}` - Recipient's full name

### 📊 **Comprehensive Tracking**
- Detailed logs of all sent reminders
- Delivery status tracking
- Statistics and analytics
- Test message functionality

## Database Schema

### Tables Created

#### `event_reminder_configs`
Stores reminder configuration settings for each event.

```sql
CREATE TABLE event_reminder_configs (
  id UUID PRIMARY KEY,
  event_id VARCHAR(255) REFERENCES events(id),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  reminder_type TEXT DEFAULT 'sms',
  timing_hours INTEGER DEFAULT 24,
  message_template TEXT NOT NULL,
  target_groups JSONB DEFAULT '[]',
  target_members JSONB DEFAULT '[]',
  target_type TEXT DEFAULT 'all',
  is_active BOOLEAN DEFAULT true,
  last_sent TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `event_reminder_logs`
Tracks all sent reminders and their delivery status.

```sql
CREATE TABLE event_reminder_logs (
  id UUID PRIMARY KEY,
  reminder_config_id UUID REFERENCES event_reminder_configs(id),
  event_id VARCHAR(255) REFERENCES events(id),
  organization_id UUID REFERENCES organizations(id),
  member_id UUID REFERENCES members(id),
  phone_number TEXT,
  message_sent TEXT NOT NULL,
  status TEXT DEFAULT 'sent',
  twilio_sid TEXT,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE
);
```

### Functions

#### `get_event_reminder_recipients()`
Returns the appropriate list of members based on the target type and configuration.

#### `send_event_reminders()`
Database function that processes and sends reminders (used by the edge function).

## Frontend Components

### EventRemindersDialog
A comprehensive React component that provides:

- **Configuration Management**: Create, edit, and delete reminder configurations
- **Recipient Selection**: Choose target audiences with visual interfaces
- **Message Templates**: Select from predefined templates or create custom ones
- **Preview Functionality**: See how messages will appear to recipients
- **Test Sending**: Send test reminders to verify configurations
- **Logs & Analytics**: View sent reminders and delivery statistics

### Integration with Events Page
- Added "Manage Reminders" option to event dropdown menus
- Seamless integration with existing event management workflow
- Permission-based access control

## Backend Services

### EventReminderService
JavaScript service providing:

- CRUD operations for reminder configurations
- Recipient management and filtering
- Message template rendering
- Statistics and analytics
- Test message functionality

### Edge Function: `send-event-reminders`
Automated function that:

- Runs periodically to check for reminders to send
- Processes active reminder configurations
- Retrieves appropriate recipients
- Renders message templates
- Sends SMS via existing Twilio integration
- Logs all activities and updates status

## Usage Guide

### Setting Up Reminders

1. **Navigate to Events**: Go to the Events page in the application
2. **Select an Event**: Click on any event to view its details
3. **Manage Reminders**: Click the dropdown menu and select "Manage Reminders"
4. **Create Configuration**:
   - Set reminder name and description
   - Choose timing (hours before event)
   - Select target audience
   - Write or select message template
   - Preview the message
   - Save configuration

### Target Audience Options

#### All Members
- Sends to all active members with phone numbers
- Best for general announcements and important events

#### Specific Groups
- Target members belonging to specific groups
- Useful for ministry-specific events
- Select multiple groups if needed

#### Specific Members
- Choose individual members
- Good for VIP events or special invitations
- Search and select from member list

#### RSVP Attendees
- Only sends to members who have RSVP'd as attending
- Perfect for event confirmations and updates

#### RSVP Declined
- Sends to members who declined the event
- Useful for follow-up or alternative invitations

### Message Templates

#### Predefined Templates
- **Event Reminder - 24 Hours**: Standard 24-hour reminder
- **Event Reminder - 2 Hours**: Short notice reminder
- **Event Reminder - 1 Hour**: Last-minute reminder
- **Sunday Service Reminder**: Weekly service reminder

#### Custom Templates
Create custom messages using available variables:
```
Reminder: {event_title} is starting in {hours_until_event} hours at {event_time}. 
Location: {event_location}

We look forward to seeing you there, {member_name}!
```

### Testing Reminders

1. **Preview Message**: Use the preview button to see how the message will appear
2. **Send Test**: Use the test function to send a reminder to a specific phone number
3. **Check Logs**: Review the logs tab to see delivery status and history

## Configuration

### Environment Variables
Ensure these are set for SMS functionality:

```bash
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

### Cron Job Setup
To enable automatic reminder sending, set up a cron job to call the edge function:

```bash
# Run every hour
0 * * * * curl -X POST https://your-project.supabase.co/functions/v1/send-event-reminders \
  -H "Authorization: Bearer your-service-role-key"
```

## Testing

### Manual Testing
Use the provided test script:

```bash
node test_event_reminders.js
```

This script will:
- Create test reminder configurations
- Verify recipient retrieval
- Test message preview functionality
- Check reminder logs and statistics
- Test the edge function

### Automated Testing
The system includes comprehensive error handling and logging for monitoring and debugging.

## Security & Permissions

### Row Level Security (RLS)
All tables have RLS policies ensuring users can only access data for their organization.

### Permission Requirements
Users need appropriate permissions to:
- View and manage reminder configurations
- Access member data for targeting
- Send SMS messages

## Monitoring & Analytics

### Dashboard Statistics
- Total reminders sent
- Delivery success rates
- Timing breakdown
- Recipient engagement

### Logs & Debugging
- Detailed logs of all reminder activities
- Error tracking and reporting
- Delivery status updates
- Performance metrics

## Best Practices

### Timing Recommendations
- **24 hours**: Standard reminder for most events
- **2 hours**: Short notice for important events
- **1 hour**: Last-minute reminders for critical events

### Message Guidelines
- Keep messages concise (SMS character limits)
- Include essential information (time, location)
- Use personalization when possible
- Test messages before sending to large groups

### Target Audience Tips
- Use "All Members" sparingly to avoid spam
- Leverage groups for ministry-specific events
- Consider RSVP status for follow-up messages
- Respect member preferences and opt-outs

## Troubleshooting

### Common Issues

#### Reminders Not Sending
- Check if the edge function is properly deployed
- Verify cron job is running
- Ensure reminder configurations are active
- Check Twilio credentials and phone number

#### Wrong Recipients
- Verify target audience configuration
- Check member phone numbers are present
- Ensure group memberships are correct
- Review RSVP status if using RSVP-based targeting

#### Message Rendering Issues
- Check template variable syntax
- Verify event data is complete
- Test with preview function
- Review message length limits

### Support
For issues or questions about the event reminders system, check:
1. Application logs for error messages
2. Reminder logs for delivery status
3. Edge function logs for processing issues
4. Twilio dashboard for SMS delivery status

## Future Enhancements

### Planned Features
- Email reminder support
- Advanced scheduling (days, weeks, months)
- A/B testing for message effectiveness
- Member preference management
- Integration with calendar systems
- Bulk reminder management
- Advanced analytics and reporting

### Customization Options
- Custom reminder templates per organization
- Branded messaging
- Multi-language support
- Advanced targeting rules
- Conditional messaging based on member attributes
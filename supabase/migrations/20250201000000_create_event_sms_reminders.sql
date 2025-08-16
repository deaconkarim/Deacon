-- Create event SMS reminders table
-- This table stores scheduled SMS reminders for events

-- Drop the table if it exists (to handle any partial state)
DROP TABLE IF EXISTS event_sms_reminders CASCADE;

-- Create the table with proper structure
CREATE TABLE event_sms_reminders (
    id BIGSERIAL PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('day_before', 'hour_before', 'custom')),
    send_at TIMESTAMP WITH TIME ZONE NOT NULL,
    message_template TEXT NOT NULL,
    recipients_filter JSONB DEFAULT '{"type": "all_attendees"}',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add indexes for performance
CREATE INDEX idx_event_sms_reminders_event_id ON event_sms_reminders(event_id);
CREATE INDEX idx_event_sms_reminders_organization_id ON event_sms_reminders(organization_id);
CREATE INDEX idx_event_sms_reminders_send_at ON event_sms_reminders(send_at) WHERE status = 'pending';
CREATE INDEX idx_event_sms_reminders_status ON event_sms_reminders(status);

-- Enable RLS
ALTER TABLE event_sms_reminders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view SMS reminders in their organization" ON event_sms_reminders;
CREATE POLICY "Users can view SMS reminders in their organization" ON event_sms_reminders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND ou.organization_id = event_sms_reminders.organization_id
    )
  );

DROP POLICY IF EXISTS "Users can create SMS reminders in their organization" ON event_sms_reminders;
CREATE POLICY "Users can create SMS reminders in their organization" ON event_sms_reminders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND ou.organization_id = event_sms_reminders.organization_id
    )
  );

DROP POLICY IF EXISTS "Users can update SMS reminders in their organization" ON event_sms_reminders;
CREATE POLICY "Users can update SMS reminders in their organization" ON event_sms_reminders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND ou.organization_id = event_sms_reminders.organization_id
    )
  );

DROP POLICY IF EXISTS "Users can delete SMS reminders in their organization" ON event_sms_reminders;
CREATE POLICY "Users can delete SMS reminders in their organization" ON event_sms_reminders
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND ou.organization_id = event_sms_reminders.organization_id
    )
  );

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_event_sms_reminders_updated_at ON event_sms_reminders;
CREATE TRIGGER update_event_sms_reminders_updated_at 
  BEFORE UPDATE ON event_sms_reminders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE event_sms_reminders IS 'Stores scheduled SMS reminders for events';
COMMENT ON COLUMN event_sms_reminders.reminder_type IS 'Type of reminder: day_before, hour_before, or custom';
COMMENT ON COLUMN event_sms_reminders.recipients_filter IS 'JSON filter to determine who receives the reminder';
COMMENT ON COLUMN event_sms_reminders.message_template IS 'Template for the SMS message, can include placeholders like {event_name}, {event_time}';

-- Create a function to automatically create default reminders for new events
CREATE OR REPLACE FUNCTION create_default_event_reminders()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create reminders for certain event types
  IF NEW.event_type IN ('Sunday Worship Service', 'Bible Study', 'Youth Service', 'Prayer Meeting') THEN
    -- Create a day-before reminder
    INSERT INTO event_sms_reminders (
      event_id,
      organization_id,
      reminder_type,
      send_at,
      message_template,
      created_by
    ) VALUES (
      NEW.id,
      NEW.organization_id,
      'day_before',
      NEW.event_date - INTERVAL '1 day',
      'Reminder: {event_name} is tomorrow at {event_time}. We look forward to seeing you!',
      NEW.created_by
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Optionally enable automatic reminder creation (commented out by default)
-- CREATE TRIGGER create_event_reminders_trigger
--   AFTER INSERT ON events
--   FOR EACH ROW
--   EXECUTE FUNCTION create_default_event_reminders();
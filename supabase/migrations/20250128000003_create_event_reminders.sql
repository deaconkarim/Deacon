-- Create event reminders system
-- This migration adds the ability to configure and send SMS reminders for events

-- Create event_reminder_configs table
CREATE TABLE IF NOT EXISTS event_reminder_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id VARCHAR(255) REFERENCES events(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  reminder_type TEXT NOT NULL DEFAULT 'sms' CHECK (reminder_type IN ('sms', 'email')),
  timing_hours INTEGER NOT NULL DEFAULT 24, -- Hours before event to send reminder
  message_template TEXT NOT NULL,
  target_groups JSONB DEFAULT '[]', -- Array of group IDs to send to
  target_members JSONB DEFAULT '[]', -- Array of specific member IDs to send to
  target_type TEXT NOT NULL DEFAULT 'all' CHECK (target_type IN ('all', 'groups', 'members', 'rsvp_attendees', 'rsvp_declined')),
  is_active BOOLEAN DEFAULT true,
  last_sent TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, timing_hours, reminder_type)
);

-- Create event_reminder_logs table to track sent reminders
CREATE TABLE IF NOT EXISTS event_reminder_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reminder_config_id UUID REFERENCES event_reminder_configs(id) ON DELETE CASCADE,
  event_id VARCHAR(255) REFERENCES events(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  phone_number TEXT,
  message_sent TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed')),
  twilio_sid TEXT,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_event_reminder_configs_event_id ON event_reminder_configs(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reminder_configs_organization_id ON event_reminder_configs(organization_id);
CREATE INDEX IF NOT EXISTS idx_event_reminder_configs_active ON event_reminder_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_event_reminder_configs_timing ON event_reminder_configs(timing_hours);

CREATE INDEX IF NOT EXISTS idx_event_reminder_logs_config_id ON event_reminder_logs(reminder_config_id);
CREATE INDEX IF NOT EXISTS idx_event_reminder_logs_event_id ON event_reminder_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reminder_logs_organization_id ON event_reminder_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_event_reminder_logs_status ON event_reminder_logs(status);
CREATE INDEX IF NOT EXISTS idx_event_reminder_logs_sent_at ON event_reminder_logs(sent_at);

-- Enable Row Level Security
ALTER TABLE event_reminder_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_reminder_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for event_reminder_configs
DROP POLICY IF EXISTS "Users can view event reminder configs in their organization" ON event_reminder_configs;
CREATE POLICY "Users can view event reminder configs in their organization" ON event_reminder_configs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND ou.organization_id = event_reminder_configs.organization_id
    )
  );

DROP POLICY IF EXISTS "Users can create event reminder configs in their organization" ON event_reminder_configs;
CREATE POLICY "Users can create event reminder configs in their organization" ON event_reminder_configs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND ou.organization_id = event_reminder_configs.organization_id
    )
  );

DROP POLICY IF EXISTS "Users can update event reminder configs in their organization" ON event_reminder_configs;
CREATE POLICY "Users can update event reminder configs in their organization" ON event_reminder_configs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND ou.organization_id = event_reminder_configs.organization_id
    )
  );

DROP POLICY IF EXISTS "Users can delete event reminder configs in their organization" ON event_reminder_configs;
CREATE POLICY "Users can delete event reminder configs in their organization" ON event_reminder_configs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND ou.organization_id = event_reminder_configs.organization_id
    )
  );

-- Create RLS policies for event_reminder_logs
DROP POLICY IF EXISTS "Users can view event reminder logs in their organization" ON event_reminder_logs;
CREATE POLICY "Users can view event reminder logs in their organization" ON event_reminder_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND ou.organization_id = event_reminder_logs.organization_id
    )
  );

DROP POLICY IF EXISTS "Users can create event reminder logs in their organization" ON event_reminder_logs;
CREATE POLICY "Users can create event reminder logs in their organization" ON event_reminder_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND ou.organization_id = event_reminder_logs.organization_id
    )
  );

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_event_reminder_configs_updated_at ON event_reminder_configs;
CREATE TRIGGER update_event_reminder_configs_updated_at 
  BEFORE UPDATE ON event_reminder_configs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add reminder-related columns to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS reminders_enabled BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS default_reminder_hours INTEGER DEFAULT 24;
ALTER TABLE events ADD COLUMN IF NOT EXISTS reminder_message_template TEXT DEFAULT 'Reminder: {event_title} is starting in {hours_until_event} hours at {event_time}. {event_location}';

-- Create function to get members for event reminders
CREATE OR REPLACE FUNCTION get_event_reminder_recipients(
  p_event_id VARCHAR(255),
  p_target_type TEXT,
  p_target_groups JSONB DEFAULT '[]',
  p_target_members JSONB DEFAULT '[]'
)
RETURNS TABLE (
  member_id UUID,
  firstname TEXT,
  lastname TEXT,
  phone TEXT,
  email TEXT
) AS $$
BEGIN
  -- Return different sets of members based on target type
  CASE p_target_type
    WHEN 'all' THEN
      RETURN QUERY
      SELECT 
        m.id,
        m.firstname,
        m.lastname,
        m.phone,
        m.email
      FROM members m
      WHERE m.organization_id = (
        SELECT organization_id FROM events WHERE id = p_event_id
      )
      AND m.status = 'active'
      AND m.phone IS NOT NULL;
      
    WHEN 'groups' THEN
      RETURN QUERY
      SELECT DISTINCT
        m.id,
        m.firstname,
        m.lastname,
        m.phone,
        m.email
      FROM members m
      INNER JOIN group_members gm ON m.id = gm.member_id
      WHERE m.organization_id = (
        SELECT organization_id FROM events WHERE id = p_event_id
      )
      AND m.status = 'active'
      AND m.phone IS NOT NULL
      AND gm.group_id = ANY(
        SELECT jsonb_array_elements_text(p_target_groups)::UUID
      );
      
    WHEN 'members' THEN
      RETURN QUERY
      SELECT 
        m.id,
        m.firstname,
        m.lastname,
        m.phone,
        m.email
      FROM members m
      WHERE m.organization_id = (
        SELECT organization_id FROM events WHERE id = p_event_id
      )
      AND m.status = 'active'
      AND m.phone IS NOT NULL
      AND m.id = ANY(
        SELECT jsonb_array_elements_text(p_target_members)::UUID
      );
      
    WHEN 'rsvp_attendees' THEN
      RETURN QUERY
      SELECT 
        m.id,
        m.firstname,
        m.lastname,
        m.phone,
        m.email
      FROM members m
      INNER JOIN event_attendance ea ON m.id = ea.member_id
      WHERE ea.event_id = p_event_id
      AND ea.status = 'attending'
      AND m.status = 'active'
      AND m.phone IS NOT NULL;
      
    WHEN 'rsvp_declined' THEN
      RETURN QUERY
      SELECT 
        m.id,
        m.firstname,
        m.lastname,
        m.phone,
        m.email
      FROM members m
      INNER JOIN event_attendance ea ON m.id = ea.member_id
      WHERE ea.event_id = p_event_id
      AND ea.status = 'declined'
      AND m.status = 'active'
      AND m.phone IS NOT NULL;
      
    ELSE
      RETURN;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to send event reminders
CREATE OR REPLACE FUNCTION send_event_reminders()
RETURNS void AS $$
DECLARE
  reminder_record RECORD;
  member_record RECORD;
  message_text TEXT;
  hours_until_event INTEGER;
  event_record RECORD;
BEGIN
  -- Get all active reminder configs that need to be sent
  FOR reminder_record IN
    SELECT 
      erc.*,
      e.title as event_title,
      e.start_date,
      e.end_date,
      e.location as event_location,
      e.organization_id
    FROM event_reminder_configs erc
    INNER JOIN events e ON erc.event_id = e.id
    WHERE erc.is_active = true
    AND e.start_date > NOW()
    AND e.start_date <= NOW() + INTERVAL '1 hour'
    AND (
      erc.last_sent IS NULL 
      OR erc.last_sent < e.start_date - INTERVAL '1 day'
    )
    AND e.start_date - INTERVAL '1 hour' * erc.timing_hours <= NOW()
    AND e.start_date - INTERVAL '1 hour' * erc.timing_hours > NOW() - INTERVAL '1 hour'
  LOOP
    -- Calculate hours until event
    hours_until_event := EXTRACT(EPOCH FROM (reminder_record.start_date - NOW())) / 3600;
    
    -- Get event details for template variables
    SELECT 
      title,
      start_date,
      end_date,
      location,
      description
    INTO event_record
    FROM events
    WHERE id = reminder_record.event_id;
    
    -- Get recipients
    FOR member_record IN
      SELECT * FROM get_event_reminder_recipients(
        reminder_record.event_id,
        reminder_record.target_type,
        reminder_record.target_groups,
        reminder_record.target_members
      )
    LOOP
      -- Render message template
      message_text := reminder_record.message_template;
      message_text := REPLACE(message_text, '{event_title}', COALESCE(event_record.title, 'Event'));
      message_text := REPLACE(message_text, '{event_time}', TO_CHAR(event_record.start_date, 'HH:MI AM'));
      message_text := REPLACE(message_text, '{event_date}', TO_CHAR(event_record.start_date, 'MM/DD/YYYY'));
      message_text := REPLACE(message_text, '{event_location}', COALESCE(event_record.location, 'TBD'));
      message_text := REPLACE(message_text, '{hours_until_event}', hours_until_event::TEXT);
      message_text := REPLACE(message_text, '{member_name}', member_record.firstname || ' ' || member_record.lastname);
      
      -- Insert reminder log
      INSERT INTO event_reminder_logs (
        reminder_config_id,
        event_id,
        organization_id,
        member_id,
        phone_number,
        message_sent,
        status
      ) VALUES (
        reminder_record.id,
        reminder_record.event_id,
        reminder_record.organization_id,
        member_record.member_id,
        member_record.phone,
        message_text,
        'sent'
      );
      
      -- Send SMS via the existing SMS service
      -- This would typically call an external function or service
      -- For now, we'll just log it
      RAISE NOTICE 'Sending reminder to % (%): %', 
        member_record.firstname || ' ' || member_record.lastname,
        member_record.phone,
        message_text;
    END LOOP;
    
    -- Update last_sent timestamp
    UPDATE event_reminder_configs 
    SET last_sent = NOW()
    WHERE id = reminder_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a cron job to run reminders every hour
-- Note: This requires pg_cron extension to be enabled
-- SELECT cron.schedule('send-event-reminders', '0 * * * *', 'SELECT send_event_reminders();');

-- Insert default reminder templates
INSERT INTO sms_templates (name, description, template_text, variables) VALUES
  ('Event Reminder - 24 Hours', 'Remind members about events 24 hours before', 'Reminder: {event_title} is tomorrow at {event_time}. We hope to see you there! {event_location}', '["event_title", "event_time", "event_location"]'),
  ('Event Reminder - 2 Hours', 'Remind members about events 2 hours before', 'Reminder: {event_title} starts in 2 hours at {event_time}. {event_location}', '["event_title", "event_time", "event_location"]'),
  ('Event Reminder - 1 Hour', 'Remind members about events 1 hour before', 'Reminder: {event_title} starts in 1 hour at {event_time}. {event_location}', '["event_title", "event_time", "event_location"]'),
  ('Sunday Service Reminder', 'Weekly reminder for Sunday service', 'Join us this Sunday at {event_time} for worship! {event_location}', '["event_time", "event_location"]')
ON CONFLICT (name) DO NOTHING;
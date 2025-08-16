-- Fix SMS reminders migration issues
-- This migration addresses the sequence error and ensures proper setup

-- First, ensure the events table has the SMS reminder columns
-- (Safe to run even if columns already exist)
DO $$ 
BEGIN
    -- Add SMS reminder columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'events' AND column_name = 'enable_sms_reminders') THEN
        ALTER TABLE events ADD COLUMN enable_sms_reminders BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'events' AND column_name = 'sms_reminder_timing') THEN
        ALTER TABLE events ADD COLUMN sms_reminder_timing JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'events' AND column_name = 'sms_reminder_groups') THEN
        ALTER TABLE events ADD COLUMN sms_reminder_groups JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Create event_sms_reminders table if it doesn't exist
CREATE TABLE IF NOT EXISTS event_sms_reminders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id VARCHAR(255) NOT NULL,
    organization_id UUID NOT NULL,
    group_id UUID,
    reminder_type VARCHAR(50) NOT NULL DEFAULT 'before_event',
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'cancelled', 'failed')),
    message_content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
    -- Check and add events foreign key
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'event_sms_reminders_event_id_fkey') THEN
        ALTER TABLE event_sms_reminders 
        ADD CONSTRAINT event_sms_reminders_event_id_fkey 
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
    END IF;
    
    -- Check and add organizations foreign key
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'event_sms_reminders_organization_id_fkey') THEN
        ALTER TABLE event_sms_reminders 
        ADD CONSTRAINT event_sms_reminders_organization_id_fkey 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
    
    -- Check and add groups foreign key
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'event_sms_reminders_group_id_fkey') THEN
        ALTER TABLE event_sms_reminders 
        ADD CONSTRAINT event_sms_reminders_group_id_fkey 
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_event_sms_reminders_scheduled_time 
ON event_sms_reminders(scheduled_time) WHERE status = 'scheduled';

CREATE INDEX IF NOT EXISTS idx_event_sms_reminders_event_id 
ON event_sms_reminders(event_id);

CREATE INDEX IF NOT EXISTS idx_event_sms_reminders_organization_id 
ON event_sms_reminders(organization_id);

-- Create or replace the schedule function
CREATE OR REPLACE FUNCTION schedule_event_sms_reminders(
    p_event_id VARCHAR(255),
    p_organization_id UUID
) RETURNS VOID AS $$
DECLARE
    event_record RECORD;
    reminder_config JSONB;
    group_config JSONB;
    reminder_time TIMESTAMP WITH TIME ZONE;
    message_template TEXT;
BEGIN
    -- Get event details
    SELECT * INTO event_record 
    FROM events 
    WHERE id = p_event_id AND organization_id = p_organization_id;
    
    -- Only proceed if event exists and SMS reminders are enabled
    IF NOT FOUND OR NOT COALESCE(event_record.enable_sms_reminders, FALSE) THEN
        RETURN;
    END IF;
    
    -- Delete existing scheduled reminders for this event
    DELETE FROM event_sms_reminders 
    WHERE event_id = p_event_id AND status = 'scheduled';
    
    -- Only proceed if we have timing and groups configured
    IF event_record.sms_reminder_timing IS NULL OR 
       event_record.sms_reminder_groups IS NULL OR
       jsonb_array_length(event_record.sms_reminder_timing) = 0 OR
       jsonb_array_length(event_record.sms_reminder_groups) = 0 THEN
        RETURN;
    END IF;
    
    -- Create reminders for each timing configuration
    FOR reminder_config IN SELECT * FROM jsonb_array_elements(event_record.sms_reminder_timing)
    LOOP
        -- Calculate reminder time
        reminder_time := event_record.start_date - 
            INTERVAL '1' * (reminder_config->>'value')::integer * 
            CASE reminder_config->>'unit'
                WHEN 'minutes' THEN interval '1 minute'
                WHEN 'hours' THEN interval '1 hour'
                WHEN 'days' THEN interval '1 day'
                WHEN 'weeks' THEN interval '1 week'
                ELSE interval '1 hour'
            END;
        
        -- Only schedule if reminder time is in the future
        IF reminder_time > NOW() THEN
            -- Create message template
            message_template := 'Reminder: ' || COALESCE(event_record.title, 'Event') || 
                               ' is coming up on ' || 
                               TO_CHAR(event_record.start_date, 'Day, Month DD, YYYY at HH12:MI AM');
            
            IF event_record.location IS NOT NULL AND event_record.location != '' THEN
                message_template := message_template || ' at ' || event_record.location;
            END IF;
            
            message_template := message_template || '. We look forward to seeing you there!';
            
            -- Create reminders for each group
            FOR group_config IN SELECT * FROM jsonb_array_elements(event_record.sms_reminder_groups)
            LOOP
                -- Verify the group exists before creating reminder
                IF EXISTS (SELECT 1 FROM groups WHERE id = (group_config->>'id')::UUID AND organization_id = p_organization_id) THEN
                    INSERT INTO event_sms_reminders (
                        event_id,
                        organization_id,
                        group_id,
                        reminder_type,
                        scheduled_time,
                        message_content
                    ) VALUES (
                        p_event_id,
                        p_organization_id,
                        (group_config->>'id')::UUID,
                        'before_event',
                        reminder_time,
                        message_template
                    );
                END IF;
            END LOOP;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the send function
CREATE OR REPLACE FUNCTION send_scheduled_sms_reminders() RETURNS VOID AS $$
DECLARE
    reminder_record RECORD;
    member_record RECORD;
    organization_name TEXT := 'Our Church';
BEGIN
    -- Process all due reminders
    FOR reminder_record IN 
        SELECT * FROM event_sms_reminders 
        WHERE status = 'scheduled' 
        AND scheduled_time <= NOW()
        ORDER BY scheduled_time
    LOOP
        BEGIN
            -- Get organization name
            SELECT name INTO organization_name 
            FROM organizations 
            WHERE id = reminder_record.organization_id;
            
            -- Get all members in the group with valid phone numbers
            FOR member_record IN
                SELECT DISTINCT m.id, m.firstname, m.lastname, m.phone
                FROM members m
                INNER JOIN group_members gm ON m.id = gm.member_id
                WHERE gm.group_id = reminder_record.group_id
                AND m.organization_id = reminder_record.organization_id
                AND m.phone IS NOT NULL 
                AND m.phone != ''
                AND COALESCE(m.status, 'active') = 'active'
            LOOP
                -- Insert SMS message record
                INSERT INTO sms_messages (
                    organization_id,
                    to_number,
                    body,
                    member_id,
                    direction,
                    status,
                    sent_at
                ) VALUES (
                    reminder_record.organization_id,
                    member_record.phone,
                    reminder_record.message_content,
                    member_record.id,
                    'outbound',
                    'queued',
                    NOW()
                );
            END LOOP;
            
            -- Mark reminder as sent
            UPDATE event_sms_reminders 
            SET status = 'sent', sent_at = NOW(), updated_at = NOW()
            WHERE id = reminder_record.id;
            
        EXCEPTION
            WHEN OTHERS THEN
                -- Mark reminder as failed
                UPDATE event_sms_reminders 
                SET status = 'failed', updated_at = NOW()
                WHERE id = reminder_record.id;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION trigger_schedule_event_sms_reminders() 
RETURNS TRIGGER AS $$
BEGIN
    -- Only schedule reminders if SMS reminders are enabled
    IF COALESCE(NEW.enable_sms_reminders, FALSE) = TRUE THEN
        PERFORM schedule_event_sms_reminders(NEW.id, NEW.organization_id);
    ELSE
        -- Cancel any existing scheduled reminders if SMS reminders are disabled
        UPDATE event_sms_reminders 
        SET status = 'cancelled', updated_at = NOW()
        WHERE event_id = NEW.id AND status = 'scheduled';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger to ensure it works properly
DROP TRIGGER IF EXISTS trigger_schedule_event_sms_reminders_on_change ON events;
CREATE TRIGGER trigger_schedule_event_sms_reminders_on_change
    AFTER INSERT OR UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION trigger_schedule_event_sms_reminders();

-- Enable RLS if not already enabled
ALTER TABLE event_sms_reminders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view SMS reminders for their organization" ON event_sms_reminders;
DROP POLICY IF EXISTS "Users can insert SMS reminders for their organization" ON event_sms_reminders;
DROP POLICY IF EXISTS "Users can update SMS reminders for their organization" ON event_sms_reminders;

-- Create RLS policies
CREATE POLICY "Users can view SMS reminders for their organization" ON event_sms_reminders
    FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert SMS reminders for their organization" ON event_sms_reminders
    FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update SMS reminders for their organization" ON event_sms_reminders
    FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    ));

-- Grant permissions (no sequence needed for UUID primary keys)
GRANT SELECT, INSERT, UPDATE ON event_sms_reminders TO authenticated;

-- Add comments
COMMENT ON TABLE event_sms_reminders IS 'Tracks scheduled SMS reminders for events';
COMMENT ON COLUMN events.enable_sms_reminders IS 'Whether SMS reminders are enabled for this event';
COMMENT ON COLUMN events.sms_reminder_timing IS 'JSON array of reminder times';
COMMENT ON COLUMN events.sms_reminder_groups IS 'JSON array of group IDs to send reminders to';
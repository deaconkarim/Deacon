-- Add SMS reminder fields to events table
ALTER TABLE events 
ADD COLUMN enable_sms_reminders BOOLEAN DEFAULT FALSE,
ADD COLUMN sms_reminder_timing JSONB DEFAULT '[]'::jsonb,
ADD COLUMN sms_reminder_groups JSONB DEFAULT '[]'::jsonb;

-- Create comments for the new columns
COMMENT ON COLUMN events.enable_sms_reminders IS 'Whether SMS reminders are enabled for this event';
COMMENT ON COLUMN events.sms_reminder_timing IS 'JSON array of reminder times (e.g., [{"value": 24, "unit": "hours"}, {"value": 1, "unit": "days"}])';
COMMENT ON COLUMN events.sms_reminder_groups IS 'JSON array of group IDs to send reminders to';

-- Create a table to track scheduled reminders
CREATE TABLE event_sms_reminders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id VARCHAR(255) REFERENCES events(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    reminder_type VARCHAR(50) NOT NULL, -- 'before_event', 'day_of', 'follow_up'
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'cancelled', 'failed')),
    message_content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for efficient querying of scheduled reminders
CREATE INDEX idx_event_sms_reminders_scheduled_time ON event_sms_reminders(scheduled_time) WHERE status = 'scheduled';
CREATE INDEX idx_event_sms_reminders_event_id ON event_sms_reminders(event_id);
CREATE INDEX idx_event_sms_reminders_organization_id ON event_sms_reminders(organization_id);

-- Create function to schedule SMS reminders for an event
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
    
    -- Only proceed if SMS reminders are enabled
    IF NOT event_record.enable_sms_reminders THEN
        RETURN;
    END IF;
    
    -- Delete existing scheduled reminders for this event
    DELETE FROM event_sms_reminders 
    WHERE event_id = p_event_id AND status = 'scheduled';
    
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
            message_template := 'Reminder: ' || event_record.title || 
                               ' is coming up on ' || 
                               TO_CHAR(event_record.start_date, 'Day, Month DD, YYYY at HH12:MI AM');
            
            IF event_record.location IS NOT NULL AND event_record.location != '' THEN
                message_template := message_template || ' at ' || event_record.location;
            END IF;
            
            message_template := message_template || '. We look forward to seeing you there!';
            
            -- Create reminders for each group
            FOR group_config IN SELECT * FROM jsonb_array_elements(event_record.sms_reminder_groups)
            LOOP
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
            END LOOP;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to send scheduled SMS reminders
CREATE OR REPLACE FUNCTION send_scheduled_sms_reminders() RETURNS VOID AS $$
DECLARE
    reminder_record RECORD;
    member_record RECORD;
    church_name TEXT := 'Our Church';
BEGIN
    -- Get church name from settings
    SELECT name INTO church_name 
    FROM organizations 
    WHERE id = (
        SELECT organization_id 
        FROM event_sms_reminders 
        WHERE status = 'scheduled' 
        AND scheduled_time <= NOW() 
        LIMIT 1
    );
    
    -- Process all due reminders
    FOR reminder_record IN 
        SELECT * FROM event_sms_reminders 
        WHERE status = 'scheduled' 
        AND scheduled_time <= NOW()
        ORDER BY scheduled_time
    LOOP
        BEGIN
            -- Get all members in the group with valid phone numbers
            FOR member_record IN
                SELECT DISTINCT m.id, m.firstname, m.lastname, m.phone
                FROM members m
                INNER JOIN group_members gm ON m.id = gm.member_id
                WHERE gm.group_id = reminder_record.group_id
                AND m.organization_id = reminder_record.organization_id
                AND m.phone IS NOT NULL 
                AND m.phone != ''
                AND m.status = 'active'
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

-- Create trigger to automatically schedule reminders when event is created/updated
CREATE OR REPLACE FUNCTION trigger_schedule_event_sms_reminders() 
RETURNS TRIGGER AS $$
BEGIN
    -- Only schedule reminders if SMS reminders are enabled
    IF NEW.enable_sms_reminders = TRUE THEN
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

-- Create the trigger
CREATE TRIGGER trigger_schedule_event_sms_reminders_on_change
    AFTER INSERT OR UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION trigger_schedule_event_sms_reminders();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON event_sms_reminders TO authenticated;
GRANT USAGE ON SEQUENCE event_sms_reminders_id_seq TO authenticated;

-- Create RLS policies for event_sms_reminders
ALTER TABLE event_sms_reminders ENABLE ROW LEVEL SECURITY;

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

-- Add comment to document the feature
COMMENT ON TABLE event_sms_reminders IS 'Tracks scheduled SMS reminders for events';
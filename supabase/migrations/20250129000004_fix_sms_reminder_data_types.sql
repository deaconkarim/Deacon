-- Hotfix for SMS reminder data type issues
-- This migration fixes the "cannot get array length of a scalar" error

-- First, let's clean up any malformed data in existing events
UPDATE events 
SET 
    sms_reminder_timing = '[]'::jsonb
WHERE 
    sms_reminder_timing IS NOT NULL 
    AND jsonb_typeof(sms_reminder_timing) != 'array';

UPDATE events 
SET 
    sms_reminder_groups = '[]'::jsonb
WHERE 
    sms_reminder_groups IS NOT NULL 
    AND jsonb_typeof(sms_reminder_groups) != 'array';

-- Update any null values to empty arrays
UPDATE events 
SET 
    sms_reminder_timing = '[]'::jsonb
WHERE sms_reminder_timing IS NULL;

UPDATE events 
SET 
    sms_reminder_groups = '[]'::jsonb
WHERE sms_reminder_groups IS NULL;

-- Add constraints to ensure these fields are always arrays
ALTER TABLE events 
ADD CONSTRAINT check_sms_reminder_timing_is_array 
CHECK (sms_reminder_timing IS NULL OR jsonb_typeof(sms_reminder_timing) = 'array');

ALTER TABLE events 
ADD CONSTRAINT check_sms_reminder_groups_is_array 
CHECK (sms_reminder_groups IS NULL OR jsonb_typeof(sms_reminder_groups) = 'array');

-- Create an improved version of the schedule function that's more robust
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
    timing_array JSONB;
    groups_array JSONB;
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
    
    -- Normalize timing data to array format
    timing_array := COALESCE(event_record.sms_reminder_timing, '[]'::jsonb);
    IF jsonb_typeof(timing_array) != 'array' THEN
        timing_array := '[]'::jsonb;
    END IF;
    
    -- Normalize groups data to array format  
    groups_array := COALESCE(event_record.sms_reminder_groups, '[]'::jsonb);
    IF jsonb_typeof(groups_array) != 'array' THEN
        groups_array := '[]'::jsonb;
    END IF;
    
    -- Only proceed if we have both timing and groups configured
    IF jsonb_array_length(timing_array) = 0 OR jsonb_array_length(groups_array) = 0 THEN
        RETURN;
    END IF;
    
    -- Create reminders for each timing configuration
    FOR reminder_config IN SELECT * FROM jsonb_array_elements(timing_array)
    LOOP
        -- Validate reminder config has required fields
        IF NOT (reminder_config ? 'value' AND reminder_config ? 'unit') THEN
            CONTINUE;
        END IF;
        
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
            FOR group_config IN SELECT * FROM jsonb_array_elements(groups_array)
            LOOP
                -- Validate group config has id field
                IF NOT (group_config ? 'id') THEN
                    CONTINUE;
                END IF;
                
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
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the entire operation
        RAISE WARNING 'Error scheduling SMS reminders for event %: %', p_event_id, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the trigger function to be more robust
CREATE OR REPLACE FUNCTION trigger_schedule_event_sms_reminders() 
RETURNS TRIGGER AS $$
BEGIN
    -- Only schedule reminders if SMS reminders are enabled
    IF COALESCE(NEW.enable_sms_reminders, FALSE) = TRUE THEN
        BEGIN
            PERFORM schedule_event_sms_reminders(NEW.id, NEW.organization_id);
        EXCEPTION
            WHEN OTHERS THEN
                -- Log warning but don't fail the event creation/update
                RAISE WARNING 'Failed to schedule SMS reminders for event %: %', NEW.id, SQLERRM;
        END;
    ELSE
        -- Cancel any existing scheduled reminders if SMS reminders are disabled
        UPDATE event_sms_reminders 
        SET status = 'cancelled', updated_at = NOW()
        WHERE event_id = NEW.id AND status = 'scheduled';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add a function to validate and fix SMS reminder data
CREATE OR REPLACE FUNCTION fix_sms_reminder_data()
RETURNS TEXT AS $$
DECLARE
    fixed_count INTEGER := 0;
    event_record RECORD;
BEGIN
    -- Fix any events with malformed SMS reminder data
    FOR event_record IN 
        SELECT id, sms_reminder_timing, sms_reminder_groups 
        FROM events 
        WHERE enable_sms_reminders = TRUE
    LOOP
        -- Check and fix timing data
        IF event_record.sms_reminder_timing IS NOT NULL AND 
           jsonb_typeof(event_record.sms_reminder_timing) != 'array' THEN
            UPDATE events 
            SET sms_reminder_timing = '[]'::jsonb 
            WHERE id = event_record.id;
            fixed_count := fixed_count + 1;
        END IF;
        
        -- Check and fix groups data
        IF event_record.sms_reminder_groups IS NOT NULL AND 
           jsonb_typeof(event_record.sms_reminder_groups) != 'array' THEN
            UPDATE events 
            SET sms_reminder_groups = '[]'::jsonb 
            WHERE id = event_record.id;
            fixed_count := fixed_count + 1;
        END IF;
    END LOOP;
    
    RETURN 'Fixed ' || fixed_count || ' malformed SMS reminder data entries.';
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION fix_sms_reminder_data() TO authenticated;

-- Run the fix function
SELECT fix_sms_reminder_data();

-- Add comments
COMMENT ON CONSTRAINT check_sms_reminder_timing_is_array ON events IS 'Ensures sms_reminder_timing is always a JSON array';
COMMENT ON CONSTRAINT check_sms_reminder_groups_is_array ON events IS 'Ensures sms_reminder_groups is always a JSON array';
COMMENT ON FUNCTION fix_sms_reminder_data IS 'Utility function to fix malformed SMS reminder data in events table';
-- Create the send_event_reminders function that the cron job is calling
CREATE OR REPLACE FUNCTION public.send_event_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    reminder_record RECORD;
    event_record RECORD;
    member_record RECORD;
    message_text TEXT;
    hours_until_event INTEGER;
    organization_id UUID;
    twilio_account_sid TEXT;
    twilio_auth_token TEXT;
    twilio_phone_number TEXT;
    twilio_url TEXT;
    response_status INTEGER;
    response_body TEXT;
BEGIN
    -- Get Twilio credentials from environment variables
    twilio_account_sid := current_setting('app.twilio_account_sid', true);
    twilio_auth_token := current_setting('app.twilio_auth_token', true);
    twilio_phone_number := current_setting('app.twilio_phone_number', true);
    
    -- Check if Twilio is configured
    IF twilio_account_sid IS NULL OR twilio_auth_token IS NULL OR twilio_phone_number IS NULL THEN
        RAISE LOG 'Twilio credentials not configured. Skipping SMS reminders.';
        RETURN;
    END IF;
    
    -- Process active reminder configurations
    FOR reminder_record IN 
        SELECT 
            erc.*,
            e.title as event_title,
            e.start_date as event_start_date,
            e.end_date as event_end_date,
            e.location as event_location
        FROM event_reminder_configs erc
        JOIN events e ON erc.event_id = e.id
        WHERE erc.is_active = true
        AND e.start_date > NOW()
        AND e.start_date <= NOW() + INTERVAL '1 hour'
        AND erc.timing_hours = EXTRACT(EPOCH FROM (e.start_date - NOW())) / 3600
    LOOP
        RAISE LOG 'Processing reminder for event: % (ID: %)', reminder_record.event_title, reminder_record.event_id;
        
        -- Calculate hours until event
        hours_until_event := EXTRACT(EPOCH FROM (reminder_record.event_start_date - NOW())) / 3600;
        
        -- Only send if it's within the timing window (within 1 hour of the scheduled time)
        IF hours_until_event <= reminder_record.timing_hours AND hours_until_event > (reminder_record.timing_hours - 1) THEN
            
            -- Get recipients based on target type
            IF reminder_record.target_type = 'all' THEN
                -- Send to all active members with phone numbers
                FOR member_record IN 
                    SELECT id, firstname, lastname, phone
                    FROM members 
                    WHERE organization_id = reminder_record.organization_id
                    AND status = 'active'
                    AND phone IS NOT NULL
                    AND phone != ''
                LOOP
                    PERFORM send_sms_reminder(
                        reminder_record.id,
                        reminder_record.event_id,
                        member_record.id,
                        member_record.phone,
                        reminder_record.message_template,
                        reminder_record.event_title,
                        reminder_record.event_start_date,
                        reminder_record.event_location,
                        hours_until_event,
                        member_record.firstname || ' ' || member_record.lastname
                    );
                END LOOP;
                
            ELSIF reminder_record.target_type = 'groups' THEN
                -- Send to members of specified groups
                FOR member_record IN 
                    SELECT DISTINCT m.id, m.firstname, m.lastname, m.phone
                    FROM members m
                    JOIN group_members gm ON m.id = gm.member_id
                    WHERE gm.group_id = ANY(reminder_record.target_groups::uuid[])
                    AND m.organization_id = reminder_record.organization_id
                    AND m.status = 'active'
                    AND m.phone IS NOT NULL
                    AND m.phone != ''
                LOOP
                    PERFORM send_sms_reminder(
                        reminder_record.id,
                        reminder_record.event_id,
                        member_record.id,
                        member_record.phone,
                        reminder_record.message_template,
                        reminder_record.event_title,
                        reminder_record.event_start_date,
                        reminder_record.event_location,
                        hours_until_event,
                        member_record.firstname || ' ' || member_record.lastname
                    );
                END LOOP;
                
            ELSIF reminder_record.target_type = 'members' THEN
                -- Send to specific members
                FOR member_record IN 
                    SELECT id, firstname, lastname, phone
                    FROM members 
                    WHERE id = ANY(reminder_record.target_members::uuid[])
                    AND organization_id = reminder_record.organization_id
                    AND status = 'active'
                    AND phone IS NOT NULL
                    AND phone != ''
                LOOP
                    PERFORM send_sms_reminder(
                        reminder_record.id,
                        reminder_record.event_id,
                        member_record.id,
                        member_record.phone,
                        reminder_record.message_template,
                        reminder_record.event_title,
                        reminder_record.event_start_date,
                        reminder_record.event_location,
                        hours_until_event,
                        member_record.firstname || ' ' || member_record.lastname
                    );
                END LOOP;
            END IF;
            
            -- Update last_sent timestamp
            UPDATE event_reminder_configs 
            SET last_sent = NOW()
            WHERE id = reminder_record.id;
            
        END IF;
    END LOOP;
END;
$$;

-- Helper function to send SMS and log the result
CREATE OR REPLACE FUNCTION send_sms_reminder(
    reminder_config_id UUID,
    event_id UUID,
    member_id UUID,
    phone_number TEXT,
    message_template TEXT,
    event_title TEXT,
    event_start_date TIMESTAMPTZ,
    event_location TEXT,
    hours_until_event INTEGER,
    member_name TEXT
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    message_text TEXT;
    twilio_account_sid TEXT;
    twilio_auth_token TEXT;
    twilio_phone_number TEXT;
    twilio_url TEXT;
    response_status INTEGER;
    response_body TEXT;
    log_id UUID;
BEGIN
    -- Render message template
    message_text := message_template;
    message_text := REPLACE(message_text, '{event_title}', event_title);
    message_text := REPLACE(message_text, '{event_time}', TO_CHAR(event_start_date, 'HH:MI AM'));
    message_text := REPLACE(message_text, '{event_date}', TO_CHAR(event_start_date, 'MM/DD/YYYY'));
    message_text := REPLACE(message_text, '{event_location}', COALESCE(event_location, 'TBD'));
    message_text := REPLACE(message_text, '{hours_until_event}', hours_until_event::TEXT);
    message_text := REPLACE(message_text, '{member_name}', member_name);
    
    -- Get Twilio credentials
    twilio_account_sid := current_setting('app.twilio_account_sid', true);
    twilio_auth_token := current_setting('app.twilio_auth_token', true);
    twilio_phone_number := current_setting('app.twilio_phone_number', true);
    
    -- Log the attempt
    INSERT INTO event_reminder_logs (
        reminder_config_id,
        event_id,
        member_id,
        phone_number,
        message_sent,
        status,
        sent_at
    ) VALUES (
        reminder_config_id,
        event_id,
        member_id,
        phone_number,
        message_text,
        'attempting',
        NOW()
    ) RETURNING id INTO log_id;
    
    -- Try to send SMS via HTTP request to Twilio
    BEGIN
        SELECT status, content INTO response_status, response_body
        FROM http((
            'POST',
            'https://api.twilio.com/2010-04-01/Accounts/' || twilio_account_sid || '/Messages.json',
            ARRAY[
                ('Authorization', 'Basic ' || encode(twilio_account_sid || ':' || twilio_auth_token, 'base64'))::http_header,
                ('Content-Type', 'application/x-www-form-urlencoded')::http_header
            ],
            'application/x-www-form-urlencoded',
            'To=' || phone_number || '&From=' || twilio_phone_number || '&Body=' || encode_uri_component(message_text)
        ));
        
        -- Update log with result
        IF response_status = 201 THEN
            UPDATE event_reminder_logs 
            SET status = 'sent', twilio_sid = (response_body::json->>'sid')
            WHERE id = log_id;
            RAISE LOG 'SMS sent successfully to % for event %', phone_number, event_title;
        ELSE
            UPDATE event_reminder_logs 
            SET status = 'failed', error_message = response_body
            WHERE id = log_id;
            RAISE LOG 'SMS failed to % for event %: %', phone_number, event_title, response_body;
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        -- Log the error
        UPDATE event_reminder_logs 
        SET status = 'failed', error_message = SQLERRM
        WHERE id = log_id;
        RAISE LOG 'SMS error to % for event %: %', phone_number, event_title, SQLERRM;
    END;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.send_event_reminders() TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_sms_reminder(UUID, UUID, UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ, TEXT, INTEGER, TEXT) TO authenticated;

-- Alternative SMS reminder setup that doesn't require pg_cron
-- This migration provides fallback options for environments where pg_cron is not available

-- Create a function to manually trigger reminder processing (for testing and manual execution)
CREATE OR REPLACE FUNCTION trigger_reminder_processing() 
RETURNS TEXT AS $$
DECLARE
    processed_count INTEGER := 0;
    reminder_record RECORD;
BEGIN
    -- Count scheduled reminders that are due
    SELECT COUNT(*) INTO processed_count
    FROM event_sms_reminders 
    WHERE status = 'scheduled' 
    AND scheduled_time <= NOW();
    
    -- Call the main processing function
    PERFORM send_scheduled_sms_reminders();
    
    RETURN 'SMS reminder processing completed. ' || processed_count || ' reminders were due for processing.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for the manual trigger
GRANT EXECUTE ON FUNCTION trigger_reminder_processing() TO authenticated;

-- Create a view to monitor scheduled reminders
CREATE OR REPLACE VIEW scheduled_reminders_status AS
SELECT 
    er.id,
    er.event_id,
    e.title as event_title,
    e.start_date as event_start_date,
    er.scheduled_time,
    er.status,
    er.sent_at,
    g.name as group_name,
    er.message_content,
    CASE 
        WHEN er.scheduled_time <= NOW() AND er.status = 'scheduled' THEN 'overdue'
        WHEN er.scheduled_time > NOW() AND er.status = 'scheduled' THEN 'pending'
        ELSE er.status
    END as actual_status,
    EXTRACT(EPOCH FROM (NOW() - er.scheduled_time))/60 as minutes_overdue,
    er.created_at,
    er.updated_at
FROM event_sms_reminders er
INNER JOIN events e ON er.event_id = e.id
LEFT JOIN groups g ON er.group_id = g.id
ORDER BY er.scheduled_time ASC;

-- Grant access to the view
GRANT SELECT ON scheduled_reminders_status TO authenticated;

-- Create RLS policy for the view (if supported)
DO $$
BEGIN
    -- Try to set security barrier on the view
    ALTER VIEW scheduled_reminders_status SET (security_barrier = true);
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore if not supported
        NULL;
END $$;

-- Create a function to get reminder statistics
CREATE OR REPLACE FUNCTION get_reminder_stats()
RETURNS TABLE(
    total_scheduled INTEGER,
    overdue_count INTEGER,
    sent_today INTEGER,
    failed_count INTEGER,
    next_reminder_time TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM event_sms_reminders WHERE status = 'scheduled') as total_scheduled,
        (SELECT COUNT(*)::INTEGER FROM event_sms_reminders WHERE status = 'scheduled' AND scheduled_time <= NOW()) as overdue_count,
        (SELECT COUNT(*)::INTEGER FROM event_sms_reminders WHERE status = 'sent' AND sent_at >= CURRENT_DATE) as sent_today,
        (SELECT COUNT(*)::INTEGER FROM event_sms_reminders WHERE status = 'failed') as failed_count,
        (SELECT MIN(scheduled_time) FROM event_sms_reminders WHERE status = 'scheduled' AND scheduled_time > NOW()) as next_reminder_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for the stats function
GRANT EXECUTE ON FUNCTION get_reminder_stats() TO authenticated;

-- Try to set up pg_cron if available, but don't fail if it's not
DO $$
BEGIN
    -- Check if pg_cron extension exists
    IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
        -- Try to create the extension
        BEGIN
            CREATE EXTENSION IF NOT EXISTS pg_cron;
            
            -- Check if the job exists before trying to unschedule it
            IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-sms-reminders') THEN
                PERFORM cron.unschedule('process-sms-reminders');
            END IF;
            
            -- Create the cron job
            PERFORM cron.schedule(
                'process-sms-reminders',
                '*/5 * * * *',
                'SELECT send_scheduled_sms_reminders();'
            );
            
            RAISE NOTICE 'pg_cron extension enabled and SMS reminder job scheduled successfully';
            
        EXCEPTION
            WHEN insufficient_privilege THEN
                RAISE NOTICE 'pg_cron extension requires superuser privileges. SMS reminders will need to be processed manually or via external scheduler.';
            WHEN OTHERS THEN
                RAISE NOTICE 'Failed to set up pg_cron: %. SMS reminders will need to be processed manually.', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'pg_cron extension is not available. SMS reminders will need to be processed manually or via external scheduler.';
    END IF;
END $$;

-- Create instructions table for manual processing
CREATE TABLE IF NOT EXISTS sms_reminder_instructions (
    id SERIAL PRIMARY KEY,
    instruction_type VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    command_example TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert instructions for manual processing
INSERT INTO sms_reminder_instructions (instruction_type, title, description, command_example) VALUES
(
    'manual_processing',
    'Manual SMS Reminder Processing',
    'If automatic processing is not set up, you can manually process SMS reminders by calling this function.',
    'SELECT trigger_reminder_processing();'
),
(
    'monitoring',
    'Monitor Reminder Status',
    'Check the status of all scheduled SMS reminders and identify any that are overdue.',
    'SELECT * FROM scheduled_reminders_status WHERE actual_status = ''overdue'';'
),
(
    'statistics',
    'Get Reminder Statistics',
    'View overall statistics about SMS reminders including counts and next scheduled time.',
    'SELECT * FROM get_reminder_stats();'
),
(
    'cleanup',
    'Clean Up Old Reminders',
    'Remove old reminder records that are no longer needed (older than 30 days).',
    'DELETE FROM event_sms_reminders WHERE created_at < NOW() - INTERVAL ''30 days'' AND status IN (''sent'', ''failed'', ''cancelled'');'
)
ON CONFLICT DO NOTHING;

-- Grant access to instructions
GRANT SELECT ON sms_reminder_instructions TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION trigger_reminder_processing IS 'Manual trigger for SMS reminder processing - useful when automatic cron job is not available';
COMMENT ON VIEW scheduled_reminders_status IS 'View showing the status of all scheduled SMS reminders with calculated status';
COMMENT ON FUNCTION get_reminder_stats IS 'Returns overall statistics about SMS reminders';
COMMENT ON TABLE sms_reminder_instructions IS 'Instructions for manually managing SMS reminders when automatic processing is not available';

-- Final notice
DO $$
BEGIN
    RAISE NOTICE '=== SMS Reminder Setup Complete ===';
    RAISE NOTICE 'If automatic processing was set up successfully, reminders will be processed every 5 minutes.';
    RAISE NOTICE 'If not, you can manually process reminders by running: SELECT trigger_reminder_processing();';
    RAISE NOTICE 'Monitor reminders with: SELECT * FROM scheduled_reminders_status;';
    RAISE NOTICE 'View setup instructions: SELECT * FROM sms_reminder_instructions;';
END $$;
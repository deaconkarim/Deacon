-- Enable the pg_cron extension if not already enabled
-- Note: This may require superuser permissions
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove any existing cron job with the same name
SELECT cron.unschedule('process-sms-reminders');

-- Create a cron job to process SMS reminders every 5 minutes
-- This will call our database function that processes scheduled reminders
SELECT cron.schedule(
    'process-sms-reminders',  -- job name
    '*/5 * * * *',            -- every 5 minutes
    'SELECT send_scheduled_sms_reminders();'
);

-- Grant necessary permissions for the cron job
GRANT EXECUTE ON FUNCTION send_scheduled_sms_reminders() TO postgres;
GRANT EXECUTE ON FUNCTION send_scheduled_sms_reminders() TO authenticated;

-- Create a function to manually trigger reminder processing (for testing)
CREATE OR REPLACE FUNCTION trigger_reminder_processing() 
RETURNS TEXT AS $$
BEGIN
    PERFORM send_scheduled_sms_reminders();
    RETURN 'SMS reminder processing triggered successfully';
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
    NOW() - er.scheduled_time as time_diff
FROM event_sms_reminders er
INNER JOIN events e ON er.event_id = e.id
INNER JOIN groups g ON er.group_id = g.id
ORDER BY er.scheduled_time ASC;

-- Grant access to the view
GRANT SELECT ON scheduled_reminders_status TO authenticated;

-- Create RLS policy for the view
ALTER VIEW scheduled_reminders_status SET (security_barrier = true);

-- Add comment explaining the setup
COMMENT ON EXTENSION pg_cron IS 'Cron extension for scheduling SMS reminder processing';
COMMENT ON FUNCTION trigger_reminder_processing IS 'Manual trigger for SMS reminder processing - useful for testing';
COMMENT ON VIEW scheduled_reminders_status IS 'View showing the status of all scheduled SMS reminders';
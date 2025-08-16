-- Fix for missing event_sms_reminders_id_seq sequence
-- This creates the sequence if it doesn't exist

DO $$
BEGIN
    -- Check if the sequence exists
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'event_sms_reminders_id_seq') THEN
        -- Create the sequence
        CREATE SEQUENCE public.event_sms_reminders_id_seq
            START WITH 1
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1;
        
        RAISE NOTICE 'Created missing sequence: event_sms_reminders_id_seq';
    ELSE
        RAISE NOTICE 'Sequence event_sms_reminders_id_seq already exists';
    END IF;
END $$;

-- Optional: If you also need the table, uncomment below
/*
CREATE TABLE IF NOT EXISTS event_sms_reminders (
    id INTEGER PRIMARY KEY DEFAULT nextval('event_sms_reminders_id_seq'),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    reminder_type TEXT NOT NULL,
    send_at TIMESTAMP WITH TIME ZONE NOT NULL,
    message TEXT NOT NULL,
    recipients JSONB DEFAULT '[]',
    status TEXT DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS if needed
ALTER TABLE event_sms_reminders ENABLE ROW LEVEL SECURITY;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_event_sms_reminders_event_id ON event_sms_reminders(event_id);
CREATE INDEX IF NOT EXISTS idx_event_sms_reminders_send_at ON event_sms_reminders(send_at);
CREATE INDEX IF NOT EXISTS idx_event_sms_reminders_status ON event_sms_reminders(status);
*/
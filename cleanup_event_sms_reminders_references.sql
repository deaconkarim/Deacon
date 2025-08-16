-- Cleanup script to remove orphaned references to event_sms_reminders

-- 1. Drop the sequence if it exists but the table doesn't
DO $$
BEGIN
    -- Check if sequence exists but table doesn't
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'event_sms_reminders_id_seq')
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_sms_reminders') THEN
        
        DROP SEQUENCE IF EXISTS public.event_sms_reminders_id_seq CASCADE;
        RAISE NOTICE 'Dropped orphaned sequence: event_sms_reminders_id_seq';
    END IF;
END $$;

-- 2. Drop any orphaned foreign key constraints
DO $$
DECLARE
    constraint_rec RECORD;
BEGIN
    FOR constraint_rec IN 
        SELECT
            tc.table_schema,
            tc.table_name,
            tc.constraint_name
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND ccu.table_name = 'event_sms_reminders'
            AND NOT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'event_sms_reminders'
            )
    LOOP
        EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT %I CASCADE',
            constraint_rec.table_schema,
            constraint_rec.table_name,
            constraint_rec.constraint_name);
        RAISE NOTICE 'Dropped orphaned foreign key constraint: %.%.%',
            constraint_rec.table_schema,
            constraint_rec.table_name,
            constraint_rec.constraint_name;
    END LOOP;
END $$;

-- 3. Update any automation rules that might reference SMS reminders for events
UPDATE automation_rules
SET 
    action_type = 'send_email',
    action_data = jsonb_set(
        action_data,
        '{note}',
        '"SMS reminder action disabled - table does not exist"'::jsonb
    ),
    is_active = false
WHERE action_type = 'send_sms'
    AND action_data::text LIKE '%event_sms_reminders%';

-- 4. Log what we found and cleaned up
DO $$
DECLARE
    found_references INTEGER := 0;
BEGIN
    -- Check for any remaining references in functions
    SELECT COUNT(*) INTO found_references
    FROM pg_proc
    WHERE prosrc LIKE '%event_sms_reminders%';
    
    IF found_references > 0 THEN
        RAISE WARNING 'Found % function(s) that still reference event_sms_reminders. Manual review required.', found_references;
    END IF;
    
    -- Check for any remaining references in views
    SELECT COUNT(*) INTO found_references
    FROM pg_views
    WHERE definition LIKE '%event_sms_reminders%';
    
    IF found_references > 0 THEN
        RAISE WARNING 'Found % view(s) that still reference event_sms_reminders. Manual review required.', found_references;
    END IF;
    
    RAISE NOTICE 'Cleanup completed. If you still get errors, run the diagnostic script to find remaining references.';
END $$;
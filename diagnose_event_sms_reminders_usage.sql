-- Diagnostic script to find what's using event_sms_reminders_id_seq

-- 1. Check if the table exists
SELECT 
    'Table existence check' as check_type,
    EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'event_sms_reminders'
    ) as exists;

-- 2. Check for any columns using this sequence as default
SELECT 
    'Columns using sequence' as check_type,
    table_schema,
    table_name,
    column_name,
    column_default
FROM information_schema.columns
WHERE column_default LIKE '%event_sms_reminders_id_seq%';

-- 3. Check for any views that might reference this table
SELECT 
    'Views referencing table' as check_type,
    viewname,
    definition
FROM pg_views
WHERE definition LIKE '%event_sms_reminders%';

-- 4. Check for any functions that might reference this sequence
SELECT 
    'Functions referencing sequence' as check_type,
    proname as function_name,
    prosrc as function_source
FROM pg_proc
WHERE prosrc LIKE '%event_sms_reminders%';

-- 5. Check for any triggers that might reference this
SELECT 
    'Triggers referencing' as check_type,
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE action_statement LIKE '%event_sms_reminders%';

-- 6. Check for foreign keys referencing this table
SELECT
    'Foreign keys' as check_type,
    tc.table_schema, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND (ccu.table_name = 'event_sms_reminders' OR tc.table_name = 'event_sms_reminders');

-- 7. Check recent error logs (if you have access)
-- This would show you the exact query that's failing
-- SELECT * FROM pg_stat_activity WHERE state = 'idle in transaction' AND query LIKE '%event_sms_reminders%';

-- 8. List all sequences to see if it's named differently
SELECT 
    'All sequences' as check_type,
    schemaname,
    sequencename
FROM pg_sequences
WHERE sequencename LIKE '%sms%' OR sequencename LIKE '%event%reminder%'
ORDER BY sequencename;
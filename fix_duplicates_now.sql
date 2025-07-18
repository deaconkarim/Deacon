-- IMMEDIATE FIX: Remove duplicate attendance records
-- This will fix the unique constraint violation error

-- Remove all duplicate records, keeping only the first one
DELETE FROM public.event_attendance
WHERE id IN (
    SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY event_id, anonymous_name 
                   ORDER BY created_at
               ) as rn
        FROM public.event_attendance
        WHERE anonymous_name IS NOT NULL
    ) ranked
    WHERE rn > 1
);

-- Verify the fix
SELECT 
    'Records after cleanup' as status,
    COUNT(*) as count
FROM public.event_attendance; 
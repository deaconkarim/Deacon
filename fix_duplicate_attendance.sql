-- Fix Duplicate Attendance Records
-- This script removes duplicate attendance records and ensures data integrity

-- Step 1: Check for duplicate records
SELECT 
    'Duplicate records found' as status,
    COUNT(*) as count
FROM (
    SELECT event_id, anonymous_name, COUNT(*) as duplicate_count
    FROM public.event_attendance
    WHERE anonymous_name IS NOT NULL
    GROUP BY event_id, anonymous_name
    HAVING COUNT(*) > 1
) duplicates;

-- Step 2: Show details of duplicates
SELECT 
    event_id,
    anonymous_name,
    COUNT(*) as duplicate_count,
    MIN(created_at) as first_record,
    MAX(created_at) as last_record
FROM public.event_attendance
WHERE anonymous_name IS NOT NULL
GROUP BY event_id, anonymous_name
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Step 3: Remove duplicate records (keep the first one)
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

-- Step 4: Verify the fix
SELECT 
    'Remaining records after cleanup' as status,
    COUNT(*) as count
FROM public.event_attendance;

-- Step 5: Show final statistics
SELECT 
    'Events with attendance' as metric,
    COUNT(DISTINCT event_id) as count
FROM public.event_attendance
UNION ALL
SELECT 
    'Total attendance records' as metric,
    COUNT(*) as count
FROM public.event_attendance
UNION ALL
SELECT 
    'Unique attendees' as metric,
    COUNT(DISTINCT anonymous_name) as count
FROM public.event_attendance
WHERE anonymous_name IS NOT NULL;

-- Step 6: Show sample of clean data
SELECT 
    ea.anonymous_name,
    e.title as event_title,
    e.event_type,
    ea.status,
    ea.created_at
FROM public.event_attendance ea
JOIN public.events e ON ea.event_id = e.id
WHERE ea.organization_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY e.start_date, ea.anonymous_name
LIMIT 20; 
-- This script removes duplicate attendance records and ensures data integrity

-- Step 1: Check for duplicate records
SELECT 
    'Duplicate records found' as status,
    COUNT(*) as count
FROM (
    SELECT event_id, anonymous_name, COUNT(*) as duplicate_count
    FROM public.event_attendance
    WHERE anonymous_name IS NOT NULL
    GROUP BY event_id, anonymous_name
    HAVING COUNT(*) > 1
) duplicates;

-- Step 2: Show details of duplicates
SELECT 
    event_id,
    anonymous_name,
    COUNT(*) as duplicate_count,
    MIN(created_at) as first_record,
    MAX(created_at) as last_record
FROM public.event_attendance
WHERE anonymous_name IS NOT NULL
GROUP BY event_id, anonymous_name
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Step 3: Remove duplicate records (keep the first one)
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

-- Step 4: Verify the fix
SELECT 
    'Remaining records after cleanup' as status,
    COUNT(*) as count
FROM public.event_attendance;

-- Step 5: Show final statistics
SELECT 
    'Events with attendance' as metric,
    COUNT(DISTINCT event_id) as count
FROM public.event_attendance
UNION ALL
SELECT 
    'Total attendance records' as metric,
    COUNT(*) as count
FROM public.event_attendance
UNION ALL
SELECT 
    'Unique attendees' as metric,
    COUNT(DISTINCT anonymous_name) as count
FROM public.event_attendance
WHERE anonymous_name IS NOT NULL;

-- Step 6: Show sample of clean data
SELECT 
    ea.anonymous_name,
    e.title as event_title,
    e.event_type,
    ea.status,
    ea.created_at
FROM public.event_attendance ea
JOIN public.events e ON ea.event_id = e.id
WHERE ea.organization_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY e.start_date, ea.anonymous_name
LIMIT 20; 
-- This script removes duplicate attendance records and ensures data integrity

-- Step 1: Check for duplicate records
SELECT 
    'Duplicate records found' as status,
    COUNT(*) as count
FROM (
    SELECT event_id, anonymous_name, COUNT(*) as duplicate_count
    FROM public.event_attendance
    WHERE anonymous_name IS NOT NULL
    GROUP BY event_id, anonymous_name
    HAVING COUNT(*) > 1
) duplicates;

-- Step 2: Show details of duplicates
SELECT 
    event_id,
    anonymous_name,
    COUNT(*) as duplicate_count,
    MIN(created_at) as first_record,
    MAX(created_at) as last_record
FROM public.event_attendance
WHERE anonymous_name IS NOT NULL
GROUP BY event_id, anonymous_name
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Step 3: Remove duplicate records (keep the first one)
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

-- Step 4: Verify the fix
SELECT 
    'Remaining records after cleanup' as status,
    COUNT(*) as count
FROM public.event_attendance;

-- Step 5: Show final statistics
SELECT 
    'Events with attendance' as metric,
    COUNT(DISTINCT event_id) as count
FROM public.event_attendance
UNION ALL
SELECT 
    'Total attendance records' as metric,
    COUNT(*) as count
FROM public.event_attendance
UNION ALL
SELECT 
    'Unique attendees' as metric,
    COUNT(DISTINCT anonymous_name) as count
FROM public.event_attendance
WHERE anonymous_name IS NOT NULL;

-- Step 6: Show sample of clean data
SELECT 
    ea.anonymous_name,
    e.title as event_title,
    e.event_type,
    ea.status,
    ea.created_at
FROM public.event_attendance ea
JOIN public.events e ON ea.event_id = e.id
WHERE ea.organization_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY e.start_date, ea.anonymous_name
LIMIT 20; 
-- Complete Attendance Fix
-- This script fixes all orphaned attendance records and creates proper events

-- Step 1: Check current state
SELECT 
    'Current state' as status,
    COUNT(*) as attendance_records,
    (SELECT COUNT(*) FROM public.events) as events_count
FROM public.event_attendance;

-- Step 2: Create all missing events based on the attendance records
INSERT INTO public.events (
    id,
    title,
    event_type,
    start_date,
    end_date,
    organization_id,
    location,
    description,
    created_at,
    updated_at
) VALUES 
    -- Sunday Worship Services
    (
        'sunday-morning-worship-service-1746381600000-2025-07-06t18-00-00-000z',
        'Sunday Morning Worship Service',
        'Worship Service',
        '2025-01-05T10:00:00Z',
        '2025-01-05T11:30:00Z',
        '550e8400-e29b-41d4-a716-446655440000',
        'Main Sanctuary',
        'Sunday morning worship service',
        NOW(),
        NOW()
    ),
    (
        'sunday-morning-worship-service-1746381600000-2025-07-13t18-00-00-000z',
        'Sunday Morning Worship Service',
        'Worship Service',
        '2025-01-12T10:00:00Z',
        '2025-01-12T11:30:00Z',
        '550e8400-e29b-41d4-a716-446655440000',
        'Main Sanctuary',
        'Sunday morning worship service',
        NOW(),
        NOW()
    ),
    -- Bible Studies
    (
        'tuesday-bible-study-1748980800000-2025-07-15t20-00-00-000z',
        'Tuesday Bible Study',
        'Bible Study',
        '2025-01-14T19:00:00Z',
        '2025-01-14T20:30:00Z',
        '550e8400-e29b-41d4-a716-446655440000',
        'Fellowship Hall',
        'Tuesday evening Bible study',
        NOW(),
        NOW()
    ),
    (
        'wednesday-bible-study-1749088800000-2025-07-17t02-00-00-000z',
        'Wednesday Bible Study',
        'Bible Study',
        '2025-01-15T19:00:00Z',
        '2025-01-15T20:30:00Z',
        '550e8400-e29b-41d4-a716-446655440000',
        'Fellowship Hall',
        'Wednesday evening Bible study',
        NOW(),
        NOW()
    ),
    (
        'wednesday-bible-study-1749088800000-2025-07-10t02-00-00-000z',
        'Wednesday Bible Study',
        'Bible Study',
        '2025-01-08T19:00:00Z',
        '2025-01-08T20:30:00Z',
        '550e8400-e29b-41d4-a716-446655440000',
        'Fellowship Hall',
        'Wednesday evening Bible study',
        NOW(),
        NOW()
    ),
    -- Special Events
    (
        'fifth-sunday-potluck-1751225400000',
        'Fifth Sunday Potluck',
        'Fellowship',
        '2025-01-26T12:00:00Z',
        '2025-01-26T14:00:00Z',
        '550e8400-e29b-41d4-a716-446655440000',
        'Fellowship Hall',
        'Fifth Sunday potluck lunch',
        NOW(),
        NOW()
    ),
    (
        'men-s-ministry-breakfast-1747497600000',
        'Men\'s Ministry Breakfast',
        'Fellowship',
        '2025-01-17T07:00:00Z',
        '2025-01-17T08:30:00Z',
        '550e8400-e29b-41d4-a716-446655440000',
        'Fellowship Hall',
        'Men\'s ministry breakfast meeting',
        NOW(),
        NOW()
    );

-- Step 3: Remove ALL duplicate attendance records (keep only the first one for each event-anonymous combination)
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

-- Step 4: Update all attendance records to have proper organization_id
UPDATE public.event_attendance
SET organization_id = '550e8400-e29b-41d4-a716-446655440000'
WHERE organization_id IS NULL;

-- Step 5: Verify the fix
SELECT 
    'After fix' as status,
    COUNT(*) as attendance_records,
    (SELECT COUNT(*) FROM public.events) as events_count
FROM public.event_attendance;

-- Step 6: Show final statistics
SELECT 
    'Events created' as metric,
    COUNT(*) as count
FROM public.events
UNION ALL
SELECT 
    'Attendance records remaining' as metric,
    COUNT(*) as count
FROM public.event_attendance
UNION ALL
SELECT 
    'Unique attendees' as metric,
    COUNT(DISTINCT anonymous_name) as count
FROM public.event_attendance
WHERE anonymous_name IS NOT NULL;

-- Step 7: Show sample of clean data
SELECT 
    ea.anonymous_name,
    e.title as event_title,
    e.event_type,
    ea.status,
    ea.created_at
FROM public.event_attendance ea
JOIN public.events e ON ea.event_id = e.id
ORDER BY e.start_date, ea.anonymous_name
LIMIT 20;

-- Step 8: Verify no duplicates remain
SELECT 
    'Duplicate check' as status,
    COUNT(*) as duplicate_count
FROM (
    SELECT event_id, anonymous_name, COUNT(*) as duplicate_count
    FROM public.event_attendance
    WHERE anonymous_name IS NOT NULL
    GROUP BY event_id, anonymous_name
    HAVING COUNT(*) > 1
) duplicates; 
-- This script fixes all orphaned attendance records and creates proper events

-- Step 1: Check current state
SELECT 
    'Current state' as status,
    COUNT(*) as attendance_records,
    (SELECT COUNT(*) FROM public.events) as events_count
FROM public.event_attendance;

-- Step 2: Create all missing events based on the attendance records
INSERT INTO public.events (
    id,
    title,
    event_type,
    start_date,
    end_date,
    organization_id,
    location,
    description,
    created_at,
    updated_at
) VALUES 
    -- Sunday Worship Services
    (
        'sunday-morning-worship-service-1746381600000-2025-07-06t18-00-00-000z',
        'Sunday Morning Worship Service',
        'Worship Service',
        '2025-01-05T10:00:00Z',
        '2025-01-05T11:30:00Z',
        '550e8400-e29b-41d4-a716-446655440000',
        'Main Sanctuary',
        'Sunday morning worship service',
        NOW(),
        NOW()
    ),
    (
        'sunday-morning-worship-service-1746381600000-2025-07-13t18-00-00-000z',
        'Sunday Morning Worship Service',
        'Worship Service',
        '2025-01-12T10:00:00Z',
        '2025-01-12T11:30:00Z',
        '550e8400-e29b-41d4-a716-446655440000',
        'Main Sanctuary',
        'Sunday morning worship service',
        NOW(),
        NOW()
    ),
    -- Bible Studies
    (
        'tuesday-bible-study-1748980800000-2025-07-15t20-00-00-000z',
        'Tuesday Bible Study',
        'Bible Study',
        '2025-01-14T19:00:00Z',
        '2025-01-14T20:30:00Z',
        '550e8400-e29b-41d4-a716-446655440000',
        'Fellowship Hall',
        'Tuesday evening Bible study',
        NOW(),
        NOW()
    ),
    (
        'wednesday-bible-study-1749088800000-2025-07-17t02-00-00-000z',
        'Wednesday Bible Study',
        'Bible Study',
        '2025-01-15T19:00:00Z',
        '2025-01-15T20:30:00Z',
        '550e8400-e29b-41d4-a716-446655440000',
        'Fellowship Hall',
        'Wednesday evening Bible study',
        NOW(),
        NOW()
    ),
    (
        'wednesday-bible-study-1749088800000-2025-07-10t02-00-00-000z',
        'Wednesday Bible Study',
        'Bible Study',
        '2025-01-08T19:00:00Z',
        '2025-01-08T20:30:00Z',
        '550e8400-e29b-41d4-a716-446655440000',
        'Fellowship Hall',
        'Wednesday evening Bible study',
        NOW(),
        NOW()
    ),
    -- Special Events
    (
        'fifth-sunday-potluck-1751225400000',
        'Fifth Sunday Potluck',
        'Fellowship',
        '2025-01-26T12:00:00Z',
        '2025-01-26T14:00:00Z',
        '550e8400-e29b-41d4-a716-446655440000',
        'Fellowship Hall',
        'Fifth Sunday potluck lunch',
        NOW(),
        NOW()
    ),
    (
        'men-s-ministry-breakfast-1747497600000',
        'Men\'s Ministry Breakfast',
        'Fellowship',
        '2025-01-17T07:00:00Z',
        '2025-01-17T08:30:00Z',
        '550e8400-e29b-41d4-a716-446655440000',
        'Fellowship Hall',
        'Men\'s ministry breakfast meeting',
        NOW(),
        NOW()
    );

-- Step 3: Remove ALL duplicate attendance records (keep only the first one for each event-anonymous combination)
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

-- Step 4: Update all attendance records to have proper organization_id
UPDATE public.event_attendance
SET organization_id = '550e8400-e29b-41d4-a716-446655440000'
WHERE organization_id IS NULL;

-- Step 5: Verify the fix
SELECT 
    'After fix' as status,
    COUNT(*) as attendance_records,
    (SELECT COUNT(*) FROM public.events) as events_count
FROM public.event_attendance;

-- Step 6: Show final statistics
SELECT 
    'Events created' as metric,
    COUNT(*) as count
FROM public.events
UNION ALL
SELECT 
    'Attendance records remaining' as metric,
    COUNT(*) as count
FROM public.event_attendance
UNION ALL
SELECT 
    'Unique attendees' as metric,
    COUNT(DISTINCT anonymous_name) as count
FROM public.event_attendance
WHERE anonymous_name IS NOT NULL;

-- Step 7: Show sample of clean data
SELECT 
    ea.anonymous_name,
    e.title as event_title,
    e.event_type,
    ea.status,
    ea.created_at
FROM public.event_attendance ea
JOIN public.events e ON ea.event_id = e.id
ORDER BY e.start_date, ea.anonymous_name
LIMIT 20;

-- Step 8: Verify no duplicates remain
SELECT 
    'Duplicate check' as status,
    COUNT(*) as duplicate_count
FROM (
    SELECT event_id, anonymous_name, COUNT(*) as duplicate_count
    FROM public.event_attendance
    WHERE anonymous_name IS NOT NULL
    GROUP BY event_id, anonymous_name
    HAVING COUNT(*) > 1
) duplicates; 
-- This script fixes all orphaned attendance records and creates proper events

-- Step 1: Check current state
SELECT 
    'Current state' as status,
    COUNT(*) as attendance_records,
    (SELECT COUNT(*) FROM public.events) as events_count
FROM public.event_attendance;

-- Step 2: Create all missing events based on the attendance records
INSERT INTO public.events (
    id,
    title,
    event_type,
    start_date,
    end_date,
    organization_id,
    location,
    description,
    created_at,
    updated_at
) VALUES 
    -- Sunday Worship Services
    (
        'sunday-morning-worship-service-1746381600000-2025-07-06t18-00-00-000z',
        'Sunday Morning Worship Service',
        'Worship Service',
        '2025-01-05T10:00:00Z',
        '2025-01-05T11:30:00Z',
        '550e8400-e29b-41d4-a716-446655440000',
        'Main Sanctuary',
        'Sunday morning worship service',
        NOW(),
        NOW()
    ),
    (
        'sunday-morning-worship-service-1746381600000-2025-07-13t18-00-00-000z',
        'Sunday Morning Worship Service',
        'Worship Service',
        '2025-01-12T10:00:00Z',
        '2025-01-12T11:30:00Z',
        '550e8400-e29b-41d4-a716-446655440000',
        'Main Sanctuary',
        'Sunday morning worship service',
        NOW(),
        NOW()
    ),
    -- Bible Studies
    (
        'tuesday-bible-study-1748980800000-2025-07-15t20-00-00-000z',
        'Tuesday Bible Study',
        'Bible Study',
        '2025-01-14T19:00:00Z',
        '2025-01-14T20:30:00Z',
        '550e8400-e29b-41d4-a716-446655440000',
        'Fellowship Hall',
        'Tuesday evening Bible study',
        NOW(),
        NOW()
    ),
    (
        'wednesday-bible-study-1749088800000-2025-07-17t02-00-00-000z',
        'Wednesday Bible Study',
        'Bible Study',
        '2025-01-15T19:00:00Z',
        '2025-01-15T20:30:00Z',
        '550e8400-e29b-41d4-a716-446655440000',
        'Fellowship Hall',
        'Wednesday evening Bible study',
        NOW(),
        NOW()
    ),
    (
        'wednesday-bible-study-1749088800000-2025-07-10t02-00-00-000z',
        'Wednesday Bible Study',
        'Bible Study',
        '2025-01-08T19:00:00Z',
        '2025-01-08T20:30:00Z',
        '550e8400-e29b-41d4-a716-446655440000',
        'Fellowship Hall',
        'Wednesday evening Bible study',
        NOW(),
        NOW()
    ),
    -- Special Events
    (
        'fifth-sunday-potluck-1751225400000',
        'Fifth Sunday Potluck',
        'Fellowship',
        '2025-01-26T12:00:00Z',
        '2025-01-26T14:00:00Z',
        '550e8400-e29b-41d4-a716-446655440000',
        'Fellowship Hall',
        'Fifth Sunday potluck lunch',
        NOW(),
        NOW()
    ),
    (
        'men-s-ministry-breakfast-1747497600000',
        'Men\'s Ministry Breakfast',
        'Fellowship',
        '2025-01-17T07:00:00Z',
        '2025-01-17T08:30:00Z',
        '550e8400-e29b-41d4-a716-446655440000',
        'Fellowship Hall',
        'Men\'s ministry breakfast meeting',
        NOW(),
        NOW()
    );

-- Step 3: Remove ALL duplicate attendance records (keep only the first one for each event-anonymous combination)
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

-- Step 4: Update all attendance records to have proper organization_id
UPDATE public.event_attendance
SET organization_id = '550e8400-e29b-41d4-a716-446655440000'
WHERE organization_id IS NULL;

-- Step 5: Verify the fix
SELECT 
    'After fix' as status,
    COUNT(*) as attendance_records,
    (SELECT COUNT(*) FROM public.events) as events_count
FROM public.event_attendance;

-- Step 6: Show final statistics
SELECT 
    'Events created' as metric,
    COUNT(*) as count
FROM public.events
UNION ALL
SELECT 
    'Attendance records remaining' as metric,
    COUNT(*) as count
FROM public.event_attendance
UNION ALL
SELECT 
    'Unique attendees' as metric,
    COUNT(DISTINCT anonymous_name) as count
FROM public.event_attendance
WHERE anonymous_name IS NOT NULL;

-- Step 7: Show sample of clean data
SELECT 
    ea.anonymous_name,
    e.title as event_title,
    e.event_type,
    ea.status,
    ea.created_at
FROM public.event_attendance ea
JOIN public.events e ON ea.event_id = e.id
ORDER BY e.start_date, ea.anonymous_name
LIMIT 20;

-- Step 8: Verify no duplicates remain
SELECT 
    'Duplicate check' as status,
    COUNT(*) as duplicate_count
FROM (
    SELECT event_id, anonymous_name, COUNT(*) as duplicate_count
    FROM public.event_attendance
    WHERE anonymous_name IS NOT NULL
    GROUP BY event_id, anonymous_name
    HAVING COUNT(*) > 1
) duplicates; 
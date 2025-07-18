-- Event Attendance Restoration Script
-- Run this in your Supabase SQL Editor to restore attendance data
-- This script bypasses RLS policies by using admin privileges

-- Step 1: Create events
INSERT INTO public.events (
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
    (
        'Sunday Worship Service - January 7, 2024',
        'Worship Service',
        '2024-01-07T10:00:00Z',
        '2024-01-07T11:30:00Z',
        '550e8400-e29b-41d4-a716-446655440000',
        'Main Sanctuary',
        'Sunday morning worship service',
        NOW(),
        NOW()
    ),
    (
        'Wednesday Bible Study - January 10, 2024',
        'Bible Study',
        '2024-01-10T19:00:00Z',
        '2024-01-10T20:30:00Z',
        '550e8400-e29b-41d4-a716-446655440000',
        'Fellowship Hall',
        'Midweek Bible study',
        NOW(),
        NOW()
    ),
    (
        'Sunday Worship Service - January 14, 2024',
        'Worship Service',
        '2024-01-14T10:00:00Z',
        '2024-01-14T11:30:00Z',
        '550e8400-e29b-41d4-a716-446655440000',
        'Main Sanctuary',
        'Sunday morning worship service',
        NOW(),
        NOW()
    ),
    (
        'Prayer Meeting - January 17, 2024',
        'Prayer Meeting',
        '2024-01-17T19:00:00Z',
        '2024-01-17T20:00:00Z',
        '550e8400-e29b-41d4-a716-446655440000',
        'Prayer Room',
        'Weekly prayer meeting',
        NOW(),
        NOW()
    ),
    (
        'Sunday Worship Service - January 21, 2024',
        'Worship Service',
        '2024-01-21T10:00:00Z',
        '2024-01-21T11:30:00Z',
        '550e8400-e29b-41d4-a716-446655440000',
        'Main Sanctuary',
        'Sunday morning worship service',
        NOW(),
        NOW()
    );

-- Step 2: Create attendance records for the first event (Sunday Worship Service - January 7)
INSERT INTO public.event_attendance (
    event_id,
    organization_id,
    anonymous_name,
    status,
    created_at
)
SELECT 
    e.id as event_id,
    e.organization_id,
    member_name as anonymous_name,
    'attending' as status,
    NOW() as created_at
FROM public.events e
CROSS JOIN (
    VALUES 
        ('Anthony Grose'),
        ('Maryjane Grose'),
        ('Karim Maguid'),
        ('Amber Maguid'),
        ('Carol Baldwin'),
        ('Wendy Berman'),
        ('Roy Blanchard'),
        ('Millie Blanchard'),
        ('John Borsdorf'),
        ('Kathy Borsdorf'),
        ('Dan Burch'),
        ('Jane Burch'),
        ('Leslie Butler'),
        ('Debora Chew'),
        ('Coral Eggers')
) AS members(member_name)
WHERE e.title = 'Sunday Worship Service - January 7, 2024';

-- Step 3: Create attendance records for the second event (Wednesday Bible Study)
INSERT INTO public.event_attendance (
    event_id,
    organization_id,
    anonymous_name,
    status,
    created_at
)
SELECT 
    e.id as event_id,
    e.organization_id,
    member_name as anonymous_name,
    'attending' as status,
    NOW() as created_at
FROM public.events e
CROSS JOIN (
    VALUES 
        ('Anthony Grose'),
        ('Maryjane Grose'),
        ('Karim Maguid'),
        ('Amber Maguid'),
        ('Carol Baldwin'),
        ('Wendy Berman'),
        ('Roy Blanchard'),
        ('Millie Blanchard'),
        ('John Borsdorf'),
        ('Kathy Borsdorf'),
        ('Dan Burch'),
        ('Jane Burch')
) AS members(member_name)
WHERE e.title = 'Wednesday Bible Study - January 10, 2024';

-- Step 4: Create attendance records for the third event (Sunday Worship Service - January 14)
INSERT INTO public.event_attendance (
    event_id,
    organization_id,
    anonymous_name,
    status,
    created_at
)
SELECT 
    e.id as event_id,
    e.organization_id,
    member_name as anonymous_name,
    'attending' as status,
    NOW() as created_at
FROM public.events e
CROSS JOIN (
    VALUES 
        ('Anthony Grose'),
        ('Maryjane Grose'),
        ('Karim Maguid'),
        ('Amber Maguid'),
        ('Carol Baldwin'),
        ('Wendy Berman'),
        ('Roy Blanchard'),
        ('Millie Blanchard'),
        ('John Borsdorf'),
        ('Kathy Borsdorf'),
        ('Dan Burch'),
        ('Jane Burch'),
        ('Leslie Butler'),
        ('Debora Chew'),
        ('Coral Eggers'),
        ('Donald Fraasch'),
        ('Anna Fraasch')
) AS members(member_name)
WHERE e.title = 'Sunday Worship Service - January 14, 2024';

-- Step 5: Create attendance records for the fourth event (Prayer Meeting)
INSERT INTO public.event_attendance (
    event_id,
    organization_id,
    anonymous_name,
    status,
    created_at
)
SELECT 
    e.id as event_id,
    e.organization_id,
    member_name as anonymous_name,
    'attending' as status,
    NOW() as created_at
FROM public.events e
CROSS JOIN (
    VALUES 
        ('Anthony Grose'),
        ('Maryjane Grose'),
        ('Karim Maguid'),
        ('Carol Baldwin'),
        ('Wendy Berman'),
        ('Roy Blanchard'),
        ('Millie Blanchard'),
        ('Leslie Butler'),
        ('Donald Fraasch'),
        ('Anna Fraasch')
) AS members(member_name)
WHERE e.title = 'Prayer Meeting - January 17, 2024';

-- Step 6: Create attendance records for the fifth event (Sunday Worship Service - January 21)
INSERT INTO public.event_attendance (
    event_id,
    organization_id,
    anonymous_name,
    status,
    created_at
)
SELECT 
    e.id as event_id,
    e.organization_id,
    member_name as anonymous_name,
    'attending' as status,
    NOW() as created_at
FROM public.events e
CROSS JOIN (
    VALUES 
        ('Anthony Grose'),
        ('Maryjane Grose'),
        ('Karim Maguid'),
        ('Amber Maguid'),
        ('Carol Baldwin'),
        ('Wendy Berman'),
        ('Roy Blanchard'),
        ('Millie Blanchard'),
        ('John Borsdorf'),
        ('Kathy Borsdorf'),
        ('Dan Burch'),
        ('Jane Burch'),
        ('Leslie Butler'),
        ('Debora Chew'),
        ('Coral Eggers'),
        ('Donald Fraasch'),
        ('Anna Fraasch'),
        ('Angela Gallego'),
        ('Mark Garro'),
        ('Varan Garro')
) AS members(member_name)
WHERE e.title = 'Sunday Worship Service - January 21, 2024';

-- Step 7: Verify the data
SELECT 
    'Events created' as status,
    COUNT(*) as count
FROM public.events 
WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000'
UNION ALL
SELECT 
    'Attendance records created' as status,
    COUNT(*) as count
FROM public.event_attendance 
WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000';

-- Step 8: Show sample attendance data
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
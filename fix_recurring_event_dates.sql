-- Fix Recurring Event Dates
-- This script fixes all recurring event instances that have incorrect start/end dates

-- First, let's see what we're dealing with
SELECT 
    'Events with duplicate dates' as status,
    COUNT(*) as count
FROM events 
WHERE is_recurring = true 
AND parent_event_id IS NOT NULL
AND start_date = '2025-07-20 18:00:00+00';

-- Show sample of the problematic events
SELECT 
    id,
    title,
    start_date,
    end_date,
    parent_event_id,
    is_master
FROM events 
WHERE is_recurring = true 
AND parent_event_id IS NOT NULL
AND start_date = '2025-07-20 18:00:00+00'
ORDER BY id
LIMIT 10;

-- Get the master event details
SELECT 
    id as master_id,
    title,
    start_date as master_start_date,
    end_date as master_end_date,
    recurrence_pattern
FROM events 
WHERE id = 'sunday-morning-worship-service-1746381600000'
AND is_master = true;

-- Calculate the correct dates for each instance
-- The pattern is: each instance should be 7 days apart from the master event
-- Master event: 2025-07-20 18:00:00+00
-- Duration: 1.5 hours (90 minutes)

-- Fix the dates for all instances
UPDATE events 
SET 
    start_date = CASE 
        -- Extract the date from the instance ID and convert to proper datetime
        WHEN id LIKE '%-2025-06-15t%' THEN '2025-06-15 18:00:00+00'
        WHEN id LIKE '%-2025-06-22t%' THEN '2025-06-22 18:00:00+00'
        WHEN id LIKE '%-2025-06-29t%' THEN '2025-06-29 18:00:00+00'
        WHEN id LIKE '%-2025-07-06t%' THEN '2025-07-06 18:00:00+00'
        WHEN id LIKE '%-2025-07-13t%' THEN '2025-07-13 18:00:00+00'
        WHEN id LIKE '%-2025-07-20t%' THEN '2025-07-20 18:00:00+00'
        WHEN id LIKE '%-2025-07-27t%' THEN '2025-07-27 18:00:00+00'
        WHEN id LIKE '%-2025-08-03t%' THEN '2025-08-03 18:00:00+00'
        WHEN id LIKE '%-2025-08-10t%' THEN '2025-08-10 18:00:00+00'
        WHEN id LIKE '%-2025-08-17t%' THEN '2025-08-17 18:00:00+00'
        WHEN id LIKE '%-2025-08-24t%' THEN '2025-08-24 18:00:00+00'
        WHEN id LIKE '%-2025-08-31t%' THEN '2025-08-31 18:00:00+00'
        WHEN id LIKE '%-2025-09-07t%' THEN '2025-09-07 18:00:00+00'
        WHEN id LIKE '%-2025-09-14t%' THEN '2025-09-14 18:00:00+00'
        WHEN id LIKE '%-2025-09-21t%' THEN '2025-09-21 18:00:00+00'
        WHEN id LIKE '%-2025-09-28t%' THEN '2025-09-28 18:00:00+00'
        WHEN id LIKE '%-2025-10-05t%' THEN '2025-10-05 18:00:00+00'
        WHEN id LIKE '%-2025-10-12t%' THEN '2025-10-12 18:00:00+00'
        WHEN id LIKE '%-2025-10-19t%' THEN '2025-10-19 18:00:00+00'
        WHEN id LIKE '%-2025-10-26t%' THEN '2025-10-26 18:00:00+00'
        WHEN id LIKE '%-2025-11-02t%' THEN '2025-11-02 19:00:00+00'  -- DST change
        WHEN id LIKE '%-2025-11-09t%' THEN '2025-11-09 19:00:00+00'
        WHEN id LIKE '%-2025-11-16t%' THEN '2025-11-16 19:00:00+00'
        WHEN id LIKE '%-2025-11-23t%' THEN '2025-11-23 19:00:00+00'
        WHEN id LIKE '%-2025-11-30t%' THEN '2025-11-30 19:00:00+00'
        WHEN id LIKE '%-2025-12-07t%' THEN '2025-12-07 19:00:00+00'
        WHEN id LIKE '%-2025-12-14t%' THEN '2025-12-14 19:00:00+00'
        WHEN id LIKE '%-2025-12-21t%' THEN '2025-12-21 19:00:00+00'
        WHEN id LIKE '%-2025-12-28t%' THEN '2025-12-28 19:00:00+00'
        WHEN id LIKE '%-2026-01-04t%' THEN '2026-01-04 19:00:00+00'
        WHEN id LIKE '%-2026-01-11t%' THEN '2026-01-11 19:00:00+00'
        WHEN id LIKE '%-2026-01-18t%' THEN '2026-01-18 19:00:00+00'
        WHEN id LIKE '%-2026-01-25t%' THEN '2026-01-25 19:00:00+00'
        WHEN id LIKE '%-2026-02-01t%' THEN '2026-02-01 19:00:00+00'
        WHEN id LIKE '%-2026-02-08t%' THEN '2026-02-08 19:00:00+00'
        WHEN id LIKE '%-2026-02-15t%' THEN '2026-02-15 19:00:00+00'
        WHEN id LIKE '%-2026-02-22t%' THEN '2026-02-22 19:00:00+00'
        WHEN id LIKE '%-2026-03-01t%' THEN '2026-03-01 19:00:00+00'
        WHEN id LIKE '%-2026-03-08t%' THEN '2026-03-08 18:00:00+00'  -- DST change back
        WHEN id LIKE '%-2026-03-15t%' THEN '2026-03-15 18:00:00+00'
        WHEN id LIKE '%-2026-03-22t%' THEN '2026-03-22 18:00:00+00'
        WHEN id LIKE '%-2026-03-29t%' THEN '2026-03-29 18:00:00+00'
        WHEN id LIKE '%-2026-04-05t%' THEN '2026-04-05 18:00:00+00'
        WHEN id LIKE '%-2026-04-12t%' THEN '2026-04-12 18:00:00+00'
        WHEN id LIKE '%-2026-04-19t%' THEN '2026-04-19 18:00:00+00'
        WHEN id LIKE '%-2026-04-26t%' THEN '2026-04-26 18:00:00+00'
        WHEN id LIKE '%-2026-05-03t%' THEN '2026-05-03 18:00:00+00'
        WHEN id LIKE '%-2026-05-10t%' THEN '2026-05-10 18:00:00+00'
        WHEN id LIKE '%-2026-05-17t%' THEN '2026-05-17 18:00:00+00'
        WHEN id LIKE '%-2026-05-24t%' THEN '2026-05-24 18:00:00+00'
        WHEN id LIKE '%-2026-05-31t%' THEN '2026-05-31 18:00:00+00'
        WHEN id LIKE '%-2026-06-07t%' THEN '2026-06-07 18:00:00+00'
        WHEN id LIKE '%-2026-06-14t%' THEN '2026-06-14 18:00:00+00'
        ELSE start_date
    END,
    end_date = CASE 
        -- Extract the date from the instance ID and convert to proper datetime (1.5 hours later)
        WHEN id LIKE '%-2025-06-15t%' THEN '2025-06-15 19:30:00+00'
        WHEN id LIKE '%-2025-06-22t%' THEN '2025-06-22 19:30:00+00'
        WHEN id LIKE '%-2025-06-29t%' THEN '2025-06-29 19:30:00+00'
        WHEN id LIKE '%-2025-07-06t%' THEN '2025-07-06 19:30:00+00'
        WHEN id LIKE '%-2025-07-13t%' THEN '2025-07-13 19:30:00+00'
        WHEN id LIKE '%-2025-07-20t%' THEN '2025-07-20 19:30:00+00'
        WHEN id LIKE '%-2025-07-27t%' THEN '2025-07-27 19:30:00+00'
        WHEN id LIKE '%-2025-08-03t%' THEN '2025-08-03 19:30:00+00'
        WHEN id LIKE '%-2025-08-10t%' THEN '2025-08-10 19:30:00+00'
        WHEN id LIKE '%-2025-08-17t%' THEN '2025-08-17 19:30:00+00'
        WHEN id LIKE '%-2025-08-24t%' THEN '2025-08-24 19:30:00+00'
        WHEN id LIKE '%-2025-08-31t%' THEN '2025-08-31 19:30:00+00'
        WHEN id LIKE '%-2025-09-07t%' THEN '2025-09-07 19:30:00+00'
        WHEN id LIKE '%-2025-09-14t%' THEN '2025-09-14 19:30:00+00'
        WHEN id LIKE '%-2025-09-21t%' THEN '2025-09-21 19:30:00+00'
        WHEN id LIKE '%-2025-09-28t%' THEN '2025-09-28 19:30:00+00'
        WHEN id LIKE '%-2025-10-05t%' THEN '2025-10-05 19:30:00+00'
        WHEN id LIKE '%-2025-10-12t%' THEN '2025-10-12 19:30:00+00'
        WHEN id LIKE '%-2025-10-19t%' THEN '2025-10-19 19:30:00+00'
        WHEN id LIKE '%-2025-10-26t%' THEN '2025-10-26 19:30:00+00'
        WHEN id LIKE '%-2025-11-02t%' THEN '2025-11-02 20:30:00+00'  -- DST change
        WHEN id LIKE '%-2025-11-09t%' THEN '2025-11-09 20:30:00+00'
        WHEN id LIKE '%-2025-11-16t%' THEN '2025-11-16 20:30:00+00'
        WHEN id LIKE '%-2025-11-23t%' THEN '2025-11-23 20:30:00+00'
        WHEN id LIKE '%-2025-11-30t%' THEN '2025-11-30 20:30:00+00'
        WHEN id LIKE '%-2025-12-07t%' THEN '2025-12-07 20:30:00+00'
        WHEN id LIKE '%-2025-12-14t%' THEN '2025-12-14 20:30:00+00'
        WHEN id LIKE '%-2025-12-21t%' THEN '2025-12-21 20:30:00+00'
        WHEN id LIKE '%-2025-12-28t%' THEN '2025-12-28 20:30:00+00'
        WHEN id LIKE '%-2026-01-04t%' THEN '2026-01-04 20:30:00+00'
        WHEN id LIKE '%-2026-01-11t%' THEN '2026-01-11 20:30:00+00'
        WHEN id LIKE '%-2026-01-18t%' THEN '2026-01-18 20:30:00+00'
        WHEN id LIKE '%-2026-01-25t%' THEN '2026-01-25 20:30:00+00'
        WHEN id LIKE '%-2026-02-01t%' THEN '2026-02-01 20:30:00+00'
        WHEN id LIKE '%-2026-02-08t%' THEN '2026-02-08 20:30:00+00'
        WHEN id LIKE '%-2026-02-15t%' THEN '2026-02-15 20:30:00+00'
        WHEN id LIKE '%-2026-02-22t%' THEN '2026-02-22 20:30:00+00'
        WHEN id LIKE '%-2026-03-01t%' THEN '2026-03-01 20:30:00+00'
        WHEN id LIKE '%-2026-03-08t%' THEN '2026-03-08 19:30:00+00'  -- DST change back
        WHEN id LIKE '%-2026-03-15t%' THEN '2026-03-15 19:30:00+00'
        WHEN id LIKE '%-2026-03-22t%' THEN '2026-03-22 19:30:00+00'
        WHEN id LIKE '%-2026-03-29t%' THEN '2026-03-29 19:30:00+00'
        WHEN id LIKE '%-2026-04-05t%' THEN '2026-04-05 19:30:00+00'
        WHEN id LIKE '%-2026-04-12t%' THEN '2026-04-12 19:30:00+00'
        WHEN id LIKE '%-2026-04-19t%' THEN '2026-04-19 19:30:00+00'
        WHEN id LIKE '%-2026-04-26t%' THEN '2026-04-26 19:30:00+00'
        WHEN id LIKE '%-2026-05-03t%' THEN '2026-05-03 19:30:00+00'
        WHEN id LIKE '%-2026-05-10t%' THEN '2026-05-10 19:30:00+00'
        WHEN id LIKE '%-2026-05-17t%' THEN '2026-05-17 19:30:00+00'
        WHEN id LIKE '%-2026-05-24t%' THEN '2026-05-24 19:30:00+00'
        WHEN id LIKE '%-2026-05-31t%' THEN '2026-05-31 19:30:00+00'
        WHEN id LIKE '%-2026-06-07t%' THEN '2026-06-07 19:30:00+00'
        WHEN id LIKE '%-2026-06-14t%' THEN '2026-06-14 19:30:00+00'
        ELSE end_date
    END
WHERE is_recurring = true 
AND parent_event_id IS NOT NULL
AND start_date = '2025-07-20 18:00:00+00';

-- Verify the fix
SELECT 
    'Events fixed' as status,
    COUNT(*) as count
FROM events 
WHERE is_recurring = true 
AND parent_event_id IS NOT NULL
AND start_date != '2025-07-20 18:00:00+00';

-- Show sample of fixed events
SELECT 
    id,
    title,
    start_date,
    end_date,
    parent_event_id
FROM events 
WHERE is_recurring = true 
AND parent_event_id IS NOT NULL
ORDER BY start_date
LIMIT 10; 
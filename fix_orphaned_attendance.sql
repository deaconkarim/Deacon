-- Fix Orphaned Event Attendance Records
-- This script identifies and handles event_attendance records that reference non-existent events

-- First, let's see what we're dealing with
SELECT 
    'Orphaned attendance records found' as status,
    COUNT(*) as count
FROM event_attendance ea
LEFT JOIN events e ON ea.event_id = e.id
WHERE e.id IS NULL;

-- Show details of orphaned records
SELECT 
    ea.id as attendance_id,
    ea.event_id as orphaned_event_id,
    ea.member_id,
    ea.status,
    ea.created_at
FROM event_attendance ea
LEFT JOIN events e ON ea.event_id = e.id
WHERE e.id IS NULL
ORDER BY ea.created_at DESC;

-- Option 1: Delete orphaned attendance records (RECOMMENDED)
-- Uncomment the following lines if you want to delete orphaned records
/*
DELETE FROM event_attendance 
WHERE event_id IN (
    SELECT ea.event_id 
    FROM event_attendance ea
    LEFT JOIN events e ON ea.event_id = e.id
    WHERE e.id IS NULL
);
*/

-- Option 2: Archive orphaned records to a backup table before deleting
-- Uncomment the following lines if you want to archive first
/*
-- Create backup table
CREATE TABLE IF NOT EXISTS event_attendance_orphaned_backup AS
SELECT ea.*
FROM event_attendance ea
LEFT JOIN events e ON ea.event_id = e.id
WHERE e.id IS NULL;

-- Then delete from main table
DELETE FROM event_attendance 
WHERE event_id IN (
    SELECT ea.event_id 
    FROM event_attendance ea
    LEFT JOIN events e ON ea.event_id = e.id
    WHERE e.id IS NULL
);
*/

-- Option 3: Update orphaned records to point to a default event
-- Uncomment and modify the following if you want to reassign to a specific event
/*
-- First, find a suitable default event (modify the WHERE clause as needed)
SELECT id, title, start_date 
FROM events 
WHERE event_type = 'Worship Service' 
ORDER BY start_date DESC 
LIMIT 1;

-- Then update orphaned records (replace 'DEFAULT_EVENT_ID' with actual ID)
UPDATE event_attendance 
SET event_id = 'DEFAULT_EVENT_ID'  -- Replace with actual event ID
WHERE event_id IN (
    SELECT ea.event_id 
    FROM event_attendance ea
    LEFT JOIN events e ON ea.event_id = e.id
    WHERE e.id IS NULL
);
*/

-- Verify the fix
SELECT 
    'Remaining orphaned records after fix' as status,
    COUNT(*) as count
FROM event_attendance ea
LEFT JOIN events e ON ea.event_id = e.id
WHERE e.id IS NULL;

-- Show final summary
SELECT 
    'Total attendance records' as metric,
    COUNT(*) as count
FROM event_attendance
UNION ALL
SELECT 
    'Valid attendance records' as metric,
    COUNT(*) as count
FROM event_attendance ea
JOIN events e ON ea.event_id = e.id
UNION ALL
SELECT 
    'Orphaned attendance records' as metric,
    COUNT(*) as count
FROM event_attendance ea
LEFT JOIN events e ON ea.event_id = e.id
WHERE e.id IS NULL; 
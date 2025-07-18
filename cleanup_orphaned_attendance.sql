-- Clean up orphaned attendance records
-- This script removes attendance records that reference non-existent members or events

-- First, let's see what we're dealing with
SELECT 'Before cleanup - Total attendance records' as status, COUNT(*) as count FROM event_attendance
UNION ALL
SELECT 'Before cleanup - Records with null member_id', COUNT(*) FROM event_attendance WHERE member_id IS NULL
UNION ALL
SELECT 'Before cleanup - Records with null event_id', COUNT(*) FROM event_attendance WHERE event_id IS NULL;

-- Check for orphaned records (records referencing non-existent members)
SELECT 'Before cleanup - Orphaned member records', COUNT(*) as count 
FROM event_attendance ea
LEFT JOIN members m ON ea.member_id = m.id
WHERE ea.member_id IS NOT NULL AND m.id IS NULL;

-- Check for orphaned records (records referencing non-existent events)
SELECT 'Before cleanup - Orphaned event records', COUNT(*) as count 
FROM event_attendance ea
LEFT JOIN events e ON ea.event_id = e.id
WHERE ea.event_id IS NOT NULL AND e.id IS NULL;

-- Step 1: Remove attendance records with null member_id
DELETE FROM event_attendance WHERE member_id IS NULL;

-- Step 2: Remove attendance records for non-existent members
DELETE FROM event_attendance 
WHERE member_id NOT IN (SELECT id FROM members WHERE id IS NOT NULL);

-- Step 3: Remove attendance records for non-existent events
DELETE FROM event_attendance 
WHERE event_id NOT IN (SELECT id FROM events WHERE id IS NOT NULL);

-- Verify cleanup results
SELECT 'After cleanup - Total attendance records' as status, COUNT(*) as count FROM event_attendance
UNION ALL
SELECT 'After cleanup - Records with null member_id', COUNT(*) FROM event_attendance WHERE member_id IS NULL
UNION ALL
SELECT 'After cleanup - Records with null event_id', COUNT(*) FROM event_attendance WHERE event_id IS NULL;

-- Check for remaining orphaned records
SELECT 'After cleanup - Orphaned member records', COUNT(*) as count 
FROM event_attendance ea
LEFT JOIN members m ON ea.member_id = m.id
WHERE ea.member_id IS NOT NULL AND m.id IS NULL;

SELECT 'After cleanup - Orphaned event records', COUNT(*) as count 
FROM event_attendance ea
LEFT JOIN events e ON ea.event_id = e.id
WHERE ea.event_id IS NOT NULL AND e.id IS NULL;

-- Show remaining valid attendance records
SELECT 
    ea.id,
    ea.event_id,
    ea.member_id,
    ea.status,
    m.firstname,
    m.lastname,
    e.title as event_title
FROM event_attendance ea
LEFT JOIN members m ON ea.member_id = m.id
LEFT JOIN events e ON ea.event_id = e.id
ORDER BY ea.created_at DESC
LIMIT 10; 
-- Fix event_attendance records missing organization_id
-- This script updates event_attendance records to have the correct organization_id

-- First, let's see how many records are missing organization_id
SELECT 
  'Records missing organization_id' as status,
  COUNT(*) as count
FROM event_attendance 
WHERE organization_id IS NULL;

-- Update event_attendance records to get organization_id from events
UPDATE event_attendance 
SET organization_id = events.organization_id
FROM events 
WHERE event_attendance.event_id = events.id 
  AND event_attendance.organization_id IS NULL
  AND events.organization_id IS NOT NULL;

-- Update event_attendance records to get organization_id from members (for cases where event might not have org_id)
UPDATE event_attendance 
SET organization_id = members.organization_id
FROM members 
WHERE event_attendance.member_id = members.id 
  AND event_attendance.organization_id IS NULL
  AND members.organization_id IS NOT NULL;

-- For any remaining records without organization_id, set to the default organization
-- (You'll need to replace '0c434cec-e141-4b05-9092-adbf8e9da0ec' with your actual organization ID)
UPDATE event_attendance 
SET organization_id = '0c434cec-e141-4b05-9092-adbf8e9da0ec'
WHERE organization_id IS NULL;

-- Verify the fix
SELECT 
  'Records with organization_id' as status,
  COUNT(*) as count
FROM event_attendance 
WHERE organization_id IS NOT NULL;

SELECT 
  'Records still missing organization_id' as status,
  COUNT(*) as count
FROM event_attendance 
WHERE organization_id IS NULL;

-- Show breakdown by organization
SELECT 
  organization_id,
  COUNT(*) as record_count
FROM event_attendance 
GROUP BY organization_id
ORDER BY record_count DESC;

-- Show some sample records to verify
SELECT 
  ea.id,
  ea.event_id,
  ea.member_id,
  ea.organization_id,
  e.title as event_title,
  e.organization_id as event_org_id,
  m.firstname,
  m.lastname,
  m.organization_id as member_org_id
FROM event_attendance ea
LEFT JOIN events e ON ea.event_id = e.id
LEFT JOIN members m ON ea.member_id = m.id
LIMIT 10; 
-- This script updates event_attendance records to have the correct organization_id

-- First, let's see how many records are missing organization_id
SELECT 
  'Records missing organization_id' as status,
  COUNT(*) as count
FROM event_attendance 
WHERE organization_id IS NULL;

-- Update event_attendance records to get organization_id from events
UPDATE event_attendance 
SET organization_id = events.organization_id
FROM events 
WHERE event_attendance.event_id = events.id 
  AND event_attendance.organization_id IS NULL
  AND events.organization_id IS NOT NULL;

-- Update event_attendance records to get organization_id from members (for cases where event might not have org_id)
UPDATE event_attendance 
SET organization_id = members.organization_id
FROM members 
WHERE event_attendance.member_id = members.id 
  AND event_attendance.organization_id IS NULL
  AND members.organization_id IS NOT NULL;

-- For any remaining records without organization_id, set to the default organization
-- (You'll need to replace '0c434cec-e141-4b05-9092-adbf8e9da0ec' with your actual organization ID)
UPDATE event_attendance 
SET organization_id = '0c434cec-e141-4b05-9092-adbf8e9da0ec'
WHERE organization_id IS NULL;

-- Verify the fix
SELECT 
  'Records with organization_id' as status,
  COUNT(*) as count
FROM event_attendance 
WHERE organization_id IS NOT NULL;

SELECT 
  'Records still missing organization_id' as status,
  COUNT(*) as count
FROM event_attendance 
WHERE organization_id IS NULL;

-- Show breakdown by organization
SELECT 
  organization_id,
  COUNT(*) as record_count
FROM event_attendance 
GROUP BY organization_id
ORDER BY record_count DESC;

-- Show some sample records to verify
SELECT 
  ea.id,
  ea.event_id,
  ea.member_id,
  ea.organization_id,
  e.title as event_title,
  e.organization_id as event_org_id,
  m.firstname,
  m.lastname,
  m.organization_id as member_org_id
FROM event_attendance ea
LEFT JOIN events e ON ea.event_id = e.id
LEFT JOIN members m ON ea.member_id = m.id
LIMIT 10; 
-- This script updates event_attendance records to have the correct organization_id

-- First, let's see how many records are missing organization_id
SELECT 
  'Records missing organization_id' as status,
  COUNT(*) as count
FROM event_attendance 
WHERE organization_id IS NULL;

-- Update event_attendance records to get organization_id from events
UPDATE event_attendance 
SET organization_id = events.organization_id
FROM events 
WHERE event_attendance.event_id = events.id 
  AND event_attendance.organization_id IS NULL
  AND events.organization_id IS NOT NULL;

-- Update event_attendance records to get organization_id from members (for cases where event might not have org_id)
UPDATE event_attendance 
SET organization_id = members.organization_id
FROM members 
WHERE event_attendance.member_id = members.id 
  AND event_attendance.organization_id IS NULL
  AND members.organization_id IS NOT NULL;

-- For any remaining records without organization_id, set to the default organization
-- (You'll need to replace '0c434cec-e141-4b05-9092-adbf8e9da0ec' with your actual organization ID)
UPDATE event_attendance 
SET organization_id = '0c434cec-e141-4b05-9092-adbf8e9da0ec'
WHERE organization_id IS NULL;

-- Verify the fix
SELECT 
  'Records with organization_id' as status,
  COUNT(*) as count
FROM event_attendance 
WHERE organization_id IS NOT NULL;

SELECT 
  'Records still missing organization_id' as status,
  COUNT(*) as count
FROM event_attendance 
WHERE organization_id IS NULL;

-- Show breakdown by organization
SELECT 
  organization_id,
  COUNT(*) as record_count
FROM event_attendance 
GROUP BY organization_id
ORDER BY record_count DESC;

-- Show some sample records to verify
SELECT 
  ea.id,
  ea.event_id,
  ea.member_id,
  ea.organization_id,
  e.title as event_title,
  e.organization_id as event_org_id,
  m.firstname,
  m.lastname,
  m.organization_id as member_org_id
FROM event_attendance ea
LEFT JOIN events e ON ea.event_id = e.id
LEFT JOIN members m ON ea.member_id = m.id
LIMIT 10; 
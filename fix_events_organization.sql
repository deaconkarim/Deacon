-- Fix events organization_id to match the current user's organization
-- This script updates all events to use the organization ID that the user is currently viewing

-- Update events to use the current organization ID
UPDATE public.events 
SET organization_id = '0c434cec-e141-4b05-9092-adbf8e9da0ec'
WHERE organization_id IS NOT NULL;

-- Update event_attendance to use the current organization ID
UPDATE public.event_attendance 
SET organization_id = '0c434cec-e141-4b05-9092-adbf8e9da0ec'
WHERE organization_id IS NOT NULL;

-- Update members to use the current organization ID
UPDATE public.members 
SET organization_id = '0c434cec-e141-4b05-9092-adbf8e9da0ec'
WHERE organization_id IS NOT NULL;

-- Update donations to use the current organization ID
UPDATE public.donations 
SET organization_id = '0c434cec-e141-4b05-9092-adbf8e9da0ec'
WHERE organization_id IS NOT NULL;

-- Update donation_batches to use the current organization ID
UPDATE public.donation_batches 
SET organization_id = '0c434cec-e141-4b05-9092-adbf8e9da0ec'
WHERE organization_id IS NOT NULL;

-- Update groups to use the current organization ID
UPDATE public.groups 
SET organization_id = '0c434cec-e141-4b05-9092-adbf8e9da0ec'
WHERE organization_id IS NOT NULL;

-- Update group_members to use the current organization ID
UPDATE public.group_members 
SET organization_id = '0c434cec-e141-4b05-9092-adbf8e9da0ec'
WHERE organization_id IS NOT NULL;

-- Update tasks to use the current organization ID
UPDATE public.tasks 
SET organization_id = '0c434cec-e141-4b05-9092-adbf8e9da0ec'
WHERE organization_id IS NOT NULL;

-- Update task_comments to use the current organization ID
UPDATE public.task_comments 
SET organization_id = '0c434cec-e141-4b05-9092-adbf8e9da0ec'
WHERE organization_id IS NOT NULL;

-- Update child_guardians to use the current organization ID
UPDATE public.child_guardians 
SET organization_id = '0c434cec-e141-4b05-9092-adbf8e9da0ec'
WHERE organization_id IS NOT NULL;

-- Update child_checkin_logs to use the current organization ID
UPDATE public.child_checkin_logs 
SET organization_id = '0c434cec-e141-4b05-9092-adbf8e9da0ec'
WHERE organization_id IS NOT NULL;

-- Verify the updates
SELECT 
  'events' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN organization_id = '0c434cec-e141-4b05-9092-adbf8e9da0ec' THEN 1 END) as records_with_correct_org
FROM public.events
UNION ALL
SELECT 
  'members' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN organization_id = '0c434cec-e141-4b05-9092-adbf8e9da0ec' THEN 1 END) as records_with_correct_org
FROM public.members
UNION ALL
SELECT 
  'event_attendance' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN organization_id = '0c434cec-e141-4b05-9092-adbf8e9da0ec' THEN 1 END) as records_with_correct_org
FROM public.event_attendance; 
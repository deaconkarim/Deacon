-- Fix events organization_id to match the current user's organization
-- SIMPLE VERSION - focuses on events and skips problematic groups

-- First, let's see what organization ID we should use
-- Based on the data you provided, one event has organization_id: '550e8400-e29b-41d4-a716-446655440000'
-- Let's use that as the target organization ID

-- Update events to use the correct organization ID
UPDATE public.events 
SET organization_id = '550e8400-e29b-41d4-a716-446655440000'
WHERE organization_id IS NULL;

-- Update event_attendance to use the correct organization ID
UPDATE public.event_attendance 
SET organization_id = '550e8400-e29b-41d4-a716-446655440000'
WHERE organization_id IS NULL;

-- Update members to use the correct organization ID
UPDATE public.members 
SET organization_id = '550e8400-e29b-41d4-a716-446655440000'
WHERE organization_id IS NULL;

-- Update donations to use the correct organization ID
UPDATE public.donations 
SET organization_id = '550e8400-e29b-41d4-a716-446655440000'
WHERE organization_id IS NULL;

-- Update donation_batches to use the correct organization ID
UPDATE public.donation_batches 
SET organization_id = '550e8400-e29b-41d4-a716-446655440000'
WHERE organization_id IS NULL;

-- SKIP GROUPS FOR NOW - we'll handle them separately
-- The groups table has unique constraint issues that need manual resolution

-- Update group_members to use the correct organization ID
UPDATE public.group_members 
SET organization_id = '550e8400-e29b-41d4-a716-446655440000'
WHERE organization_id IS NULL;

-- Update tasks to use the correct organization ID
UPDATE public.tasks 
SET organization_id = '550e8400-e29b-41d4-a716-446655440000'
WHERE organization_id IS NULL;

-- Update task_comments to use the correct organization ID
UPDATE public.task_comments 
SET organization_id = '550e8400-e29b-41d4-a716-446655440000'
WHERE organization_id IS NULL;

-- Update child_guardians to use the correct organization ID
UPDATE public.child_guardians 
SET organization_id = '550e8400-e29b-41d4-a716-446655440000'
WHERE organization_id IS NULL;

-- Update child_checkin_logs to use the correct organization ID
UPDATE public.child_checkin_logs 
SET organization_id = '550e8400-e29b-41d4-a716-446655440000'
WHERE organization_id IS NULL;

-- Update locations to use the correct organization ID
UPDATE public.locations 
SET organization_id = '550e8400-e29b-41d4-a716-446655440000'
WHERE organization_id IS NULL;

-- Update event_reminder_configs to use the correct organization ID
UPDATE public.event_reminder_configs 
SET organization_id = '550e8400-e29b-41d4-a716-446655440000'
WHERE organization_id IS NULL;

-- Update event_reminder_logs to use the correct organization ID
UPDATE public.event_reminder_logs 
SET organization_id = '550e8400-e29b-41d4-a716-446655440000'
WHERE organization_id IS NULL;

-- Show the results
SELECT 'Events updated' as table_name, COUNT(*) as count FROM public.events WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000'
UNION ALL
SELECT 'Event attendance updated' as table_name, COUNT(*) as count FROM public.event_attendance WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000'
UNION ALL
SELECT 'Members updated' as table_name, COUNT(*) as count FROM public.members WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000'
UNION ALL
SELECT 'Donations updated' as table_name, COUNT(*) as count FROM public.donations WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000'
UNION ALL
SELECT 'Tasks updated' as table_name, COUNT(*) as count FROM public.tasks WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000'
UNION ALL
SELECT 'Locations updated' as table_name, COUNT(*) as count FROM public.locations WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000';

-- Show groups status for manual review
SELECT 'Groups with target org_id:' as info, name, organization_id, id
FROM public.groups 
WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY name;

SELECT 'Groups with null org_id:' as info, name, organization_id, id
FROM public.groups 
WHERE organization_id IS NULL
ORDER BY name;

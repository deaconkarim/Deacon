-- Fix duplicate groups by keeping one of each group name
-- This script will clean up the duplicate groups and assign the correct organization_id

-- First, let's see what groups already exist with the target organization_id
SELECT 'Groups with target org_id:' as info, name, organization_id, id
FROM public.groups 
WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY name;

-- For each group name, we'll keep the first one and delete the rest
-- We'll use a window function to identify duplicates

-- Delete duplicate groups with null organization_id, keeping only the first one of each name
DELETE FROM public.groups 
WHERE id IN (
  SELECT id FROM (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at, id) as rn
    FROM public.groups 
    WHERE organization_id IS NULL
  ) ranked
  WHERE rn > 1
);

-- Now update the remaining groups with null organization_id
UPDATE public.groups 
SET organization_id = '550e8400-e29b-41d4-a716-446655440000'
WHERE organization_id IS NULL;

-- Show the final result
SELECT 'Final groups with target org_id:' as info, name, organization_id, id
FROM public.groups 
WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY name;

SELECT 'Groups with null org_id (should be 0):' as info, COUNT(*) as count
FROM public.groups 
WHERE organization_id IS NULL;

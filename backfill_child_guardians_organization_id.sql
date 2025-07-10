-- Backfill organization_id for child_guardians table
-- Migration: backfill_child_guardians_organization_id.sql

-- Update child_guardians to set organization_id based on the child's organization
UPDATE public.child_guardians 
SET organization_id = (
  SELECT m.organization_id 
  FROM public.members m 
  WHERE m.id = child_guardians.child_id
)
WHERE organization_id IS NULL;

-- Verify the update worked
SELECT 
  COUNT(*) as total_records,
  COUNT(organization_id) as records_with_org_id,
  COUNT(*) - COUNT(organization_id) as records_without_org_id
FROM public.child_guardians; 
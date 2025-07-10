-- Check child_guardians data
-- Script: check_child_guardians_data.sql

-- Check total records and organization_id distribution
SELECT 
  COUNT(*) as total_records,
  COUNT(organization_id) as records_with_org_id,
  COUNT(*) - COUNT(organization_id) as records_without_org_id
FROM public.child_guardians;

-- Check what organization_ids exist
SELECT 
  organization_id,
  COUNT(*) as record_count
FROM public.child_guardians 
WHERE organization_id IS NOT NULL
GROUP BY organization_id
ORDER BY record_count DESC;

-- Check if there are any child_guardians records at all
SELECT 
  'Total child_guardians records' as description,
  COUNT(*) as count
FROM public.child_guardians
UNION ALL
SELECT 
  'Records with organization_id = 550e8400-e29b-41d4-a716-446655440000' as description,
  COUNT(*) as count
FROM public.child_guardians 
WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000';

-- Check if there are children in this organization
SELECT 
  'Children in organization 550e8400-e29b-41d4-a716-446655440000' as description,
  COUNT(*) as count
FROM public.members 
WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000' 
AND member_type = 'child'; 
-- Create guardian relationships for children
-- Script: create_guardian_relationships.sql

-- First, let's see what children and potential guardians we have
SELECT 
  'Children in organization' as description,
  COUNT(*) as count
FROM public.members 
WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000' 
AND member_type = 'child';

SELECT 
  'Adult members (potential guardians) in organization' as description,
  COUNT(*) as count
FROM public.members 
WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000' 
AND member_type = 'adult';

-- Get the children and potential guardians
SELECT 
  'Children:' as info,
  id,
  firstname,
  lastname,
  member_type
FROM public.members 
WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000' 
AND member_type = 'child'
ORDER BY lastname, firstname;

SELECT 
  'Potential guardians:' as info,
  id,
  firstname,
  lastname,
  member_type
FROM public.members 
WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000' 
AND member_type = 'adult'
ORDER BY lastname, firstname; 
-- Fix existing families to have the correct organization_id
-- This script updates families that were created without organization_id
-- by setting their organization_id based on their members' organization_id

-- First, let's see what families exist and their current organization_id status
SELECT 
  f.id,
  f.family_name,
  f.organization_id as family_org_id,
  m.organization_id as member_org_id,
  COUNT(m.id) as member_count
FROM families f
LEFT JOIN family_relationships fr ON f.id = fr.family_id
LEFT JOIN members m ON fr.member_id = m.id
GROUP BY f.id, f.family_name, f.organization_id, m.organization_id
ORDER BY f.family_name;

-- Update families to have organization_id based on their members
-- For families with members, use the organization_id of the first member
UPDATE families 
SET organization_id = (
  SELECT m.organization_id 
  FROM family_relationships fr 
  JOIN members m ON fr.member_id = m.id 
  WHERE fr.family_id = families.id 
  AND m.organization_id IS NOT NULL
  LIMIT 1
)
WHERE organization_id IS NULL 
AND EXISTS (
  SELECT 1 
  FROM family_relationships fr 
  JOIN members m ON fr.member_id = m.id 
  WHERE fr.family_id = families.id 
  AND m.organization_id IS NOT NULL
);

-- For families without members or with members that have NULL organization_id,
-- set them to the default organization (BLB Church)
UPDATE families 
SET organization_id = (
  SELECT id FROM organizations WHERE slug = 'blb-church'
)
WHERE organization_id IS NULL;

-- Verify the update worked
SELECT 
  f.id,
  f.family_name,
  f.organization_id,
  o.name as organization_name,
  COUNT(m.id) as member_count
FROM families f
LEFT JOIN organizations o ON f.organization_id = o.id
LEFT JOIN family_relationships fr ON f.id = fr.family_id
LEFT JOIN members m ON fr.member_id = m.id
GROUP BY f.id, f.family_name, f.organization_id, o.name
ORDER BY f.family_name; 
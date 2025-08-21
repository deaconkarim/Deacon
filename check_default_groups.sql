-- Check if default groups were created successfully
-- Run this in your Supabase SQL editor to verify the implementation

-- 1. Check if default groups exist
SELECT 
  id,
  name,
  description,
  is_default,
  organization_id,
  created_at
FROM groups 
WHERE is_default = true
ORDER BY organization_id, name;

-- 2. Check group membership counts
SELECT 
  g.name as group_name,
  g.organization_id,
  COUNT(gm.member_id) as member_count
FROM groups g
LEFT JOIN group_members gm ON g.id = gm.group_id
WHERE g.is_default = true
GROUP BY g.id, g.name, g.organization_id
ORDER BY g.organization_id, g.name;

-- 3. Check a few sample members and their group memberships
SELECT 
  m.firstname,
  m.lastname,
  m.status,
  m.organization_id,
  g.name as group_name
FROM members m
JOIN group_members gm ON m.id = gm.member_id
JOIN groups g ON gm.group_id = g.id
WHERE g.is_default = true
ORDER BY m.organization_id, m.lastname, m.firstname
LIMIT 20;

-- 4. Check if the triggers are working by looking at recent members
SELECT 
  m.firstname,
  m.lastname,
  m.status,
  m.created_at,
  COUNT(gm.group_id) as group_count
FROM members m
LEFT JOIN group_members gm ON m.id = gm.member_id
WHERE m.created_at >= NOW() - INTERVAL '7 days'
GROUP BY m.id, m.firstname, m.lastname, m.status, m.created_at
ORDER BY m.created_at DESC
LIMIT 10;

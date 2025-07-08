-- Script to make a user a System Administrator
-- Replace 'YOUR_EMAIL_HERE' with your actual email address

-- Step 1: Find your user ID
-- Run this first to get your user ID
SELECT 
  id as user_id,
  email,
  created_at
FROM auth.users 
WHERE email = 'YOUR_EMAIL_HERE';

-- Step 2: Get the System Administration organization ID
-- Run this to verify the System Administration org exists
SELECT 
  id as org_id,
  name,
  slug,
  created_at
FROM organizations 
WHERE name = 'System Administration';

-- Step 3: Make yourself a system admin
-- Replace the user_id and organization_id with the actual values from steps 1 & 2
-- Or use this dynamic version (replace YOUR_EMAIL_HERE with your email):

INSERT INTO organization_users (
  user_id,
  organization_id,
  role,
  approval_status,
  approved_at,
  approved_by
)
SELECT 
  auth_users.id as user_id,
  orgs.id as organization_id,
  'admin' as role,
  'approved' as approval_status,
  NOW() as approved_at,
  auth_users.id as approved_by
FROM auth.users auth_users
CROSS JOIN organizations orgs
WHERE auth_users.email = 'YOUR_EMAIL_HERE'
  AND orgs.name = 'System Administration'
  AND NOT EXISTS (
    SELECT 1 FROM organization_users ou 
    WHERE ou.user_id = auth_users.id 
    AND ou.organization_id = orgs.id
  );

-- Step 4: Create or update a member record in the System Administration org
-- This handles the case where a member record already exists with your email

-- First, try to update existing member record if one exists with the same email
UPDATE members 
SET 
  user_id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE'),
  organization_id = (SELECT id FROM organizations WHERE name = 'System Administration'),
  status = 'active',
  updated_at = NOW()
WHERE email = 'YOUR_EMAIL_HERE'
  AND user_id IS NULL; -- Only update if not already linked to a user

-- Create a new member record only if one doesn't exist for this user/org combination
INSERT INTO members (
  user_id,
  organization_id,
  firstname,
  lastname,
  email,
  status,
  created_at,
  updated_at
)
SELECT 
  auth_users.id as user_id,
  orgs.id as organization_id,
  COALESCE(auth_users.raw_user_meta_data->>'first_name', 'System') as firstname,
  COALESCE(auth_users.raw_user_meta_data->>'last_name', 'Administrator') as lastname,
  auth_users.email,
  'active' as status,
  NOW() as created_at,
  NOW() as updated_at
FROM auth.users auth_users
CROSS JOIN organizations orgs
WHERE auth_users.email = 'YOUR_EMAIL_HERE'
  AND orgs.name = 'System Administration'
  AND NOT EXISTS (
    SELECT 1 FROM members m 
    WHERE m.user_id = auth_users.id 
    AND m.organization_id = orgs.id
  )
  AND NOT EXISTS (
    SELECT 1 FROM members m2
    WHERE m2.email = auth_users.email
  );

-- Step 5: Verify the setup
-- Run this to confirm you're now a system admin
SELECT 
  u.email,
  o.name as organization_name,
  ou.role,
  ou.approval_status,
  m.firstname,
  m.lastname
FROM auth.users u
JOIN organization_users ou ON u.id = ou.user_id
JOIN organizations o ON ou.organization_id = o.id
LEFT JOIN members m ON u.id = m.user_id AND o.id = m.organization_id
WHERE u.email = 'YOUR_EMAIL_HERE'
  AND o.name = 'System Administration'; 
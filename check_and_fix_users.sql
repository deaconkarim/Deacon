-- Check and fix user organization memberships
-- This script will help identify and fix missing organization memberships

-- First, let's see what we have in each table
SELECT 'Members table:' as info;
SELECT id, firstname, lastname, email, organization_id FROM members ORDER BY created_at;

SELECT 'Organization users table:' as info;
SELECT user_id, organization_id, role, approval_status FROM organization_users ORDER BY created_at;

SELECT 'Organizations table:' as info;
SELECT id, name FROM organizations;

-- Check for members without organization membership (only for users who exist in auth.users)
SELECT 'Members without organization membership (existing users only):' as info;
SELECT 
    m.id,
    m.firstname,
    m.lastname,
    m.email,
    m.organization_id
FROM members m
LEFT JOIN organization_users ou ON m.id = ou.user_id
JOIN auth.users au ON m.id = au.id
WHERE ou.user_id IS NULL;

-- Check for organization users without member records
SELECT 'Organization users without member records:' as info;
SELECT 
    ou.user_id,
    ou.organization_id,
    ou.role,
    ou.approval_status
FROM organization_users ou
LEFT JOIN members m ON ou.user_id = m.id
WHERE m.id IS NULL;

-- Check for orphaned member records (members without auth users)
SELECT 'Orphaned member records (members without auth users):' as info;
SELECT 
    m.id,
    m.firstname,
    m.lastname,
    m.email
FROM members m
LEFT JOIN auth.users au ON m.id = au.id
WHERE au.id IS NULL;

-- Fix: Add organization membership for members who don't have it (only for existing auth users)
DO $$
DECLARE
    org_id UUID;
    member_record RECORD;
BEGIN
    -- Get the first organization (or create one if none exist)
    SELECT id INTO org_id FROM organizations LIMIT 1;
    
    IF org_id IS NULL THEN
        -- Create a default organization if none exists
        INSERT INTO organizations (id, name, description, created_at, updated_at)
        VALUES (gen_random_uuid(), 'Default Church', 'Default organization', NOW(), NOW())
        RETURNING id INTO org_id;
    END IF;
    
    -- Add organization membership for members who don't have it (only if they exist in auth.users)
    FOR member_record IN 
        SELECT m.id, m.firstname, m.lastname, m.email
        FROM members m
        LEFT JOIN organization_users ou ON m.id = ou.user_id
        JOIN auth.users au ON m.id = au.id
        WHERE ou.user_id IS NULL
    LOOP
        INSERT INTO organization_users (
            id,
            user_id,
            organization_id,
            role,
            status,
            approval_status,
            created_at,
            updated_at
        )
        VALUES (
            gen_random_uuid(),
            member_record.id,
            org_id,
            'member',
            'active',
            'approved',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Added organization membership for user: % % (%)', 
            member_record.firstname, member_record.lastname, member_record.email;
    END LOOP;
END $$;

-- Clean up orphaned member records (optional - uncomment if you want to remove them)
-- DELETE FROM members 
-- WHERE id NOT IN (SELECT id FROM auth.users);

-- Verify the fix
SELECT 'After fix - Members with organization membership:' as info;
SELECT 
    m.firstname,
    m.lastname,
    m.email,
    ou.role,
    ou.approval_status,
    o.name as organization_name
FROM members m
JOIN organization_users ou ON m.id = ou.user_id
JOIN organizations o ON ou.organization_id = o.id
ORDER BY m.firstname, m.lastname; 
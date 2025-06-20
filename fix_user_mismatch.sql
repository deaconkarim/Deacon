-- Fix user mismatch between auth users, members, and organization users

-- Show the 3 auth users
SELECT 'Auth Users:' as info;
SELECT id, email, created_at FROM auth.users ORDER BY created_at;

-- Show the 2 organization users
SELECT 'Organization Users:' as info;
SELECT user_id, role, approval_status, created_at FROM organization_users ORDER BY created_at;

-- Show some sample members
SELECT 'Sample Members (first 10):' as info;
SELECT id, firstname, lastname, email, created_at FROM members ORDER BY created_at LIMIT 10;

-- Check which auth users have member records
SELECT 'Auth Users with Member Records:' as info;
SELECT 
    au.id,
    au.email,
    au.created_at as auth_created,
    m.firstname,
    m.lastname,
    m.created_at as member_created
FROM auth.users au
LEFT JOIN members m ON au.id = m.id
ORDER BY au.created_at;

-- Check which auth users have organization membership
SELECT 'Auth Users with Organization Membership:' as info;
SELECT 
    au.id,
    au.email,
    au.created_at as auth_created,
    ou.role,
    ou.approval_status,
    ou.created_at as org_created
FROM auth.users au
LEFT JOIN organization_users ou ON au.id = ou.user_id
ORDER BY au.created_at;

-- Find the complete picture
SELECT 'Complete User Analysis:' as info;
SELECT 
    au.id,
    au.email,
    CASE WHEN m.id IS NOT NULL THEN 'Yes' ELSE 'No' END as has_member_record,
    CASE WHEN ou.user_id IS NOT NULL THEN 'Yes' ELSE 'No' END as has_org_membership,
    m.firstname,
    m.lastname,
    ou.role,
    ou.approval_status
FROM auth.users au
LEFT JOIN members m ON au.id = m.id
LEFT JOIN organization_users ou ON au.id = ou.user_id
ORDER BY au.created_at;

-- Fix: Create member records for auth users who don't have them (handle foreign key constraints)
DO $$
DECLARE
    auth_user_record RECORD;
    existing_member_id UUID;
    existing_member_email_id UUID;
    temp_email TEXT;
BEGIN
    -- Loop through all auth users
    FOR auth_user_record IN 
        SELECT 
            au.id,
            au.email,
            au.raw_user_meta_data
        FROM auth.users au
        WHERE au.email IS NOT NULL
    LOOP
        -- Check if a member with this auth user ID already exists
        SELECT id INTO existing_member_id 
        FROM members 
        WHERE id = auth_user_record.id;
        
        -- Check if a member with this email already exists
        SELECT id INTO existing_member_email_id 
        FROM members 
        WHERE email = auth_user_record.email;
        
        -- If no member exists with this auth user ID
        IF existing_member_id IS NULL THEN
            -- If a member with this email exists, we need to handle this carefully
            IF existing_member_email_id IS NOT NULL THEN
                -- Temporarily change the email of the existing member to avoid constraint violation
                temp_email := auth_user_record.email || '.temp.' || extract(epoch from now());
                UPDATE members 
                SET email = temp_email
                WHERE id = existing_member_email_id;
                
                -- Create a new member record with the auth user ID and original email
                INSERT INTO members (
                    id,
                    firstname,
                    lastname,
                    email,
                    phone,
                    address,
                    status,
                    notes,
                    join_date,
                    image_url,
                    member_type,
                    birth_date,
                    gender,
                    created_at,
                    updated_at
                )
                SELECT 
                    auth_user_record.id,
                    firstname,
                    lastname,
                    auth_user_record.email,
                    phone,
                    address,
                    status,
                    notes,
                    join_date,
                    image_url,
                    member_type,
                    birth_date,
                    gender,
                    created_at,
                    NOW()
                FROM members 
                WHERE id = existing_member_email_id;
                
                -- Now update all foreign key references to use the auth user ID
                -- Only update tables that exist
                
                -- Update groups table (if it exists)
                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'groups') THEN
                    UPDATE groups 
                    SET leader_id = auth_user_record.id
                    WHERE leader_id = existing_member_email_id;
                END IF;
                
                -- Update group_members table (if it exists)
                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'group_members') THEN
                    UPDATE group_members 
                    SET member_id = auth_user_record.id
                    WHERE member_id = existing_member_email_id;
                END IF;
                
                -- Update tasks table (if it exists)
                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
                    UPDATE tasks 
                    SET requestor_id = auth_user_record.id
                    WHERE requestor_id = existing_member_email_id;
                    
                    UPDATE tasks 
                    SET assignee_id = auth_user_record.id
                    WHERE assignee_id = existing_member_email_id;
                END IF;
                
                -- Update task_comments table (if it exists)
                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_comments') THEN
                    UPDATE task_comments 
                    SET member_id = auth_user_record.id
                    WHERE member_id = existing_member_email_id;
                END IF;
                
                -- Update child_guardians table (if it exists)
                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'child_guardians') THEN
                    UPDATE child_guardians 
                    SET child_id = auth_user_record.id
                    WHERE child_id = existing_member_email_id;
                    
                    UPDATE child_guardians 
                    SET guardian_id = auth_user_record.id
                    WHERE guardian_id = existing_member_email_id;
                END IF;
                
                -- Update child_checkin_logs table (if it exists)
                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'child_checkin_logs') THEN
                    UPDATE child_checkin_logs 
                    SET child_id = auth_user_record.id
                    WHERE child_id = existing_member_email_id;
                    
                    UPDATE child_checkin_logs 
                    SET checked_in_by = auth_user_record.id
                    WHERE checked_in_by = existing_member_email_id;
                    
                    UPDATE child_checkin_logs 
                    SET checked_out_by = auth_user_record.id
                    WHERE checked_out_by = existing_member_email_id;
                END IF;
                
                -- Update prayer_responses table (if it exists)
                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prayer_responses') THEN
                    UPDATE prayer_responses 
                    SET member_id = auth_user_record.id
                    WHERE member_id = existing_member_email_id;
                END IF;
                
                -- Finally, delete the old member record
                DELETE FROM members WHERE id = existing_member_email_id;
                
                RAISE NOTICE 'Updated existing member with email % to use auth user ID %', 
                    auth_user_record.email, auth_user_record.id;
            ELSE
                -- Create new member record using auth user data
                INSERT INTO members (
                    id,
                    firstname,
                    lastname,
                    email,
                    status,
                    created_at,
                    updated_at
                )
                VALUES (
                    auth_user_record.id,
                    COALESCE(auth_user_record.raw_user_meta_data->>'firstname', 'Unknown'),
                    COALESCE(auth_user_record.raw_user_meta_data->>'lastname', 'User'),
                    auth_user_record.email,
                    'active',
                    NOW(),
                    NOW()
                );
                
                RAISE NOTICE 'Created new member for auth user % with email %', 
                    auth_user_record.id, auth_user_record.email;
            END IF;
        END IF;
        
        -- Ensure organization membership exists
        INSERT INTO organization_users (organization_id, user_id, role, status, approval_status, created_at, updated_at)
        SELECT 
            o.id,
            auth_user_record.id,
            'member',
            'active',
            'approved',
            NOW(),
            NOW()
        FROM organizations o
        WHERE o.id = (
            SELECT organization_id 
            FROM organization_users 
            WHERE user_id = auth_user_record.id 
            LIMIT 1
        )
        ON CONFLICT (organization_id, user_id) DO NOTHING;
        
    END LOOP;
    
    RAISE NOTICE 'User mismatch fix completed';
END $$;

-- Fix: Create organization membership for auth users who don't have it
DO $$
DECLARE
    org_id UUID;
    auth_user_record RECORD;
BEGIN
    -- Get the first organization
    SELECT id INTO org_id FROM organizations LIMIT 1;
    
    IF org_id IS NULL THEN
        -- Create a default organization if none exists
        INSERT INTO organizations (id, name, description, created_at, updated_at)
        VALUES (gen_random_uuid(), 'Default Church', 'Default organization', NOW(), NOW())
        RETURNING id INTO org_id;
    END IF;
    
    FOR auth_user_record IN 
        SELECT au.id, au.email
        FROM auth.users au
        LEFT JOIN organization_users ou ON au.id = ou.user_id
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
            auth_user_record.id,
            org_id,
            'member',
            'active',
            'approved',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Created organization membership for: % (%)', 
            auth_user_record.email, auth_user_record.id;
    END LOOP;
END $$;

-- Verify the fix
SELECT 'After fix - Complete User Profiles:' as info;
SELECT 
    m.firstname,
    m.lastname,
    m.email,
    ou.role,
    ou.approval_status,
    m.created_at as member_since,
    ou.created_at as org_member_since
FROM members m
JOIN organization_users ou ON m.id = ou.user_id
ORDER BY m.firstname, m.lastname; 
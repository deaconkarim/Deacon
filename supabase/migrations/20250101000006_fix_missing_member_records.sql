-- Fix existing users who don't have member records
-- This migration creates member records for users who have organization_users records but no member records

-- Function to create missing member records
CREATE OR REPLACE FUNCTION fix_missing_member_records()
RETURNS INTEGER AS $$
DECLARE
    missing_count INTEGER := 0;
    org_user RECORD;
    mapped_role TEXT;
BEGIN
    -- Find organization_users records that don't have corresponding member records
    FOR org_user IN 
        SELECT 
            ou.user_id,
            ou.organization_id,
            ou.role,
            ou.status,
            au.email,
            COALESCE(au.raw_user_meta_data->>'first_name', 'Unknown') as first_name,
            COALESCE(au.raw_user_meta_data->>'last_name', 'User') as last_name
        FROM organization_users ou
        JOIN auth.users au ON au.id = ou.user_id
        WHERE NOT EXISTS (
            SELECT 1 FROM members m 
            WHERE m.user_id = ou.user_id 
            AND m.organization_id = ou.organization_id
        )
    LOOP
        -- Map organization_users role to members role
        -- organization_users: 'owner', 'admin', 'member'
        -- members: 'member', 'deacon', 'admin'
        mapped_role := CASE org_user.role
            WHEN 'owner' THEN 'admin'
            WHEN 'admin' THEN 'admin'
            WHEN 'member' THEN 'member'
            ELSE 'member'
        END;
        
        -- Create member record
        INSERT INTO members (
            firstname,
            lastname,
            email,
            user_id,
            organization_id,
            status,
            role,
            created_at,
            updated_at
        ) VALUES (
            org_user.first_name,
            org_user.last_name,
            org_user.email,
            org_user.user_id,
            org_user.organization_id,
            org_user.status,
            mapped_role,
            NOW(),
            NOW()
        );
        
        missing_count := missing_count + 1;
    END LOOP;
    
    RETURN missing_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the function to fix missing member records
SELECT fix_missing_member_records() as fixed_records;

-- Drop the function after use
DROP FUNCTION fix_missing_member_records(); 
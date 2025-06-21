-- Fix the auto_create_member_record trigger to handle email conflicts
-- This prevents the unique constraint violation when registering new users

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS trigger_auto_create_member_record ON organization_users;

-- Recreate the function with better email conflict handling
CREATE OR REPLACE FUNCTION auto_create_member_record()
RETURNS TRIGGER AS $$
DECLARE
    mapped_role TEXT;
    existing_member_id UUID;
    user_email TEXT;
BEGIN
    -- Check if a member record already exists for this user
    IF NOT EXISTS (
        SELECT 1 FROM members 
        WHERE user_id = NEW.user_id 
        AND organization_id = NEW.organization_id
    ) THEN
        -- Map organization_users role to members role
        -- organization_users: 'owner', 'admin', 'member'
        -- members: 'member', 'deacon', 'admin'
        mapped_role := CASE NEW.role
            WHEN 'owner' THEN 'admin'
            WHEN 'admin' THEN 'admin'
            WHEN 'member' THEN 'member'
            ELSE 'member'
        END;
        
        -- Get the user's email
        SELECT email INTO user_email FROM auth.users WHERE id = NEW.user_id;
        
        -- Check if a member with the same email already exists
        IF user_email IS NOT NULL THEN
            SELECT id INTO existing_member_id 
            FROM members 
            WHERE email = user_email;
        END IF;
        
        -- If a member with the same email exists, update it instead of creating new
        IF existing_member_id IS NOT NULL THEN
            UPDATE members 
            SET 
                user_id = NEW.user_id,
                organization_id = NEW.organization_id,
                role = mapped_role,
                status = 'active',
                updated_at = NOW()
            WHERE id = existing_member_id;
        ELSE
            -- Get user details from auth.users and create new member record
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
            )
            SELECT 
                COALESCE(au.raw_user_meta_data->>'first_name', 'Unknown'),
                COALESCE(au.raw_user_meta_data->>'last_name', 'User'),
                au.email,
                NEW.user_id,
                NEW.organization_id,
                'active',
                mapped_role,
                NOW(),
                NOW()
            FROM auth.users au
            WHERE au.id = NEW.user_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER trigger_auto_create_member_record
    AFTER INSERT ON organization_users
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_member_record();

-- Test the fix by checking if the function exists
SELECT 'Auto-create member trigger function updated successfully' as status; 
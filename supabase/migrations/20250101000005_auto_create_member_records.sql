-- Auto-create member records when organization_users records are created
-- This ensures that every user with an organization_users record also has a member record

-- Function to create member record when organization_users record is created
CREATE OR REPLACE FUNCTION auto_create_member_record()
RETURNS TRIGGER AS $$
DECLARE
    mapped_role TEXT;
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
        
        -- Get user details from auth.users
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
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create member records
DROP TRIGGER IF EXISTS trigger_auto_create_member_record ON organization_users;
CREATE TRIGGER trigger_auto_create_member_record
    AFTER INSERT ON organization_users
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_member_record();

-- Function to update member record when organization_users record is updated
CREATE OR REPLACE FUNCTION auto_update_member_record()
RETURNS TRIGGER AS $$
DECLARE
    mapped_role TEXT;
BEGIN
    -- Map organization_users role to members role
    mapped_role := CASE NEW.role
        WHEN 'owner' THEN 'admin'
        WHEN 'admin' THEN 'admin'
        WHEN 'member' THEN 'member'
        ELSE 'member'
    END;
    
    -- Update member record if it exists
    UPDATE members 
    SET 
        status = CASE 
            WHEN NEW.status = 'active' THEN 'active'
            WHEN NEW.status = 'inactive' THEN 'inactive'
            ELSE members.status
        END,
        role = mapped_role,
        updated_at = NOW()
    WHERE user_id = NEW.user_id 
    AND organization_id = NEW.organization_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update member records
DROP TRIGGER IF EXISTS trigger_auto_update_member_record ON organization_users;
CREATE TRIGGER trigger_auto_update_member_record
    AFTER UPDATE ON organization_users
    FOR EACH ROW
    EXECUTE FUNCTION auto_update_member_record(); 
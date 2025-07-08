-- Fix organization deletion by creating a proper cascade deletion function
-- This addresses the issue where the activity logging trigger causes FK constraint violations

-- Create a function to safely delete an organization
CREATE OR REPLACE FUNCTION delete_organization_safely(org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    org_name TEXT;
    org_slug TEXT;
BEGIN
    -- Get organization info before deletion
    SELECT name, slug INTO org_name, org_slug 
    FROM organizations 
    WHERE id = org_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Organization not found';
    END IF;
    
    -- Temporarily disable the activity logging trigger
    ALTER TABLE organizations DISABLE TRIGGER trigger_log_organization_activity;
    
    -- Delete all activity_log entries first to prevent FK violations
    DELETE FROM activity_log WHERE organization_id = org_id;
    
    -- Delete the organization (this will cascade to other tables)
    DELETE FROM organizations WHERE id = org_id;
    
    -- Re-enable the trigger
    ALTER TABLE organizations ENABLE TRIGGER trigger_log_organization_activity;
    
    -- Manually log the deletion (since trigger was disabled)
    INSERT INTO activity_log (organization_id, user_id, action, details, created_at)
    VALUES (
        NULL, -- No organization_id since it's deleted
        auth.uid(),
        'organization_deleted',
        jsonb_build_object('organization_name', org_name, 'organization_slug', org_slug),
        NOW()
    );
    
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Re-enable trigger in case of error
        ALTER TABLE organizations ENABLE TRIGGER trigger_log_organization_activity;
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_organization_safely(UUID) TO authenticated;

-- Create a simpler version that just disables the problematic trigger temporarily
CREATE OR REPLACE FUNCTION delete_organization_simple(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Temporarily disable the activity logging trigger to prevent FK constraint violations
    ALTER TABLE organizations DISABLE TRIGGER trigger_log_organization_activity;
    
    -- Delete all activity_log entries first
    DELETE FROM activity_log WHERE organization_id = org_id;
    
    -- Delete the organization 
    DELETE FROM organizations WHERE id = org_id;
    
    -- Re-enable the trigger
    ALTER TABLE organizations ENABLE TRIGGER trigger_log_organization_activity;
    
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Re-enable trigger in case of error
        ALTER TABLE organizations ENABLE TRIGGER trigger_log_organization_activity;
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_organization_simple(UUID) TO authenticated; 
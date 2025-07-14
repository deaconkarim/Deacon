-- Create a function to get the user's organization ID
-- This avoids the infinite recursion issue in RLS policies

-- Create a function that returns the user's organization ID
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS uuid AS $$
BEGIN
    -- Return the organization ID for the current user
    -- This function can be called from RLS policies without causing recursion
    RETURN (
        SELECT organization_id 
        FROM public.members 
        WHERE user_id = auth.uid() 
        LIMIT 1
    );
EXCEPTION
    -- If there's any error, return NULL
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_organization_id() TO authenticated;

-- Create a comment to document the function
COMMENT ON FUNCTION get_user_organization_id() IS 'Returns the organization ID for the current user, safe to use in RLS policies'; 
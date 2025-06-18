-- Fix infinite recursion in organization_users RLS policies
-- This script should be run directly on your Supabase project

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Organization owners can manage members" ON public.organization_users;

-- Add simpler policies that don't cause recursion
CREATE POLICY "Users can insert their own organization memberships" ON public.organization_users
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own organization memberships" ON public.organization_users
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own organization memberships" ON public.organization_users
    FOR DELETE USING (user_id = auth.uid());

-- Verify the policies are working
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'organization_users'; 
-- Fix RLS policies for members table to allow registration
DROP POLICY IF EXISTS "Members can view members of their organizations" ON public.members;
DROP POLICY IF EXISTS "Members can be created by organization members" ON public.members;
DROP POLICY IF EXISTS "Members can be updated by organization members" ON public.members;
DROP POLICY IF EXISTS "Members can be deleted by organization admins" ON public.members;

-- Create new policies for members table
CREATE POLICY "Members can view members of their organizations" ON public.members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.organization_users
            WHERE organization_users.organization_id = members.organization_id
            AND organization_users.user_id = auth.uid()
            AND organization_users.status = 'active'
        )
    );

-- Allow users to create their own member record during registration
CREATE POLICY "Users can create their own member record" ON public.members
    FOR INSERT WITH CHECK (
        id = auth.uid() OR -- Allow users to create their own record
        EXISTS (
            SELECT 1 FROM public.organization_users
            WHERE organization_users.organization_id = members.organization_id
            AND organization_users.user_id = auth.uid()
            AND organization_users.status = 'active'
        )
    );

CREATE POLICY "Members can be updated by organization members" ON public.members
    FOR UPDATE USING (
        id = auth.uid() OR -- Allow users to update their own record
        EXISTS (
            SELECT 1 FROM public.organization_users
            WHERE organization_users.organization_id = members.organization_id
            AND organization_users.user_id = auth.uid()
            AND organization_users.status = 'active'
        )
    );

CREATE POLICY "Members can be deleted by organization admins" ON public.members
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.organization_users
            WHERE organization_users.organization_id = members.organization_id
            AND organization_users.user_id = auth.uid()
            AND organization_users.role IN ('owner', 'admin')
            AND organization_users.status = 'active'
        )
    );

-- Fix RLS policies for organization_users table
DROP POLICY IF EXISTS "Organization members can view their own organization memberships" ON public.organization_users;
DROP POLICY IF EXISTS "Organization admins can view all members of their organization" ON public.organization_users;
DROP POLICY IF EXISTS "Organization members can be created by authenticated users" ON public.organization_users;
DROP POLICY IF EXISTS "Organization admins can update member roles" ON public.organization_users;

-- Create new policies for organization_users table
CREATE POLICY "Organization users can view their own memberships" ON public.organization_users
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Organization admins can view all members of their organization" ON public.organization_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.organization_users AS admin_membership
            WHERE admin_membership.organization_id = organization_users.organization_id
            AND admin_membership.user_id = auth.uid()
            AND admin_membership.role IN ('owner', 'admin')
            AND admin_membership.status = 'active'
        )
    );

-- Allow users to create their own organization membership during registration
CREATE POLICY "Users can create their own organization membership" ON public.organization_users
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR -- Allow users to create their own membership
        auth.role() = 'authenticated'
    );

CREATE POLICY "Organization admins can update member roles" ON public.organization_users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.organization_users AS admin_membership
            WHERE admin_membership.organization_id = organization_users.organization_id
            AND admin_membership.user_id = auth.uid()
            AND admin_membership.role IN ('owner', 'admin')
            AND admin_membership.status = 'active'
        )
    );

-- Test the policies
SELECT 'Members table policies updated' as status;
SELECT 'Organization_users table policies updated' as status; 
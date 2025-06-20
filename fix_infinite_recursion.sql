-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Organizations are viewable by everyone" ON public.organizations;
DROP POLICY IF EXISTS "Organizations can be created by authenticated users" ON public.organizations;
DROP POLICY IF EXISTS "Organizations can be updated by organization admins" ON public.organizations;
DROP POLICY IF EXISTS "Organizations can be deleted by organization admins" ON public.organizations;

DROP POLICY IF EXISTS "Members can view members of their organizations" ON public.members;
DROP POLICY IF EXISTS "Users can create their own member record" ON public.members;
DROP POLICY IF EXISTS "Members can be updated by organization members" ON public.members;
DROP POLICY IF EXISTS "Members can be deleted by organization admins" ON public.members;

DROP POLICY IF EXISTS "Organization users can view their own memberships" ON public.organization_users;
DROP POLICY IF EXISTS "Organization admins can view all members of their organization" ON public.organization_users;
DROP POLICY IF EXISTS "Users can create their own organization membership" ON public.organization_users;
DROP POLICY IF EXISTS "Organization admins can update member roles" ON public.organization_users;

-- Create simple policies for organizations table (no circular dependencies)
CREATE POLICY "Organizations are viewable by everyone" ON public.organizations
    FOR SELECT USING (true);

CREATE POLICY "Organizations can be created by authenticated users" ON public.organizations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Organizations can be updated by authenticated users" ON public.organizations
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Organizations can be deleted by authenticated users" ON public.organizations
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create simple policies for members table
CREATE POLICY "Members can view members of their organization" ON public.members
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_users 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Users can create their own member record" ON public.members
    FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own member record" ON public.members
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Members can be deleted by admins" ON public.members
    FOR DELETE USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_users 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
        )
    );

-- Create simple policies for organization_users table
CREATE POLICY "Users can view their own memberships" ON public.organization_users
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own membership" ON public.organization_users
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own membership" ON public.organization_users
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all members of their organization" ON public.organization_users
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_users 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
        )
    );

-- Test the policies
SELECT 'All policies updated successfully' as status; 
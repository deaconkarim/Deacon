-- Drop existing policies for organizations table
DROP POLICY IF EXISTS "Organizations are viewable by everyone" ON public.organizations;
DROP POLICY IF EXISTS "Organizations can be created by authenticated users" ON public.organizations;
DROP POLICY IF EXISTS "Organizations can be updated by organization admins" ON public.organizations;

-- Create new policies that allow everyone to view organizations
CREATE POLICY "Organizations are viewable by everyone" ON public.organizations
    FOR SELECT USING (true);

CREATE POLICY "Organizations can be created by authenticated users" ON public.organizations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Organizations can be updated by organization admins" ON public.organizations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_members.organization_id = organizations.id
            AND organization_members.user_id = auth.uid()
            AND organization_members.role = 'admin'
            AND organization_members.status = 'active'
        )
    );

-- Also create a policy for deleting organizations (admin only)
CREATE POLICY "Organizations can be deleted by organization admins" ON public.organizations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_members.organization_id = organizations.id
            AND organization_members.user_id = auth.uid()
            AND organization_members.role = 'admin'
            AND organization_members.status = 'active'
        )
    );

-- Test the policy by checking if we can select organizations
SELECT COUNT(*) as accessible_organizations FROM organizations; 
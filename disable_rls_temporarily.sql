-- Temporarily disable RLS on organization_users table to fix infinite recursion
ALTER TABLE public.organization_users DISABLE ROW LEVEL SECURITY;

-- Also disable RLS on members table temporarily for registration
ALTER TABLE public.members DISABLE ROW LEVEL SECURITY;

-- Keep RLS enabled on organizations but with simple policies
DROP POLICY IF EXISTS "Organizations are viewable by everyone" ON public.organizations;
DROP POLICY IF EXISTS "Organizations can be created by authenticated users" ON public.organizations;
DROP POLICY IF EXISTS "Organizations can be updated by authenticated users" ON public.organizations;
DROP POLICY IF EXISTS "Organizations can be deleted by authenticated users" ON public.organizations;

-- Create simple policies for organizations table only
CREATE POLICY "Organizations are viewable by everyone" ON public.organizations
    FOR SELECT USING (true);

CREATE POLICY "Organizations can be created by authenticated users" ON public.organizations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Organizations can be updated by authenticated users" ON public.organizations
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Organizations can be deleted by authenticated users" ON public.organizations
    FOR DELETE USING (auth.role() = 'authenticated');

-- Test that organizations can be viewed
SELECT COUNT(*) as accessible_organizations FROM organizations; 
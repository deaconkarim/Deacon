-- Check what tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%organization%'
ORDER BY table_name;

-- Create the organization_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'deacon', 'admin')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(organization_id, user_id)
);

-- Enable RLS on organization_members table
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Create policies for organization_members
CREATE POLICY "Organization members can view their own organization memberships" ON public.organization_members
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Organization admins can view all members of their organization" ON public.organization_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.organization_members AS admin_membership
            WHERE admin_membership.organization_id = organization_members.organization_id
            AND admin_membership.user_id = auth.uid()
            AND admin_membership.role = 'admin'
            AND admin_membership.status = 'active'
        )
    );

CREATE POLICY "Organization members can be created by authenticated users" ON public.organization_members
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Organization admins can update member roles" ON public.organization_members
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.organization_members AS admin_membership
            WHERE admin_membership.organization_id = organization_members.organization_id
            AND admin_membership.user_id = auth.uid()
            AND admin_membership.role = 'admin'
            AND admin_membership.status = 'active'
        )
    );

-- Now fix the organizations RLS policies (simplified version without organization_members dependency)
DROP POLICY IF EXISTS "Organizations are viewable by everyone" ON public.organizations;
DROP POLICY IF EXISTS "Organizations can be created by authenticated users" ON public.organizations;
DROP POLICY IF EXISTS "Organizations can be updated by organization admins" ON public.organizations;
DROP POLICY IF EXISTS "Organizations can be deleted by organization admins" ON public.organizations;

-- Create new policies that allow everyone to view organizations
CREATE POLICY "Organizations are viewable by everyone" ON public.organizations
    FOR SELECT USING (true);

CREATE POLICY "Organizations can be created by authenticated users" ON public.organizations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Organizations can be updated by authenticated users" ON public.organizations
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Organizations can be deleted by authenticated users" ON public.organizations
    FOR DELETE USING (auth.role() = 'authenticated');

-- Test the policy by checking if we can select organizations
SELECT COUNT(*) as accessible_organizations FROM organizations; 
-- Create organizations table for multi-tenancy
CREATE TABLE public.organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    address JSONB,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add organization_id to existing tables
ALTER TABLE public.members ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.events ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.donations ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.groups ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.group_members ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.event_attendance ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.church_settings ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Create organization_members junction table for user-organization relationships
CREATE TABLE public.organization_members (
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

-- Enable RLS on new tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Create policies for organizations
CREATE POLICY "Organizations are viewable by everyone" ON public.organizations
    FOR SELECT USING (is_active = true);

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

-- Update existing RLS policies to include organization_id checks
-- Drop existing policies first
DROP POLICY IF EXISTS "Enable read access for all users" ON public.members;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.members;
DROP POLICY IF EXISTS "Enable update for all users" ON public.members;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.members;

-- Create new organization-aware policies for members
CREATE POLICY "Members can view members of their organizations" ON public.members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_members.organization_id = members.organization_id
            AND organization_members.user_id = auth.uid()
            AND organization_members.status = 'active'
        )
    );

CREATE POLICY "Members can be created by organization members" ON public.members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_members.organization_id = members.organization_id
            AND organization_members.user_id = auth.uid()
            AND organization_members.status = 'active'
        )
    );

CREATE POLICY "Members can be updated by organization members" ON public.members
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_members.organization_id = members.organization_id
            AND organization_members.user_id = auth.uid()
            AND organization_members.status = 'active'
        )
    );

CREATE POLICY "Members can be deleted by organization admins" ON public.members
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_members.organization_id = members.organization_id
            AND organization_members.user_id = auth.uid()
            AND organization_members.role = 'admin'
            AND organization_members.status = 'active'
        )
    );

-- Insert some sample organizations
INSERT INTO public.organizations (name, slug, description, email, phone, website, address) VALUES
('Brentwood Lighthouse Baptist Church', 'blb-church', 'A welcoming Baptist church in Brentwood, CA', 'info@blb.church', '(925) 634-1540', 'www.blb.church', '{"street": "2250 Jeffery Way", "city": "Brentwood", "state": "CA", "zip": "94513"}'),
('Grace Community Church', 'grace-community', 'A vibrant community church focused on serving our neighbors', 'hello@gracecommunity.org', '(555) 123-4567', 'www.gracecommunity.org', '{"street": "123 Main Street", "city": "Anytown", "state": "CA", "zip": "12345"}'),
('First Baptist Church', 'first-baptist', 'Traditional Baptist church with contemporary ministries', 'info@firstbaptist.org', '(555) 987-6543', 'www.firstbaptist.org', '{"street": "456 Oak Avenue", "city": "Somewhere", "state": "CA", "zip": "54321"}');

-- Update existing data to associate with the first organization (BLB Church)
UPDATE public.members SET organization_id = (SELECT id FROM public.organizations WHERE slug = 'blb-church') WHERE organization_id IS NULL;
UPDATE public.events SET organization_id = (SELECT id FROM public.organizations WHERE slug = 'blb-church') WHERE organization_id IS NULL;
UPDATE public.donations SET organization_id = (SELECT id FROM public.organizations WHERE slug = 'blb-church') WHERE organization_id IS NULL;
UPDATE public.groups SET organization_id = (SELECT id FROM public.organizations WHERE slug = 'blb-church') WHERE organization_id IS NULL;
UPDATE public.group_members SET organization_id = (SELECT id FROM public.organizations WHERE slug = 'blb-church') WHERE organization_id IS NULL;
UPDATE public.event_attendance SET organization_id = (SELECT id FROM public.organizations WHERE slug = 'blb-church') WHERE organization_id IS NULL;
UPDATE public.church_settings SET organization_id = (SELECT id FROM public.organizations WHERE slug = 'blb-church') WHERE organization_id IS NULL;

-- Make organization_id NOT NULL after setting default values
ALTER TABLE public.members ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.events ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.donations ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.groups ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.group_members ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.event_attendance ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.church_settings ALTER COLUMN organization_id SET NOT NULL; 
-- Add organizations and authentication support
-- Create organizations table
CREATE TABLE public.organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    address JSONB,
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    logo_url TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create organization_users table to link users to organizations
CREATE TABLE public.organization_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(organization_id, user_id)
);

-- Add organization_id to existing tables (only those that exist)
ALTER TABLE public.members ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.events ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.donations ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.groups ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.group_members ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.event_attendance ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.church_settings ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX idx_members_organization_id ON public.members(organization_id);
CREATE INDEX idx_events_organization_id ON public.events(organization_id);
CREATE INDEX idx_donations_organization_id ON public.donations(organization_id);
CREATE INDEX idx_groups_organization_id ON public.groups(organization_id);
CREATE INDEX idx_group_members_organization_id ON public.group_members(organization_id);
CREATE INDEX idx_event_attendance_organization_id ON public.event_attendance(organization_id);
CREATE INDEX idx_church_settings_organization_id ON public.church_settings(organization_id);

-- Enable RLS on new tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for organizations
CREATE POLICY "Users can view organizations they belong to" ON public.organizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.organization_users
            WHERE organization_users.organization_id = organizations.id
            AND organization_users.user_id = auth.uid()
            AND organization_users.status = 'active'
        )
    );

CREATE POLICY "Organization owners can update their organization" ON public.organizations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.organization_users
            WHERE organization_users.organization_id = organizations.id
            AND organization_users.user_id = auth.uid()
            AND organization_users.role = 'owner'
            AND organization_users.status = 'active'
        )
    );

-- Create RLS policies for organization_users
CREATE POLICY "Users can view their organization memberships" ON public.organization_users
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own organization memberships" ON public.organization_users
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own organization memberships" ON public.organization_users
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own organization memberships" ON public.organization_users
    FOR DELETE USING (user_id = auth.uid());

-- Update existing RLS policies to include organization_id
-- Members policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.members;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.members;
DROP POLICY IF EXISTS "Enable update for all users" ON public.members;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.members;

CREATE POLICY "Users can view members in their organizations" ON public.members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.organization_users
            WHERE organization_users.organization_id = members.organization_id
            AND organization_users.user_id = auth.uid()
            AND organization_users.status = 'active'
        )
    );

CREATE POLICY "Users can create members in their organizations" ON public.members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_users
            WHERE organization_users.organization_id = members.organization_id
            AND organization_users.user_id = auth.uid()
            AND organization_users.status = 'active'
        )
    );

CREATE POLICY "Users can update members in their organizations" ON public.members
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.organization_users
            WHERE organization_users.organization_id = members.organization_id
            AND organization_users.user_id = auth.uid()
            AND organization_users.status = 'active'
        )
    );

CREATE POLICY "Users can delete members in their organizations" ON public.members
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.organization_users
            WHERE organization_users.organization_id = members.organization_id
            AND organization_users.user_id = auth.uid()
            AND organization_users.status = 'active'
        )
    );

-- Events policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.events;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.events;
DROP POLICY IF EXISTS "Enable update for all users" ON public.events;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.events;

CREATE POLICY "Users can view events in their organizations" ON public.events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.organization_users
            WHERE organization_users.organization_id = events.organization_id
            AND organization_users.user_id = auth.uid()
            AND organization_users.status = 'active'
        )
    );

CREATE POLICY "Users can create events in their organizations" ON public.events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_users
            WHERE organization_users.organization_id = events.organization_id
            AND organization_users.user_id = auth.uid()
            AND organization_users.status = 'active'
        )
    );

CREATE POLICY "Users can update events in their organizations" ON public.events
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.organization_users
            WHERE organization_users.organization_id = events.organization_id
            AND organization_users.user_id = auth.uid()
            AND organization_users.status = 'active'
        )
    );

CREATE POLICY "Users can delete events in their organizations" ON public.events
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.organization_users
            WHERE organization_users.organization_id = events.organization_id
            AND organization_users.user_id = auth.uid()
            AND organization_users.status = 'active'
        )
    );

-- Create function to automatically set organization_id
CREATE OR REPLACE FUNCTION public.set_organization_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Get the user's primary organization
    SELECT organization_id INTO NEW.organization_id
    FROM public.organization_users
    WHERE user_id = auth.uid()
    AND status = 'active'
    ORDER BY created_at ASC
    LIMIT 1;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically set organization_id
CREATE TRIGGER set_members_organization_id
    BEFORE INSERT ON public.members
    FOR EACH ROW
    EXECUTE FUNCTION public.set_organization_id();

CREATE TRIGGER set_events_organization_id
    BEFORE INSERT ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.set_organization_id();

CREATE TRIGGER set_donations_organization_id
    BEFORE INSERT ON public.donations
    FOR EACH ROW
    EXECUTE FUNCTION public.set_organization_id();

CREATE TRIGGER set_groups_organization_id
    BEFORE INSERT ON public.groups
    FOR EACH ROW
    EXECUTE FUNCTION public.set_organization_id();

CREATE TRIGGER set_group_members_organization_id
    BEFORE INSERT ON public.group_members
    FOR EACH ROW
    EXECUTE FUNCTION public.set_organization_id();

CREATE TRIGGER set_event_attendance_organization_id
    BEFORE INSERT ON public.event_attendance
    FOR EACH ROW
    EXECUTE FUNCTION public.set_organization_id();

CREATE TRIGGER set_church_settings_organization_id
    BEFORE INSERT ON public.church_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.set_organization_id();

-- Create function to get user's organizations
CREATE OR REPLACE FUNCTION public.get_user_organizations()
RETURNS TABLE (
    organization_id UUID,
    organization_name VARCHAR(255),
    organization_slug VARCHAR(100),
    user_role VARCHAR(50),
    user_status VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ou.organization_id,
        o.name,
        o.slug,
        ou.role,
        ou.status
    FROM public.organization_users ou
    JOIN public.organizations o ON o.id = ou.organization_id
    WHERE ou.user_id = auth.uid()
    AND ou.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get current organization context
CREATE OR REPLACE FUNCTION public.get_current_organization()
RETURNS UUID AS $$
DECLARE
    org_id UUID;
BEGIN
    -- Try to get from session storage first (this will be set by the app)
    -- For now, return the first active organization
    SELECT organization_id INTO org_id
    FROM public.organization_users
    WHERE user_id = auth.uid()
    AND status = 'active'
    ORDER BY created_at ASC
    LIMIT 1;
    
    RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 
-- Create missing admin tables and fix admin data access
-- Migration: 20250127000000_create_admin_tables.sql

-- Create activity_log table for tracking system activity
CREATE TABLE IF NOT EXISTS public.activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create system_users view for admin access (safer than direct auth.users access)
CREATE OR REPLACE VIEW public.system_users AS
SELECT 
    au.id,
    au.email,
    au.created_at,
    au.last_sign_in_at,
    au.email_confirmed_at,
    m.firstname,
    m.lastname,
    m.organization_id,
    o.name as organization_name,
    ou.role,
    ou.status,
    ou.approval_status
FROM auth.users au
LEFT JOIN public.members m ON m.user_id = au.id
LEFT JOIN public.organizations o ON o.id = m.organization_id
LEFT JOIN public.organization_users ou ON ou.user_id = au.id AND ou.organization_id = m.organization_id;

-- Create system_stats view for admin dashboard (simplified)
CREATE OR REPLACE VIEW public.system_stats AS
SELECT 
    (SELECT COUNT(*) FROM public.organizations) as total_organizations,
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM public.members) as total_members,
    (SELECT COUNT(*) FROM public.donations) as total_donations,
    (SELECT COALESCE(SUM(amount), 0) FROM public.donations) as total_donation_amount,
    (SELECT COUNT(*) FROM public.organizations WHERE created_at >= NOW() - INTERVAL '30 days') as recent_organizations,
    (SELECT COUNT(*) FROM auth.users WHERE created_at >= NOW() - INTERVAL '30 days') as recent_users;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_log_organization_id ON public.activity_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON public.activity_log(action);

-- Enable RLS
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for activity_log
CREATE POLICY "Users can view activity for their organization" ON public.activity_log
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_users 
            WHERE user_id = auth.uid() AND status = 'active' AND approval_status = 'approved'
        )
    );

CREATE POLICY "System admins can view all activity" ON public.activity_log
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM organization_users 
            WHERE role = 'admin' AND status = 'active' AND approval_status = 'approved'
            AND organization_id IN (
                SELECT id FROM public.organizations WHERE slug = 'system-admin'
            )
        )
    );

CREATE POLICY "Users can insert activity for their organization" ON public.activity_log
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM organization_users 
            WHERE user_id = auth.uid() AND status = 'active' AND approval_status = 'approved'
        )
    );

-- Create function to log activity automatically
CREATE OR REPLACE FUNCTION log_admin_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Log organization changes
    IF TG_TABLE_NAME = 'organizations' THEN
        IF TG_OP = 'INSERT' THEN
            INSERT INTO public.activity_log (organization_id, user_id, action, details)
            VALUES (NEW.id, auth.uid(), 'organization_created', 
                    jsonb_build_object('organization_name', NEW.name, 'slug', NEW.slug));
        ELSIF TG_OP = 'UPDATE' THEN
            INSERT INTO public.activity_log (organization_id, user_id, action, details)
            VALUES (NEW.id, auth.uid(), 'organization_updated', 
                    jsonb_build_object('organization_name', NEW.name, 'changes', 
                    jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))));
        ELSIF TG_OP = 'DELETE' THEN
            INSERT INTO public.activity_log (organization_id, user_id, action, details)
            VALUES (OLD.id, auth.uid(), 'organization_deleted', 
                    jsonb_build_object('organization_name', OLD.name));
        END IF;
    END IF;
    
    -- Log user changes
    IF TG_TABLE_NAME = 'organization_users' THEN
        IF TG_OP = 'INSERT' THEN
            INSERT INTO public.activity_log (organization_id, user_id, action, details)
            VALUES (NEW.organization_id, auth.uid(), 'user_added', 
                    jsonb_build_object('user_id', NEW.user_id, 'role', NEW.role));
        ELSIF TG_OP = 'UPDATE' THEN
            INSERT INTO public.activity_log (organization_id, user_id, action, details)
            VALUES (NEW.organization_id, auth.uid(), 'user_updated', 
                    jsonb_build_object('user_id', NEW.user_id, 'role', NEW.role, 'status', NEW.status));
        ELSIF TG_OP = 'DELETE' THEN
            INSERT INTO public.activity_log (organization_id, user_id, action, details)
            VALUES (OLD.organization_id, auth.uid(), 'user_removed', 
                    jsonb_build_object('user_id', OLD.user_id));
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic activity logging
DROP TRIGGER IF EXISTS trigger_log_organization_activity ON public.organizations;
CREATE TRIGGER trigger_log_organization_activity
    AFTER INSERT OR UPDATE OR DELETE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION log_admin_activity();

DROP TRIGGER IF EXISTS trigger_log_user_activity ON organization_users;
CREATE TRIGGER trigger_log_user_activity
    AFTER INSERT OR UPDATE OR DELETE ON organization_users
    FOR EACH ROW EXECUTE FUNCTION log_admin_activity();

-- Insert some sample activity data for existing organizations
INSERT INTO public.activity_log (organization_id, action, details, created_at)
SELECT 
    id,
    'organization_created',
    jsonb_build_object('organization_name', name, 'slug', slug),
    created_at
FROM public.organizations
WHERE NOT EXISTS (
    SELECT 1 FROM public.activity_log 
    WHERE activity_log.organization_id = organizations.id 
    AND action = 'organization_created'
);

-- Create a system admin organization if it doesn't exist
INSERT INTO public.organizations (name, slug, description)
VALUES (
    'System Administration',
    'system-admin',
    'System-wide administration and management'
)
ON CONFLICT (slug) DO NOTHING; 
-- Create custom roles table
CREATE TABLE IF NOT EXISTS custom_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, name)
);

-- Create custom role permissions table for more granular control
CREATE TABLE IF NOT EXISTS custom_role_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    custom_role_id UUID NOT NULL REFERENCES custom_roles(id) ON DELETE CASCADE,
    permission TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(custom_role_id, permission)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_custom_roles_organization_id ON custom_roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_custom_roles_name ON custom_roles(name);
CREATE INDEX IF NOT EXISTS idx_custom_role_permissions_role_id ON custom_role_permissions(custom_role_id);
CREATE INDEX IF NOT EXISTS idx_custom_role_permissions_permission ON custom_role_permissions(permission);

-- Enable RLS
ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_role_permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for custom_roles
CREATE POLICY "Users can view custom roles for their organization" ON custom_roles
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_users 
            WHERE user_id = auth.uid() 
            AND status = 'active' 
            AND approval_status = 'approved'
        )
    );

CREATE POLICY "Admins can manage custom roles for their organization" ON custom_roles
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_users 
            WHERE user_id = auth.uid() 
            AND status = 'active' 
            AND approval_status = 'approved' 
            AND role IN ('admin', 'owner')
        )
    );

-- RLS policies for custom_role_permissions
CREATE POLICY "Users can view custom role permissions for their organization" ON custom_role_permissions
    FOR SELECT USING (
        custom_role_id IN (
            SELECT cr.id FROM custom_roles cr
            WHERE cr.organization_id IN (
                SELECT organization_id FROM organization_users 
                WHERE user_id = auth.uid() 
                AND status = 'active' 
                AND approval_status = 'approved'
            )
        )
    );

CREATE POLICY "Admins can manage custom role permissions for their organization" ON custom_role_permissions
    FOR ALL USING (
        custom_role_id IN (
            SELECT cr.id FROM custom_roles cr
            WHERE cr.organization_id IN (
                SELECT organization_id FROM organization_users 
                WHERE user_id = auth.uid() 
                AND status = 'active' 
                AND approval_status = 'approved' 
                AND role IN ('admin', 'owner')
            )
        )
    );

-- Function to get custom role permissions
CREATE OR REPLACE FUNCTION get_custom_role_permissions(role_name TEXT, org_id UUID)
RETURNS TEXT[] AS $$
DECLARE
    role_permissions TEXT[];
BEGIN
    SELECT array_agg(crp.permission) INTO role_permissions
    FROM custom_roles cr
    JOIN custom_role_permissions crp ON cr.id = crp.custom_role_id
    WHERE cr.name = role_name 
    AND cr.organization_id = org_id 
    AND cr.is_active = true;
    
    RETURN COALESCE(role_permissions, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a custom role has a specific permission
CREATE OR REPLACE FUNCTION custom_role_has_permission(role_name TEXT, org_id UUID, perm_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    has_perm BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM custom_roles cr
        JOIN custom_role_permissions crp ON cr.id = crp.custom_role_id
        WHERE cr.name = role_name 
        AND cr.organization_id = org_id 
        AND cr.is_active = true
        AND crp.permission = perm_name
    ) INTO has_perm;
    
    RETURN COALESCE(has_perm, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_custom_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_custom_roles_updated_at
    BEFORE UPDATE ON custom_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_custom_roles_updated_at(); 
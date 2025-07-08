-- Create the System Administration organization if it doesn't exist
-- This organization is used to manage system-wide administrative functions

INSERT INTO organizations (
  id,
  name,
  slug,
  description,
  contact_email,
  plan,
  status,
  settings,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  'System Administration',
  'system-administration',
  'System-wide administrative organization for managing all other organizations and system functions',
  'admin@churchapp.com',
  'enterprise',
  'active',
  jsonb_build_object(
    'features', jsonb_build_object(
      'donations', true,
      'events', true,
      'members', true,
      'messaging', true,
      'reports', true,
      'admin_center', true,
      'system_management', true
    ),
    'limits', jsonb_build_object(
      'members', 999999,
      'storage_gb', 1000,
      'monthly_emails', 999999
    ),
    'permissions', jsonb_build_object(
      'can_manage_organizations', true,
      'can_manage_users', true,
      'can_view_system_stats', true,
      'can_impersonate_users', true
    )
  ),
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM organizations WHERE name = 'System Administration'
);

-- Create a comment explaining the purpose
COMMENT ON TABLE organizations IS 'Organizations table with special System Administration org for system management';

-- Add an index on name for faster lookups of the System Administration org
CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(name);

-- Grant appropriate permissions (if using RLS)
-- Note: This may need to be adjusted based on your RLS policies 
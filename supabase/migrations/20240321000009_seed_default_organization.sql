-- Seed default organization and user for testing
-- This creates a default church organization and admin user

-- Create default organization
INSERT INTO public.organizations (
    id,
    name,
    slug,
    description,
    email,
    phone,
    website,
    address,
    created_at,
    updated_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'Brentwood Lighthouse Baptist Church',
    'brentwood-lighthouse-baptist',
    'A welcoming community of faith in Brentwood, CA',
    'info@blb.church',
    '(925) 634-1540',
    'www.blb.church',
    '{"street": "123 Main Street", "city": "Brentwood", "state": "CA", "zip": "94513"}',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create a default admin user (you'll need to create this user in Supabase Auth first)
-- The user ID below is a placeholder - you'll need to replace it with the actual user ID
-- from your Supabase Auth dashboard after creating the user

-- Note: This is commented out because we need to create the user in Supabase Auth first
-- Uncomment and update the user_id after creating the user in Supabase Auth

/*
INSERT INTO public.organization_users (
    organization_id,
    user_id,
    role,
    status,
    created_at,
    updated_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'karim', -- Replace with actual user ID from Supabase Auth
    'owner',
    'active',
    NOW(),
    NOW()
) ON CONFLICT (organization_id, user_id) DO NOTHING;
*/

-- Update existing data to belong to the default organization
-- This ensures existing data is associated with the organization

UPDATE public.members 
SET organization_id = '550e8400-e29b-41d4-a716-446655440000' 
WHERE organization_id IS NULL;

UPDATE public.events 
SET organization_id = '550e8400-e29b-41d4-a716-446655440000' 
WHERE organization_id IS NULL;

UPDATE public.donations 
SET organization_id = '550e8400-e29b-41d4-a716-446655440000' 
WHERE organization_id IS NULL;

UPDATE public.groups 
SET organization_id = '550e8400-e29b-41d4-a716-446655440000' 
WHERE organization_id IS NULL;

UPDATE public.group_members 
SET organization_id = '550e8400-e29b-41d4-a716-446655440000' 
WHERE organization_id IS NULL;

UPDATE public.event_attendance 
SET organization_id = '550e8400-e29b-41d4-a716-446655440000' 
WHERE organization_id IS NULL;

UPDATE public.church_settings 
SET organization_id = '550e8400-e29b-41d4-a716-446655440000' 
WHERE organization_id IS NULL; 
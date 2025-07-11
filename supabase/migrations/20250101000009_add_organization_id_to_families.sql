-- Add organization_id column to families table for better organization isolation
ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Update the family_members_view to include family organization_id
DROP VIEW IF EXISTS family_members_view;

CREATE OR REPLACE VIEW family_members_view AS
SELECT 
    f.id as family_id,
    f.family_name,
    f.primary_contact_id,
    f.address as family_address,
    f.phone as family_phone,
    f.email as family_email,
    f.organization_id as family_organization_id,
    m.id as member_id,
    m.firstname,
    m.lastname,
    m.email as member_email,
    m.phone as member_phone,
    m.image_url,
    m.member_type,
    m.birth_date,
    m.gender,
    m.marital_status,
    fr.relationship_type,
    fr.related_member_id,
    fr.is_primary,
    m.organization_id as member_organization_id,
    m.created_at as member_created_at
FROM public.families f
LEFT JOIN public.family_relationships fr ON f.id = fr.family_id
LEFT JOIN public.members m ON fr.member_id = m.id
ORDER BY f.family_name, m.firstname, m.lastname;

-- Grant permissions on the view
GRANT SELECT ON family_members_view TO authenticated;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_families_organization_id ON public.families(organization_id);

-- Update RLS policies to include organization filtering
DROP POLICY IF EXISTS "Enable read access for all users" ON public.families;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.families;
DROP POLICY IF EXISTS "Enable update for all users" ON public.families;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.families;

-- Create new RLS policies with organization filtering
CREATE POLICY "Enable read access for organization users" ON public.families
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Enable insert for organization users" ON public.families
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Enable update for organization users" ON public.families
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Enable delete for organization users" ON public.families
    FOR DELETE USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_users 
            WHERE user_id = auth.uid()
        )
    ); 
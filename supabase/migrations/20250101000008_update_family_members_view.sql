-- Update family_members_view to include organization_id for proper filtering
DROP VIEW IF EXISTS family_members_view;

CREATE OR REPLACE VIEW family_members_view AS
SELECT 
    f.id as family_id,
    f.family_name,
    f.primary_contact_id,
    f.address as family_address,
    f.phone as family_phone,
    f.email as family_email,
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
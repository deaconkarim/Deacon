-- Check if organizations exist
SELECT COUNT(*) as organization_count FROM organizations;

-- Show existing organizations
SELECT id, name, slug, description FROM organizations;

-- Add sample organizations if none exist
INSERT INTO public.organizations (name, slug, description, email, phone, website, address) 
SELECT 
    'Brentwood Lighthouse Baptist Church', 
    'blb-church', 
    'A welcoming Baptist church in Brentwood, CA', 
    'info@blb.church', 
    '(925) 634-1540', 
    'www.blb.church', 
    '{"street": "2250 Jeffery Way", "city": "Brentwood", "state": "CA", "zip": "94513"}'
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE slug = 'blb-church');

INSERT INTO public.organizations (name, slug, description, email, phone, website, address) 
SELECT 
    'Grace Community Church', 
    'grace-community', 
    'A vibrant community church focused on serving our neighbors', 
    'hello@gracecommunity.org', 
    '(555) 123-4567', 
    'www.gracecommunity.org', 
    '{"street": "123 Main Street", "city": "Anytown", "state": "CA", "zip": "12345"}'
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE slug = 'grace-community');

INSERT INTO public.organizations (name, slug, description, email, phone, website, address) 
SELECT 
    'First Baptist Church', 
    'first-baptist', 
    'Traditional Baptist church with contemporary ministries', 
    'info@firstbaptist.org', 
    '(555) 987-6543', 
    'www.firstbaptist.org', 
    '{"street": "456 Oak Avenue", "city": "Somewhere", "state": "CA", "zip": "54321"}'
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE slug = 'first-baptist');

-- Show organizations after adding
SELECT id, name, slug, description FROM organizations; 
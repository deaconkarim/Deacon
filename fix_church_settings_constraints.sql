-- Check the current constraints on church_settings table
SELECT conname, contype, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.church_settings'::regclass;

-- The issue is that we have both:
-- 1. UNIQUE (setting_key) - this prevents multiple organizations from having the same setting_key
-- 2. UNIQUE (setting_key, organization_id) - this allows multiple organizations to have the same setting_key

-- We should remove the single-column constraint since we want multi-tenancy
ALTER TABLE public.church_settings DROP CONSTRAINT IF EXISTS church_settings_setting_key_key;

-- Verify the constraint was removed
SELECT conname, contype, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.church_settings'::regclass; 
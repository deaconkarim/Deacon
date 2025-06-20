-- Check the current structure of church_settings table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'church_settings' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check existing constraints on church_settings table
SELECT conname, contype, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.church_settings'::regclass;

-- Add the missing unique constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'church_settings_setting_key_organization_id_key'
    ) THEN
        ALTER TABLE public.church_settings 
        ADD CONSTRAINT church_settings_setting_key_organization_id_key 
        UNIQUE (setting_key, organization_id);
    END IF;
END $$;

-- Verify the constraint was added
SELECT conname, contype, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.church_settings'::regclass; 
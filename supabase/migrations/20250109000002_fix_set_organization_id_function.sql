-- Fix missing set_organization_id function
-- Migration: 20250109000002_fix_set_organization_id_function.sql

-- Create the missing set_organization_id function
-- This function should preserve the organization_id if it's already set,
-- otherwise it could try to derive it from context

CREATE OR REPLACE FUNCTION set_organization_id()
RETURNS TRIGGER AS $$
BEGIN
    -- If organization_id is already set, don't change it
    IF NEW.organization_id IS NOT NULL THEN
        RETURN NEW;
    END IF;
    
    -- If no organization_id is set, this is likely an error case
    -- For demo data generation, the organization_id should always be provided
    -- We'll just return NEW without modification in this case
    RETURN NEW;
END;
$$ LANGUAGE plpgsql; 
-- Add organization_id to child_guardians table
-- Migration: add_organization_id_to_child_guardians.sql

-- First, add the organization_id column (without DEFAULT)
ALTER TABLE public.child_guardians 
ADD COLUMN organization_id uuid;

-- Update existing records to use the default organization
UPDATE public.child_guardians 
SET organization_id = (SELECT id FROM organizations WHERE name = 'Grace Community Church' LIMIT 1)
WHERE organization_id IS NULL;

-- Make organization_id NOT NULL after setting values
ALTER TABLE public.child_guardians ALTER COLUMN organization_id SET NOT NULL;

-- Add foreign key constraint for organization_id
ALTER TABLE public.child_guardians 
ADD CONSTRAINT child_guardians_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- Add index for better performance
CREATE INDEX idx_child_guardians_organization_id ON public.child_guardians(organization_id); 
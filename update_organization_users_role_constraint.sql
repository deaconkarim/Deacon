-- Update organization_users role constraint to allow custom roles
-- This removes the restrictive check constraint that only allows specific role values

-- Drop the existing role check constraint
ALTER TABLE public.organization_users DROP CONSTRAINT IF EXISTS organization_users_role_check;

-- Add a new, more flexible constraint that allows any non-empty string
ALTER TABLE public.organization_users 
ADD CONSTRAINT organization_users_role_check 
CHECK (role IS NOT NULL AND length(trim(role)) > 0); 
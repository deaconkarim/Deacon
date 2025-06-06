-- Add check constraint to ensure status is one of the valid values
ALTER TABLE public.members
DROP CONSTRAINT IF EXISTS members_status_check;

ALTER TABLE public.members
ADD CONSTRAINT members_status_check 
CHECK (status IN ('active', 'inactive', 'visitor')); 
-- Drop existing constraint if it exists
ALTER TABLE public.members
DROP CONSTRAINT IF EXISTS members_gender_check;

-- Add new constraint to only allow male and female
ALTER TABLE public.members
ADD CONSTRAINT members_gender_check CHECK (gender IN ('male', 'female'));

-- Update any existing records that don't match the new constraint
UPDATE public.members
SET gender = 'male'
WHERE gender NOT IN ('male', 'female'); 
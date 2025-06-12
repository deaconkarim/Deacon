-- Add gender column to members table
ALTER TABLE public.members
ADD COLUMN gender TEXT CHECK (gender IN ('male', 'female', 'other'));

-- Update existing records to have a default gender
UPDATE public.members SET gender = 'other' WHERE gender IS NULL; 
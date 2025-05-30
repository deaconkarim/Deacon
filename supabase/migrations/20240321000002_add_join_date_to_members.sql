-- Add join_date column to members table
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS join_date TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update existing records to use created_at as join_date
UPDATE public.members SET join_date = created_at WHERE join_date IS NULL; 
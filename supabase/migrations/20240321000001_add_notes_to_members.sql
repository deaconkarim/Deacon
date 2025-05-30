-- Add notes column to members table
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS notes TEXT; 
-- Add user_id column to members table to link members with auth users
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create an index on user_id for better performance
CREATE INDEX IF NOT EXISTS idx_members_user_id ON public.members(user_id);

-- Create a unique constraint to ensure one member per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_members_user_id_unique ON public.members(user_id) WHERE user_id IS NOT NULL; 
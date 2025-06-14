-- Drop the existing unique constraint on email
ALTER TABLE public.members DROP CONSTRAINT IF EXISTS members_email_key;

-- Create a partial unique index for email that allows multiple NULL values
CREATE UNIQUE INDEX members_email_unique_idx ON public.members (email) WHERE email IS NOT NULL; 
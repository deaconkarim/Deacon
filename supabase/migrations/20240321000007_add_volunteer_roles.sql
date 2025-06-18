-- Add volunteer_roles column to events table
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS volunteer_roles JSONB DEFAULT '[]'::jsonb;

-- Add comment to explain the column
COMMENT ON COLUMN public.events.volunteer_roles IS 'Array of volunteer roles with their descriptions'; 
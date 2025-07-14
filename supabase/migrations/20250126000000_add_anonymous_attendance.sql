-- Add support for anonymous event attendance
-- Allow member_id to be NULL and add anonymous_name field

-- First, drop the existing foreign key constraint
ALTER TABLE public.event_attendance 
DROP CONSTRAINT IF EXISTS event_attendance_member_id_fkey;

-- Allow member_id to be NULL
ALTER TABLE public.event_attendance 
ALTER COLUMN member_id DROP NOT NULL;

-- Add anonymous_name column
ALTER TABLE public.event_attendance 
ADD COLUMN anonymous_name TEXT DEFAULT 'Anonymous';

-- Add check constraint to ensure either member_id or anonymous_name is provided
ALTER TABLE public.event_attendance 
ADD CONSTRAINT event_attendance_member_or_anonymous_check 
CHECK (
    (member_id IS NOT NULL AND anonymous_name IS NULL) OR 
    (member_id IS NULL AND anonymous_name IS NOT NULL)
);

-- Recreate the foreign key constraint (allows NULL)
ALTER TABLE public.event_attendance 
ADD CONSTRAINT event_attendance_member_id_fkey 
FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;

-- Update the unique constraint to handle anonymous attendance
-- Drop the existing unique constraint
ALTER TABLE public.event_attendance 
DROP CONSTRAINT IF EXISTS event_attendance_event_id_member_id_key;

-- Add new unique constraint that handles both member and anonymous attendance
ALTER TABLE public.event_attendance 
ADD CONSTRAINT event_attendance_event_id_member_id_anonymous_key 
UNIQUE (event_id, member_id, anonymous_name);

-- Add a comment to document the new functionality
COMMENT ON TABLE public.event_attendance IS 'Tracks event attendance for both members and anonymous attendees. For members, member_id is set and anonymous_name is NULL. For anonymous attendees, member_id is NULL and anonymous_name contains the attendee name.';
-- Fix event_attendance constraint issues
-- This script addresses the 400 error when adding users to event attendance

-- First, let's see the current table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'event_attendance' 
ORDER BY ordinal_position;

-- Check the current constraints
SELECT conname, contype, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'public.event_attendance'::regclass;

-- Drop the problematic constraint if it exists
ALTER TABLE public.event_attendance 
DROP CONSTRAINT IF EXISTS event_attendance_member_or_anonymous_check;

-- Drop the unique constraint that might be causing issues
ALTER TABLE public.event_attendance 
DROP CONSTRAINT IF EXISTS event_attendance_event_id_member_id_anonymous_key;

-- Drop the old unique constraint if it exists
ALTER TABLE public.event_attendance 
DROP CONSTRAINT IF EXISTS event_attendance_event_id_member_id_key;

-- Recreate the foreign key constraint (allows NULL)
ALTER TABLE public.event_attendance 
DROP CONSTRAINT IF EXISTS event_attendance_member_id_fkey;

ALTER TABLE public.event_attendance 
ADD CONSTRAINT event_attendance_member_id_fkey 
FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;

-- Clean up existing duplicate data before creating unique indexes
-- Remove duplicate anonymous entries, keeping only the first one for each event
DELETE FROM public.event_attendance 
WHERE id IN (
    SELECT ea2.id
    FROM public.event_attendance ea1
    JOIN public.event_attendance ea2 ON 
        ea1.event_id = ea2.event_id 
        AND ea1.anonymous_name = ea2.anonymous_name
        AND ea1.member_id IS NULL 
        AND ea2.member_id IS NULL
        AND ea1.anonymous_name IS NOT NULL
        AND ea2.anonymous_name IS NOT NULL
        AND ea1.id < ea2.id
);

-- Add a unique constraint that handles both member and anonymous attendance
-- We'll use a partial index approach instead of a complex unique constraint
CREATE UNIQUE INDEX event_attendance_event_member_unique 
ON public.event_attendance (event_id, member_id) 
WHERE member_id IS NOT NULL;

CREATE UNIQUE INDEX event_attendance_event_anonymous_unique 
ON public.event_attendance (event_id, anonymous_name) 
WHERE member_id IS NULL AND anonymous_name IS NOT NULL;

-- Add a comment to document the functionality
COMMENT ON TABLE public.event_attendance IS 'Tracks event attendance for both members and anonymous attendees. For members, member_id is set. For anonymous attendees, member_id is NULL and anonymous_name contains the attendee name.';

-- Verify the constraints were created
SELECT conname, contype, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'public.event_attendance'::regclass; 
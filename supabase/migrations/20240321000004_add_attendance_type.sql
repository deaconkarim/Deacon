-- Add attendance_type to events table
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS attendance_type VARCHAR(50) DEFAULT 'rsvp' CHECK (attendance_type IN ('rsvp', 'check-in'));

-- Update event_attendance status check constraint
ALTER TABLE public.event_attendance
DROP CONSTRAINT IF EXISTS event_attendance_status_check;

ALTER TABLE public.event_attendance
ADD CONSTRAINT event_attendance_status_check 
CHECK (status IN ('attending', 'checked-in', 'declined'));

-- Update existing records to have default values
UPDATE public.events
SET attendance_type = 'rsvp'
WHERE attendance_type IS NULL; 
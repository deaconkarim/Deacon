-- Fix anonymous check-in constraint
-- Allow multiple anonymous check-ins per event

-- Drop the existing constraint that's causing the error
ALTER TABLE public.event_attendance 
DROP CONSTRAINT IF EXISTS event_attendance_event_anonymous_unique;

-- Verify the fix
SELECT 
    'Constraint removed' as status,
    'Multiple anonymous check-ins now allowed per event' as message; 
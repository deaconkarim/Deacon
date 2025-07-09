-- Update event types constraint to allow more descriptive event types
-- Migration: 20250109000000_update_event_types_constraint.sql

-- First, drop the existing constraint to avoid conflicts
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_event_type_check;

-- Update all existing event_type values to ensure they're compatible
UPDATE events SET event_type = 'Fellowship Activity' WHERE event_type IS NOT NULL;
UPDATE events SET event_type = 'Fellowship Activity' WHERE event_type IS NULL;

-- Add new constraint with expanded event types
ALTER TABLE events 
ADD CONSTRAINT events_event_type_check 
CHECK (event_type IN (
  'Sunday Service',
  'Bible Study', 
  'Prayer Meeting',
  'Youth Group',
  'Potluck Dinner',
  'Outreach Event',
  'Special Service',
  'Choir Practice',
  'Board Meeting',
  'Vacation Bible School',
  'Work Day',
  'Fellowship Activity'
));

-- Add comment
COMMENT ON CONSTRAINT events_event_type_check ON events IS 'Ensures event_type is one of the predefined church event categories'; 
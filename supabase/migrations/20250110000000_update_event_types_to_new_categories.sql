-- Update event types constraint to use the new simplified event categories
-- Migration: 20250110000000_update_event_types_to_new_categories.sql

-- First, drop the existing constraint
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_event_type_check;

-- Update existing event_type values to map to new categories
UPDATE events SET event_type = 'Worship Service' WHERE event_type IN ('Sunday Service', 'Special Service');
UPDATE events SET event_type = 'Bible Study or Class' WHERE event_type IN ('Bible Study', 'Vacation Bible School');
UPDATE events SET event_type = 'Prayer Meeting' WHERE event_type = 'Prayer Meeting';
UPDATE events SET event_type = 'Ministry Meeting' WHERE event_type IN ('Board Meeting', 'Choir Practice');
UPDATE events SET event_type = 'Outreach Event' WHERE event_type = 'Outreach Event';
UPDATE events SET event_type = 'Fellowship Gathering' WHERE event_type IN ('Potluck Dinner', 'Fellowship Activity', 'Youth Group');
UPDATE events SET event_type = 'Special Event' WHERE event_type = 'Special Service';
UPDATE events SET event_type = 'Training or Workshop' WHERE event_type = 'Work Day';

-- Set default for any remaining null or unrecognized values
UPDATE events SET event_type = 'Worship Service' WHERE event_type IS NULL OR event_type NOT IN (
  'Worship Service',
  'Bible Study or Class',
  'Prayer Meeting',
  'Ministry Meeting',
  'Outreach Event',
  'Fellowship Gathering',
  'Special Event',
  'Training or Workshop',
  'Fundraiser',
  'Trip or Retreat'
);

-- Add new constraint with the updated event types
ALTER TABLE events 
ADD CONSTRAINT events_event_type_check 
CHECK (event_type IN (
  'Worship Service',
  'Bible Study or Class',
  'Prayer Meeting',
  'Ministry Meeting',
  'Outreach Event',
  'Fellowship Gathering',
  'Special Event',
  'Training or Workshop',
  'Fundraiser',
  'Trip or Retreat'
));

-- Add comment
COMMENT ON CONSTRAINT events_event_type_check ON events IS 'Ensures event_type is one of the 10 main church event categories'; 
-- Expand event_type constraint to allow all event types
-- Drop the existing constraint
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_event_type_check;

-- Add the new expanded constraint
ALTER TABLE events ADD CONSTRAINT events_event_type_check 
CHECK (event_type IN (
  'Worship Service',
  'Bible Study or Class',
  'Prayer Meeting',
  'Fellowship Gathering',
  'Potluck',
  'Youth Group',
  'Children''s Ministry',
  'Men''s Ministry',
  'Women''s Ministry',
  'Board Meeting',
  'Community Service',
  'Special Event',
  'Other'
));

-- Add a comment explaining the constraint
COMMENT ON CONSTRAINT events_event_type_check ON events IS 'Allows all standard church event types'; 
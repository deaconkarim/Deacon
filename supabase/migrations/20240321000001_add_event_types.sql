-- Add event_type column to events table
ALTER TABLE events
ADD COLUMN event_type VARCHAR(50) CHECK (
  event_type IN (
    'Sunday Worship Service',
    'Bible Study',
    'Work Day',
    'Fellowship Activity'
  )
);

-- Update existing events based on their titles
UPDATE events
SET event_type = CASE
  WHEN LOWER(title) LIKE '%sunday worship%' THEN 'Sunday Worship Service'
  WHEN LOWER(title) LIKE '%bible study%' OR LOWER(title) LIKE '%tuesday%' OR LOWER(title) LIKE '%wednesday%' THEN 'Bible Study'
  WHEN LOWER(title) LIKE '%work day%' THEN 'Work Day'
  ELSE 'Fellowship Activity'
END; 
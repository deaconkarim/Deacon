-- Create the handle_updated_at function
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at column to events table if it doesn't exist
ALTER TABLE events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS set_updated_at ON events;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Add updated_at column to event_volunteers table if it doesn't exist
ALTER TABLE event_volunteers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create or replace the trigger for event_volunteers
DROP TRIGGER IF EXISTS set_updated_at ON event_volunteers;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON event_volunteers
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at(); 
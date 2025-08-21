-- Enhance event reminder system to support multiple reminders per event with granular timing

-- Add new columns to event_reminder_configs table
ALTER TABLE event_reminder_configs 
ADD COLUMN IF NOT EXISTS timing_unit VARCHAR(10) DEFAULT 'hours' CHECK (timing_unit IN ('minutes', 'hours', 'days', 'weeks')),
ADD COLUMN IF NOT EXISTS timing_value INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS reminder_order INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT true;

-- Update existing records to use the new timing system
UPDATE event_reminder_configs 
SET 
  timing_unit = 'hours',
  timing_value = timing_hours,
  reminder_order = 1
WHERE timing_unit IS NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_event_reminder_configs_event_timing 
ON event_reminder_configs (event_id, timing_unit, timing_value, is_active, is_enabled);

-- Add constraint to ensure unique reminder order per event
ALTER TABLE event_reminder_configs 
ADD CONSTRAINT unique_reminder_order_per_event 
UNIQUE (event_id, reminder_order);

-- Add function to calculate reminder time
CREATE OR REPLACE FUNCTION calculate_reminder_time(event_start TIMESTAMPTZ, timing_unit TEXT, timing_value INTEGER)
RETURNS TIMESTAMPTZ AS $$
BEGIN
  CASE timing_unit
    WHEN 'minutes' THEN RETURN event_start - INTERVAL '1 minute' * timing_value;
    WHEN 'hours' THEN RETURN event_start - INTERVAL '1 hour' * timing_value;
    WHEN 'days' THEN RETURN event_start - INTERVAL '1 day' * timing_value;
    WHEN 'weeks' THEN RETURN event_start - INTERVAL '1 week' * timing_value;
    ELSE RETURN event_start - INTERVAL '1 hour' * timing_value;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add function to get timing display text
CREATE OR REPLACE FUNCTION get_timing_display(timing_unit TEXT, timing_value INTEGER)
RETURNS TEXT AS $$
BEGIN
  CASE timing_unit
    WHEN 'minutes' THEN 
      RETURN CASE 
        WHEN timing_value = 1 THEN '1 minute before'
        ELSE timing_value || ' minutes before'
      END;
    WHEN 'hours' THEN 
      RETURN CASE 
        WHEN timing_value = 1 THEN '1 hour before'
        ELSE timing_value || ' hours before'
      END;
    WHEN 'days' THEN 
      RETURN CASE 
        WHEN timing_value = 1 THEN '1 day before'
        ELSE timing_value || ' days before'
      END;
    WHEN 'weeks' THEN 
      RETURN CASE 
        WHEN timing_value = 1 THEN '1 week before'
        ELSE timing_value || ' weeks before'
      END;
    ELSE RETURN timing_value || ' hours before';
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

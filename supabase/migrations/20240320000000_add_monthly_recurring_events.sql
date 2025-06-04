-- Add monthly recurring event fields
ALTER TABLE events
ADD COLUMN monthly_week INTEGER,
ADD COLUMN monthly_weekday INTEGER;

-- Add check constraints
ALTER TABLE events
ADD CONSTRAINT check_monthly_week CHECK (monthly_week IS NULL OR (monthly_week >= 1 AND monthly_week <= 5)),
ADD CONSTRAINT check_monthly_weekday CHECK (monthly_weekday IS NULL OR (monthly_weekday >= 0 AND monthly_weekday <= 6));

-- Add comment
COMMENT ON COLUMN events.monthly_week IS 'Week of the month (1-5, where 5 means last week)';
COMMENT ON COLUMN events.monthly_weekday IS 'Day of the week (0-6, where 0 is Sunday)'; 
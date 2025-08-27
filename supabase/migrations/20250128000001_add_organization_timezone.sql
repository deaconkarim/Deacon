-- Add timezone support to organizations
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York' NOT NULL;

-- Add timezone validation constraint
ALTER TABLE public.organizations 
ADD CONSTRAINT valid_timezone 
CHECK (timezone IN (
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu', 'America/Indiana/Indianapolis',
  'America/Detroit', 'America/Kentucky/Louisville', 'America/Kentucky/Monticello',
  'America/Indiana/Vincennes', 'America/Indiana/Winamac', 'America/Indiana/Marengo',
  'America/Indiana/Petersburg', 'America/Indiana/Vevay', 'America/Chicago',
  'America/Indiana/Tell_City', 'America/Indiana/Knox', 'America/Menominee',
  'America/North_Dakota/Center', 'America/North_Dakota/New_Salem',
  'America/North_Dakota/Beulah', 'America/Denver', 'America/Boise',
  'America/Phoenix', 'America/Los_Angeles', 'America/Anchorage',
  'America/Juneau', 'America/Sitka', 'America/Metlakatla', 'America/Yakutat',
  'America/Nome', 'America/Adak', 'Pacific/Honolulu', 'UTC'
));

-- Create timezone utility functions
CREATE OR REPLACE FUNCTION convert_to_organization_timezone(
  utc_timestamp TIMESTAMP WITH TIME ZONE,
  org_timezone TEXT
) RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
  RETURN utc_timestamp AT TIME ZONE org_timezone;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION convert_from_organization_timezone(
  local_timestamp TIMESTAMP WITH TIME ZONE,
  org_timezone TEXT
) RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
  -- Convert local time to UTC
  RETURN local_timestamp AT TIME ZONE org_timezone AT TIME ZONE 'UTC';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to get organization timezone
CREATE OR REPLACE FUNCTION get_organization_timezone(org_id UUID)
RETURNS TEXT AS $$
DECLARE
  org_tz TEXT;
BEGIN
  SELECT timezone INTO org_tz 
  FROM organizations 
  WHERE id = org_id;
  
  RETURN COALESCE(org_tz, 'America/New_York');
END;
$$ LANGUAGE plpgsql STABLE;

-- Create function to format event times in organization timezone
CREATE OR REPLACE FUNCTION format_event_time_in_org_timezone(
  event_id VARCHAR(255),
  org_id UUID
) RETURNS TABLE(
  formatted_start TEXT,
  formatted_end TEXT,
  timezone TEXT
) AS $$
DECLARE
  event_record RECORD;
  org_tz TEXT;
BEGIN
  -- Get organization timezone
  SELECT get_organization_timezone(org_id) INTO org_tz;
  
  -- Get event data
  SELECT * INTO event_record 
  FROM events 
  WHERE id = event_id;
  
  IF event_record IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY SELECT
    TO_CHAR(event_record.start_date AT TIME ZONE org_tz, 'YYYY-MM-DD HH24:MI:SS')::TEXT,
    TO_CHAR(event_record.end_date AT TIME ZONE org_tz, 'YYYY-MM-DD HH24:MI:SS')::TEXT,
    org_tz;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create view for timezone-aware event display
CREATE OR REPLACE VIEW events_with_timezone AS
SELECT 
  e.*,
  o.timezone as organization_timezone,
  e.start_date AT TIME ZONE o.timezone as local_start_date,
  e.end_date AT TIME ZONE o.timezone as local_end_date,
  TO_CHAR(e.start_date AT TIME ZONE o.timezone, 'YYYY-MM-DD HH24:MI:SS') as formatted_start,
  TO_CHAR(e.end_date AT TIME ZONE o.timezone, 'YYYY-MM-DD HH24:MI:SS') as formatted_end
FROM events e
JOIN organizations o ON e.organization_id = o.id;

-- Add timezone to existing organizations if not set
UPDATE public.organizations 
SET timezone = 'America/New_York' 
WHERE timezone IS NULL;

-- Create index for timezone lookups
CREATE INDEX IF NOT EXISTS idx_organizations_timezone ON public.organizations(timezone);

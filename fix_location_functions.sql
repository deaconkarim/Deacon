-- Fix Location Functions
-- Run this in your Supabase SQL Editor

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS check_location_conflict(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, UUID, UUID);
DROP FUNCTION IF EXISTS check_location_conflict(TEXT, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, UUID, UUID);
DROP FUNCTION IF EXISTS get_available_locations(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, UUID);

-- Create function to check for location conflicts
CREATE OR REPLACE FUNCTION check_location_conflict(
  p_location_id TEXT,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE,
  p_event_id UUID DEFAULT NULL,
  p_organization_id UUID DEFAULT NULL
) RETURNS TABLE(
  has_conflict BOOLEAN,
  conflicting_event_id UUID,
  conflicting_event_title TEXT,
  conflicting_start_date TIMESTAMP WITH TIME ZONE,
  conflicting_end_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Return empty result if location_id is null or invalid
  IF p_location_id IS NULL OR p_location_id = '' OR p_location_id = 'no-location' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    true as has_conflict,
    e.id as conflicting_event_id,
    e.title as conflicting_event_title,
    e.start_date as conflicting_start_date,
    e.end_date as conflicting_end_date
  FROM events e
  WHERE e.location_id::TEXT = p_location_id
    AND EXISTS (SELECT 1 FROM locations l WHERE l.id::TEXT = e.location_id::TEXT AND l.is_active = true)
    AND (p_event_id IS NULL OR e.id != p_event_id)
    AND (p_organization_id IS NULL OR e.organization_id = p_organization_id)
    AND (
      (p_start_date < e.end_date AND p_end_date > e.start_date)
      OR (e.start_date < p_end_date AND e.end_date > p_start_date)
    )
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Create function to get available locations for a time slot
CREATE OR REPLACE FUNCTION get_available_locations(
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE,
  p_organization_id UUID
) RETURNS TABLE(
  location_id UUID,
  location_name VARCHAR(255),
  location_description TEXT,
  capacity INTEGER,
  location_type VARCHAR(100)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id as location_id,
    l.name::VARCHAR(255) as location_name,
    l.description as location_description,
    l.capacity as capacity,
    l.location_type::VARCHAR(100) as location_type
  FROM locations l
  WHERE l.organization_id = p_organization_id
    AND l.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM events e
      WHERE e.location_id::TEXT = l.id::TEXT
        AND (
          (p_start_date < e.end_date AND p_end_date > e.start_date)
          OR (e.start_date < p_end_date AND e.end_date > p_start_date)
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Test the functions
SELECT 'Functions created successfully' as status; 
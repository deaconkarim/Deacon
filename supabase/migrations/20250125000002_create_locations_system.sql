-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  capacity INTEGER,
  location_type VARCHAR(100) DEFAULT 'room', -- room, outdoor, virtual, etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

-- Add location_id to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- Create location conflicts view
CREATE OR REPLACE VIEW location_conflicts AS
SELECT 
  e1.id as event1_id,
  e1.title as event1_title,
  e1.start_date as event1_start,
  e1.end_date as event1_end,
  e2.id as event2_id,
  e2.title as event2_title,
  e2.start_date as event2_start,
  e2.end_date as event2_end,
  l.id as location_id,
  l.name as location_name,
  e1.organization_id
FROM events e1
JOIN events e2 ON e1.location_id = e2.location_id 
  AND e1.id != e2.id
  AND e1.organization_id = e2.organization_id
JOIN locations l ON e1.location_id = l.id
WHERE 
  e1.location_id IS NOT NULL
  AND e2.location_id IS NOT NULL
  AND (
    (e1.start_date < e2.end_date AND e1.end_date > e2.start_date)
    OR (e2.start_date < e1.end_date AND e2.end_date > e1.start_date)
  )
  AND l.is_active = true;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS check_location_conflict(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, UUID, UUID);

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

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_available_locations(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, UUID);

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
      WHERE e.location_id::UUID = l.id::UUID
        AND (
          (p_start_date < e.end_date AND p_end_date > e.start_date)
          OR (e.start_date < p_end_date AND e.end_date > p_start_date)
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies for locations
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view locations from their organization" ON locations;
DROP POLICY IF EXISTS "Users can insert locations for their organization" ON locations;
DROP POLICY IF EXISTS "Users can update locations from their organization" ON locations;
DROP POLICY IF EXISTS "Users can delete locations from their organization" ON locations;

-- Policy: Users can only see locations from their organization
CREATE POLICY "Users can view locations from their organization" ON locations
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can insert locations for their organization
CREATE POLICY "Users can insert locations for their organization" ON locations
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update locations from their organization
CREATE POLICY "Users can update locations from their organization" ON locations
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete locations from their organization
CREATE POLICY "Users can delete locations from their organization" ON locations
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_locations_organization_id ON locations(organization_id);
CREATE INDEX IF NOT EXISTS idx_locations_active ON locations(is_active);
CREATE INDEX IF NOT EXISTS idx_events_location_id ON events(location_id);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_end_date ON events(end_date);

-- Insert some default locations for existing organizations
INSERT INTO locations (organization_id, name, description, capacity, location_type)
SELECT 
  o.id,
  'Main Sanctuary',
  'Primary worship space',
  200,
  'room'
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM locations l WHERE l.organization_id = o.id AND l.name = 'Main Sanctuary'
);

INSERT INTO locations (organization_id, name, description, capacity, location_type)
SELECT 
  o.id,
  'Fellowship Hall',
  'Multi-purpose gathering space',
  100,
  'room'
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM locations l WHERE l.organization_id = o.id AND l.name = 'Fellowship Hall'
);

INSERT INTO locations (organization_id, name, description, capacity, location_type)
SELECT 
  o.id,
  'Classroom 1',
  'Small group meeting room',
  25,
  'room'
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM locations l WHERE l.organization_id = o.id AND l.name = 'Classroom 1'
);

INSERT INTO locations (organization_id, name, description, capacity, location_type)
SELECT 
  o.id,
  'Classroom 2',
  'Small group meeting room',
  25,
  'room'
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM locations l WHERE l.organization_id = o.id AND l.name = 'Classroom 2'
);

INSERT INTO locations (organization_id, name, description, capacity, location_type)
SELECT 
  o.id,
  'Outdoor Pavilion',
  'Covered outdoor gathering space',
  150,
  'outdoor'
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM locations l WHERE l.organization_id = o.id AND l.name = 'Outdoor Pavilion'
); 
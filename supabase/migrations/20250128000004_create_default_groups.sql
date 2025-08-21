-- Create default groups migration
-- This migration creates "Everyone" and "Active Members" groups and sets up automatic membership

-- Add unique constraint to prevent duplicate default groups per organization FIRST
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_group_name_per_org') THEN
    ALTER TABLE groups ADD CONSTRAINT unique_group_name_per_org UNIQUE (name, organization_id);
  END IF;
END $$;

-- Function to create default groups for an organization if they don't exist
CREATE OR REPLACE FUNCTION create_default_groups_for_org(org_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Create "Everyone" group if it doesn't exist
  INSERT INTO groups (name, description, organization_id, is_default)
  VALUES ('Everyone', 'All members of the organization', org_id, true)
  ON CONFLICT (name, organization_id) DO NOTHING;
  
  -- Create "Active Members" group if it doesn't exist
  INSERT INTO groups (name, description, organization_id, is_default)
  VALUES ('Active Members', 'All active members of the organization', org_id, true)
  ON CONFLICT (name, organization_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Add is_default column to groups table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'is_default') THEN
    ALTER TABLE groups ADD COLUMN is_default BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create index on is_default column
CREATE INDEX IF NOT EXISTS idx_groups_is_default ON groups(is_default);

-- Function to add member to default groups
CREATE OR REPLACE FUNCTION add_member_to_default_groups()
RETURNS TRIGGER AS $$
DECLARE
  everyone_group_id UUID;
  active_members_group_id UUID;
BEGIN
  -- Only process if this is a new member or if status changed to active
  IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != 'active' AND NEW.status = 'active')) THEN
    
    -- Ensure default groups exist for this organization
    PERFORM create_default_groups_for_org(NEW.organization_id);
    
    -- Get the "Everyone" group ID
    SELECT id INTO everyone_group_id 
    FROM groups 
    WHERE name = 'Everyone' 
      AND organization_id = NEW.organization_id 
      AND is_default = true;
    
    -- Add to "Everyone" group if it exists
    IF everyone_group_id IS NOT NULL THEN
      INSERT INTO group_members (group_id, member_id, organization_id)
      VALUES (everyone_group_id, NEW.id, NEW.organization_id)
      ON CONFLICT (group_id, member_id) DO NOTHING;
    END IF;
    
    -- If member is active, also add to "Active Members" group
    IF NEW.status = 'active' THEN
      SELECT id INTO active_members_group_id 
      FROM groups 
      WHERE name = 'Active Members' 
        AND organization_id = NEW.organization_id 
        AND is_default = true;
      
      IF active_members_group_id IS NOT NULL THEN
        INSERT INTO group_members (group_id, member_id, organization_id)
        VALUES (active_members_group_id, NEW.id, NEW.organization_id)
        ON CONFLICT (group_id, member_id) DO NOTHING;
      END IF;
    END IF;
  END IF;
  
  -- If member status changed from active to inactive, remove from "Active Members"
  IF (TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status != 'active') THEN
    SELECT id INTO active_members_group_id 
    FROM groups 
    WHERE name = 'Active Members' 
      AND organization_id = NEW.organization_id 
      AND is_default = true;
    
    IF active_members_group_id IS NOT NULL THEN
      DELETE FROM group_members 
      WHERE group_id = active_members_group_id 
        AND member_id = NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic group membership on member insert/update
DROP TRIGGER IF EXISTS trigger_add_member_to_default_groups ON members;
CREATE TRIGGER trigger_add_member_to_default_groups
  AFTER INSERT OR UPDATE OF status ON members
  FOR EACH ROW
  EXECUTE FUNCTION add_member_to_default_groups();

-- Function to populate default groups for existing organizations
CREATE OR REPLACE FUNCTION populate_default_groups_for_existing_orgs()
RETURNS VOID AS $$
DECLARE
  org_record RECORD;
  member_record RECORD;
  everyone_group_id UUID;
  active_members_group_id UUID;
BEGIN
  -- Loop through all organizations
  FOR org_record IN SELECT DISTINCT organization_id FROM members WHERE organization_id IS NOT NULL
  LOOP
    -- Create default groups for this organization
    PERFORM create_default_groups_for_org(org_record.organization_id);
    
    -- Get group IDs
    SELECT id INTO everyone_group_id 
    FROM groups 
    WHERE name = 'Everyone' 
      AND organization_id = org_record.organization_id 
      AND is_default = true;
    
    SELECT id INTO active_members_group_id 
    FROM groups 
    WHERE name = 'Active Members' 
      AND organization_id = org_record.organization_id 
      AND is_default = true;
    
    -- Add all existing members to "Everyone" group
    IF everyone_group_id IS NOT NULL THEN
      INSERT INTO group_members (group_id, member_id, organization_id)
      SELECT everyone_group_id, id, organization_id
      FROM members 
      WHERE organization_id = org_record.organization_id
      ON CONFLICT (group_id, member_id) DO NOTHING;
    END IF;
    
    -- Add active members to "Active Members" group
    IF active_members_group_id IS NOT NULL THEN
      INSERT INTO group_members (group_id, member_id, organization_id)
      SELECT active_members_group_id, id, organization_id
      FROM members 
      WHERE organization_id = org_record.organization_id 
        AND status = 'active'
      ON CONFLICT (group_id, member_id) DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to populate default groups for existing organizations
SELECT populate_default_groups_for_existing_orgs();

-- Function to create default groups when a new organization is created
CREATE OR REPLACE FUNCTION create_default_groups_on_org_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default groups for the new organization
  PERFORM create_default_groups_for_org(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic default group creation on organization insert
DROP TRIGGER IF EXISTS trigger_create_default_groups_on_org_creation ON organizations;
CREATE TRIGGER trigger_create_default_groups_on_org_creation
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION create_default_groups_on_org_creation();



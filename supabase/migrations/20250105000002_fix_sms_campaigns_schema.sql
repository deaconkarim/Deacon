-- Fix SMS campaigns schema issues
-- This migration ensures the sms_campaigns table has the correct column names

-- Drop the problematic index if it exists
DROP INDEX IF EXISTS idx_sms_campaigns_scheduled_date;

-- Ensure the table exists with correct structure
DO $$
BEGIN
  -- If table doesn't exist, create it
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sms_campaigns') THEN
    CREATE TABLE sms_campaigns (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      organization_id UUID,
      name TEXT NOT NULL,
      description TEXT,
      message TEXT NOT NULL,
      "scheduledDate" DATE,
      "scheduledTime" TIME,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'completed', 'cancelled')),
      type TEXT NOT NULL DEFAULT 'immediate' CHECK (type IN ('immediate', 'scheduled', 'recurring')),
      "targetType" TEXT NOT NULL DEFAULT 'all' CHECK ("targetType" IN ('all', 'groups', 'members')),
      recipients JSONB DEFAULT '[]',
      "selectedGroups" JSONB DEFAULT '[]',
      "selectedMembers" JSONB DEFAULT '[]',
      sent_count INTEGER DEFAULT 0,
      delivered_count INTEGER DEFAULT 0,
      failed_count INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

-- Recreate the index with the correct column name
CREATE INDEX IF NOT EXISTS idx_sms_campaigns_scheduled_date ON sms_campaigns("scheduledDate");

-- Ensure all camelCase columns exist and are correctly named
DO $$
BEGIN
  -- Check if scheduledDate column exists, if not create it
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sms_campaigns' AND column_name = 'scheduledDate') THEN
    -- If scheduled_date exists, rename it
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sms_campaigns' AND column_name = 'scheduled_date') THEN
      ALTER TABLE sms_campaigns RENAME COLUMN scheduled_date TO "scheduledDate";
    ELSE
      -- Add the column if it doesn't exist
      ALTER TABLE sms_campaigns ADD COLUMN "scheduledDate" DATE;
    END IF;
  END IF;

  -- Check if scheduledTime column exists, if not create it
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sms_campaigns' AND column_name = 'scheduledTime') THEN
    -- If scheduled_time exists, rename it
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sms_campaigns' AND column_name = 'scheduled_time') THEN
      ALTER TABLE sms_campaigns RENAME COLUMN scheduled_time TO "scheduledTime";
    ELSE
      -- Add the column if it doesn't exist
      ALTER TABLE sms_campaigns ADD COLUMN "scheduledTime" TIME;
    END IF;
  END IF;

  -- Check if targetType column exists, if not create it
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sms_campaigns' AND column_name = 'targetType') THEN
    -- If target_type exists, rename it
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sms_campaigns' AND column_name = 'target_type') THEN
      ALTER TABLE sms_campaigns RENAME COLUMN target_type TO "targetType";
    ELSE
      -- Add the column if it doesn't exist
      ALTER TABLE sms_campaigns ADD COLUMN "targetType" TEXT NOT NULL DEFAULT 'all';
    END IF;
  END IF;

  -- Check if selectedGroups column exists, if not create it
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sms_campaigns' AND column_name = 'selectedGroups') THEN
    -- If selected_groups exists, rename it
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sms_campaigns' AND column_name = 'selected_groups') THEN
      ALTER TABLE sms_campaigns RENAME COLUMN selected_groups TO "selectedGroups";
    ELSE
      -- Add the column if it doesn't exist
      ALTER TABLE sms_campaigns ADD COLUMN "selectedGroups" JSONB DEFAULT '[]';
    END IF;
  END IF;

  -- Check if selectedMembers column exists, if not create it
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sms_campaigns' AND column_name = 'selectedMembers') THEN
    -- If selected_members exists, rename it
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sms_campaigns' AND column_name = 'selected_members') THEN
      ALTER TABLE sms_campaigns RENAME COLUMN selected_members TO "selectedMembers";
    ELSE
      -- Add the column if it doesn't exist
      ALTER TABLE sms_campaigns ADD COLUMN "selectedMembers" JSONB DEFAULT '[]';
    END IF;
  END IF;
END $$;

-- Insert sample data if table has correct structure and no data exists
DO $$
BEGIN
  -- Check if table has correct structure and organizations exist
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sms_campaigns' AND column_name = 'targetType') AND
     EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
    
    -- Only insert if no campaigns exist
    IF NOT EXISTS (SELECT 1 FROM sms_campaigns LIMIT 1) THEN
      DECLARE
        org_id UUID;
      BEGIN
        SELECT id INTO org_id FROM organizations LIMIT 1;
        
        IF org_id IS NOT NULL THEN
          INSERT INTO sms_campaigns (organization_id, name, description, message, type, status, "scheduledDate", "scheduledTime", "targetType", "selectedGroups", "selectedMembers") VALUES
            (org_id, 'Welcome Campaign', 'Welcome new members to the church', 'Welcome to our church! We''re so glad you''re here.', 'immediate', 'draft', NULL, NULL, 'all', '[]', '[]'),
            (org_id, 'Sunday Service Reminder', 'Weekly reminder for Sunday service', 'Join us this Sunday at 10 AM for worship!', 'recurring', 'scheduled', NULL, NULL, 'all', '[]', '[]');
        END IF;
      END;
    END IF;
  END IF;
END $$;
-- Fix SMS campaigns schema issues
-- This migration ensures the sms_campaigns table has the correct column names

-- Drop the problematic index if it exists
DROP INDEX IF EXISTS idx_sms_campaigns_scheduled_date;

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
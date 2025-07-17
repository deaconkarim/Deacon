-- Test script to validate the migration syntax
-- This script contains the problematic parts of the migration to test

-- Test the table creation with camelCase column names
CREATE TABLE IF NOT EXISTS test_sms_campaigns (
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

-- Test the index creation with the correct column name
CREATE INDEX IF NOT EXISTS idx_test_sms_campaigns_scheduled_date ON test_sms_campaigns("scheduledDate");

-- Test inserting data with camelCase column names
INSERT INTO test_sms_campaigns (name, description, message, "scheduledDate", "scheduledTime", "targetType", "selectedGroups", "selectedMembers") 
VALUES ('Test Campaign', 'Test Description', 'Test Message', '2024-01-15', '10:00:00', 'all', '[]', '[]');

-- Test selecting data
SELECT * FROM test_sms_campaigns;

-- Clean up
DROP TABLE IF EXISTS test_sms_campaigns;
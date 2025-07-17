-- Add Clearstream-style SMS features
-- This migration adds advanced SMS functionality similar to Clearstream

-- Create sms_campaigns table
CREATE TABLE IF NOT EXISTS sms_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  message TEXT NOT NULL,
  scheduled_date DATE,
  scheduled_time TIME,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'completed', 'cancelled')),
  type TEXT NOT NULL DEFAULT 'immediate' CHECK (type IN ('immediate', 'scheduled', 'recurring')),
  recipients JSONB DEFAULT '[]',
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sms_ab_tests table
CREATE TABLE IF NOT EXISTS sms_ab_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  variant_a TEXT NOT NULL,
  variant_b TEXT NOT NULL,
  test_size INTEGER DEFAULT 50,
  duration INTEGER DEFAULT 7,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  winner TEXT CHECK (winner IN ('A', 'B', 'tie')),
  variant_a_stats JSONB DEFAULT '{"sent": 0, "delivered": 0, "failed": 0, "responses": 0}',
  variant_b_stats JSONB DEFAULT '{"sent": 0, "delivered": 0, "failed": 0, "responses": 0}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sms_analytics table for detailed tracking
CREATE TABLE IF NOT EXISTS sms_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  total_responses INTEGER DEFAULT 0,
  delivery_rate DECIMAL(5,2) DEFAULT 0,
  response_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sms_opt_out_logs table for tracking opt-outs
CREATE TABLE IF NOT EXISTS sms_opt_out_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('opted_in', 'opted_out')),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sms_campaigns_organization_id ON sms_campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_sms_campaigns_status ON sms_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_sms_campaigns_scheduled_date ON sms_campaigns(scheduled_date);

CREATE INDEX IF NOT EXISTS idx_sms_ab_tests_organization_id ON sms_ab_tests(organization_id);
CREATE INDEX IF NOT EXISTS idx_sms_ab_tests_status ON sms_ab_tests(status);

CREATE INDEX IF NOT EXISTS idx_sms_analytics_organization_id ON sms_analytics(organization_id);
CREATE INDEX IF NOT EXISTS idx_sms_analytics_date ON sms_analytics(date);

CREATE INDEX IF NOT EXISTS idx_sms_opt_out_logs_organization_id ON sms_opt_out_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_sms_opt_out_logs_member_id ON sms_opt_out_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_sms_opt_out_logs_action ON sms_opt_out_logs(action);

-- Enable Row Level Security
ALTER TABLE sms_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_opt_out_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sms_campaigns
DROP POLICY IF EXISTS "Users can view SMS campaigns" ON sms_campaigns;
CREATE POLICY "Users can view SMS campaigns" ON sms_campaigns
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create SMS campaigns" ON sms_campaigns;
CREATE POLICY "Users can create SMS campaigns" ON sms_campaigns
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update SMS campaigns" ON sms_campaigns;
CREATE POLICY "Users can update SMS campaigns" ON sms_campaigns
  FOR UPDATE USING (true);

-- Create RLS policies for sms_ab_tests
DROP POLICY IF EXISTS "Users can view SMS A/B tests" ON sms_ab_tests;
CREATE POLICY "Users can view SMS A/B tests" ON sms_ab_tests
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create SMS A/B tests" ON sms_ab_tests;
CREATE POLICY "Users can create SMS A/B tests" ON sms_ab_tests
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update SMS A/B tests" ON sms_ab_tests;
CREATE POLICY "Users can update SMS A/B tests" ON sms_ab_tests
  FOR UPDATE USING (true);

-- Create RLS policies for sms_analytics
DROP POLICY IF EXISTS "Users can view SMS analytics" ON sms_analytics;
CREATE POLICY "Users can view SMS analytics" ON sms_analytics
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create SMS analytics" ON sms_analytics;
CREATE POLICY "Users can create SMS analytics" ON sms_analytics
  FOR INSERT WITH CHECK (true);

-- Create RLS policies for sms_opt_out_logs
DROP POLICY IF EXISTS "Users can view SMS opt-out logs" ON sms_opt_out_logs;
CREATE POLICY "Users can view SMS opt-out logs" ON sms_opt_out_logs
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create SMS opt-out logs" ON sms_opt_out_logs;
CREATE POLICY "Users can create SMS opt-out logs" ON sms_opt_out_logs
  FOR INSERT WITH CHECK (true);

-- Add sms_opt_in column to members table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'sms_opt_in') THEN
    ALTER TABLE members ADD COLUMN sms_opt_in BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Create triggers to automatically update updated_at
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_sms_campaigns_updated_at') THEN
    CREATE TRIGGER update_sms_campaigns_updated_at 
      BEFORE UPDATE ON sms_campaigns 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_sms_ab_tests_updated_at') THEN
    CREATE TRIGGER update_sms_ab_tests_updated_at 
      BEFORE UPDATE ON sms_ab_tests 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Insert some sample campaigns
INSERT INTO sms_campaigns (organization_id, name, description, message, type, status) VALUES
  ('00000000-0000-0000-0000-000000000000', 'Welcome Campaign', 'Welcome new members to the church', 'Welcome to our church! We''re so glad you''re here.', 'immediate', 'draft'),
  ('00000000-0000-0000-0000-000000000000', 'Sunday Service Reminder', 'Weekly reminder for Sunday service', 'Join us this Sunday at 10 AM for worship!', 'recurring', 'scheduled')
ON CONFLICT DO NOTHING;

-- Insert sample A/B test
INSERT INTO sms_ab_tests (organization_id, name, variant_a, variant_b, test_size, duration) VALUES
  ('00000000-0000-0000-0000-000000000000', 'Welcome Message Test', 'Welcome to our church!', 'We''re glad you''re here!', 50, 7)
ON CONFLICT DO NOTHING;
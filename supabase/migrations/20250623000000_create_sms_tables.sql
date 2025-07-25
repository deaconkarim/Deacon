-- Create SMS tables for Deacon
-- This migration creates the necessary tables for SMS functionality

-- Create sms_conversations table
CREATE TABLE IF NOT EXISTS sms_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  conversation_type TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sms_messages table
CREATE TABLE IF NOT EXISTS sms_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES sms_conversations(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'failed')),
  twilio_sid TEXT,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sms_templates table
CREATE TABLE IF NOT EXISTS sms_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  template_text TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint on template name (only if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sms_templates_name_unique') THEN
    ALTER TABLE sms_templates ADD CONSTRAINT sms_templates_name_unique UNIQUE (name);
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sms_conversations_type ON sms_conversations(conversation_type);
CREATE INDEX IF NOT EXISTS idx_sms_conversations_status ON sms_conversations(status);
CREATE INDEX IF NOT EXISTS idx_sms_conversations_updated_at ON sms_conversations(updated_at);

CREATE INDEX IF NOT EXISTS idx_sms_messages_conversation_id ON sms_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_member_id ON sms_messages(member_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_direction ON sms_messages(direction);
CREATE INDEX IF NOT EXISTS idx_sms_messages_status ON sms_messages(status);
CREATE INDEX IF NOT EXISTS idx_sms_messages_sent_at ON sms_messages(sent_at);
CREATE INDEX IF NOT EXISTS idx_sms_messages_twilio_sid ON sms_messages(twilio_sid);

CREATE INDEX IF NOT EXISTS idx_sms_templates_active ON sms_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_sms_templates_name ON sms_templates(name);

-- Enable Row Level Security
ALTER TABLE sms_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sms_conversations
DROP POLICY IF EXISTS "Users can view all SMS conversations" ON sms_conversations;
CREATE POLICY "Users can view all SMS conversations" ON sms_conversations
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create SMS conversations" ON sms_conversations;
CREATE POLICY "Users can create SMS conversations" ON sms_conversations
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update SMS conversations" ON sms_conversations;
CREATE POLICY "Users can update SMS conversations" ON sms_conversations
  FOR UPDATE USING (true);

-- Create RLS policies for sms_messages
DROP POLICY IF EXISTS "Users can view all SMS messages" ON sms_messages;
CREATE POLICY "Users can view all SMS messages" ON sms_messages
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create SMS messages" ON sms_messages;
CREATE POLICY "Users can create SMS messages" ON sms_messages
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update SMS messages" ON sms_messages;
CREATE POLICY "Users can update SMS messages" ON sms_messages
  FOR UPDATE USING (true);

-- Create RLS policies for sms_templates
DROP POLICY IF EXISTS "Users can view all SMS templates" ON sms_templates;
CREATE POLICY "Users can view all SMS templates" ON sms_templates
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create SMS templates" ON sms_templates;
CREATE POLICY "Users can create SMS templates" ON sms_templates
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update SMS templates" ON sms_templates;
CREATE POLICY "Users can update SMS templates" ON sms_templates
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can delete SMS templates" ON sms_templates;
CREATE POLICY "Users can delete SMS templates" ON sms_templates
  FOR DELETE USING (true);

-- Insert some default SMS templates
INSERT INTO sms_templates (name, description, template_text, variables) VALUES
  ('Welcome Message', 'Welcome new members to the church', 'Welcome to {church_name}! We''re so glad you''re here. If you have any questions, please don''t hesitate to reach out.', '["church_name"]'),
  ('Event Reminder', 'Remind members about upcoming events', 'Reminder: {event_name} is tomorrow at {event_time}. We hope to see you there!', '["event_name", "event_time"]'),
  ('Prayer Request', 'Send prayer request to prayer team', 'New prayer request from {member_name}: {request_text}', '["member_name", "request_text"]'),
  ('Emergency Notification', 'Send urgent notifications to all members', 'URGENT: {emergency_message}. Please check your email for more details.', '["emergency_message"]'),
  ('Pastoral Care', 'Follow up with members who need pastoral care', 'Hi {member_name}, we''re thinking of you and praying for you. Please let us know if you need anything.', '["member_name"]')
ON CONFLICT (name) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_sms_conversations_updated_at') THEN
    CREATE TRIGGER update_sms_conversations_updated_at 
      BEFORE UPDATE ON sms_conversations 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_sms_templates_updated_at') THEN
    CREATE TRIGGER update_sms_templates_updated_at 
      BEFORE UPDATE ON sms_templates 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$; 
-- Create email conversations table
CREATE TABLE IF NOT EXISTS email_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  conversation_type TEXT DEFAULT 'general',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email messages table
CREATE TABLE IF NOT EXISTS email_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES email_conversations(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  direction TEXT DEFAULT 'outbound', -- 'inbound' or 'outbound'
  status TEXT DEFAULT 'sent', -- 'sent', 'delivered', 'failed', 'queued'
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  resend_id TEXT, -- Store Resend email ID for tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  template_text TEXT NOT NULL,
  variables TEXT[], -- Array of variable names used in template
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_conversations_type ON email_conversations(conversation_type);
CREATE INDEX IF NOT EXISTS idx_email_conversations_status ON email_conversations(status);
CREATE INDEX IF NOT EXISTS idx_email_conversations_updated_at ON email_conversations(updated_at);

CREATE INDEX IF NOT EXISTS idx_email_messages_conversation_id ON email_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_member_id ON email_messages(member_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_sent_at ON email_messages(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_messages_status ON email_messages(status);

CREATE INDEX IF NOT EXISTS idx_email_templates_name ON email_templates(name);

-- Add RLS policies for email conversations
ALTER TABLE email_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view email conversations in their organization" ON email_conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
    )
  );

CREATE POLICY "Users can insert email conversations in their organization" ON email_conversations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
    )
  );

CREATE POLICY "Users can update email conversations in their organization" ON email_conversations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
    )
  );

-- Add RLS policies for email messages
ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view email messages in their organization" ON email_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
    )
  );

CREATE POLICY "Users can insert email messages in their organization" ON email_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
    )
  );

CREATE POLICY "Users can update email messages in their organization" ON email_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
    )
  );

-- Add RLS policies for email templates
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view email templates in their organization" ON email_templates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
    )
  );

CREATE POLICY "Users can insert email templates in their organization" ON email_templates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
    )
  );

CREATE POLICY "Users can update email templates in their organization" ON email_templates
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
    )
  );

CREATE POLICY "Users can delete email templates in their organization" ON email_templates
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_email_conversations_updated_at 
  BEFORE UPDATE ON email_conversations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at 
  BEFORE UPDATE ON email_templates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 
-- Add group tracking to email messages
ALTER TABLE email_messages 
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE SET NULL;

-- Create a table to track bulk email campaigns and their recipients
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES email_conversations(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  conversation_type TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a table to track campaign recipients (members and groups)
CREATE TABLE IF NOT EXISTS email_campaign_recipients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  email_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure either member_id or group_id is set, but not both
  CONSTRAINT check_recipient_type CHECK (
    (member_id IS NOT NULL AND group_id IS NULL) OR 
    (member_id IS NULL AND group_id IS NOT NULL)
  )
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_messages_group_id ON email_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_conversation_id ON email_campaigns(conversation_id);
CREATE INDEX IF NOT EXISTS idx_email_campaign_recipients_campaign_id ON email_campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_campaign_recipients_member_id ON email_campaign_recipients(member_id);
CREATE INDEX IF NOT EXISTS idx_email_campaign_recipients_group_id ON email_campaign_recipients(group_id);

-- Add RLS policies for email campaigns
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view email campaigns in their organization" ON email_campaigns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
    )
  );

CREATE POLICY "Users can insert email campaigns in their organization" ON email_campaigns
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
    )
  );

-- Add RLS policies for email campaign recipients
ALTER TABLE email_campaign_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view email campaign recipients in their organization" ON email_campaign_recipients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
    )
  );

CREATE POLICY "Users can insert email campaign recipients in their organization" ON email_campaign_recipients
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
    )
  );

CREATE POLICY "Users can update email campaign recipients in their organization" ON email_campaign_recipients
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
    )
  ); 
-- Add organization_id to core SMS tables
-- This migration adds organization_id to sms_conversations and sms_messages tables

-- Add organization_id to sms_conversations table
ALTER TABLE sms_conversations 
ADD COLUMN IF NOT EXISTS organization_id UUID;

-- Add organization_id to sms_messages table  
ALTER TABLE sms_messages 
ADD COLUMN IF NOT EXISTS organization_id UUID;

-- Add foreign key constraints if organizations table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
    -- Add constraints only if they don't already exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_sms_conversations_organization_id') THEN
      ALTER TABLE sms_conversations ADD CONSTRAINT fk_sms_conversations_organization_id 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_sms_messages_organization_id') THEN
      ALTER TABLE sms_messages ADD CONSTRAINT fk_sms_messages_organization_id 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sms_conversations_organization_id ON sms_conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_organization_id ON sms_messages(organization_id);

-- Add index for phone number matching in sms_messages
CREATE INDEX IF NOT EXISTS idx_sms_messages_from_number ON sms_messages(from_number);
CREATE INDEX IF NOT EXISTS idx_sms_messages_to_number ON sms_messages(to_number);
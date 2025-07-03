-- Add group_id column to sms_conversations table for group messaging
ALTER TABLE sms_conversations 
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_sms_conversations_group_id ON sms_conversations(group_id);

-- Add constraint to ensure either group_id is set or it's a regular conversation
-- (This allows for both group conversations and individual conversations)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_conversation_type') THEN
    ALTER TABLE sms_conversations 
    ADD CONSTRAINT check_conversation_type 
    CHECK (
      (conversation_type = 'group' AND group_id IS NOT NULL) OR
      (conversation_type != 'group' AND group_id IS NULL)
    );
  END IF;
END $$; 
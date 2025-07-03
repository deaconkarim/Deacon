-- Remove the conversation_type check constraint to allow any conversation type to be a group message
-- First, drop any existing check constraint if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sms_conversations_conversation_type_check') THEN
    ALTER TABLE sms_conversations DROP CONSTRAINT sms_conversations_conversation_type_check;
  END IF;
  
  -- Also drop the check_conversation_type constraint that was added in the previous migration
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_conversation_type') THEN
    ALTER TABLE sms_conversations DROP CONSTRAINT check_conversation_type;
  END IF;
END $$; 
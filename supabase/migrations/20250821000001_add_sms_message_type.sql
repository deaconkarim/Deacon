-- Add message_type and metadata columns to sms_messages table for event reminders

-- Add message_type column
ALTER TABLE sms_messages 
ADD COLUMN IF NOT EXISTS message_type VARCHAR(50) DEFAULT 'manual' CHECK (message_type IN ('manual', 'event_reminder', 'bulk', 'automated'));

-- Add metadata column for storing additional data
ALTER TABLE sms_messages 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Update existing records to have message_type
UPDATE sms_messages 
SET message_type = 'manual' 
WHERE message_type IS NULL;

-- Add index for better performance when querying by message type
CREATE INDEX IF NOT EXISTS idx_sms_messages_message_type 
ON sms_messages (message_type);

-- Add index for metadata queries
CREATE INDEX IF NOT EXISTS idx_sms_messages_metadata 
ON sms_messages USING GIN (metadata);

-- Add demographic and family fields to members table for advanced filtering and alerts
-- Migration: 20250102000000_add_member_demographic_fields.sql

-- Add birth_date field for birthday tracking
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Add anniversary_date field for anniversary tracking
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS anniversary_date DATE;

-- Add spouse_name field for family status tracking
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS spouse_name TEXT;

-- Add has_children field for family status tracking
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS has_children BOOLEAN DEFAULT FALSE;

-- Add gender field for demographic tracking
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say'));

-- Add marital_status field for more detailed family tracking
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS marital_status TEXT CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed', 'separated'));

-- Add occupation field for demographic tracking
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS occupation TEXT;

-- Add emergency_contact field for safety
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS emergency_contact JSONB;

-- Add notes field for additional member information
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add last_attendance_date for attendance tracking
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS last_attendance_date DATE;

-- Add attendance_frequency for attendance status filtering
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS attendance_frequency TEXT CHECK (attendance_frequency IN ('regular', 'occasional', 'rare', 'inactive'));

-- Add ministry_involvement field for ministry tracking
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS ministry_involvement TEXT[] DEFAULT '{}';

-- Add communication_preferences field for SMS/Email preferences
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS communication_preferences JSONB DEFAULT '{"sms": true, "email": true, "mail": false}';

-- Add tags field for custom categorization
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_members_birth_date ON members(birth_date);
CREATE INDEX IF NOT EXISTS idx_members_anniversary_date ON members(anniversary_date);
CREATE INDEX IF NOT EXISTS idx_members_join_date ON members(join_date);
CREATE INDEX IF NOT EXISTS idx_members_last_attendance_date ON members(last_attendance_date);
CREATE INDEX IF NOT EXISTS idx_members_attendance_frequency ON members(attendance_frequency);
CREATE INDEX IF NOT EXISTS idx_members_ministry_involvement ON members USING GIN(ministry_involvement);
CREATE INDEX IF NOT EXISTS idx_members_tags ON members USING GIN(tags);

-- Add comments for documentation
COMMENT ON COLUMN members.birth_date IS 'Member birth date for birthday tracking and age calculations';
COMMENT ON COLUMN members.anniversary_date IS 'Wedding anniversary date for anniversary tracking';
COMMENT ON COLUMN members.spouse_name IS 'Name of spouse for family status tracking';
COMMENT ON COLUMN members.has_children IS 'Whether member has children for family status filtering';
COMMENT ON COLUMN members.gender IS 'Member gender for demographic tracking';
COMMENT ON COLUMN members.marital_status IS 'Current marital status for family status filtering';
COMMENT ON COLUMN members.occupation IS 'Member occupation for demographic tracking';
COMMENT ON COLUMN members.emergency_contact IS 'Emergency contact information in JSON format';
COMMENT ON COLUMN members.notes IS 'Additional notes about the member';
COMMENT ON COLUMN members.last_attendance_date IS 'Date of last attendance for attendance tracking';
COMMENT ON COLUMN members.attendance_frequency IS 'Frequency of attendance for filtering';
COMMENT ON COLUMN members.ministry_involvement IS 'Array of ministry areas the member is involved in';
COMMENT ON COLUMN members.communication_preferences IS 'Communication preferences in JSON format';
COMMENT ON COLUMN members.tags IS 'Custom tags for member categorization';

-- Update RLS policies to include new fields
-- Note: This assumes existing RLS policies are already in place
-- The new fields will automatically be subject to the same RLS policies as other member fields 
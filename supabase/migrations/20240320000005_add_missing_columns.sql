-- Add role column to members if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'members' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE members 
        ADD COLUMN role TEXT DEFAULT 'member' CHECK (role IN ('member', 'deacon', 'admin'));
    END IF;
END $$;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Members can view own data" ON members;
DROP POLICY IF EXISTS "Admins can view all members" ON members;
DROP POLICY IF EXISTS "Admins can update all members" ON members;

-- Create new policies
CREATE POLICY "Members can view own data"
  ON members FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can view all members"
  ON members FOR SELECT
  TO authenticated
  USING (
    auth.jwt()->>'role' = 'admin'
  );

CREATE POLICY "Admins can update all members"
  ON members FOR UPDATE
  TO authenticated
  USING (
    auth.jwt()->>'role' = 'admin'
  );

-- Add any missing indexes
CREATE INDEX IF NOT EXISTS members_email_idx ON members(email); 
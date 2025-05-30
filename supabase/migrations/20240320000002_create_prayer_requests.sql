-- Create prayer_requests table
CREATE TABLE IF NOT EXISTS prayer_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES members(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;

-- Allow members to view their own prayer requests
CREATE POLICY "Members can view own prayer requests"
  ON prayer_requests FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR
    is_public = true OR
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id = auth.uid()
      AND members.role = 'admin'
      AND members.status = 'active'
    )
  );

-- Allow members to create prayer requests
CREATE POLICY "Members can create prayer requests"
  ON prayer_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
  );

-- Allow members to update their own prayer requests
CREATE POLICY "Members can update own prayer requests"
  ON prayer_requests FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() AND
    status = 'pending'
  );

-- Allow admins to update any prayer request
CREATE POLICY "Admins can update any prayer request"
  ON prayer_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id = auth.uid()
      AND members.role = 'admin'
      AND members.status = 'active'
    )
  );

-- Allow members to delete their own pending prayer requests
CREATE POLICY "Members can delete own pending prayer requests"
  ON prayer_requests FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid() AND
    status = 'pending'
  );

-- Allow admins to delete any prayer request
CREATE POLICY "Admins can delete any prayer request"
  ON prayer_requests FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id = auth.uid()
      AND members.role = 'admin'
      AND members.status = 'active'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS prayer_requests_created_by_idx ON prayer_requests(created_by);
CREATE INDEX IF NOT EXISTS prayer_requests_status_idx ON prayer_requests(status);
CREATE INDEX IF NOT EXISTS prayer_requests_created_at_idx ON prayer_requests(created_at DESC); 
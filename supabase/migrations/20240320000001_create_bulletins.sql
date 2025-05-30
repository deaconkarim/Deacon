-- Create bulletins table
CREATE TABLE IF NOT EXISTS bulletins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  service_order JSONB,
  sermon_scripture JSONB,
  upcoming_events JSONB,
  announcements JSONB,
  giving_attendance JSONB,
  monthly_praise_prayer JSONB,
  weekly_schedule JSONB,
  contact_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE bulletins ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view bulletins
CREATE POLICY "Anyone can view bulletins"
  ON bulletins FOR SELECT
  TO authenticated, anon
  USING (true);

-- Only allow admins to insert/update bulletins
CREATE POLICY "Admins can insert bulletins"
  ON bulletins FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id = auth.uid()
      AND members.role = 'admin'
      AND members.status = 'active'
    )
  );

CREATE POLICY "Admins can update bulletins"
  ON bulletins FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id = auth.uid()
      AND members.role = 'admin'
      AND members.status = 'active'
    )
  );

CREATE POLICY "Admins can delete bulletins"
  ON bulletins FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id = auth.uid()
      AND members.role = 'admin'
      AND members.status = 'active'
    )
  );

-- Create index on date for faster sorting
CREATE INDEX IF NOT EXISTS bulletins_date_idx ON bulletins(date DESC); 
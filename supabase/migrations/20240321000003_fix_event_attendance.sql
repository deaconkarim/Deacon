-- Drop existing event_attendance table
DROP TABLE IF EXISTS event_attendance CASCADE;

-- Recreate event_attendance table with proper foreign key relationships
CREATE TABLE event_attendance (
  id uuid default gen_random_uuid() primary key,
  event_id text not null references events(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  status text not null default 'attending' check (status = 'attending'),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint event_attendance_event_id_member_id_key unique (event_id, member_id)
);

-- Enable RLS
ALTER TABLE event_attendance ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON event_attendance
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON event_attendance
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON event_attendance
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON event_attendance
  FOR DELETE USING (true);

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON event_attendance
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at(); 
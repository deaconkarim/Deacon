import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function initializeDatabase() {
  // Create event_attendance table
  const { error: eventAttendanceError } = await supabase.rpc('create_event_attendance_table');
  if (eventAttendanceError) {
    console.error('Error creating event_attendance table:', eventAttendanceError);
  }

  // Create member_event_attendance table
  const { error: memberEventAttendanceError } = await supabase.rpc('create_member_event_attendance_table');
  if (memberEventAttendanceError) {
    console.error('Error creating member_event_attendance table:', memberEventAttendanceError);
  }
}

// SQL function to create event_attendance table
/*
create or replace function create_event_attendance_table()
returns void
language plpgsql
security definer
as $$
begin
  create table if not exists event_attendance (
    id uuid default gen_random_uuid() primary key,
    event_id text not null,
    member_id uuid references members(id),
    status text not null check (status in ('attending', 'maybe', 'not_attending')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(event_id, member_id)
  );

  -- Add RLS policies
  alter table event_attendance enable row level security;

  create policy "Enable read access for all users" on event_attendance
    for select using (true);

  create policy "Enable insert for authenticated users" on event_attendance
    for insert with check (true);

  create policy "Enable update for authenticated users" on event_attendance
    for update using (true);

  create policy "Enable delete for authenticated users" on event_attendance
    for delete using (true);
end;
$$;
*/ 
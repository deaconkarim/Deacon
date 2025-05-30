-- Drop existing table and related objects
do $$
begin
  -- Drop policies if they exist
  drop policy if exists "Enable read access for all users" on event_attendance;
  drop policy if exists "Enable insert for authenticated users" on event_attendance;
  drop policy if exists "Enable update for authenticated users" on event_attendance;
  drop policy if exists "Enable delete for authenticated users" on event_attendance;
  
  -- Drop table if it exists
  drop table if exists event_attendance cascade;
end $$;

-- Create the event_attendance table with the new structure
create table event_attendance (
  id uuid default gen_random_uuid() primary key,
  event_id text not null,
  member_id uuid not null,
  status text not null default 'attending' check (status = 'attending'),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint event_attendance_event_id_member_id_key unique (event_id, member_id)
);

-- Enable RLS
alter table event_attendance enable row level security;

-- Create policies
create policy "Enable read access for all users" on event_attendance
  for select using (true);

create policy "Enable insert for authenticated users" on event_attendance
  for insert with check (true);

create policy "Enable update for authenticated users" on event_attendance
  for update using (true);

create policy "Enable delete for authenticated users" on event_attendance
  for delete using (true); 
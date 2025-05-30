-- Drop existing table and related objects
DROP TABLE IF EXISTS public.event_attendance CASCADE;

-- Recreate event_attendance table with proper foreign key relationship
CREATE TABLE public.event_attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id VARCHAR(255) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(event_id, member_id)
);

-- Enable RLS
ALTER TABLE public.event_attendance ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON public.event_attendance;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.event_attendance;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.event_attendance;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.event_attendance;

-- Create new policies that allow all operations without authentication
CREATE POLICY "Enable read access for all users" ON public.event_attendance
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.event_attendance
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.event_attendance
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON public.event_attendance
    FOR DELETE USING (true); 
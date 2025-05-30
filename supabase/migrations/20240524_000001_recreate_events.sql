-- Drop existing table and related objects
DROP TABLE IF EXISTS public.events CASCADE;

-- Recreate events table
CREATE TABLE public.events (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(255),
    url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON public.events;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.events;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.events;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.events;

-- Create new policies that allow all operations without authentication
CREATE POLICY "Enable read access for all users" ON public.events
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.events
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.events
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON public.events
    FOR DELETE USING (true); 
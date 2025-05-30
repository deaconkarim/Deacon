-- Drop existing table and related objects
DROP TABLE IF EXISTS public.donations CASCADE;

-- Recreate donations table
CREATE TABLE public.donations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'weekly',
    notes TEXT,
    attendance INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON public.donations;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.donations;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.donations;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.donations;

-- Create new policies that allow all operations without authentication
CREATE POLICY "Enable read access for all users" ON public.donations
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.donations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.donations
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON public.donations
    FOR DELETE USING (true); 
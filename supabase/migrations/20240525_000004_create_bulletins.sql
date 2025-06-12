-- Create bulletins table
CREATE TABLE public.bulletins (
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
ALTER TABLE public.bulletins ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.bulletins
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.bulletins
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.bulletins
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON public.bulletins
    FOR DELETE USING (true);

-- Create index on date for faster sorting
CREATE INDEX bulletins_date_idx ON public.bulletins(date DESC); 
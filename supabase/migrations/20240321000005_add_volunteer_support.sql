-- Add needs_volunteers column to events table
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS needs_volunteers BOOLEAN DEFAULT false;

-- Create event_volunteers table
CREATE TABLE public.event_volunteers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id VARCHAR(255) REFERENCES events(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(event_id, member_id)
);

-- Enable RLS
ALTER TABLE public.event_volunteers ENABLE ROW LEVEL SECURITY;

-- Create policies for event_volunteers
CREATE POLICY "Enable read access for all users" ON public.event_volunteers
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.event_volunteers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.event_volunteers
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON public.event_volunteers
    FOR DELETE USING (true);

-- Add trigger to automatically update updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.event_volunteers
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at(); 
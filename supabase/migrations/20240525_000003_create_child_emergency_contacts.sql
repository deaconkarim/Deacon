-- Create child_emergency_contacts table
CREATE TABLE public.child_emergency_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    child_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    relationship TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.child_emergency_contacts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.child_emergency_contacts
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.child_emergency_contacts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.child_emergency_contacts
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON public.child_emergency_contacts
    FOR DELETE USING (true); 
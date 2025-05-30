-- Drop all existing tables and functions
DROP TABLE IF EXISTS public.prayer_responses CASCADE;
DROP TABLE IF EXISTS public.prayer_requests CASCADE;
DROP TABLE IF EXISTS public.members CASCADE;
DROP TABLE IF EXISTS public.donations CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.bulletins CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

-- Create members table first (since other tables reference it)
CREATE TABLE public.members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    address JSONB,
    role TEXT NOT NULL DEFAULT 'member',
    status TEXT NOT NULL DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create prayer_requests table
CREATE TABLE public.prayer_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    email TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create prayer_responses table
CREATE TABLE public.prayer_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prayer_request_id UUID REFERENCES prayer_requests(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id),
    response TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create donations table
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

-- Create events table
CREATE TABLE public.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create bulletins table
CREATE TABLE public.bulletins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security on all tables
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulletins ENABLE ROW LEVEL SECURITY;

-- Create policies for members
CREATE POLICY "Enable read access for all users" ON public.members
    FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.members
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON public.members
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users only" ON public.members
    FOR DELETE TO authenticated USING (true);

-- Create policies for prayer_requests
CREATE POLICY "Anyone can view non-anonymous requests" ON public.prayer_requests
    FOR SELECT TO authenticated, anon USING (is_anonymous = false);
CREATE POLICY "Requestors can view their own requests" ON public.prayer_requests
    FOR SELECT TO authenticated, anon USING (email = auth.jwt()->>'email');
CREATE POLICY "Authenticated users can create requests" ON public.prayer_requests
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Requestors can update their own requests" ON public.prayer_requests
    FOR UPDATE TO authenticated USING (email = auth.jwt()->>'email') WITH CHECK (true);
CREATE POLICY "Requestors can delete their own requests" ON public.prayer_requests
    FOR DELETE TO authenticated USING (email = auth.jwt()->>'email');

-- Create policies for prayer_responses
CREATE POLICY "Members can insert responses" ON public.prayer_responses
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM members
            WHERE members.id = auth.uid()
            AND members.status = 'active'
        )
    );
CREATE POLICY "Requestors can view responses to their requests" ON public.prayer_responses
    FOR SELECT TO authenticated, anon USING (
        EXISTS (
            SELECT 1 FROM prayer_requests
            WHERE prayer_requests.id = prayer_responses.prayer_request_id
            AND prayer_requests.email = auth.jwt()->>'email'
        )
    );
CREATE POLICY "Deacons can view all responses" ON public.prayer_responses
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM members
            WHERE members.id = auth.uid()
            AND members.role = 'deacon'
            AND members.status = 'active'
        )
    );

-- Create policies for donations
CREATE POLICY "Enable read access for all users" ON public.donations
    FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.donations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.donations
    FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.donations
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for events
CREATE POLICY "Allow read access for all users" ON public.events
    FOR SELECT USING (true);
CREATE POLICY "Allow insert for authenticated users only" ON public.events
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow update for authenticated users only" ON public.events
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete for authenticated users only" ON public.events
    FOR DELETE TO authenticated USING (true);

-- Create policies for bulletins
CREATE POLICY "Allow read access for all users" ON public.bulletins
    FOR SELECT USING (true);
CREATE POLICY "Allow insert for authenticated users only" ON public.bulletins
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow update for authenticated users only" ON public.bulletins
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete for authenticated users only" ON public.bulletins
    FOR DELETE TO authenticated USING (true);

-- Create triggers for updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.members
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.prayer_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.donations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.bulletins
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 
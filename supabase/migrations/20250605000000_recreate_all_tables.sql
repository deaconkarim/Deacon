-- Complete database recreation with correct schema
-- Drop all tables in order
DROP TABLE IF EXISTS public.event_attendance CASCADE;
DROP TABLE IF EXISTS public.member_event_attendance CASCADE;
DROP TABLE IF EXISTS public.group_members CASCADE;
DROP TABLE IF EXISTS public.task_comments CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.groups CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.donations CASCADE;
DROP TABLE IF EXISTS public.members CASCADE;
DROP TABLE IF EXISTS public.bulletins CASCADE;
DROP TABLE IF EXISTS public.prayer_requests CASCADE;
DROP TABLE IF EXISTS public.prayer_responses CASCADE;
DROP TABLE IF EXISTS public.church_settings CASCADE;

-- Create members table
CREATE TABLE public.members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    firstname TEXT NOT NULL,
    lastname TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    address JSONB,
    status TEXT NOT NULL DEFAULT 'active',
    notes TEXT,
    join_date DATE,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create events table
CREATE TABLE public.events (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(255),
    url VARCHAR(255),
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern VARCHAR(50),
    monthly_week INTEGER,
    monthly_weekday INTEGER,
    allow_rsvp BOOLEAN DEFAULT true,
    parent_event_id VARCHAR(255),
    is_master BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
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

-- Create groups table
CREATE TABLE public.groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    leader_id UUID REFERENCES public.members(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create group_members table
CREATE TABLE public.group_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(group_id, member_id)
);

-- Create event_attendance table
CREATE TABLE public.event_attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id VARCHAR(255) REFERENCES public.events(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'attending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(event_id, member_id)
);

-- Create church_settings table
CREATE TABLE public.church_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security on all tables
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for members
CREATE POLICY "Enable read access for all users" ON public.members FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.members FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.members FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.members FOR DELETE USING (true);

-- Create policies for events
CREATE POLICY "Enable read access for all users" ON public.events FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.events FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.events FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.events FOR DELETE USING (true);

-- Create policies for donations
CREATE POLICY "Enable read access for all users" ON public.donations FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.donations FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.donations FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.donations FOR DELETE USING (true);

-- Create policies for groups
CREATE POLICY "Enable read access for all users" ON public.groups FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.groups FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.groups FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.groups FOR DELETE USING (true);

-- Create policies for group_members
CREATE POLICY "Enable read access for all users" ON public.group_members FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.group_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.group_members FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.group_members FOR DELETE USING (true);

-- Create policies for event_attendance
CREATE POLICY "Enable read access for all users" ON public.event_attendance FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.event_attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.event_attendance FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.event_attendance FOR DELETE USING (true);

-- Create policies for church_settings
CREATE POLICY "Enable read access for all users" ON public.church_settings FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.church_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.church_settings FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.church_settings FOR DELETE USING (true);

-- Create storage bucket for member images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('members', 'members', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for member images
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'members');
CREATE POLICY "Authenticated users can upload member images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'members' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update member images" ON storage.objects FOR UPDATE USING (bucket_id = 'members' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete member images" ON storage.objects FOR DELETE USING (bucket_id = 'members' AND auth.role() = 'authenticated'); 
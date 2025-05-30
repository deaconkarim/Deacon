-- Create groups table
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    leader_id UUID REFERENCES members(id),
    type TEXT DEFAULT 'ministry' CHECK (type IN ('ministry', 'committee', 'music')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create group_members junction table
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    CONSTRAINT unique_group_member UNIQUE (group_id, member_id)
);

-- Enable RLS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Create policies for groups
CREATE POLICY "Enable read access for all users" ON public.groups
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.groups
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.groups
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON public.groups
    FOR DELETE USING (true);

-- Create policies for group_members
CREATE POLICY "Enable read access for all users" ON public.group_members
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.group_members
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.group_members
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON public.group_members
    FOR DELETE USING (true);

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.groups
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.group_members
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at(); 
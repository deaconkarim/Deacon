-- Create comprehensive family system
-- Add family-related fields to members table
ALTER TABLE public.members 
ADD COLUMN IF NOT EXISTS member_type TEXT DEFAULT 'adult' CHECK (member_type IN ('adult', 'child')),
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other')),
ADD COLUMN IF NOT EXISTS marital_status TEXT CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed')),
ADD COLUMN IF NOT EXISTS family_id UUID;

-- Create families table
CREATE TABLE public.families (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_name TEXT NOT NULL,
    primary_contact_id UUID REFERENCES public.members(id),
    address JSONB,
    phone TEXT,
    email TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relationship TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create family_relationships table
CREATE TABLE public.family_relationships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL CHECK (relationship_type IN (
        'spouse', 'parent', 'child', 'sibling', 'grandparent', 'grandchild', 
        'aunt', 'uncle', 'niece', 'nephew', 'cousin', 'guardian', 'other'
    )),
    related_member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(family_id, member_id)
);

-- Add foreign key constraint to members table
ALTER TABLE public.members 
ADD CONSTRAINT fk_members_family 
FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE SET NULL;

-- Enable RLS on new tables
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_relationships ENABLE ROW LEVEL SECURITY;

-- Create policies for families
CREATE POLICY "Enable read access for all users" ON public.families
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.families
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.families
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON public.families
    FOR DELETE USING (true);

-- Create policies for family_relationships
CREATE POLICY "Enable read access for all users" ON public.family_relationships
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.family_relationships
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.family_relationships
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON public.family_relationships
    FOR DELETE USING (true);

-- Create function to automatically create family relationships
CREATE OR REPLACE FUNCTION create_family_relationship()
RETURNS TRIGGER AS $$
BEGIN
    -- If a family_id is set, create a family_relationship record
    IF NEW.family_id IS NOT NULL THEN
        INSERT INTO public.family_relationships (
            family_id,
            member_id,
            relationship_type,
            is_primary
        ) VALUES (
            NEW.family_id,
            NEW.id,
            CASE 
                WHEN NEW.member_type = 'child' THEN 'child'
                ELSE 'other'
            END,
            false
        )
        ON CONFLICT (family_id, member_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic family relationship creation
CREATE TRIGGER trigger_create_family_relationship
    AFTER INSERT ON public.members
    FOR EACH ROW
    EXECUTE FUNCTION create_family_relationship();

-- Create function to update family relationships when family_id changes
CREATE OR REPLACE FUNCTION update_family_relationship()
RETURNS TRIGGER AS $$
BEGIN
    -- If family_id changed, update family_relationships
    IF OLD.family_id IS DISTINCT FROM NEW.family_id THEN
        -- Remove old relationship
        IF OLD.family_id IS NOT NULL THEN
            DELETE FROM public.family_relationships 
            WHERE family_id = OLD.family_id AND member_id = NEW.id;
        END IF;
        
        -- Add new relationship
        IF NEW.family_id IS NOT NULL THEN
            INSERT INTO public.family_relationships (
                family_id,
                member_id,
                relationship_type,
                is_primary
            ) VALUES (
                NEW.family_id,
                NEW.id,
                CASE 
                    WHEN NEW.member_type = 'child' THEN 'child'
                    ELSE 'other'
                END,
                false
            )
            ON CONFLICT (family_id, member_id) DO NOTHING;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating family relationships
CREATE TRIGGER trigger_update_family_relationship
    AFTER UPDATE ON public.members
    FOR EACH ROW
    EXECUTE FUNCTION update_family_relationship();

-- Create indexes for better performance
CREATE INDEX idx_members_family_id ON public.members(family_id);
CREATE INDEX idx_family_relationships_family_id ON public.family_relationships(family_id);
CREATE INDEX idx_family_relationships_member_id ON public.family_relationships(member_id);
CREATE INDEX idx_family_relationships_related_member_id ON public.family_relationships(related_member_id);

-- Create view for family information
CREATE OR REPLACE VIEW family_members_view AS
SELECT 
    f.id as family_id,
    f.family_name,
    f.primary_contact_id,
    f.address as family_address,
    f.phone as family_phone,
    f.email as family_email,
    m.id as member_id,
    m.firstname,
    m.lastname,
    m.email as member_email,
    m.phone as member_phone,
    m.image_url,
    m.member_type,
    m.birth_date,
    m.gender,
    m.marital_status,
    fr.relationship_type,
    fr.related_member_id,
    fr.is_primary,
    m.created_at as member_created_at
FROM public.families f
LEFT JOIN public.family_relationships fr ON f.id = fr.family_id
LEFT JOIN public.members m ON fr.member_id = m.id
ORDER BY f.family_name, m.firstname, m.lastname;

-- Grant permissions on the view
GRANT SELECT ON family_members_view TO authenticated; 
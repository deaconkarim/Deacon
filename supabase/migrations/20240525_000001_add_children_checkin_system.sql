-- Add member_type to members table
ALTER TABLE public.members
ADD COLUMN member_type TEXT NOT NULL DEFAULT 'adult' 
CHECK (member_type IN ('adult', 'child'));

-- Add birth_date to members table
ALTER TABLE public.members
ADD COLUMN birth_date DATE;

-- Create child_guardians table to track who can check in/out children
CREATE TABLE public.child_guardians (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    child_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    guardian_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    relationship TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(child_id, guardian_id)
);

-- Create child_checkin_logs table to track check-ins and check-outs
CREATE TABLE public.child_checkin_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    child_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    event_id VARCHAR(255) NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    checked_in_by UUID NOT NULL REFERENCES public.members(id),
    checked_out_by UUID REFERENCES public.members(id),
    check_in_time TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    check_out_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create child_allergies table to track important health information
CREATE TABLE public.child_allergies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    child_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    allergy_name TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create child_emergency_contacts table
CREATE TABLE public.child_emergency_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    child_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    contact_name TEXT NOT NULL,
    relationship TEXT NOT NULL,
    phone TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on new tables
ALTER TABLE public.child_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_checkin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_emergency_contacts ENABLE ROW LEVEL SECURITY;

-- Create policies for child_guardians
CREATE POLICY "Enable read access for all users" ON public.child_guardians
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.child_guardians
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.child_guardians
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON public.child_guardians
    FOR DELETE USING (true);

-- Create policies for child_checkin_logs
CREATE POLICY "Enable read access for all users" ON public.child_checkin_logs
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.child_checkin_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.child_checkin_logs
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON public.child_checkin_logs
    FOR DELETE USING (true);

-- Create policies for child_allergies
CREATE POLICY "Enable read access for all users" ON public.child_allergies
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.child_allergies
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.child_allergies
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON public.child_allergies
    FOR DELETE USING (true);

-- Create policies for child_emergency_contacts
CREATE POLICY "Enable read access for all users" ON public.child_emergency_contacts
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.child_emergency_contacts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.child_emergency_contacts
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON public.child_emergency_contacts
    FOR DELETE USING (true);

-- Create function to validate guardian
CREATE OR REPLACE FUNCTION validate_guardian()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure the guardian is an adult
    IF NOT EXISTS (
        SELECT 1 FROM members 
        WHERE id = NEW.guardian_id 
        AND member_type = 'adult'
    ) THEN
        RAISE EXCEPTION 'Guardian must be an adult member';
    END IF;
    
    -- Ensure the child is a child
    IF NOT EXISTS (
        SELECT 1 FROM members 
        WHERE id = NEW.child_id 
        AND member_type = 'child'
    ) THEN
        RAISE EXCEPTION 'Child must be a child member';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for guardian validation
CREATE TRIGGER validate_guardian_trigger
    BEFORE INSERT OR UPDATE ON child_guardians
    FOR EACH ROW
    EXECUTE FUNCTION validate_guardian();

-- Create function to validate check-in/out
CREATE OR REPLACE FUNCTION validate_checkin()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure the child is a child
    IF NOT EXISTS (
        SELECT 1 FROM members 
        WHERE id = NEW.child_id 
        AND member_type = 'child'
    ) THEN
        RAISE EXCEPTION 'Child must be a child member';
    END IF;
    
    -- Ensure the person checking in is a guardian
    IF NOT EXISTS (
        SELECT 1 FROM child_guardians
        WHERE child_id = NEW.child_id
        AND guardian_id = NEW.checked_in_by
    ) THEN
        RAISE EXCEPTION 'Person checking in must be a registered guardian';
    END IF;
    
    -- If checking out, ensure the person checking out is a guardian
    IF NEW.check_out_time IS NOT NULL AND NEW.checked_out_by IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM child_guardians
            WHERE child_id = NEW.child_id
            AND guardian_id = NEW.checked_out_by
        ) THEN
            RAISE EXCEPTION 'Person checking out must be a registered guardian';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for check-in validation
CREATE TRIGGER validate_checkin_trigger
    BEFORE INSERT OR UPDATE ON child_checkin_logs
    FOR EACH ROW
    EXECUTE FUNCTION validate_checkin(); 
-- Create user properties table for storing user preferences and settings
-- This allows adding new user properties without database schema changes

CREATE TABLE public.user_properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    property_key TEXT NOT NULL,
    property_value JSONB,
    property_type TEXT DEFAULT 'string' CHECK (property_type IN ('string', 'number', 'boolean', 'object', 'array')),
    is_encrypted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, organization_id, property_key)
);

-- Create indexes for better performance
CREATE INDEX idx_user_properties_user_id ON public.user_properties(user_id);
CREATE INDEX idx_user_properties_organization_id ON public.user_properties(organization_id);
CREATE INDEX idx_user_properties_key ON public.user_properties(property_key);
CREATE INDEX idx_user_properties_user_org ON public.user_properties(user_id, organization_id);

-- Enable Row Level Security
ALTER TABLE public.user_properties ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own properties" ON public.user_properties
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own properties" ON public.user_properties
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own properties" ON public.user_properties
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own properties" ON public.user_properties
    FOR DELETE USING (user_id = auth.uid());

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_user_properties_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER handle_user_properties_updated_at
    BEFORE UPDATE ON public.user_properties
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_properties_updated_at();

-- Insert some default user properties for existing users
-- This will set up theme preference for existing users
INSERT INTO public.user_properties (user_id, property_key, property_value, property_type)
SELECT 
    au.id,
    'theme',
    '"system"'::jsonb,
    'string'
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_properties up 
    WHERE up.user_id = au.id AND up.property_key = 'theme'
);

-- Add comments for documentation
COMMENT ON TABLE public.user_properties IS 'Stores user preferences and settings as key-value pairs';
COMMENT ON COLUMN public.user_properties.user_id IS 'Reference to auth.users table';
COMMENT ON COLUMN public.user_properties.organization_id IS 'Optional organization context for multi-tenant properties';
COMMENT ON COLUMN public.user_properties.property_key IS 'The property name/key';
COMMENT ON COLUMN public.user_properties.property_value IS 'The property value stored as JSONB for flexibility';
COMMENT ON COLUMN public.user_properties.property_type IS 'The data type of the property for validation';
COMMENT ON COLUMN public.user_properties.is_encrypted IS 'Whether the property value should be encrypted'; 
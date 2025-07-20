-- Square Integration Migration
-- This migration adds tables for Square payment integration and donation URL management

-- Create Square settings table for organization configuration
CREATE TABLE IF NOT EXISTS public.square_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    application_id TEXT NOT NULL,
    location_id TEXT,
    access_token TEXT,
    environment TEXT DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
    is_active BOOLEAN DEFAULT false,
    webhook_url TEXT,
    webhook_secret TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(organization_id)
);

-- Create donation URLs table for public donation pages
CREATE TABLE IF NOT EXISTS public.donation_urls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    slug TEXT NOT NULL UNIQUE,
    campaign_id UUID REFERENCES public.donation_campaigns(id) ON DELETE SET NULL,
    suggested_amounts DECIMAL(12,2)[] DEFAULT '{}',
    custom_message TEXT,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create Square donations table to track online donations
CREATE TABLE IF NOT EXISTS public.square_donations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    donation_url_id UUID NOT NULL REFERENCES public.donation_urls(id) ON DELETE CASCADE,
    donor_name TEXT,
    donor_email TEXT,
    amount DECIMAL(12,2) NOT NULL,
    square_payment_id TEXT NOT NULL,
    square_transaction_id TEXT,
    fund_designation TEXT DEFAULT 'general',
    message TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_square_settings_organization_id ON public.square_settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_square_settings_active ON public.square_settings(organization_id, is_active);

CREATE INDEX IF NOT EXISTS idx_donation_urls_organization_id ON public.donation_urls(organization_id);
CREATE INDEX IF NOT EXISTS idx_donation_urls_slug ON public.donation_urls(slug);
CREATE INDEX IF NOT EXISTS idx_donation_urls_active ON public.donation_urls(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_donation_urls_campaign_id ON public.donation_urls(campaign_id);

CREATE INDEX IF NOT EXISTS idx_square_donations_organization_id ON public.square_donations(organization_id);
CREATE INDEX IF NOT EXISTS idx_square_donations_donation_url_id ON public.square_donations(donation_url_id);
CREATE INDEX IF NOT EXISTS idx_square_donations_square_payment_id ON public.square_donations(square_payment_id);
CREATE INDEX IF NOT EXISTS idx_square_donations_created_at ON public.square_donations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_square_donations_status ON public.square_donations(organization_id, status);

-- Enable Row Level Security
ALTER TABLE public.square_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.square_donations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for square_settings
CREATE POLICY "Enable read access for organization users" ON public.square_settings
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Enable insert for organization users" ON public.square_settings
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.organization_users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Enable update for organization users" ON public.square_settings
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Enable delete for organization users" ON public.square_settings
    FOR DELETE USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_users 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for donation_urls
CREATE POLICY "Enable read access for organization users" ON public.donation_urls
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Enable insert for organization users" ON public.donation_urls
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.organization_users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Enable update for organization users" ON public.donation_urls
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Enable delete for organization users" ON public.donation_urls
    FOR DELETE USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_users 
            WHERE user_id = auth.uid()
        )
    );

-- Public read access for donation URLs (for public donation pages)
CREATE POLICY "Enable public read access for active donation URLs" ON public.donation_urls
    FOR SELECT USING (is_active = true);

-- RLS Policies for square_donations
CREATE POLICY "Enable read access for organization users" ON public.square_donations
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Enable insert for public" ON public.square_donations
    FOR INSERT WITH CHECK (true); -- Allow public inserts for donation processing

CREATE POLICY "Enable update for organization users" ON public.square_donations
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_users 
            WHERE user_id = auth.uid()
        )
    );

-- Create function to update donation_urls updated_at
CREATE OR REPLACE FUNCTION update_donation_urls_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for donation_urls updated_at
CREATE TRIGGER trigger_update_donation_urls_updated_at
    BEFORE UPDATE ON public.donation_urls
    FOR EACH ROW EXECUTE FUNCTION update_donation_urls_updated_at();

-- Create function to update square_donations updated_at
CREATE OR REPLACE FUNCTION update_square_donations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for square_donations updated_at
CREATE TRIGGER trigger_update_square_donations_updated_at
    BEFORE UPDATE ON public.square_donations
    FOR EACH ROW EXECUTE FUNCTION update_square_donations_updated_at();

-- Create function to update square_settings updated_at
CREATE OR REPLACE FUNCTION update_square_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for square_settings updated_at
CREATE TRIGGER trigger_update_square_settings_updated_at
    BEFORE UPDATE ON public.square_settings
    FOR EACH ROW EXECUTE FUNCTION update_square_settings_updated_at();

-- Add donation_url_id to existing donations table for linking
ALTER TABLE public.donations 
ADD COLUMN IF NOT EXISTS donation_url_id UUID REFERENCES public.donation_urls(id) ON DELETE SET NULL;

-- Add square_donation_id to existing donations table for linking Square donations
ALTER TABLE public.donations 
ADD COLUMN IF NOT EXISTS square_donation_id UUID REFERENCES public.square_donations(id) ON DELETE SET NULL;

-- Create indexes for linking
CREATE INDEX IF NOT EXISTS idx_donations_donation_url_id ON public.donations(donation_url_id);
CREATE INDEX IF NOT EXISTS idx_donations_square_donation_id ON public.donations(square_donation_id);
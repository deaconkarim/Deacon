-- Enhanced Donation Management System Migration
-- This migration enhances the existing donations table and adds new tables for comprehensive donation management

-- First, enhance the existing donations table
ALTER TABLE public.donations 
ADD COLUMN IF NOT EXISTS donor_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS campaign_id UUID,
ADD COLUMN IF NOT EXISTS pledge_id UUID,
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'check', 'credit_card', 'debit_card', 'ach', 'online', 'paypal', 'venmo', 'zelle', 'other')),
ADD COLUMN IF NOT EXISTS check_number TEXT,
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_tax_deductible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS fund_designation TEXT DEFAULT 'general' CHECK (fund_designation IN ('general', 'tithe', 'building_fund', 'missions', 'youth_ministry', 'outreach', 'benevolence', 'special_events', 'other')),
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(10,4) DEFAULT 1.0000,
ADD COLUMN IF NOT EXISTS processed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS receipt_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS receipt_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create donation campaigns table
CREATE TABLE IF NOT EXISTS public.donation_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    goal_amount DECIMAL(12,2),
    current_amount DECIMAL(12,2) DEFAULT 0.00,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    campaign_type TEXT DEFAULT 'fundraising' CHECK (campaign_type IN ('fundraising', 'building', 'missions', 'special_project', 'emergency', 'memorial', 'other')),
    visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'members_only')),
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create donation pledges table
CREATE TABLE IF NOT EXISTS public.donation_pledges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    donor_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.donation_campaigns(id) ON DELETE SET NULL,
    pledge_amount DECIMAL(12,2) NOT NULL,
    fulfilled_amount DECIMAL(12,2) DEFAULT 0.00,
    pledge_date DATE NOT NULL,
    due_date DATE,
    frequency TEXT DEFAULT 'one_time' CHECK (frequency IN ('one_time', 'weekly', 'monthly', 'quarterly', 'annually')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'fulfilled', 'cancelled', 'overdue')),
    notes TEXT,
    reminder_sent BOOLEAN DEFAULT false,
    last_reminder_sent TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create donation receipts table
CREATE TABLE IF NOT EXISTS public.donation_receipts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    donation_id UUID REFERENCES public.donations(id) ON DELETE CASCADE,
    donor_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    receipt_number TEXT NOT NULL UNIQUE,
    receipt_date DATE NOT NULL,
    tax_year INTEGER NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    tax_deductible_amount DECIMAL(12,2) NOT NULL,
    receipt_type TEXT DEFAULT 'annual' CHECK (receipt_type IN ('individual', 'annual', 'quarterly')),
    sent_via TEXT DEFAULT 'email' CHECK (sent_via IN ('email', 'mail', 'pickup', 'download')),
    sent_at TIMESTAMP WITH TIME ZONE,
    email_address TEXT,
    mailing_address JSONB,
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create donation categories table for better organization
CREATE TABLE IF NOT EXISTS public.donation_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_tax_deductible BOOLEAN DEFAULT true,
    account_code TEXT,
    parent_category_id UUID REFERENCES public.donation_categories(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(organization_id, name)
);

-- Create donation batches table for organizing donations
CREATE TABLE IF NOT EXISTS public.donation_batches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    batch_number TEXT NOT NULL,
    batch_date DATE NOT NULL,
    description TEXT,
    total_amount DECIMAL(12,2) DEFAULT 0.00,
    donation_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'reconciled')),
    processed_by UUID REFERENCES auth.users(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    reconciled_by UUID REFERENCES auth.users(id),
    reconciled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(organization_id, batch_number)
);

-- Create recurring donations table
CREATE TABLE IF NOT EXISTS public.recurring_donations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    donor_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'annually')),
    start_date DATE NOT NULL,
    end_date DATE,
    next_donation_date DATE,
    last_donation_date DATE,
    fund_designation TEXT DEFAULT 'general',
    payment_method TEXT DEFAULT 'cash',
    is_active BOOLEAN DEFAULT true,
    total_donated DECIMAL(12,2) DEFAULT 0.00,
    donation_count INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add foreign key references to link tables
ALTER TABLE public.donations 
ADD CONSTRAINT fk_donations_campaign_id FOREIGN KEY (campaign_id) REFERENCES public.donation_campaigns(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_donations_pledge_id FOREIGN KEY (pledge_id) REFERENCES public.donation_pledges(id) ON DELETE SET NULL;

-- Add donation_id to donations table to track batch
ALTER TABLE public.donations 
ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.donation_batches(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_donations_donor_id ON public.donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_campaign_id ON public.donations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_donations_pledge_id ON public.donations(pledge_id);
CREATE INDEX IF NOT EXISTS idx_donations_batch_id ON public.donations(batch_id);
CREATE INDEX IF NOT EXISTS idx_donations_payment_method ON public.donations(payment_method);
CREATE INDEX IF NOT EXISTS idx_donations_fund_designation ON public.donations(fund_designation);
CREATE INDEX IF NOT EXISTS idx_donations_date_amount ON public.donations(date DESC, amount DESC);
CREATE INDEX IF NOT EXISTS idx_donations_tags ON public.donations USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_donation_campaigns_organization_id ON public.donation_campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_donation_campaigns_active ON public.donation_campaigns(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_donation_campaigns_dates ON public.donation_campaigns(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_donation_pledges_donor_id ON public.donation_pledges(donor_id);
CREATE INDEX IF NOT EXISTS idx_donation_pledges_campaign_id ON public.donation_pledges(campaign_id);
CREATE INDEX IF NOT EXISTS idx_donation_pledges_status ON public.donation_pledges(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_donation_pledges_due_date ON public.donation_pledges(due_date) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_donation_receipts_donor_id ON public.donation_receipts(donor_id);
CREATE INDEX IF NOT EXISTS idx_donation_receipts_tax_year ON public.donation_receipts(tax_year);
CREATE INDEX IF NOT EXISTS idx_donation_receipts_receipt_number ON public.donation_receipts(receipt_number);

CREATE INDEX IF NOT EXISTS idx_donation_categories_organization_id ON public.donation_categories(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_donation_categories_parent ON public.donation_categories(parent_category_id);

CREATE INDEX IF NOT EXISTS idx_donation_batches_organization_id ON public.donation_batches(organization_id);
CREATE INDEX IF NOT EXISTS idx_donation_batches_status ON public.donation_batches(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_donation_batches_date ON public.donation_batches(batch_date DESC);

CREATE INDEX IF NOT EXISTS idx_recurring_donations_donor_id ON public.recurring_donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_recurring_donations_active ON public.recurring_donations(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_recurring_donations_next_date ON public.recurring_donations(next_donation_date) WHERE is_active = true;

-- Enable RLS on all new tables
ALTER TABLE public.donation_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_pledges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_donations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for all new tables
-- Donation Campaigns
CREATE POLICY "Users can view campaigns for their organization" ON public.donation_campaigns
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_users 
            WHERE user_id = auth.uid() AND status = 'active' AND approval_status = 'approved'
        )
    );

CREATE POLICY "Admins can manage campaigns for their organization" ON public.donation_campaigns
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_users 
            WHERE user_id = auth.uid() AND status = 'active' AND approval_status = 'approved' AND role IN ('admin', 'deacon')
        )
    );

-- Donation Pledges
CREATE POLICY "Users can view pledges for their organization" ON public.donation_pledges
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_users 
            WHERE user_id = auth.uid() AND status = 'active' AND approval_status = 'approved'
        )
    );

CREATE POLICY "Admins can manage pledges for their organization" ON public.donation_pledges
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_users 
            WHERE user_id = auth.uid() AND status = 'active' AND approval_status = 'approved' AND role IN ('admin', 'deacon')
        )
    );

-- Donation Receipts
CREATE POLICY "Users can view receipts for their organization" ON public.donation_receipts
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_users 
            WHERE user_id = auth.uid() AND status = 'active' AND approval_status = 'approved'
        )
    );

CREATE POLICY "Admins can manage receipts for their organization" ON public.donation_receipts
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_users 
            WHERE user_id = auth.uid() AND status = 'active' AND approval_status = 'approved' AND role IN ('admin', 'deacon')
        )
    );

-- Donation Categories
CREATE POLICY "Users can view categories for their organization" ON public.donation_categories
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_users 
            WHERE user_id = auth.uid() AND status = 'active' AND approval_status = 'approved'
        )
    );

CREATE POLICY "Admins can manage categories for their organization" ON public.donation_categories
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_users 
            WHERE user_id = auth.uid() AND status = 'active' AND approval_status = 'approved' AND role IN ('admin', 'deacon')
        )
    );

-- Donation Batches
CREATE POLICY "Users can view batches for their organization" ON public.donation_batches
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_users 
            WHERE user_id = auth.uid() AND status = 'active' AND approval_status = 'approved'
        )
    );

CREATE POLICY "Admins can manage batches for their organization" ON public.donation_batches
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_users 
            WHERE user_id = auth.uid() AND status = 'active' AND approval_status = 'approved' AND role IN ('admin', 'deacon')
        )
    );

-- Recurring Donations
CREATE POLICY "Users can view recurring donations for their organization" ON public.recurring_donations
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_users 
            WHERE user_id = auth.uid() AND status = 'active' AND approval_status = 'approved'
        )
    );

CREATE POLICY "Admins can manage recurring donations for their organization" ON public.recurring_donations
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_users 
            WHERE user_id = auth.uid() AND status = 'active' AND approval_status = 'approved' AND role IN ('admin', 'deacon')
        )
    );

-- Create functions for automatically updating campaign totals
CREATE OR REPLACE FUNCTION update_campaign_total()
RETURNS TRIGGER AS $$
BEGIN
    -- Update campaign total when donation is inserted, updated, or deleted
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.campaign_id IS NOT NULL THEN
            UPDATE donation_campaigns 
            SET current_amount = (
                SELECT COALESCE(SUM(amount), 0) 
                FROM donations 
                WHERE campaign_id = NEW.campaign_id
            ),
            updated_at = NOW()
            WHERE id = NEW.campaign_id;
        END IF;
    END IF;
    
    IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
        IF OLD.campaign_id IS NOT NULL THEN
            UPDATE donation_campaigns 
            SET current_amount = (
                SELECT COALESCE(SUM(amount), 0) 
                FROM donations 
                WHERE campaign_id = OLD.campaign_id
            ),
            updated_at = NOW()
            WHERE id = OLD.campaign_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create function for updating pledge fulfillment
CREATE OR REPLACE FUNCTION update_pledge_fulfillment()
RETURNS TRIGGER AS $$
BEGIN
    -- Update pledge fulfillment when donation is inserted, updated, or deleted
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.pledge_id IS NOT NULL THEN
            UPDATE donation_pledges 
            SET fulfilled_amount = (
                SELECT COALESCE(SUM(amount), 0) 
                FROM donations 
                WHERE pledge_id = NEW.pledge_id
            ),
            status = CASE 
                WHEN (SELECT COALESCE(SUM(amount), 0) FROM donations WHERE pledge_id = NEW.pledge_id) >= pledge_amount THEN 'fulfilled'
                ELSE status
            END,
            updated_at = NOW()
            WHERE id = NEW.pledge_id;
        END IF;
    END IF;
    
    IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
        IF OLD.pledge_id IS NOT NULL THEN
            UPDATE donation_pledges 
            SET fulfilled_amount = (
                SELECT COALESCE(SUM(amount), 0) 
                FROM donations 
                WHERE pledge_id = OLD.pledge_id
            ),
            status = CASE 
                WHEN (SELECT COALESCE(SUM(amount), 0) FROM donations WHERE pledge_id = OLD.pledge_id) >= pledge_amount THEN 'fulfilled'
                WHEN (SELECT COALESCE(SUM(amount), 0) FROM donations WHERE pledge_id = OLD.pledge_id) < pledge_amount THEN 'active'
                ELSE status
            END,
            updated_at = NOW()
            WHERE id = OLD.pledge_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_update_campaign_total
    AFTER INSERT OR UPDATE OR DELETE ON donations
    FOR EACH ROW EXECUTE FUNCTION update_campaign_total();

CREATE TRIGGER trigger_update_pledge_fulfillment
    AFTER INSERT OR UPDATE OR DELETE ON donations
    FOR EACH ROW EXECUTE FUNCTION update_pledge_fulfillment();

-- Insert default donation categories
INSERT INTO public.donation_categories (organization_id, name, description, is_tax_deductible, sort_order)
SELECT 
    o.id,
    category.name,
    category.description,
    category.is_tax_deductible,
    category.sort_order
FROM public.organizations o
CROSS JOIN (
    VALUES 
        ('General Fund', 'General church operations and ministry', true, 1),
        ('Tithes & Offerings', 'Regular tithes and offerings', true, 2),
        ('Building Fund', 'Church building and facility improvements', true, 3),
        ('Missions', 'Missionary support and outreach programs', true, 4),
        ('Youth Ministry', 'Youth programs and activities', true, 5),
        ('Children Ministry', 'Children programs and activities', true, 6),
        ('Music Ministry', 'Music equipment and choir expenses', true, 7),
        ('Benevolence', 'Help for those in need', true, 8),
        ('Special Events', 'Church events and celebrations', true, 9),
        ('Memorial Gifts', 'Memorial and honor donations', true, 10)
) AS category(name, description, is_tax_deductible, sort_order)
WHERE NOT EXISTS (
    SELECT 1 FROM public.donation_categories dc 
    WHERE dc.organization_id = o.id AND dc.name = category.name
);

-- Create receipt number generation function
CREATE OR REPLACE FUNCTION generate_receipt_number(org_id UUID, receipt_year INTEGER)
RETURNS TEXT AS $$
DECLARE
    org_prefix TEXT;
    receipt_count INTEGER;
    receipt_number TEXT;
BEGIN
    -- Get organization prefix (first 3 letters of name, uppercase)
    SELECT UPPER(LEFT(REPLACE(name, ' ', ''), 3)) INTO org_prefix
    FROM organizations WHERE id = org_id;
    
    -- Get count of receipts for this year and organization
    SELECT COUNT(*) + 1 INTO receipt_count
    FROM donation_receipts 
    WHERE organization_id = org_id AND tax_year = receipt_year;
    
    -- Generate receipt number: ORG-YEAR-###
    receipt_number := org_prefix || '-' || receipt_year || '-' || LPAD(receipt_count::TEXT, 4, '0');
    
    RETURN receipt_number;
END;
$$ LANGUAGE plpgsql; 
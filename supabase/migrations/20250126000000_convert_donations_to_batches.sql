-- Migration: Convert existing donations to proper batch system
-- This migration converts existing weekly donations (which were essentially batches) into proper batches

-- Step 1: Add legacy flag to donations table
ALTER TABLE public.donations 
ADD COLUMN IF NOT EXISTS is_legacy_batch_summary BOOLEAN DEFAULT false;

-- Step 2: Create batches from existing donations
INSERT INTO public.donation_batches (
    organization_id,
    batch_number,
    name,
    batch_date,
    description,
    total_amount,
    donation_count,
    status,
    created_at,
    updated_at
)
SELECT 
    d.organization_id,
    'BATCH-' || TO_CHAR(d.date, 'YYYY-MM-DD'),
    CASE 
        WHEN d.fund_designation = 'tithe' THEN 'Sunday Service - ' || TO_CHAR(d.date, 'Month DD, YYYY')
        ELSE INITCAP(COALESCE(d.fund_designation, 'general')) || ' - ' || TO_CHAR(d.date, 'Month DD, YYYY')
    END as name,
    d.date,
    CASE 
        WHEN d.notes IS NOT NULL THEN 'Legacy batch: ' || d.notes
        ELSE 'Legacy weekly collection converted to batch'
    END as description,
    d.amount,
    1 as donation_count, -- Each existing donation represents 1 batch
    'closed' as status, -- Mark legacy batches as closed
    d.created_at,
    d.updated_at
FROM public.donations d
WHERE d.batch_id IS NULL -- Only process donations not already in batches
ON CONFLICT (organization_id, batch_number) DO NOTHING; -- Skip if batch already exists

-- Step 3: Link existing donations to their corresponding batches
UPDATE public.donations 
SET 
    batch_id = (
        SELECT db.id 
        FROM public.donation_batches db 
        WHERE db.organization_id = donations.organization_id 
        AND db.batch_date = donations.date
        AND db.batch_number = 'BATCH-' || TO_CHAR(donations.date, 'YYYY-MM-DD')
        LIMIT 1
    ),
    is_legacy_batch_summary = true
WHERE batch_id IS NULL;

-- Step 4: Update batch totals to match actual donations
UPDATE public.donation_batches 
SET 
    total_amount = (
        SELECT COALESCE(SUM(d.amount), 0) 
        FROM donations d 
        WHERE d.batch_id = donation_batches.id
    ),
    donation_count = (
        SELECT COUNT(*) 
        FROM donations d 
        WHERE d.batch_id = donation_batches.id
    );

-- Step 5: Add comments for future reference
COMMENT ON COLUMN donations.is_legacy_batch_summary IS 'Indicates if this donation was originally a weekly batch summary before the batch system was implemented';

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_donations_legacy_flag ON donations(is_legacy_batch_summary);
CREATE INDEX IF NOT EXISTS idx_donations_batch_legacy ON donations(batch_id, is_legacy_batch_summary);

-- Step 7: Insert a record to track this migration
INSERT INTO automation_settings (organization_id, setting_key, setting_value, description)
SELECT 
    id,
    'donation_migration_completed',
    ('{"migration_date": "' || NOW()::date || '", "legacy_donations_converted": true, "batch_system_enabled": true}')::jsonb,
    'Tracks completion of donation to batch migration'
FROM organizations
ON CONFLICT (organization_id, setting_key) DO UPDATE SET
    setting_value = EXCLUDED.setting_value,
    updated_at = NOW(); 
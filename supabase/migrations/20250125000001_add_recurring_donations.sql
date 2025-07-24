-- Add recurring donation support to donations table
ALTER TABLE donations 
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS subscription_id TEXT,
ADD COLUMN IF NOT EXISTS recurring_interval TEXT CHECK (recurring_interval IN ('week', 'month', 'quarter', 'year'));

-- Add subscription tracking to members table
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT;

-- Create index for subscription lookups
CREATE INDEX IF NOT EXISTS idx_donations_subscription_id ON donations(subscription_id);
CREATE INDEX IF NOT EXISTS idx_members_stripe_customer_id ON members(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_members_subscription_id ON members(subscription_id);

-- Add comment explaining the new fields
COMMENT ON COLUMN donations.is_recurring IS 'Whether this donation is part of a recurring subscription';
COMMENT ON COLUMN donations.subscription_id IS 'Stripe subscription ID for recurring donations';
COMMENT ON COLUMN donations.recurring_interval IS 'Interval for recurring donations (week, month, quarter, year)';
COMMENT ON COLUMN members.stripe_customer_id IS 'Stripe customer ID for payment processing';
COMMENT ON COLUMN members.subscription_id IS 'Stripe subscription ID for recurring donations';
COMMENT ON COLUMN members.subscription_status IS 'Current status of the subscription (active, canceled, etc.)'; 
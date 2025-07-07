-- Add name field to donation_batches table
ALTER TABLE public.donation_batches 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Update existing batches to use batch_number as name if name is null
UPDATE public.donation_batches 
SET name = batch_number 
WHERE name IS NULL OR name = '';

-- Make name field not null after updating existing records
ALTER TABLE public.donation_batches 
ALTER COLUMN name SET NOT NULL; 
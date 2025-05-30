-- Add recurring event columns to events table
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recurrence_pattern TEXT;

-- Update existing events to have default values
UPDATE public.events
SET is_recurring = false,
    recurrence_pattern = NULL
WHERE is_recurring IS NULL; 
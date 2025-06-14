-- Create potluck_rsvps table
CREATE TABLE potluck_rsvps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id CHARACTER VARYING REFERENCES events(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    dish_type TEXT NOT NULL CHECK (dish_type IN ('main', 'side', 'dessert')),
    dish_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(event_id, member_id)
);

-- Add function to check if a date is a fifth Sunday
CREATE OR REPLACE FUNCTION is_fifth_sunday(date)
RETURNS boolean AS $$
BEGIN
    RETURN EXTRACT(DOW FROM $1) = 0  -- Sunday
        AND EXTRACT(DAY FROM $1) > 28  -- Must be in the last week
        AND EXTRACT(DAY FROM $1) <= 31;  -- Must be in the last week
END;
$$ LANGUAGE plpgsql; 
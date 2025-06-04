-- Add image_url column to members table
ALTER TABLE members
ADD COLUMN image_url TEXT;

-- Add comment
COMMENT ON COLUMN members.image_url IS 'URL to the member''s profile image'; 
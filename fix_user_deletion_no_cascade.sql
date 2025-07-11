-- Drop the existing foreign key constraint with CASCADE
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_user_id_fkey;

-- Add the foreign key constraint with SET NULL (preserves member record)
ALTER TABLE members 
ADD CONSTRAINT members_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE SET NULL; 
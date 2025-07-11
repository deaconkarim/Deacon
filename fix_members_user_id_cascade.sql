-- Drop the existing foreign key constraint
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_user_id_fkey;

-- Add the foreign key constraint with CASCADE DELETE
ALTER TABLE members 
ADD CONSTRAINT members_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE; 
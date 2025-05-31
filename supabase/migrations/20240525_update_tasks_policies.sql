-- Drop existing policies
DROP POLICY IF EXISTS "Tasks are viewable by authenticated users" ON tasks;
DROP POLICY IF EXISTS "Tasks can be created by authenticated users" ON tasks;
DROP POLICY IF EXISTS "Tasks can be updated by assigned users, requestors, or staff" ON tasks;
DROP POLICY IF EXISTS "Tasks can be deleted by requestors or staff" ON tasks;
DROP POLICY IF EXISTS "Task comments are viewable by authenticated users" ON task_comments;
DROP POLICY IF EXISTS "Task comments can be created by authenticated users" ON task_comments;
DROP POLICY IF EXISTS "Task comments can be updated by comment authors" ON task_comments;
DROP POLICY IF EXISTS "Task comments can be deleted by comment authors" ON task_comments;

-- Create new policies for tasks
CREATE POLICY "Tasks are viewable by everyone" ON tasks
    FOR SELECT USING (true);

CREATE POLICY "Tasks can be created by anyone" ON tasks
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Tasks can be updated by anyone" ON tasks
    FOR UPDATE USING (true);

CREATE POLICY "Tasks can be deleted by anyone" ON tasks
    FOR DELETE USING (true);

-- Create new policies for task comments
CREATE POLICY "Task comments are viewable by everyone" ON task_comments
    FOR SELECT USING (true);

CREATE POLICY "Task comments can be created by anyone" ON task_comments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Task comments can be updated by anyone" ON task_comments
    FOR UPDATE USING (true);

CREATE POLICY "Task comments can be deleted by anyone" ON task_comments
    FOR DELETE USING (true);

-- Update the staff validation function to check for deacons
CREATE OR REPLACE FUNCTION validate_staff_member()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.assignee_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 
            FROM group_members gm
            JOIN groups g ON g.id = gm.group_id
            WHERE g.name = 'Deacons' 
            AND gm.memberid = NEW.assignee_id
        ) THEN
            RAISE EXCEPTION 'Assignee must be a deacon';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql; 
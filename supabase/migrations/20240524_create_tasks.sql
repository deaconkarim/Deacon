-- Create tasks table
CREATE TABLE tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    requestor_id UUID REFERENCES members(id),
    assignee_id UUID REFERENCES members(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create task comments table for tracking progress
CREATE TABLE task_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id),
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create function to validate staff member
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

-- Create trigger to validate staff member
CREATE TRIGGER validate_staff_member_trigger
    BEFORE INSERT OR UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION validate_staff_member();

-- Add RLS policies
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for tasks
CREATE POLICY "Tasks are viewable by everyone" ON tasks
    FOR SELECT USING (true);

CREATE POLICY "Tasks can be created by anyone" ON tasks
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Tasks can be updated by anyone" ON tasks
    FOR UPDATE USING (true);

CREATE POLICY "Tasks can be deleted by anyone" ON tasks
    FOR DELETE USING (true);

-- Create policies for task comments
CREATE POLICY "Task comments are viewable by everyone" ON task_comments
    FOR SELECT USING (true);

CREATE POLICY "Task comments can be created by anyone" ON task_comments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Task comments can be updated by anyone" ON task_comments
    FOR UPDATE USING (true);

CREATE POLICY "Task comments can be deleted by anyone" ON task_comments
    FOR DELETE USING (true); 
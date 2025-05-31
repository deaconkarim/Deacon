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
            WHERE g.name = 'Staff' 
            AND gm.memberid = NEW.assignee_id
        ) THEN
            RAISE EXCEPTION 'Assignee must be a staff member';
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
CREATE POLICY "Tasks are viewable by authenticated users" ON tasks
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Tasks can be created by authenticated users" ON tasks
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Tasks can be updated by assigned users, requestors, or staff" ON tasks
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            assignee_id = auth.uid() OR 
            requestor_id = auth.uid() OR
            auth.uid() IN (
                SELECT memberid 
                FROM group_members 
                WHERE group_id = (
                    SELECT id 
                    FROM groups 
                    WHERE name = 'Staff'
                )
            )
        )
    );

CREATE POLICY "Tasks can be deleted by requestors or staff" ON tasks
    FOR DELETE USING (
        auth.role() = 'authenticated' AND (
            requestor_id = auth.uid() OR
            auth.uid() IN (
                SELECT memberid 
                FROM group_members 
                WHERE group_id = (
                    SELECT id 
                    FROM groups 
                    WHERE name = 'Staff'
                )
            )
        )
    );

-- Create policies for task comments
CREATE POLICY "Task comments are viewable by authenticated users" ON task_comments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Task comments can be created by authenticated users" ON task_comments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Task comments can be updated by comment authors" ON task_comments
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        member_id = auth.uid()
    );

CREATE POLICY "Task comments can be deleted by comment authors" ON task_comments
    FOR DELETE USING (
        auth.role() = 'authenticated' AND 
        member_id = auth.uid()
    ); 
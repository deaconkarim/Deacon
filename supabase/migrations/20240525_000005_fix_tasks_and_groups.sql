-- Drop existing tasks table if it exists
DROP TABLE IF EXISTS public.tasks CASCADE;

-- Recreate tasks table with proper foreign key relationships
CREATE TABLE public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    requestor_id UUID REFERENCES public.members(id),
    assignee_id UUID REFERENCES public.members(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create task comments table
CREATE TABLE public.task_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.members(id),
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for tasks
CREATE POLICY "Tasks are viewable by everyone" ON public.tasks
    FOR SELECT USING (true);

CREATE POLICY "Tasks can be created by anyone" ON public.tasks
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Tasks can be updated by anyone" ON public.tasks
    FOR UPDATE USING (true);

CREATE POLICY "Tasks can be deleted by anyone" ON public.tasks
    FOR DELETE USING (true);

-- Create policies for task comments
CREATE POLICY "Task comments are viewable by everyone" ON public.task_comments
    FOR SELECT USING (true);

CREATE POLICY "Task comments can be created by anyone" ON public.task_comments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Task comments can be updated by anyone" ON public.task_comments
    FOR UPDATE USING (true);

CREATE POLICY "Task comments can be deleted by anyone" ON public.task_comments
    FOR DELETE USING (true);

-- Create Deacons group if it doesn't exist
INSERT INTO public.groups (name, description)
SELECT 'Deacons', 'Church deacons responsible for various tasks and ministries'
WHERE NOT EXISTS (
    SELECT 1 FROM public.groups WHERE name = 'Deacons'
); 
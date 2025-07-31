-- Add missing columns to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_organization_id ON public.tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON public.tasks(category);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);

-- Update RLS policies to include organization_id
DROP POLICY IF EXISTS "Tasks are viewable by everyone" ON public.tasks;
DROP POLICY IF EXISTS "Tasks can be created by anyone" ON public.tasks;
DROP POLICY IF EXISTS "Tasks can be updated by anyone" ON public.tasks;
DROP POLICY IF EXISTS "Tasks can be deleted by anyone" ON public.tasks;

-- Create new policies that respect organization_id
CREATE POLICY "Tasks are viewable by organization members" ON public.tasks
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Tasks can be created by organization members" ON public.tasks
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Tasks can be updated by organization members" ON public.tasks
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Tasks can be deleted by organization members" ON public.tasks
    FOR DELETE USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_users 
            WHERE user_id = auth.uid()
        )
    );
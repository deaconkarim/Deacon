-- Add missing columns to tasks table
-- This script adds the category, estimated_hours, tags, and organization_id columns
-- that are being used in the frontend but are missing from the database schema

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
-- First, drop existing policies if they exist
DO $$
BEGIN
    -- Drop old policies if they exist
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Tasks are viewable by everyone') THEN
        DROP POLICY "Tasks are viewable by everyone" ON public.tasks;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Tasks can be created by anyone') THEN
        DROP POLICY "Tasks can be created by anyone" ON public.tasks;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Tasks can be updated by anyone') THEN
        DROP POLICY "Tasks can be updated by anyone" ON public.tasks;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Tasks can be deleted by anyone') THEN
        DROP POLICY "Tasks can be deleted by anyone" ON public.tasks;
    END IF;
    
    -- Drop new policies if they exist (in case of re-run)
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Tasks are viewable by organization members') THEN
        DROP POLICY "Tasks are viewable by organization members" ON public.tasks;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Tasks can be created by organization members') THEN
        DROP POLICY "Tasks can be created by organization members" ON public.tasks;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Tasks can be updated by organization members') THEN
        DROP POLICY "Tasks can be updated by organization members" ON public.tasks;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Tasks can be deleted by organization members') THEN
        DROP POLICY "Tasks can be deleted by organization members" ON public.tasks;
    END IF;
END $$;

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

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND table_schema = 'public'
ORDER BY ordinal_position;
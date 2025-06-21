-- Add organization_id to tasks table for multi-tenancy
-- This script adds organization filtering to tasks to prevent cross-organization data access

-- Add organization_id column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Add organization_id column to task_comments table
ALTER TABLE public.task_comments 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Update existing tasks to associate with the first organization (if any exist)
UPDATE public.tasks 
SET organization_id = (SELECT id FROM public.organizations LIMIT 1) 
WHERE organization_id IS NULL;

-- Update existing task_comments to associate with the first organization (if any exist)
UPDATE public.task_comments 
SET organization_id = (SELECT id FROM public.organizations LIMIT 1) 
WHERE organization_id IS NULL;

-- Make organization_id NOT NULL after setting default values
ALTER TABLE public.tasks ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.task_comments ALTER COLUMN organization_id SET NOT NULL;

-- Drop existing policies
DROP POLICY IF EXISTS "Tasks are viewable by everyone" ON public.tasks;
DROP POLICY IF EXISTS "Tasks can be created by anyone" ON public.tasks;
DROP POLICY IF EXISTS "Tasks can be updated by anyone" ON public.tasks;
DROP POLICY IF EXISTS "Tasks can be deleted by anyone" ON public.tasks;

DROP POLICY IF EXISTS "Task comments are viewable by everyone" ON public.task_comments;
DROP POLICY IF EXISTS "Task comments can be created by anyone" ON public.task_comments;
DROP POLICY IF EXISTS "Task comments can be updated by anyone" ON public.task_comments;
DROP POLICY IF EXISTS "Task comments can be deleted by anyone" ON public.task_comments;

-- Create new organization-aware policies for tasks
CREATE POLICY "Tasks are viewable by organization members" ON public.tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.organization_users
            WHERE organization_users.organization_id = tasks.organization_id
            AND organization_users.user_id = auth.uid()
            AND organization_users.status = 'active'
        )
    );

CREATE POLICY "Tasks can be created by organization members" ON public.tasks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_users
            WHERE organization_users.organization_id = tasks.organization_id
            AND organization_users.user_id = auth.uid()
            AND organization_users.status = 'active'
        )
    );

CREATE POLICY "Tasks can be updated by organization members" ON public.tasks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.organization_users
            WHERE organization_users.organization_id = tasks.organization_id
            AND organization_users.user_id = auth.uid()
            AND organization_users.status = 'active'
        )
    );

CREATE POLICY "Tasks can be deleted by organization admins" ON public.tasks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.organization_users
            WHERE organization_users.organization_id = tasks.organization_id
            AND organization_users.user_id = auth.uid()
            AND organization_users.role IN ('owner', 'admin')
            AND organization_users.status = 'active'
        )
    );

-- Create new organization-aware policies for task_comments
CREATE POLICY "Task comments are viewable by organization members" ON public.task_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.organization_users
            WHERE organization_users.organization_id = task_comments.organization_id
            AND organization_users.user_id = auth.uid()
            AND organization_users.status = 'active'
        )
    );

CREATE POLICY "Task comments can be created by organization members" ON public.task_comments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_users
            WHERE organization_users.organization_id = task_comments.organization_id
            AND organization_users.user_id = auth.uid()
            AND organization_users.status = 'active'
        )
    );

CREATE POLICY "Task comments can be updated by organization members" ON public.task_comments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.organization_users
            WHERE organization_users.organization_id = task_comments.organization_id
            AND organization_users.user_id = auth.uid()
            AND organization_users.status = 'active'
        )
    );

CREATE POLICY "Task comments can be deleted by organization admins" ON public.task_comments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.organization_users
            WHERE organization_users.organization_id = task_comments.organization_id
            AND organization_users.user_id = auth.uid()
            AND organization_users.role IN ('owner', 'admin')
            AND organization_users.status = 'active'
        )
    );

-- Test the policies
SELECT 'Tasks table organization filtering added successfully' as status; 
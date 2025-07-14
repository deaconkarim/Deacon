-- Fix RLS policies to allow member creation during registration
-- This script can be run directly against the production database

-- First, let's see what policies currently exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'members';

-- Drop any existing restrictive INSERT policies
DROP POLICY IF EXISTS "Members can be created by organization members" ON public.members;
DROP POLICY IF EXISTS "Members can be created by authenticated users" ON public.members;
DROP POLICY IF EXISTS "Users can create their own member record during registration" ON public.members;

-- Create a simple, permissive INSERT policy that allows authenticated users to create member records
CREATE POLICY "Members can be created by authenticated users" ON public.members
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Also ensure we have a basic SELECT policy for viewing members
DROP POLICY IF EXISTS "Members can view members of their organizations" ON public.members;
CREATE POLICY "Members can be viewed by authenticated users" ON public.members
    FOR SELECT USING (auth.role() = 'authenticated');

-- Add a comment to document the policy purpose
COMMENT ON POLICY "Members can be created by authenticated users" ON public.members IS 'Allows authenticated users to create member records, especially during registration process';
COMMENT ON POLICY "Members can be viewed by authenticated users" ON public.members IS 'Allows authenticated users to view member records';

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'members'; 
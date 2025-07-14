-- Fix RLS policies to allow member creation during registration
-- The issue is that users need to be able to create member records during registration
-- before they have an organization membership

-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Members can be created by organization members" ON public.members;

-- Create a simple INSERT policy that allows authenticated users to create member records
-- This is needed for the registration process
CREATE POLICY "Members can be created by authenticated users" ON public.members
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Add a comment to document the policy purpose
COMMENT ON POLICY "Members can be created by authenticated users" ON public.members IS 'Allows authenticated users to create member records, especially during registration process'; 
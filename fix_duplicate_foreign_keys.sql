-- Fix duplicate foreign key constraints in child_checkin_logs table
-- Migration: fix_duplicate_foreign_keys.sql

-- Drop the duplicate foreign key constraints
ALTER TABLE public.child_checkin_logs DROP CONSTRAINT IF EXISTS fk_child;
ALTER TABLE public.child_checkin_logs DROP CONSTRAINT IF EXISTS fk_event;
ALTER TABLE public.child_checkin_logs DROP CONSTRAINT IF EXISTS fk_guardian;

-- Keep only the original constraints:
-- child_checkin_logs_child_id_fkey
-- child_checkin_logs_event_id_fkey  
-- child_checkin_logs_checked_in_by_fkey
-- child_checkin_logs_checked_out_by_fkey
-- child_checkin_logs_organization_id_fkey 
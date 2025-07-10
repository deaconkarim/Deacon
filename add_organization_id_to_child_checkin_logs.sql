-- Add organization_id to child_checkin_logs table
-- Migration: add_organization_id_to_child_checkin_logs.sql

-- First, add the organization_id column (without DEFAULT)
ALTER TABLE public.child_checkin_logs 
ADD COLUMN organization_id uuid;

-- Update existing records to use the default organization
UPDATE public.child_checkin_logs 
SET organization_id = (SELECT id FROM organizations WHERE name = 'Grace Community Church' LIMIT 1)
WHERE organization_id IS NULL;

-- Make organization_id NOT NULL after setting values
ALTER TABLE public.child_checkin_logs ALTER COLUMN organization_id SET NOT NULL;

-- Add foreign key constraint for organization_id
ALTER TABLE public.child_checkin_logs 
ADD CONSTRAINT child_checkin_logs_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- Add index for better performance
CREATE INDEX idx_child_checkin_logs_organization_id ON public.child_checkin_logs(organization_id);

-- Updated table definition with organization_id:
/*
CREATE TABLE public.child_checkin_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL,
  event_id character varying(255) NOT NULL,
  checked_in_by uuid NOT NULL,
  checked_out_by uuid NULL,
  check_in_time timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  check_out_time timestamp with time zone NULL,
  notes text NULL,
  organization_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT child_checkin_logs_pkey PRIMARY KEY (id),
  CONSTRAINT child_checkin_logs_checked_out_by_fkey FOREIGN KEY (checked_out_by) REFERENCES members (id),
  CONSTRAINT child_checkin_logs_child_id_fkey FOREIGN KEY (child_id) REFERENCES members (id) ON DELETE CASCADE,
  CONSTRAINT child_checkin_logs_event_id_fkey FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
  CONSTRAINT fk_child FOREIGN KEY (child_id) REFERENCES members (id) ON DELETE CASCADE,
  CONSTRAINT fk_event FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
  CONSTRAINT child_checkin_logs_checked_in_by_fkey FOREIGN KEY (checked_in_by) REFERENCES members (id),
  CONSTRAINT fk_guardian FOREIGN KEY (checked_in_by) REFERENCES members (id) ON DELETE SET NULL,
  CONSTRAINT child_checkin_logs_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE TRIGGER validate_checkin_trigger BEFORE INSERT
OR UPDATE ON child_checkin_logs FOR EACH ROW
EXECUTE FUNCTION validate_checkin();
*/ 
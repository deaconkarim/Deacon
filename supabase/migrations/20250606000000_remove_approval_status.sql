-- Migration to remove approval_status from organization_users and related logic

ALTER TABLE organization_users DROP COLUMN IF EXISTS approval_status;

-- Remove related indexes
DROP INDEX IF EXISTS idx_organization_users_approval_status;
DROP INDEX IF EXISTS idx_organization_users_pending_approvals;

-- Remove any policies, triggers, or functions that reference approval_status
-- (You may need to manually review and drop triggers or policies if they exist)

-- Remove approval_status from organization_invitations if present
ALTER TABLE organization_invitations DROP COLUMN IF EXISTS approval_status;

-- Remove approval_status from any views or materialized views
-- (You may need to manually review and update views)

-- Remove approval_status from any other tables if present
-- (Add more ALTER TABLE ... DROP COLUMN IF EXISTS ... as needed)
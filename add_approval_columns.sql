-- Add approval system columns to organization_users table
-- Run this in your Supabase SQL editor

-- Add approval status column
ALTER TABLE organization_users 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Add approval timestamp columns
ALTER TABLE organization_users 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add index for efficient approval status queries
CREATE INDEX IF NOT EXISTS idx_organization_users_approval_status ON organization_users(approval_status);

-- Add index for pending approvals by organization
CREATE INDEX IF NOT EXISTS idx_organization_users_pending_approvals ON organization_users(organization_id, approval_status) WHERE approval_status = 'pending';

-- Create notifications table for approval requests
CREATE TABLE IF NOT EXISTS approval_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    requester_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    requester_name TEXT NOT NULL,
    requester_email TEXT NOT NULL,
    notification_type TEXT NOT NULL DEFAULT 'registration_approval',
    status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'dismissed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for notifications
CREATE INDEX IF NOT EXISTS idx_approval_notifications_org_status ON approval_notifications(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_approval_notifications_created_at ON approval_notifications(created_at DESC);

-- Enable RLS on approval_notifications
ALTER TABLE approval_notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Admins can view notifications for their organization" ON approval_notifications;
DROP POLICY IF EXISTS "Admins can update notification status" ON approval_notifications;

-- Create RLS policies for approval_notifications
CREATE POLICY "Admins can view notifications for their organization" ON approval_notifications
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM organization_users 
            WHERE organization_id = approval_notifications.organization_id 
            AND role = 'admin' 
            AND approval_status = 'approved'
        )
    );

CREATE POLICY "Admins can update notification status" ON approval_notifications
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT user_id FROM organization_users 
            WHERE organization_id = approval_notifications.organization_id 
            AND role = 'admin' 
            AND approval_status = 'approved'
        )
    );

-- Update existing organization_users records to have 'approved' status
-- This ensures existing users can continue to use the app
UPDATE organization_users 
SET approval_status = 'approved' 
WHERE approval_status IS NULL OR approval_status = 'pending';

-- Create notification for any existing pending users
INSERT INTO approval_notifications (
    organization_id,
    requester_user_id,
    requester_name,
    requester_email,
    notification_type,
    status
)
SELECT 
    ou.organization_id,
    ou.user_id,
    COALESCE(m.firstname || ' ' || m.lastname, 'New User'),
    COALESCE(m.email, 'No email'),
    'registration_approval',
    'unread'
FROM organization_users ou
LEFT JOIN members m ON ou.user_id = m.id
WHERE ou.approval_status = 'pending'
ON CONFLICT DO NOTHING; 
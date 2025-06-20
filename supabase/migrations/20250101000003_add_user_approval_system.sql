-- Add approval system for new user registrations
-- This migration adds approval status and owner notifications

-- Add approval status column to organization_users
ALTER TABLE organization_users 
ADD COLUMN approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Add approval timestamp columns
ALTER TABLE organization_users 
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN approved_by UUID REFERENCES auth.users(id),
ADD COLUMN rejection_reason TEXT;

-- Add index for efficient approval status queries
CREATE INDEX idx_organization_users_approval_status ON organization_users(approval_status);

-- Add index for pending approvals by organization
CREATE INDEX idx_organization_users_pending_approvals ON organization_users(organization_id, approval_status) WHERE approval_status = 'pending';

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
CREATE INDEX idx_approval_notifications_org_status ON approval_notifications(organization_id, status);
CREATE INDEX idx_approval_notifications_created_at ON approval_notifications(created_at DESC);

-- Update RLS policies for organization_users to handle approval status
DROP POLICY IF EXISTS "Users can view their own organization membership" ON organization_users;
CREATE POLICY "Users can view their own organization membership" ON organization_users
    FOR SELECT USING (
        auth.uid() = user_id AND 
        (approval_status = 'approved' OR auth.uid() IN (
            SELECT user_id FROM organization_users 
            WHERE organization_id = organization_users.organization_id 
            AND role = 'admin' 
            AND approval_status = 'approved'
        ))
    );

-- Add policy for admins to view all pending approvals in their organization
CREATE POLICY "Admins can view pending approvals" ON organization_users
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM organization_users 
            WHERE organization_id = organization_users.organization_id 
            AND role = 'admin' 
            AND approval_status = 'approved'
        )
    );

-- Add policy for admins to update approval status
CREATE POLICY "Admins can update approval status" ON organization_users
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT user_id FROM organization_users 
            WHERE organization_id = organization_users.organization_id 
            AND role = 'admin' 
            AND approval_status = 'approved'
        )
    ) WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM organization_users 
            WHERE organization_id = organization_users.organization_id 
            AND role = 'admin' 
            AND approval_status = 'approved'
        )
    );

-- Update the existing policy to only allow approved users
DROP POLICY IF EXISTS "Users can update their own organization membership" ON organization_users;
CREATE POLICY "Approved users can update their own organization membership" ON organization_users
    FOR UPDATE USING (
        auth.uid() = user_id AND approval_status = 'approved'
    ) WITH CHECK (
        auth.uid() = user_id AND approval_status = 'approved'
    );

-- RLS policies for approval_notifications
ALTER TABLE approval_notifications ENABLE ROW LEVEL SECURITY;

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

-- Function to create approval notification
CREATE OR REPLACE FUNCTION create_approval_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create notification for new pending registrations
    IF NEW.approval_status = 'pending' AND TG_OP = 'INSERT' THEN
        INSERT INTO approval_notifications (
            organization_id,
            requester_user_id,
            requester_name,
            requester_email,
            notification_type
        )
        SELECT 
            NEW.organization_id,
            NEW.user_id,
            COALESCE(m.firstname || ' ' || m.lastname, 'New User'),
            COALESCE(m.email, 'No email'),
            'registration_approval'
        FROM members m
        WHERE m.id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create approval notifications
CREATE TRIGGER trigger_create_approval_notification
    AFTER INSERT ON organization_users
    FOR EACH ROW
    EXECUTE FUNCTION create_approval_notification();

-- Function to update notification when approval status changes
CREATE OR REPLACE FUNCTION update_approval_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Update notification status when user is approved or rejected
    IF OLD.approval_status = 'pending' AND NEW.approval_status IN ('approved', 'rejected') THEN
        UPDATE approval_notifications 
        SET status = 'read', updated_at = NOW()
        WHERE requester_user_id = NEW.user_id 
        AND organization_id = NEW.organization_id
        AND notification_type = 'registration_approval';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update notifications when approval status changes
CREATE TRIGGER trigger_update_approval_notification
    AFTER UPDATE ON organization_users
    FOR EACH ROW
    EXECUTE FUNCTION update_approval_notification(); 
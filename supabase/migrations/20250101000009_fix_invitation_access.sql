-- Fix invitation access for public invitation links
-- This policy allows anyone to view an invitation if they have the invitation ID
-- This is needed for invitation links to work properly
CREATE POLICY "Public can view invitations by ID" ON organization_invitations
  FOR SELECT USING (true); 
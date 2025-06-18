# Authentication and Multi-Organization Setup Guide

This guide explains how to set up authentication and multi-organization support for the Church Management App.

## Overview

The app now supports:
- **User Authentication**: Secure login/logout with Supabase Auth
- **Multi-Organization Support**: Each church gets its own isolated data
- **Role-Based Access**: Different permission levels (owner, admin, member, viewer)
- **Organization Switching**: Users can belong to multiple churches

## Database Schema Changes

### New Tables

1. **`organizations`** - Stores church/organization information
   - `id` (UUID) - Primary key
   - `name` (VARCHAR) - Church name
   - `slug` (VARCHAR) - URL-friendly identifier
   - `description` (TEXT) - Church description
   - `email`, `phone`, `website` - Contact information
   - `address` (JSONB) - Physical address
   - `logo_url` (TEXT) - Church logo
   - `settings` (JSONB) - Organization-specific settings

2. **`organization_users`** - Links users to organizations with roles
   - `organization_id` (UUID) - References organizations.id
   - `user_id` (UUID) - References auth.users.id
   - `role` (VARCHAR) - 'owner', 'admin', 'member', 'viewer'
   - `status` (VARCHAR) - 'active', 'inactive', 'pending'

### Updated Tables

All existing tables now include:
- `organization_id` (UUID) - References organizations.id
- Row Level Security (RLS) policies that filter by organization

## Setup Instructions

### 1. Run Database Migrations

```bash
# Apply the organization and authentication migrations
supabase db reset
```

This will:
- Create the new tables
- Add organization_id columns to existing tables
- Set up RLS policies
- Create the default organization

### 2. Configure Supabase Auth

1. Go to your Supabase dashboard
2. Navigate to Authentication > Settings
3. Configure your auth settings:
   - Enable email confirmations (recommended)
   - Set up email templates
   - Configure redirect URLs

### 3. Create Your First User

1. Go to Authentication > Users in Supabase dashboard
2. Click "Add User"
3. Enter email and password
4. Copy the user ID (you'll need this for the next step)

### 4. Link User to Organization

1. Go to the SQL Editor in Supabase dashboard
2. Run this query (replace `YOUR_USER_ID` with the actual user ID):

```sql
INSERT INTO public.organization_users (
    organization_id,
    user_id,
    role,
    status
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'YOUR_USER_ID',
    'owner',
    'active'
);
```

### 5. Update Environment Variables

Make sure your `.env.local` file includes:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## User Roles and Permissions

### Owner
- Full access to all features
- Can manage organization settings
- Can invite/remove users
- Can delete the organization

### Admin
- Full access to all features
- Can manage users (except owners)
- Cannot delete the organization

### Member
- Can view and edit most data
- Cannot access settings
- Cannot manage users

### Viewer
- Read-only access to most data
- Cannot edit anything
- Cannot access sensitive information

## Organization Management

### Creating New Organizations

Users can create new organizations through the registration process:

1. Go to `/register`
2. Fill out organization information
3. Create user account
4. User becomes the owner of the new organization

### Inviting Users to Organizations

Organization owners can invite users:

1. Go to Settings > Organization
2. Click "Invite User"
3. Enter email address
4. Select role
5. User receives email invitation

### Switching Between Organizations

Users with multiple organizations can switch:

1. Click the organization name in the header
2. Select the desired organization
3. The app will reload with the new organization's data

## Security Features

### Row Level Security (RLS)

All data is automatically filtered by organization:

```sql
-- Example: Users can only see members in their organizations
CREATE POLICY "Users can view members in their organizations" ON public.members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.organization_users
            WHERE organization_users.organization_id = members.organization_id
            AND organization_users.user_id = auth.uid()
            AND organization_users.status = 'active'
        )
    );
```

### Automatic Organization Context

The app automatically:
- Sets `organization_id` on new records
- Filters queries by current organization
- Prevents cross-organization data access

## API Changes

### Authentication Required

All API endpoints now require authentication:

```javascript
// Before
const { data } = await supabase.from('members').select('*');

// After (automatic organization filtering)
const { data } = await supabase.from('members').select('*');
// Data is automatically filtered by organization_id
```

### Organization Context

The app uses localStorage to track the current organization:

```javascript
// Get current organization ID
const organizationId = localStorage.getItem('currentOrganizationId');

// Set current organization
localStorage.setItem('currentOrganizationId', orgId);
```

## Testing

### Test Organization Setup

1. Create a test user account
2. Create a test organization
3. Verify data isolation between organizations
4. Test role-based permissions

### Test Data Isolation

1. Create two organizations
2. Add data to each organization
3. Switch between organizations
4. Verify data is properly isolated

## Troubleshooting

### Common Issues

1. **"No organizations found" error**
   - Check if user is linked to an organization
   - Verify organization_users table has correct entries

2. **"Permission denied" errors**
   - Check user role in organization_users table
   - Verify RLS policies are working correctly

3. **Data not showing up**
   - Check if organization_id is set correctly
   - Verify current organization is selected

### Debug Queries

```sql
-- Check user's organizations
SELECT * FROM organization_users WHERE user_id = auth.uid();

-- Check organization data
SELECT * FROM organizations WHERE id = 'your-org-id';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'members';
```

## Migration from Single-Organization

If you're migrating from a single-organization setup:

1. Run the migrations
2. The seed migration will create a default organization
3. Update existing data to belong to the default organization
4. Create and link your user account

## Next Steps

1. **Email Templates**: Customize email templates for invitations
2. **Billing**: Set up organization-based billing
3. **Analytics**: Add organization-specific analytics
4. **API Keys**: Generate organization-specific API keys
5. **Backup**: Set up organization-specific data backup

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the database logs
3. Test with a fresh organization
4. Contact support with specific error messages 
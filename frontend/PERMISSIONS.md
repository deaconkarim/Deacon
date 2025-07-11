# Role-Based Permission System

This document explains how to use the role-based permission system in the church management app.

## Overview

The permission system provides granular access control based on user roles. Each role has specific permissions that determine what features and actions users can access.

## Roles

### Member
- Basic read access to most features
- Can view events, members, groups, tasks, etc.
- Cannot create, edit, or delete data

### Deacon
- All member permissions
- Can create and edit events, tasks, groups
- Can manage children check-in
- Can create donations
- Cannot delete data or manage users

### Admin
- All deacon permissions
- Can delete data
- Can manage users (invite, approve, change roles)
- Can access all settings and reports
- Can manage families

### System Admin
- All permissions across all organizations
- Can impersonate users and organizations
- Can manage system-wide settings

## Permission Categories

### Member Management
- `MEMBERS_VIEW` - View member list and details
- `MEMBERS_EDIT` - Edit member information
- `MEMBERS_DELETE` - Delete members
- `MEMBERS_INVITE` - Invite new members

### Event Management
- `EVENTS_VIEW` - View events
- `EVENTS_CREATE` - Create new events
- `EVENTS_EDIT` - Edit existing events
- `EVENTS_DELETE` - Delete events
- `EVENTS_ATTENDANCE` - Manage event attendance

### Donation Management
- `DONATIONS_VIEW` - View donations
- `DONATIONS_CREATE` - Create donations
- `DONATIONS_EDIT` - Edit donations
- `DONATIONS_DELETE` - Delete donations
- `DONATIONS_REPORTS` - Access donation reports

### Task Management
- `TASKS_VIEW` - View tasks
- `TASKS_CREATE` - Create tasks
- `TASKS_EDIT` - Edit tasks
- `TASKS_DELETE` - Delete tasks
- `TASKS_ASSIGN` - Assign tasks to members

### Group Management
- `GROUPS_VIEW` - View groups
- `GROUPS_CREATE` - Create groups
- `GROUPS_EDIT` - Edit groups
- `GROUPS_DELETE` - Delete groups
- `GROUPS_MANAGE_MEMBERS` - Add/remove members from groups

### Family Management
- `FAMILIES_VIEW` - View families
- `FAMILIES_CREATE` - Create families
- `FAMILIES_EDIT` - Edit families
- `FAMILIES_DELETE` - Delete families

### Children Check-in
- `CHILDREN_VIEW` - View children
- `CHILDREN_CHECKIN` - Check children in/out
- `CHILDREN_MANAGE` - Manage children records

### Reports and Analytics
- `REPORTS_VIEW` - View reports
- `REPORTS_EXPORT` - Export reports
- `REPORTS_ADMIN` - Access admin reports

### Settings and Configuration
- `SETTINGS_VIEW` - View settings
- `SETTINGS_EDIT` - Edit settings
- `SETTINGS_ADMIN` - Access admin settings

### User Management
- `USERS_VIEW` - View users
- `USERS_EDIT` - Edit users
- `USERS_DELETE` - Delete users
- `USERS_APPROVE` - Approve new users

### System Administration
- `SYSTEM_ADMIN` - System administration
- `ORGANIZATIONS_MANAGE` - Manage organizations
- `IMPERSONATION` - Impersonate users/organizations

## Usage Examples

### Protecting Routes

```jsx
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/lib/permissions';

function MyPage() {
  return (
    <PermissionGuard permission={PERMISSIONS.MEMBERS_VIEW}>
      <div>
        {/* Page content */}
      </div>
    </PermissionGuard>
  );
}
```

### Conditional Buttons

```jsx
import { PermissionButton } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/lib/permissions';

function MyComponent() {
  return (
    <div>
      <PermissionButton 
        permission={PERMISSIONS.MEMBERS_CREATE}
        onClick={handleCreateMember}
      >
        Add Member
      </PermissionButton>
    </div>
  );
}
```

### Conditional Features

```jsx
import { PermissionFeature } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/lib/permissions';

function MyComponent() {
  return (
    <div>
      <PermissionFeature 
        permission={PERMISSIONS.MEMBERS_EDIT}
        fallback={<p>You don't have permission to edit members</p>}
      >
        <EditMemberForm />
      </PermissionFeature>
    </div>
  );
}
```

### Multiple Permissions

```jsx
// Check if user has ANY of the permissions
<PermissionGuard permissions={[PERMISSIONS.MEMBERS_EDIT, PERMISSIONS.MEMBERS_DELETE]}>
  <div>Content visible if user has edit OR delete permission</div>
</PermissionGuard>

// Check if user has ALL of the permissions
<PermissionGuard permissions={[PERMISSIONS.MEMBERS_EDIT, PERMISSIONS.MEMBERS_DELETE]} requireAll={true}>
  <div>Content visible if user has edit AND delete permission</div>
</PermissionGuard>
```

### Using the Hook

```jsx
import { usePermissions } from '@/lib/permissions';
import { PERMISSIONS } from '@/lib/permissions';

function MyComponent() {
  const { hasPermission, userRole, permissions } = usePermissions();

  if (hasPermission(PERMISSIONS.MEMBERS_CREATE)) {
    return <button>Create Member</button>;
  }

  return <p>No permission to create members</p>;
}
```

## Navigation

The navigation automatically filters based on user permissions. Navigation items are only shown if the user has the required permission.

## Best Practices

1. **Always check permissions on the frontend** - Even if you have backend protection, frontend checks provide better UX
2. **Use specific permissions** - Don't use broad permissions when specific ones exist
3. **Provide fallbacks** - Always provide meaningful fallback content when permissions are denied
4. **Test with different roles** - Test your components with different user roles to ensure proper access control
5. **Document permission requirements** - Document which permissions are required for each feature

## Adding New Permissions

To add a new permission:

1. Add the permission constant to `frontend/src/lib/permissions.js`:
```javascript
export const PERMISSIONS = {
  // ... existing permissions
  NEW_FEATURE_VIEW: 'new_feature:view',
  NEW_FEATURE_EDIT: 'new_feature:edit',
};
```

2. Add the permission to the appropriate roles in `ROLE_PERMISSIONS`:
```javascript
export const ROLE_PERMISSIONS = {
  [ROLES.MEMBER]: [
    // ... existing permissions
    PERMISSIONS.NEW_FEATURE_VIEW,
  ],
  [ROLES.ADMIN]: [
    // ... existing permissions
    PERMISSIONS.NEW_FEATURE_VIEW,
    PERMISSIONS.NEW_FEATURE_EDIT,
  ],
};
```

3. Use the permission in your components as shown in the examples above.

## Database Integration

The permission system integrates with the database through:

- `organization_users` table - Stores user roles and approval status
- `members` table - Stores member information
- RLS (Row Level Security) policies - Enforce permissions at the database level

The system automatically handles impersonation for system administrators and organization switching. 
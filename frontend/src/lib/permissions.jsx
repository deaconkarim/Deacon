import { supabase } from './supabaseClient';
import { useState, useEffect, useCallback } from 'react';

// Permission levels
export const PERMISSION_LEVELS = {
  NONE: 0,
  READ: 1,
  WRITE: 2,
  ADMIN: 3,
  SYSTEM_ADMIN: 4
};

// Default role hierarchy
export const DEFAULT_ROLES = {
  MEMBER: 'member',
  STAFF: 'staff', 
  ADMIN: 'admin'
};

// Legacy support - will be replaced by dynamic roles
export const ROLES = DEFAULT_ROLES;

// Permission definitions for different features
export const PERMISSIONS = {
  // Member management
  MEMBERS_VIEW: 'members:view',
  MEMBERS_EDIT: 'members:edit',
  MEMBERS_DELETE: 'members:delete',
  MEMBERS_INVITE: 'members:invite',
  
  // Event management
  EVENTS_VIEW: 'events:view',
  EVENTS_CREATE: 'events:create',
  EVENTS_EDIT: 'events:edit',
  EVENTS_DELETE: 'events:delete',
  EVENTS_ATTENDANCE: 'events:attendance',
  
  // Donation management
  DONATIONS_VIEW: 'donations:view',
  DONATIONS_CREATE: 'donations:create',
  DONATIONS_EDIT: 'donations:edit',
  DONATIONS_DELETE: 'donations:delete',
  DONATIONS_REPORTS: 'donations:reports',
  
  // Task management
  TASKS_VIEW: 'tasks:view',
  TASKS_CREATE: 'tasks:create',
  TASKS_EDIT: 'tasks:edit',
  TASKS_DELETE: 'tasks:delete',
  TASKS_ASSIGN: 'tasks:assign',
  
  // Group management
  GROUPS_VIEW: 'groups:view',
  GROUPS_CREATE: 'groups:create',
  GROUPS_EDIT: 'groups:edit',
  GROUPS_DELETE: 'groups:delete',
  GROUPS_MANAGE_MEMBERS: 'groups:manage_members',
  
  // Family management
  FAMILIES_VIEW: 'families:view',
  FAMILIES_CREATE: 'families:create',
  FAMILIES_EDIT: 'families:edit',
  FAMILIES_DELETE: 'families:delete',
  
  // Children check-in
  CHILDREN_VIEW: 'children:view',
  CHILDREN_CHECKIN: 'children:checkin',
  CHILDREN_MANAGE: 'children:manage',
  
  // Reports and analytics
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',
  REPORTS_ADMIN: 'reports:admin',
  
  // Settings and configuration
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_EDIT: 'settings:edit',
  SETTINGS_ADMIN: 'settings:admin',
  
  // User management
  USERS_VIEW: 'users:view',
  USERS_EDIT: 'users:edit',
  USERS_DELETE: 'users:delete',
  USERS_APPROVE: 'users:approve',
  
  // System administration
  ORGANIZATIONS_MANAGE: 'organizations:manage',
  IMPERSONATION: 'impersonation'
};

// Default role-based permission mappings
export const DEFAULT_ROLE_PERMISSIONS = {
  [DEFAULT_ROLES.MEMBER]: [
    PERMISSIONS.MEMBERS_VIEW,
    PERMISSIONS.EVENTS_VIEW,
    PERMISSIONS.TASKS_VIEW,
    PERMISSIONS.GROUPS_VIEW,
    PERMISSIONS.FAMILIES_VIEW,
    PERMISSIONS.CHILDREN_VIEW,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.SETTINGS_VIEW
  ],
  
  [DEFAULT_ROLES.STAFF]: [
    PERMISSIONS.MEMBERS_VIEW,
    PERMISSIONS.MEMBERS_EDIT,
    PERMISSIONS.EVENTS_VIEW,
    PERMISSIONS.EVENTS_CREATE,
    PERMISSIONS.EVENTS_EDIT,
    PERMISSIONS.EVENTS_ATTENDANCE,
    PERMISSIONS.DONATIONS_VIEW,
    PERMISSIONS.DONATIONS_CREATE,
    PERMISSIONS.TASKS_VIEW,
    PERMISSIONS.TASKS_CREATE,
    PERMISSIONS.TASKS_EDIT,
    PERMISSIONS.TASKS_ASSIGN,
    PERMISSIONS.GROUPS_VIEW,
    PERMISSIONS.GROUPS_CREATE,
    PERMISSIONS.GROUPS_EDIT,
    PERMISSIONS.GROUPS_MANAGE_MEMBERS,
    PERMISSIONS.FAMILIES_VIEW,
    PERMISSIONS.FAMILIES_CREATE,
    PERMISSIONS.FAMILIES_EDIT,
    PERMISSIONS.CHILDREN_VIEW,
    PERMISSIONS.CHILDREN_CHECKIN,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.SETTINGS_VIEW
  ],
  
  [DEFAULT_ROLES.ADMIN]: [
    PERMISSIONS.MEMBERS_VIEW,
    PERMISSIONS.MEMBERS_EDIT,
    PERMISSIONS.MEMBERS_DELETE,
    PERMISSIONS.MEMBERS_INVITE,
    PERMISSIONS.EVENTS_VIEW,
    PERMISSIONS.EVENTS_CREATE,
    PERMISSIONS.EVENTS_EDIT,
    PERMISSIONS.EVENTS_DELETE,
    PERMISSIONS.EVENTS_ATTENDANCE,
    PERMISSIONS.DONATIONS_VIEW,
    PERMISSIONS.DONATIONS_CREATE,
    PERMISSIONS.DONATIONS_EDIT,
    PERMISSIONS.DONATIONS_DELETE,
    PERMISSIONS.DONATIONS_REPORTS,
    PERMISSIONS.TASKS_VIEW,
    PERMISSIONS.TASKS_CREATE,
    PERMISSIONS.TASKS_EDIT,
    PERMISSIONS.TASKS_DELETE,
    PERMISSIONS.TASKS_ASSIGN,
    PERMISSIONS.GROUPS_VIEW,
    PERMISSIONS.GROUPS_CREATE,
    PERMISSIONS.GROUPS_EDIT,
    PERMISSIONS.GROUPS_DELETE,
    PERMISSIONS.GROUPS_MANAGE_MEMBERS,
    PERMISSIONS.FAMILIES_VIEW,
    PERMISSIONS.FAMILIES_CREATE,
    PERMISSIONS.FAMILIES_EDIT,
    PERMISSIONS.FAMILIES_DELETE,
    PERMISSIONS.CHILDREN_VIEW,
    PERMISSIONS.CHILDREN_CHECKIN,
    PERMISSIONS.CHILDREN_MANAGE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.REPORTS_ADMIN,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_EDIT,
    PERMISSIONS.SETTINGS_ADMIN,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_EDIT,
    PERMISSIONS.USERS_DELETE,
    PERMISSIONS.USERS_APPROVE
  ]
};

// Legacy support - will be replaced by dynamic roles
export const ROLE_PERMISSIONS = DEFAULT_ROLE_PERMISSIONS;

// Helper function to get user's role in current organization
export const getUserRole = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Check for impersonation
    const impersonatingUser = localStorage.getItem('impersonating_user');
    const impersonatingOrg = localStorage.getItem('impersonating_organization');
    
    if (impersonatingUser) {
      const impersonationData = JSON.parse(impersonatingUser);
      const { data: orgUser } = await supabase
        .from('organization_users')
        .select('role')
        .eq('user_id', impersonationData.user_id)
        .eq('organization_id', impersonationData.organization_id)

        .single();
      
      return orgUser?.role || ROLES.MEMBER;
    }
    
    if (impersonatingOrg) {
      return ROLES.ADMIN;
    }

    // Get current user's organization and role
    const { data: orgUser } = await supabase
      .from('organization_users')
      .select('role, organization_id')
      .eq('user_id', user.id)

      .single();

    return orgUser?.role || ROLES.MEMBER;
  } catch (error) {
    console.error('Error getting user role:', error);
    return ROLES.MEMBER;
  }
};

// Helper function to check if user has a specific permission
export const hasPermission = async (permission) => {
  try {
    const userRole = await getUserRole();
    if (!userRole) return false;

    // Admins have all permissions
    if (userRole === ROLES.ADMIN) return true;

    // Check if the permission is in the user's role permissions
    const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
    return rolePermissions.includes(permission);
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
};

// Helper function to check if user has any of the given permissions
export const hasAnyPermission = async (permissions) => {
  for (const permission of permissions) {
    if (await hasPermission(permission)) {
      return true;
    }
  }
  return false;
};

// Helper function to check if user has all of the given permissions
export const hasAllPermissions = async (permissions) => {
  for (const permission of permissions) {
    if (!(await hasPermission(permission))) {
      return false;
    }
  }
  return true;
};

// Helper function to get user's permission level for a feature
export const getPermissionLevel = async (feature) => {
  try {
    const userRole = await getUserRole();
    if (!userRole) return PERMISSION_LEVELS.NONE;

    // Admins have full access
    if (userRole === ROLES.ADMIN) return PERMISSION_LEVELS.ADMIN;

    // Map roles to permission levels
    const roleLevels = {
      [ROLES.MEMBER]: PERMISSION_LEVELS.READ,
      [ROLES.STAFF]: PERMISSION_LEVELS.WRITE,
      [ROLES.ADMIN]: PERMISSION_LEVELS.ADMIN
    };

    return roleLevels[userRole] || PERMISSION_LEVELS.NONE;
  } catch (error) {
    console.error('Error getting permission level:', error);
    return PERMISSION_LEVELS.NONE;
  }
};

// React hook for permissions (for use in components)
export const usePermissions = () => {
  const [userRole, setUserRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const role = await getUserRole();
        setUserRole(role);
        
        if (role) {
          const rolePerms = ROLE_PERMISSIONS[role] || [];
          setPermissions(rolePerms);
        }
      } catch (error) {
        console.error('Error loading permissions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPermissions();
  }, []);

  const hasPermission = useCallback((permission) => {
    if (!userRole) return false;
    if (userRole === ROLES.SYSTEM_ADMIN) return true;
    return permissions.includes(permission);
  }, [userRole, permissions]);

  const hasAnyPermission = useCallback((perms) => {
    return perms.some(perm => hasPermission(perm));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((perms) => {
    return perms.every(perm => hasPermission(perm));
  }, [hasPermission]);

  return {
    userRole,
    permissions,
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions
  };
};

// Permission-based route guard component
export const PermissionRoute = ({ permission, fallback = null, children }) => {
  const { hasPermission, isLoading } = usePermissions();

  if (isLoading) {
    return <div className="flex items-center justify-center p-4">Loading...</div>;
  }

  if (!hasPermission(permission)) {
    return fallback || <div className="p-4 text-center">Access denied</div>;
  }

  return children;
};

// Permission-based feature component
export const PermissionFeature = ({ permission, fallback = null, children }) => {
  const { hasPermission } = usePermissions();

  if (!hasPermission(permission)) {
    return fallback;
  }

  return children;
}; 
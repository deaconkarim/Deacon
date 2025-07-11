import { supabase } from './supabaseClient';

// Custom Roles Service
export class CustomRolesService {
  // Get all custom roles for an organization
  static async getCustomRoles(organizationId) {
    try {
      const { data, error } = await supabase
        .from('custom_roles')
        .select(`
          id,
          name,
          description,
          permissions,
          is_active,
          created_at,
          updated_at,
          custom_role_permissions (
            permission
          )
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      // Transform the data to include permissions as an array
      return data.map(role => ({
        ...role,
        permissions: role.custom_role_permissions.map(p => p.permission)
      }));
    } catch (error) {
      console.error('Error fetching custom roles:', error);
      throw error;
    }
  }

  // Get a specific custom role
  static async getCustomRole(roleId) {
    try {
      const { data, error } = await supabase
        .from('custom_roles')
        .select(`
          id,
          name,
          description,
          permissions,
          is_active,
          created_at,
          updated_at,
          custom_role_permissions (
            permission
          )
        `)
        .eq('id', roleId)
        .single();

      if (error) throw error;

      return {
        ...data,
        permissions: data.custom_role_permissions.map(p => p.permission)
      };
    } catch (error) {
      console.error('Error fetching custom role:', error);
      throw error;
    }
  }

  // Create a new custom role
  static async createCustomRole(organizationId, roleData) {
    try {
      const { name, description, permissions } = roleData;

      // Start a transaction
      const { data: role, error: roleError } = await supabase
        .from('custom_roles')
        .insert({
          organization_id: organizationId,
          name,
          description,
          permissions: permissions || []
        })
        .select()
        .single();

      if (roleError) throw roleError;

      // Insert permissions
      if (permissions && permissions.length > 0) {
        const permissionRecords = permissions.map(permission => ({
          custom_role_id: role.id,
          permission
        }));

        const { error: permError } = await supabase
          .from('custom_role_permissions')
          .insert(permissionRecords);

        if (permError) throw permError;
      }

      return role;
    } catch (error) {
      console.error('Error creating custom role:', error);
      throw error;
    }
  }

  // Update a custom role
  static async updateCustomRole(roleId, roleData) {
    try {
      const { name, description, permissions } = roleData;

      // Update the role
      const { data: role, error: roleError } = await supabase
        .from('custom_roles')
        .update({
          name,
          description,
          permissions: permissions || []
        })
        .eq('id', roleId)
        .select()
        .single();

      if (roleError) throw roleError;

      // Delete existing permissions
      const { error: deleteError } = await supabase
        .from('custom_role_permissions')
        .delete()
        .eq('custom_role_id', roleId);

      if (deleteError) throw deleteError;

      // Insert new permissions
      if (permissions && permissions.length > 0) {
        const permissionRecords = permissions.map(permission => ({
          custom_role_id: roleId,
          permission
        }));

        const { error: permError } = await supabase
          .from('custom_role_permissions')
          .insert(permissionRecords);

        if (permError) throw permError;
      }

      return role;
    } catch (error) {
      console.error('Error updating custom role:', error);
      throw error;
    }
  }

  // Delete a custom role
  static async deleteCustomRole(roleId) {
    try {
      // Delete permissions first (cascade should handle this, but being explicit)
      const { error: permError } = await supabase
        .from('custom_role_permissions')
        .delete()
        .eq('custom_role_id', roleId);

      if (permError) throw permError;

      // Delete the role
      const { error: roleError } = await supabase
        .from('custom_roles')
        .delete()
        .eq('id', roleId);

      if (roleError) throw roleError;

      return true;
    } catch (error) {
      console.error('Error deleting custom role:', error);
      throw error;
    }
  }

  // Get permissions for a specific custom role
  static async getCustomRolePermissions(roleName, organizationId) {
    try {
      const { data, error } = await supabase
        .rpc('get_custom_role_permissions', {
          role_name: roleName,
          org_id: organizationId
        });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching custom role permissions:', error);
      return [];
    }
  }

  // Check if a custom role has a specific permission
  static async customRoleHasPermission(roleName, organizationId, permission) {
    try {
      const { data, error } = await supabase
        .rpc('custom_role_has_permission', {
          role_name: roleName,
          org_id: organizationId,
          perm_name: permission
        });

      if (error) throw error;

      return data || false;
    } catch (error) {
      console.error('Error checking custom role permission:', error);
      return false;
    }
  }

  // Get all available permissions (for UI dropdowns)
  static getAvailablePermissions() {
    return [
      // Member management
      'members:view',
      'members:edit',
      'members:delete',
      'members:invite',
      
      // Event management
      'events:view',
      'events:create',
      'events:edit',
      'events:delete',
      'events:attendance',
      
      // Donation management
      'donations:view',
      'donations:create',
      'donations:edit',
      'donations:delete',
      'donations:reports',
      
      // Task management
      'tasks:view',
      'tasks:create',
      'tasks:edit',
      'tasks:delete',
      'tasks:assign',
      
      // Group management
      'groups:view',
      'groups:create',
      'groups:edit',
      'groups:delete',
      'groups:manage_members',
      
      // Family management
      'families:view',
      'families:create',
      'families:edit',
      'families:delete',
      
      // Children check-in
      'children:view',
      'children:checkin',
      'children:manage',
      
      // Reports and analytics
      'reports:view',
      'reports:export',
      'reports:admin',
      
      // Settings and configuration
      'settings:view',
      'settings:edit',
      'settings:admin',
      
      // User management
      'users:view',
      'users:edit',
      'users:delete',
      'users:approve'
    ];
  }

  // Get permission categories for UI organization
  static getPermissionCategories() {
    return {
      'Member Management': [
        'members:view',
        'members:edit',
        'members:delete',
        'members:invite'
      ],
      'Event Management': [
        'events:view',
        'events:create',
        'events:edit',
        'events:delete',
        'events:attendance'
      ],
      'Donation Management': [
        'donations:view',
        'donations:create',
        'donations:edit',
        'donations:delete',
        'donations:reports'
      ],
      'Task Management': [
        'tasks:view',
        'tasks:create',
        'tasks:edit',
        'tasks:delete',
        'tasks:assign'
      ],
      'Group Management': [
        'groups:view',
        'groups:create',
        'groups:edit',
        'groups:delete',
        'groups:manage_members'
      ],
      'Family Management': [
        'families:view',
        'families:create',
        'families:edit',
        'families:delete'
      ],
      'Children Check-in': [
        'children:view',
        'children:checkin',
        'children:manage'
      ],
      'Reports & Analytics': [
        'reports:view',
        'reports:export',
        'reports:admin'
      ],
      'Settings & Configuration': [
        'settings:view',
        'settings:edit',
        'settings:admin'
      ],
      'User Management': [
        'users:view',
        'users:edit',
        'users:delete',
        'users:approve'
      ]
    };
  }
} 
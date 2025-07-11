import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Users, 
  Crown, 
  UserCheck, 
  UserX, 
  Settings, 
  Eye, 
  EyeOff,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Check,
  AlertTriangle,
  Info,
  Search,
  Filter,
  RefreshCw,
  Download,
  Upload,
  UserPlus,
  Mail
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { PermissionGuard, PermissionButton } from '@/components/PermissionGuard';
import { PERMISSIONS, DEFAULT_ROLES, DEFAULT_ROLE_PERMISSIONS } from '@/lib/permissions.jsx';
import { usePermissions } from '@/lib/permissions.jsx';
import { supabase } from '@/lib/supabaseClient';
import { getMembers, getCurrentUserOrganizationId, makeUserAdmin, removeUserAdmin, isUserAdmin, deleteUser } from '@/lib/data';
import { CustomRolesService } from '@/lib/customRolesService';

export function Permissions() {
  const { userRole, permissions, hasPermission } = usePermissions();
  const { toast } = useToast();
  
  // State
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingPermissions, setEditingPermissions] = useState({});
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkRole, setBulkRole] = useState('member');
  const [organizationId, setOrganizationId] = useState(null);
  
  // Custom roles state
  const [customRoles, setCustomRoles] = useState([]);
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRolePermissions, setNewRolePermissions] = useState([]);

  // User management state
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isCreateAccountDialogOpen, setIsCreateAccountDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [currentUserIsAdmin, setCurrentUserIsAdmin] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'member',
    memberId: ''
  });
  const [createAccountData, setCreateAccountData] = useState({
    memberId: '',
    email: '',
    password: '',
    role: 'member'
  });
  const [membersWithoutAccounts, setMembersWithoutAccounts] = useState([]);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const orgId = await getCurrentUserOrganizationId();
      console.log('Organization ID loaded:', orgId);
      setOrganizationId(orgId);
      
      if (orgId) {
        await Promise.all([
          loadUsers(orgId),
          checkAdminStatus(),
          fetchMembersWithoutAccounts(orgId)
        ]);
        
        // Load custom roles after organization ID is set
        await loadCustomRoles(orgId);
      } else {
        console.log('No organization ID found');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load permissions data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkAdminStatus = async () => {
    try {
      const adminStatus = await isUserAdmin();
      setCurrentUserIsAdmin(adminStatus);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const fetchMembersWithoutAccounts = async (orgId) => {
    if (!orgId) {
      console.log('No organization ID available, skipping members without accounts fetch');
      setMembersWithoutAccounts([]);
      return;
    }

    try {
      console.log('Fetching members without accounts for organization:', orgId);
      
      // Fetch all members and organization users for this organization only
      const [membersResult, orgUsersResult] = await Promise.all([
        supabase
          .from('members')
          .select('id, firstname, lastname, email, status, created_at')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false }),
        supabase
          .from('organization_users')
          .select('user_id, role, approval_status')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false })
      ]);

      console.log('Organization members:', membersResult.data);
      console.log('Organization users:', orgUsersResult.data);

      if (membersResult.error) throw membersResult.error;
      if (orgUsersResult.error) throw orgUsersResult.error;

      // Get list of user IDs that already have accounts
      const existingUserIds = new Set(orgUsersResult.data.map(ou => ou.user_id));

      // Filter out members who already have user accounts and only include members with email addresses
      const membersWithoutAccounts = membersResult.data.filter(member => 
        (!member.user_id || !existingUserIds.has(member.user_id)) && 
        member.email && 
        member.email.trim() !== ''
      );
      
      console.log('Members without accounts:', membersWithoutAccounts);
      setMembersWithoutAccounts(membersWithoutAccounts);
    } catch (error) {
      console.error('Error fetching members without accounts:', error);
    }
  };

  const loadUsers = async (orgId) => {
    try {
      // Get organization users with roles
      const { data: orgUsers, error: orgError } = await supabase
        .from('organization_users')
        .select(`
          user_id,
          role,
          created_at
        `)
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (orgError) throw orgError;

      // Get member data separately
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select(`
          id,
          user_id,
          firstname,
          lastname,
          email,
          image_url
        `)
        .eq('organization_id', orgId);

      if (membersError) throw membersError;

      // Create a map of user_id to member data
      const membersMap = new Map();
      members.forEach(member => {
        if (member.user_id) {
          membersMap.set(member.user_id, member);
        }
      });

      // Transform data to include member info
      const transformedUsers = orgUsers.map(orgUser => {
        const memberData = membersMap.get(orgUser.user_id) || {};
        return {
          id: orgUser.user_id,
          role: orgUser.role,
          created_at: orgUser.created_at,
          firstname: memberData.firstname || 'Unknown',
          lastname: memberData.lastname || 'User',
          email: memberData.email || 'No email',
          image_url: memberData.image_url
        };
      });

      setUsers(transformedUsers);
      setFilteredUsers(transformedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      throw error;
    }
  };

  // Filter users
  useEffect(() => {
    let filtered = users;

    if (searchQuery) {
      filtered = filtered.filter(user => 
        user.firstname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [searchQuery, roleFilter, users]);

  // Handle role updates
  const handleRoleUpdate = async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from('organization_users')
        .update({ role: newRole })
        .eq('user_id', userId)
        .eq('organization_id', organizationId);

      if (error) throw error;

      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));

      toast({
        title: "Role Updated",
        description: `User role has been updated to ${newRole}`,
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };



  // Handle bulk role updates
  const handleBulkRoleUpdate = async () => {
    if (selectedUsers.length === 0) {
      toast({
        title: "No users selected",
        description: "Please select at least one user to update",
        variant: "destructive",
      });
      return;
    }

    try {
      const updatePromises = selectedUsers.map(userId =>
        supabase
          .from('organization_users')
          .update({ role: bulkRole })
          .eq('user_id', userId)
          .eq('organization_id', organizationId)
      );

      await Promise.all(updatePromises);

      // Update local state
      setUsers(prev => prev.map(user => 
        selectedUsers.includes(user.id) ? { ...user, role: bulkRole } : user
      ));

      setSelectedUsers([]);
      setIsBulkEditOpen(false);
      setBulkRole('member');

      toast({
        title: "Bulk Update Complete",
        description: `Updated ${selectedUsers.length} users to ${bulkRole} role`,
      });
    } catch (error) {
      console.error('Error updating roles:', error);
      toast({
        title: "Error",
        description: "Failed to update user roles",
        variant: "destructive",
      });
    }
  };

  // User management functions
  const handleInviteUser = async () => {
    if (!inviteData.email || !inviteData.firstName || !inviteData.lastName) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Current user:', user.id);

      // Check current user's organization membership and admin status
      const { data: userMembership, error: membershipError } = await supabase
        .from('organization_users')
        .select('role, organization_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (membershipError) {
        throw new Error('User not associated with any organization');
      }

      if (!userMembership.organization_id) {
        throw new Error('User not associated with any organization');
      }

      // Create the invitation
      const { data: invitation, error: inviteError } = await supabase
        .from('organization_invitations')
        .insert([{
          email: inviteData.email,
          first_name: inviteData.firstName,
          last_name: inviteData.lastName,
          role: inviteData.role,
          organization_id: userMembership.organization_id,
          invited_by: user.id,
          status: 'pending'
        }])
        .select()
        .single();

      if (inviteError) {
        console.error('Error creating invitation:', inviteError);
        throw new Error('Failed to create invitation');
      }

      // Send invitation email
      try {
        const response = await fetch('/api/send-invitation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            invitationId: invitation.id,
            email: inviteData.email,
            firstName: inviteData.firstName,
            lastName: inviteData.lastName,
            organizationId: userMembership.organization_id
          }),
        });

        if (!response.ok) {
          console.warn('Failed to send invitation email, but invitation was created');
        }
      } catch (emailError) {
        console.error('Error sending invitation email:', emailError);
        // Don't fail the whole operation if email fails
      }

      setIsInviteDialogOpen(false);
      setInviteData({
        email: '',
        firstName: '',
        lastName: '',
        role: 'member',
        memberId: ''
      });

      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${inviteData.email}`,
      });
    } catch (error) {
      console.error('Error inviting user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUserAccount = async () => {
    if (!createAccountData.memberId || !createAccountData.email || !createAccountData.password) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check current user's organization membership
      const { data: userMembership, error: membershipError } = await supabase
        .from('organization_users')
        .select('role, organization_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (membershipError) {
        throw new Error('User not associated with any organization');
      }

      if (!userMembership.organization_id) {
        throw new Error('User not associated with any organization');
      }

      // Get member data for first/last name
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('firstname, lastname')
        .eq('id', createAccountData.memberId)
        .single();

      if (memberError || !memberData) {
        throw new Error('Member not found');
      }

      // Call the Edge Function to create the user
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          email: createAccountData.email,
          password: createAccountData.password,
          firstName: memberData.firstname,
          lastName: memberData.lastname,
          role: createAccountData.role,
          organizationId: userMembership.organization_id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user account');
      }

      // Update member record with user_id from the response
      const result = await response.json();
      const { error: memberUpdateError } = await supabase
        .from('members')
        .update({ user_id: result.user.id })
        .eq('id', createAccountData.memberId);

      if (memberUpdateError) {
        console.error('Error updating member record:', memberUpdateError);
        // Don't fail the whole operation if member update fails
      }

      setIsCreateAccountDialogOpen(false);
      setCreateAccountData({
        memberId: '',
        email: '',
        password: '',
        role: 'member'
      });
      setMemberSearchQuery(''); // Clear search query

      // Refresh the data
      await loadData();

      toast({
        title: "Account Created",
        description: `User account created for ${createAccountData.email}`,
      });
    } catch (error) {
      console.error('Error creating user account:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user account",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add function to handle member selection and auto-populate email
  const handleMemberSelection = (memberId) => {
    const selectedMember = membersWithoutAccounts.find(member => member.id === memberId);
    if (selectedMember) {
      setCreateAccountData({
        ...createAccountData,
        memberId: memberId,
        email: selectedMember.email || ''
      });
    }
  };

  // Add state for member search
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  // Filter members based on search query
  const filteredMembersForAccount = membersWithoutAccounts.filter(member => {
    const fullName = `${member.firstname} ${member.lastname}`.toLowerCase();
    const email = (member.email || '').toLowerCase();
    const query = memberSearchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  const handleDeleteUser = async (userId) => {
    setUserToDelete(userId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    setIsLoading(true);
    try {
      await deleteUser(userToDelete, organizationId);
      
      // Refresh the users list
      await loadUsers(organizationId);
      
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      
      toast({
        title: "User Deleted",
        description: "User has been successfully deleted",
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get role badge variant
  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'staff': return 'secondary';
      case 'member': return 'default';
      default: return 'outline';
    }
  };

  // Get role icon
  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return Crown;
      case 'staff': return Shield;
      case 'member': return Users;
      default: return Users;
    }
  };

  const getRoleBadgeVariantForUserManagement = (role) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'staff': return 'secondary';
      case 'member': return 'default';
      default: return 'outline';
    }
  };

  const getRoleIconForUserManagement = (role) => {
    switch (role) {
      case 'admin': return Crown;
      case 'staff': return Shield;
      case 'member': return Users;
      default: return Users;
    }
  };



  // Custom role handlers
  const handleCreateRole = async () => {
    try {
      if (!newRoleName.trim() || newRolePermissions.length === 0) {
        toast({
          title: "Error",
          description: "Please provide a role name and select at least one permission",
          variant: "destructive",
        });
        return;
      }

      // Create custom role in database
      const newRole = await CustomRolesService.createCustomRole(organizationId, {
        name: newRoleName.trim(),
        description: `Custom role: ${newRoleName.trim()}`,
        permissions: newRolePermissions
      });

      // Reload custom roles
      await loadCustomRoles();

      setNewRoleName('');
      setNewRolePermissions([]);
      setIsCreateRoleOpen(false);

      toast({
        title: "Success",
        description: `Role "${newRole.name}" created successfully`,
      });
    } catch (error) {
      console.error('Error creating role:', error);
      toast({
        title: "Error",
        description: "Failed to create custom role",
        variant: "destructive",
      });
    }
  };

  const handleEditRole = (role) => {
    // TODO: Implement edit functionality
    toast({
      title: "Coming Soon",
      description: "Role editing will be available in a future update",
    });
  };

  const handleDeleteRole = async (roleId) => {
    try {
      await CustomRolesService.deleteCustomRole(roleId);
      
      // Reload custom roles
      await loadCustomRoles();

      toast({
        title: "Success",
        description: "Role deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting role:', error);
      toast({
        title: "Error",
        description: "Failed to delete role",
        variant: "destructive",
      });
    }
  };

  // Load custom roles from database
  const loadCustomRoles = async (orgId = null) => {
    const targetOrgId = orgId || organizationId;
    if (!targetOrgId) {
      console.log('No organization ID available for loading custom roles');
      return;
    }
    
    try {
      console.log('Loading custom roles for organization:', targetOrgId);
      
      // Let's also check what's in the database directly
      const { data: directCheck, error: directError } = await supabase
        .from('custom_roles')
        .select('*')
        .eq('organization_id', targetOrgId);
      
      console.log('Direct database check for custom roles:', directCheck);
      if (directError) console.error('Direct check error:', directError);
      
      const roles = await CustomRolesService.getCustomRoles(targetOrgId);
      console.log('Loaded custom roles via service:', roles);
      setCustomRoles(roles);
    } catch (error) {
      console.error('Error loading custom roles:', error);
    }
  };



  // Permission categories for display
  const permissionCategories = CustomRolesService.getPermissionCategories();

  // Add function to handle opening the Create Account dialog
  const handleOpenCreateAccountDialog = () => {
    setCreateAccountData({
      memberId: '',
      email: '',
      password: '',
      role: 'member'
    });
    setMemberSearchQuery('');
    setIsCreateAccountDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <PermissionGuard permission={PERMISSIONS.USERS_EDIT}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Permissions & Roles</h1>
            <p className="text-muted-foreground">
              Manage user roles and permissions for your organization
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={loadData}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <PermissionButton
              permission={PERMISSIONS.USERS_EDIT}
              onClick={() => setIsBulkEditOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Bulk Edit
            </PermissionButton>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Users</span>
              </div>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-red-600" />
                <span className="text-sm text-muted-foreground">Admins</span>
              </div>
              <div className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-muted-foreground">Staff</span>
              </div>
              <div className="text-2xl font-bold">{users.filter(u => u.role === 'staff').length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">Members</span>
              </div>
              <div className="text-2xl font-bold">{users.filter(u => u.role === 'member').length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Custom Roles Summary */}
        {(() => {
          console.log('Rendering custom roles section. customRoles:', customRoles);
          console.log('customRoles.length:', customRoles.length);
          return customRoles.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Custom Roles</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {customRoles.map((role) => (
                  <Card key={role.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Settings className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{role.name}</div>
                          <div className="text-2xl font-bold">{users.filter(u => u.role === role.name).length}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })()}

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="roles">Role Definitions</TabsTrigger>
            <TabsTrigger value="custom-roles">Custom Roles</TabsTrigger>
            <TabsTrigger value="permissions">Permission Matrix</TabsTrigger>
          </TabsList>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-4">
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => setIsInviteDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Invite User
              </Button>
              <Button 
                onClick={handleOpenCreateAccountDialog}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Create Account
              </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    {customRoles.map((role) => (
                      <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                    ))}
                  </SelectContent>
              </Select>
            </div>

            {/* Users List */}
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <Card key={user.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.image_url} />
                          <AvatarFallback>
                            {user.firstname?.charAt(0)}{user.lastname?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold">
                            {user.firstname} {user.lastname}
                          </div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={getRoleBadgeVariantForUserManagement(user.role)}>
                              {(() => {
                                const IconComponent = getRoleIconForUserManagement(user.role);
                                return <IconComponent className="h-3 w-3 mr-1" />;
                              })()}
                              {user.role}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={user.role}
                          onValueChange={(value) => handleRoleUpdate(user.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="staff">Staff</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            {customRoles.map((role) => (
                              <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {currentUserIsAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Role Definitions Tab */}
          <TabsContent value="roles" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Default roles */}
              {[
                { key: 'MEMBER', value: 'member', description: 'Basic access to view information and participate in events' },
                { key: 'STAFF', value: 'staff', description: 'Can create and manage events, tasks, and basic operations' },
                { key: 'ADMIN', value: 'admin', description: 'Full access to all features including user management' }
              ].map((role) => (
                <Card key={role.value}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {(() => {
                        const IconComponent = getRoleIcon(role.value);
                        return <IconComponent className="h-4 w-4" />;
                      })()}
                      {role.key.replace('_', ' ')}
                    </CardTitle>
                    <CardDescription>
                      {role.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="font-medium">Permissions:</h4>
                      <div className="space-y-2">
                        {(DEFAULT_ROLE_PERMISSIONS[role.value] || []).map((permission) => {
                          const parts = permission.split(':');
                          const category = parts[0] || '';
                          const action = parts[1] || '';
                          const categoryName = category ? category.charAt(0).toUpperCase() + category.slice(1) : '';
                          const actionName = action ? action.charAt(0).toUpperCase() + action.slice(1) : '';
                          return (
                            <div key={permission} className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{categoryName}</span>
                              <Badge variant="outline" className="text-xs">
                                {actionName}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {/* Custom roles */}
              {customRoles.map((role) => (
                <Card key={role.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      {role.name}
                    </CardTitle>
                    <CardDescription>{role.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Permissions:</h4>
                      <div className="space-y-1">
                        {role.permissions.map((permission) => {
                          const parts = permission.split(':');
                          const category = parts[0] || '';
                          const action = parts[1] || '';
                          const categoryName = category ? category.charAt(0).toUpperCase() + category.slice(1) : '';
                          const actionName = action ? action.charAt(0).toUpperCase() + action.slice(1) : '';
                          return (
                            <div key={permission} className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">{categoryName}</span>
                              <Badge variant="outline" className="text-xs">
                                {actionName}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Custom Roles Tab */}
          <TabsContent value="custom-roles" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Custom Roles</h3>
                <p className="text-muted-foreground">
                  Create and manage custom roles for your organization
                </p>
              </div>
              <Button onClick={() => setIsCreateRoleOpen(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Role
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customRoles.map((role) => (
                <Card key={role.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{role.name}</span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditRole(role)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRole(role.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription>{role.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Permissions:</h4>
                      <div className="space-y-1">
                        {role.permissions.map((permission) => {
                          const parts = permission.split(':');
                          const category = parts[0] || '';
                          const action = parts[1] || '';
                          const categoryName = category ? category.charAt(0).toUpperCase() + category.slice(1) : '';
                          const actionName = action ? action.charAt(0).toUpperCase() + action.slice(1) : '';
                          return (
                            <div key={permission} className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">{categoryName}</span>
                              <Badge variant="outline" className="text-xs">
                                {actionName}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {customRoles.length === 0 && (
              <Card className="text-center py-8">
                <CardContent>
                  <div className="flex flex-col items-center gap-4">
                    <Shield className="h-12 w-12 text-muted-foreground" />
                    <div>
                      <h3 className="text-lg font-semibold">No Custom Roles</h3>
                      <p className="text-muted-foreground">
                        Create your first custom role to get started
                      </p>
                    </div>
                    <Button onClick={() => setIsCreateRoleOpen(true)}>
                      Create Custom Role
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Permission Matrix Tab */}
          <TabsContent value="permissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Permission Matrix</CardTitle>
                <CardDescription>
                  Overview of which permissions are available to each role
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Permission</th>
                        <th className="text-center p-2">Member</th>
                        <th className="text-center p-2">Staff</th>
                        <th className="text-center p-2">Admin</th>
                        {customRoles.map((role) => (
                          <th key={role.id} className="text-center p-2">{role.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(permissionCategories).map(([category, perms]) => (
                        <React.Fragment key={category}>
                          <tr className="bg-muted/50">
                            <td className="p-2 font-medium" colSpan={4 + customRoles.length}>{category}</td>
                          </tr>
                          {perms.map((permission) => {
                            const parts = permission.split(':');
                            const category = parts[0] || '';
                            const action = parts[1] || '';
                            const categoryName = category ? category.charAt(0).toUpperCase() + category.slice(1) : '';
                            const actionName = action ? action.charAt(0).toUpperCase() + action.slice(1) : '';
                            return (
                              <tr key={permission} className="border-b">
                                <td className="p-2 text-muted-foreground">
                                  {categoryName} - {actionName}
                                </td>
                              <td className="text-center p-2">
                                {DEFAULT_ROLE_PERMISSIONS.member?.includes(permission) ? (
                                  <Check className="h-4 w-4 text-green-600 mx-auto" />
                                ) : (
                                  <X className="h-4 w-4 text-gray-400 mx-auto" />
                                )}
                              </td>
                              <td className="text-center p-2">
                                {DEFAULT_ROLE_PERMISSIONS.staff?.includes(permission) ? (
                                  <Check className="h-4 w-4 text-green-600 mx-auto" />
                                ) : (
                                  <X className="h-4 w-4 text-gray-400 mx-auto" />
                                )}
                              </td>
                              <td className="text-center p-2">
                                {DEFAULT_ROLE_PERMISSIONS.admin?.includes(permission) ? (
                                  <Check className="h-4 w-4 text-green-600 mx-auto" />
                                ) : (
                                  <X className="h-4 w-4 text-gray-400 mx-auto" />
                                )}
                              </td>
                              {customRoles.map((role) => (
                                <td key={role.id} className="text-center p-2">
                                  {role.permissions.includes(permission) ? (
                                    <Check className="h-4 w-4 text-green-600 mx-auto" />
                                  ) : (
                                    <X className="h-4 w-4 text-gray-400 mx-auto" />
                                  )}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Bulk Edit Dialog */}
        <Dialog open={isBulkEditOpen} onOpenChange={setIsBulkEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Edit User Roles</DialogTitle>
              <DialogDescription>
                Select users and assign them a new role. This will update all selected users at once.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Select Users</Label>
                <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-2">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={user.id}
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedUsers([...selectedUsers, user.id]);
                          } else {
                            setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                          }
                        }}
                      />
                      <Label htmlFor={user.id} className="text-sm">
                        {user.firstname} {user.lastname} ({user.role})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>New Role</Label>
                <Select value={bulkRole} onValueChange={setBulkRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    {customRoles.map((role) => (
                      <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsBulkEditOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleBulkRoleUpdate}
                disabled={selectedUsers.length === 0}
              >
                Update {selectedUsers.length} Users
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Custom Role Dialog */}
        <Dialog open={isCreateRoleOpen} onOpenChange={setIsCreateRoleOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Custom Role</DialogTitle>
              <DialogDescription>
                Define a new role with specific permissions for your organization
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="role-name">Role Name</Label>
                <Input
                  id="role-name"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g., Event Coordinator, Finance Manager"
                />
              </div>
              <div>
                <Label>Permissions</Label>
                <div className="max-h-64 overflow-y-auto border rounded-md p-4 space-y-4">
                  {Object.entries(permissionCategories).map(([category, perms]) => (
                    <div key={category}>
                      <h4 className="font-medium text-sm mb-2">{category}</h4>
                      <div className="space-y-2">
                        {perms.map((permission) => {
                          const parts = permission.split(':');
                          const category = parts[0] || '';
                          const action = parts[1] || '';
                          const categoryName = category ? category.charAt(0).toUpperCase() + category.slice(1) : '';
                          const actionName = action ? action.charAt(0).toUpperCase() + action.slice(1) : '';
                          return (
                            <div key={permission} className="flex items-center space-x-2">
                              <Checkbox
                                id={permission}
                                checked={newRolePermissions.includes(permission)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setNewRolePermissions([...newRolePermissions, permission]);
                                  } else {
                                    setNewRolePermissions(newRolePermissions.filter(p => p !== permission));
                                  }
                                }}
                              />
                              <Label htmlFor={permission} className="text-sm">
                                {categoryName} - {actionName}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateRoleOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateRole}
                disabled={!newRoleName.trim() || newRolePermissions.length === 0}
              >
                Create Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Invite User Dialog */}
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Invite User</DialogTitle>
              <DialogDescription>
                Enter the email address of the user you want to invite.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                  id="invite-email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <Label htmlFor="invite-first-name">First Name</Label>
                <Input
                  id="invite-first-name"
                  value={inviteData.firstName}
                  onChange={(e) => setInviteData({ ...inviteData, firstName: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="invite-last-name">Last Name</Label>
                <Input
                  id="invite-last-name"
                  value={inviteData.lastName}
                  onChange={(e) => setInviteData({ ...inviteData, lastName: e.target.value })}
                  placeholder="Doe"
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select
                  value={inviteData.role}
                  onValueChange={(value) => setInviteData({ ...inviteData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    {customRoles.map((role) => (
                      <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleInviteUser}
                disabled={!inviteData.email || !inviteData.firstName || !inviteData.lastName}
              >
                Send Invitation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create User Account Dialog */}
        <Dialog open={isCreateAccountDialogOpen} onOpenChange={setIsCreateAccountDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create User Account</DialogTitle>
              <DialogDescription>
                Select a member and provide email/password to create their user account.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="create-account-member">Select Member</Label>
                <Select
                  value={createAccountData.memberId}
                  onValueChange={(value) => {
                    setCreateAccountData({ ...createAccountData, memberId: value });
                    handleMemberSelection(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a member" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <Input
                        placeholder="Search members..."
                        value={memberSearchQuery}
                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                        className="mb-2"
                      />
                    </div>
                    {filteredMembersForAccount.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.firstname} {member.lastname} {member.email ? `(${member.email})` : ''}
                      </SelectItem>
                    ))}
                    {filteredMembersForAccount.length === 0 && memberSearchQuery && (
                      <div className="p-2 text-sm text-muted-foreground">
                        No members found matching "{memberSearchQuery}"
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {membersWithoutAccounts.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    All members already have user accounts.
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="create-account-email">Email Address</Label>
                <Input
                  id="create-account-email"
                  value={createAccountData.email}
                  onChange={(e) => setCreateAccountData({ ...createAccountData, email: e.target.value })}
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <Label htmlFor="create-account-password">Password</Label>
                <Input
                  id="create-account-password"
                  type="password"
                  value={createAccountData.password}
                  onChange={(e) => setCreateAccountData({ ...createAccountData, password: e.target.value })}
                  placeholder="Password"
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select
                  value={createAccountData.role}
                  onValueChange={(value) => setCreateAccountData({ ...createAccountData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    {customRoles.map((role) => (
                      <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateAccountDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateUserAccount}
                disabled={!createAccountData.memberId || !createAccountData.email || !createAccountData.password}
              >
                Create Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete User Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this user? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDeleteUser}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGuard>
  );
} 
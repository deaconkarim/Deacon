import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Users, Mail, Shield, Trash2, Edit, Search, Crown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { Badge } from '@/components/ui/badge';
import { makeUserAdmin, removeUserAdmin, isUserAdmin, deleteUser } from '@/lib/data';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
};

const UserManagementSettings = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isCreateAccountDialogOpen, setIsCreateAccountDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserIsAdmin, setCurrentUserIsAdmin] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'member'
  });
  const [createAccountData, setCreateAccountData] = useState({
    memberId: '',
    email: '',
    password: '',
    role: 'member'
  });
  const [membersWithoutAccounts, setMembersWithoutAccounts] = useState([]);
  const [organizationId, setOrganizationId] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const initializeComponent = async () => {
      try {
        await checkAdminStatus();
        const orgId = await getCurrentUserOrganizationId();
        setOrganizationId(orgId);
        
        if (orgId) {
          await fetchUsers();
          await fetchMembersWithoutAccounts();
        }
      } catch (error) {
        console.error('Error initializing component:', error);
      }
    };

    initializeComponent();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const adminStatus = await isUserAdmin();
      setCurrentUserIsAdmin(adminStatus);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  useEffect(() => {
    const filtered = users.filter(user => 
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.firstname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastname?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching users...');
      
      // Fetch organization users and members separately
      const [orgUsersResult, membersResult] = await Promise.all([
        supabase
          .from('organization_users')
          .select('user_id, role, approval_status, created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('members')
          .select('id, firstname, lastname, email, status, created_at, user_id')
          .order('created_at', { ascending: false })
      ]);

      console.log('Organization users:', orgUsersResult.data);
      console.log('Members:', membersResult.data);

      if (orgUsersResult.error) throw orgUsersResult.error;
      if (membersResult.error) throw membersResult.error;

      // Create a map of user_id to member data
      const membersMap = new Map();
      membersResult.data.forEach(member => {
        // Map by both member.id and member.user_id
        membersMap.set(member.id, member);
        if (member.user_id) {
          membersMap.set(member.user_id, member);
        }
      });

      // Create a map of user_id to organization user data
      const orgUsersMap = new Map();
      orgUsersResult.data.forEach(orgUser => {
        orgUsersMap.set(orgUser.user_id, orgUser);
      });

      console.log('Members map:', membersMap);
      console.log('Org users map:', orgUsersMap);

      // Show users who have organization membership (accounts)
      const transformedUsers = [];
      
      orgUsersResult.data.forEach(orgUser => {
        // Try to find a member with the same user_id
        const member = membersMap.get(orgUser.user_id);
        
        if (member) {
          transformedUsers.push({
            id: member.id,
            firstname: member.firstname,
            lastname: member.lastname,
            email: member.email,
            status: member.status,
            role: orgUser.role,
            approval_status: orgUser.approval_status,
            created_at: member.created_at
          });
        } else {
          console.log('No member found for org user:', orgUser.user_id);
        }
      });

      console.log('Transformed users:', transformedUsers);

      // Sort by creation date (newest first)
      transformedUsers.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setUsers(transformedUsers || []);
      setFilteredUsers(transformedUsers || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error fetching users",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

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
      // Instead of creating a user account directly, we'll create a pending invitation
      // The user will need to register themselves and then be approved
      const { data, error } = await supabase
        .from('organization_invitations')
        .insert({
          email: inviteData.email,
          first_name: inviteData.firstName,
          last_name: inviteData.lastName,
          role: inviteData.role,
          status: 'pending',
          invited_by: user.id
        })
        .select()
        .single();

      if (error) {
        // If the invitations table doesn't exist, fall back to a simpler approach
        console.log('Invitations table not available, using alternative approach');
        
        // Create a member record with pending status
        const { error: memberError } = await supabase
          .from('members')
          .insert({
            firstname: inviteData.firstName,
            lastname: inviteData.lastName,
            email: inviteData.email,
            status: 'pending'
          });

        if (memberError) throw memberError;

        toast({
          title: "User invitation prepared",
          description: `${inviteData.firstName} ${inviteData.lastName} has been added to the system. They will need to register with their email address to access the system.`,
        });
      } else {
        toast({
          title: "User invited successfully",
          description: `Invitation sent to ${inviteData.email} with role: ${inviteData.role}. They will receive an email to complete their registration.`,
        });
      }

      setIsInviteDialogOpen(false);
      setInviteData({ email: '', firstName: '', lastName: '', role: 'member' });
      fetchUsers();
    } catch (error) {
      console.error('Error inviting user:', error);
      toast({
        title: "Error inviting user",
        description: "Unable to create invitation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      if (newRole === 'admin') {
        await makeUserAdmin(userId);
      } else if (newRole === 'member') {
        await removeUserAdmin(userId);
      }

      toast({
        title: "Role updated",
        description: `User role has been updated to ${newRole}.`,
      });

      fetchUsers();
    } catch (error) {
      toast({
        title: "Error updating role",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteUser = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) {
      toast({
        title: "User not found",
        description: "The user you're trying to delete could not be found.",
        variant: "destructive"
      });
      return;
    }

    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await deleteUser(userToDelete.id, organizationId);

      toast({
        title: "User deleted",
        description: `${userToDelete.firstname} ${userToDelete.lastname} has been removed from the organization.`,
      });

      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error deleting user",
        description: error.message || "Failed to delete user. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'deacon': return 'default';
      default: return 'secondary';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const fetchMembersWithoutAccounts = async () => {
    try {
      console.log('Fetching members without accounts...');
      
      // Fetch all members and organization users (same as fetchUsers)
      const [membersResult, orgUsersResult] = await Promise.all([
        supabase
          .from('members')
          .select('id, firstname, lastname, email, status, created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('organization_users')
          .select('user_id, role, approval_status')
          .order('created_at', { ascending: false })
      ]);

      console.log('All members:', membersResult.data);
      console.log('All org users:', orgUsersResult.data);

      if (membersResult.error) throw membersResult.error;
      if (orgUsersResult.error) throw orgUsersResult.error;

      // Get list of user IDs that already have accounts
      const existingUserIds = new Set(orgUsersResult.data.map(ou => ou.user_id));

      // Filter out members who already have user accounts
      const membersWithoutAccounts = membersResult.data.filter(member => !existingUserIds.has(member.id));
      
      console.log('Members without accounts:', membersWithoutAccounts);
      setMembersWithoutAccounts(membersWithoutAccounts);
    } catch (error) {
      console.error('Error fetching members without accounts:', error);
    }
  };

  const getCurrentUserOrganizationId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error) throw error;
      return data?.organization_id;
    } catch (error) {
      console.error('Error getting user organization:', error);
      return null;
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

    if (createAccountData.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Creating user account for member:', createAccountData.memberId);
      console.log('Organization ID:', organizationId);
      
      // Get the member details
      const selectedMember = membersWithoutAccounts.find(m => m.id === createAccountData.memberId);
      if (!selectedMember) {
        throw new Error('Selected member not found');
      }

      console.log('Selected member:', selectedMember);

      // Create the user account using signUp
      const { data, error } = await supabase.auth.signUp({
        email: createAccountData.email,
        password: createAccountData.password,
        options: {
          data: {
            first_name: selectedMember.firstname,
            last_name: selectedMember.lastname,
            member_id: selectedMember.id
          }
        }
      });

      console.log('SignUp result:', { data, error });

      if (error) throw error;

      if (data.user) {
        console.log('User created successfully:', data.user.id);
        
        // Update the member record to link it to the user account
        const { error: memberUpdateError } = await supabase
          .from('members')
          .update({ 
            user_id: data.user.id,
            email: createAccountData.email // Update email if different
          })
          .eq('id', selectedMember.id);

        console.log('Member update result:', { memberUpdateError });

        // Create organization membership
        const { error: orgError } = await supabase
          .from('organization_users')
          .insert({
            user_id: data.user.id,
            organization_id: organizationId,
            role: createAccountData.role,
            status: 'active',
            approval_status: 'approved'
          });

        console.log('Organization membership result:', { orgError });

        if (orgError) {
          console.error('Error creating organization membership:', orgError);
        }

        toast({
          title: "User account created successfully",
          description: `Account created for ${selectedMember.firstname} ${selectedMember.lastname}. They can now log in with their email and password.`,
        });

        setIsCreateAccountDialogOpen(false);
        setCreateAccountData({ memberId: '', email: '', password: '', role: 'member' });
        
        // Wait a moment for the database to update, then refresh
        setTimeout(() => {
          fetchUsers();
          fetchMembersWithoutAccounts();
        }, 1000);
      }
    } catch (error) {
      console.error('Error creating user account:', error);
      toast({
        title: "Error creating user account",
        description: error.message || "Unable to create user account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 }}}}
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage users and their access to the organization management system.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setIsCreateAccountDialogOpen(true)} variant="outline">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Account
                </Button>
                <Button onClick={() => setIsInviteDialogOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite User
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              <div className="space-y-2">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
                        <span>Loading users...</span>
                      </div>
                    ) : searchQuery ? (
                      <div>
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No users found matching "{searchQuery}"</p>
                      </div>
                    ) : (
                      <div>
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No users found</p>
                        <p className="text-sm">Users will appear here once they register or are invited.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          {getRoleIcon(user.role)}
                        </div>
                        <div>
                          <p className="font-medium">
                            {user.firstname} {user.lastname}
                          </p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={getRoleBadgeVariant(user.role)}>
                              {user.role}
                            </Badge>
                            {user.approval_status === 'pending' && (
                              <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                                Pending Approval
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {currentUserIsAdmin && (
                          <Select
                            value={user.role}
                            onValueChange={(value) => handleUpdateUserRole(user.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="deacon">Deacon</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
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
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Invite User Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New User</DialogTitle>
            <DialogDescription>
              Create a new user account for your organization management system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={inviteData.firstName}
                  onChange={(e) => setInviteData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={inviteData.lastName}
                  onChange={(e) => setInviteData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={inviteData.email}
                onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={inviteData.role}
                onValueChange={(value) => setInviteData(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="deacon">Deacon</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInviteUser} disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Account Dialog */}
      <Dialog open={isCreateAccountDialogOpen} onOpenChange={setIsCreateAccountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create User Account</DialogTitle>
            <DialogDescription>
              Create a user account for an existing member so they can access the system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="member-select">Select Member</Label>
              <Select
                value={createAccountData.memberId}
                onValueChange={(value) => setCreateAccountData(prev => ({ ...prev, memberId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a member..." />
                </SelectTrigger>
                <SelectContent>
                  {membersWithoutAccounts.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.firstname} {member.lastname} ({member.email || 'No email'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-email">Email Address *</Label>
              <Input
                id="create-email"
                type="email"
                value={createAccountData.email}
                onChange={(e) => setCreateAccountData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="member@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-password">Password *</Label>
              <Input
                id="create-password"
                type="password"
                value={createAccountData.password}
                onChange={(e) => setCreateAccountData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Minimum 6 characters"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-role">Role</Label>
              <Select
                value={createAccountData.role}
                onValueChange={(value) => setCreateAccountData(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateAccountDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUserAccount} disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {userToDelete && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-red-800">
                      User to be deleted:
                    </h4>
                    <p className="text-sm text-red-700 mt-1">
                      <strong>{userToDelete.firstname} {userToDelete.lastname}</strong>
                    </p>
                    <p className="text-sm text-red-700">{userToDelete.email}</p>
                    <p className="text-sm text-red-700">Role: {userToDelete.role}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <Shield className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">
                      What will happen:
                    </h4>
                    <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                      <li>• User will lose access to the organization</li>
                      <li>• Their member record will be permanently deleted</li>
                      <li>• Their organization membership will be removed</li>
                      <li>• Their auth account will remain but won't have access</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsDeleteDialogOpen(false);
              setUserToDelete(null);
            }}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteUser}
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default UserManagementSettings; 
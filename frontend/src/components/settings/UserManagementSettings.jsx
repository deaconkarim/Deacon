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
import { makeUserAdmin, removeUserAdmin, isUserAdmin } from '@/lib/data';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
};

const UserManagementSettings = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserIsAdmin, setCurrentUserIsAdmin] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'member'
  });
  const { toast } = useToast();

  useEffect(() => {
    checkAdminStatus();
    fetchUsers();
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
          .select('user_id, role, approval_status')
          .order('created_at', { ascending: false }),
        supabase
          .from('members')
          .select('id, firstname, lastname, email, status, created_at')
          .order('created_at', { ascending: false })
      ]);

      console.log('Organization users:', orgUsersResult.data);
      console.log('Members:', membersResult.data);

      if (orgUsersResult.error) throw orgUsersResult.error;
      if (membersResult.error) throw membersResult.error;

      // Create a map of user_id to member data
      const membersMap = new Map();
      membersResult.data.forEach(member => {
        membersMap.set(member.id, member);
      });

      // Create a map of user_id to organization user data
      const orgUsersMap = new Map();
      orgUsersResult.data.forEach(orgUser => {
        orgUsersMap.set(orgUser.user_id, orgUser);
      });

      console.log('Members map:', membersMap);
      console.log('Org users map:', orgUsersMap);

      // Only show users who have organization membership (accounts)
      const transformedUsers = [];
      
      orgUsersResult.data.forEach(orgUser => {
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
      // Generate a temporary password
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).toUpperCase().slice(-4) + '1!';

      // Create the user account
      const { data, error } = await supabase.auth.admin.createUser({
        email: inviteData.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          first_name: inviteData.firstName,
          last_name: inviteData.lastName,
        }
      });

      if (error) throw error;

      // Create member record
      if (data.user) {
        const { error: memberError } = await supabase
          .from('members')
          .insert({
            id: data.user.id,
            firstname: inviteData.firstName,
            lastname: inviteData.lastName,
            email: inviteData.email,
            status: 'active'
          });

        if (memberError) {
          console.error('Error creating member record:', memberError);
        }

        // Create organization membership with the selected role
        const { error: orgError } = await supabase
          .from('organization_users')
          .insert({
            user_id: data.user.id,
            role: inviteData.role,
            status: 'active',
            approval_status: 'approved' // Auto-approve invited users
          });

        if (orgError) {
          console.error('Error creating organization membership:', orgError);
        }
      }

      toast({
        title: "User invited successfully",
        description: `Account created for ${inviteData.email} with role: ${inviteData.role}. Temporary password: ${tempPassword}`,
      });

      setIsInviteDialogOpen(false);
      setInviteData({ email: '', firstName: '', lastName: '', role: 'member' });
      fetchUsers();
    } catch (error) {
      toast({
        title: "Error inviting user",
        description: error.message,
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
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "User deleted",
        description: "User has been removed from the system.",
      });

      fetchUsers();
    } catch (error) {
      toast({
        title: "Error deleting user",
        description: error.message,
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
              <Button onClick={() => setIsInviteDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite User
              </Button>
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
    </motion.div>
  );
};

export default UserManagementSettings; 
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Building2,
  Users,
  UserCheck,
  Database,
  Settings,
  Shield,
  Eye,
  LogIn,
  LogOut,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  Crown,
  Church
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { getOrganizations, getAllUsers, getSystemStats, deleteOrganization } from '@/lib/adminService';
import { isSystemAdmin } from '@/lib/data';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/authContext';
import { useNavigate } from 'react-router-dom';

export function AdminCenter() {
  const [activeTab, setActiveTab] = useState('organizations');
  const [organizations, setOrganizations] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState(null);
  const [adminStatus, setAdminStatus] = useState(null);
  
  // Dialog states
  const [isOrgDialogOpen, setIsOrgDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isImpersonateDialogOpen, setIsImpersonateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewOrgDialogOpen, setIsViewOrgDialogOpen] = useState(false);
  
  // Selected items
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [orgToDelete, setOrgToDelete] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [viewingOrg, setViewingOrg] = useState(null);
  const [orgDetails, setOrgDetails] = useState(null);
  
  // Search and filters
  const [orgSearch, setOrgSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  
  // Form states
  const [orgForm, setOrgForm] = useState({
    name: '',
    contact_email: '',
    contact_phone: '',
    address: ''
  });
  
  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    firstname: '',
    lastname: '',
    role: 'member',
    organization_id: '',
    status: 'active'
  });

  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    checkAdminStatusAndLoadData();
  }, []);

  const checkAdminStatusAndLoadData = async () => {
    console.log('🔐 Checking admin status...');
    try {
      // Check if user is system admin
      const isAdmin = await isSystemAdmin();
      console.log('🔐 System admin check result:', isAdmin);
      
      // Get current user info for debug
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Current user:', user?.email);
      
      // Get user's organization memberships for debug
      const { data: orgMemberships } = await supabase
        .from('organization_users')
        .select(`
          role,
          approval_status,
          organizations(name)
        `)
        .eq('user_id', user?.id);
      
      console.log('📝 Organization memberships:', orgMemberships);
      
      const debug = {
        isSystemAdmin: isAdmin,
        currentUser: user?.email,
        organizationMemberships: orgMemberships || []
      };
      
      setDebugInfo(debug);
      setAdminStatus(isAdmin);
      
      if (isAdmin) {
        console.log('✅ User is admin, loading data...');
        loadData();
      } else {
        console.warn('⚠️ User is not a system admin, skipping data load');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('❌ Error checking admin status:', error);
      setDebugInfo({
        error: error.message,
        isSystemAdmin: false
      });
      setIsLoading(false);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      console.log('🚀 Admin Center: Loading data...');
      
      // Test each function individually
      console.log('📋 Loading organizations...');
      const orgsData = await getOrganizations();
      console.log('📋 Organizations result:', orgsData);
      
      console.log('👥 Loading users...');
      const usersData = await getAllUsers();
      console.log('👥 Users result:', usersData);
      
      console.log('📊 Loading stats...');
      const statsData = await getSystemStats();
      console.log('📊 Stats result:', statsData);
      
      console.log('📊 Admin Center: Data loaded!', {
        organizations: orgsData?.length || 0,
        users: usersData?.length || 0,
        stats: statsData
      });
      
      setOrganizations(orgsData || []);
      setUsers(usersData || []);
      setStats(statsData);
    } catch (error) {
      console.error('💥 Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive"
      });
      // Set empty arrays to prevent crashes
      setOrganizations([]);
      setUsers([]);
      setStats({
        organizations: { total: 0, recent: 0 },
        users: { total: 0, recent: 0 },
        members: { total: 0 },
        donations: { total: 0, totalAmount: 0 }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOrganization = async () => {
    if (!orgToDelete) return;
    
    console.log('Attempting to delete organization:', orgToDelete);
    
    try {
      await deleteOrganization(orgToDelete.id);
      
      // Remove from local state
      setOrganizations(organizations.filter(org => org.id !== orgToDelete.id));
      
      // Close dialog and clear selection
      setIsDeleteDialogOpen(false);
      setOrgToDelete(null);
      setDeleteConfirmText('');
      
      toast({
        title: "Success",
        description: `Organization "${orgToDelete.name}" has been deleted successfully`,
      });
    } catch (error) {
      console.error('Error deleting organization:', error);
      toast({
        title: "Error",
        description: "Failed to delete organization. Please try again.",
        variant: "destructive"
      });
    }
  };

  const confirmDeleteOrganization = (org) => {
    console.log('Confirming delete for organization:', org);
    setOrgToDelete(org);
    setDeleteConfirmText('');
    setIsDeleteDialogOpen(true);
  };

  const handleViewOrganization = async (org) => {
    console.log('Viewing organization:', org);
    setViewingOrg(org);
    setIsViewOrgDialogOpen(true);
    
    try {
      // Fetch organization details
      const { data: details, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', org.id)
        .single();

      if (error) {
        console.error('Error fetching organization details:', error);
        toast({
          title: "Error",
          description: "Failed to load organization details",
          variant: "destructive"
        });
        return;
      }

      // Fetch organization users separately
      const { data: orgUsers, error: orgUsersError } = await supabase
        .from('organization_users')
        .select('user_id, role, approval_status, created_at')
        .eq('organization_id', org.id)
        .order('created_at', { ascending: false });

      if (orgUsersError) {
        console.error('Error fetching organization users:', orgUsersError);
        toast({
          title: "Error",
          description: "Failed to load organization users",
          variant: "destructive"
        });
        return;
      }

      // Fetch member details for each user
      const usersWithDetails = await Promise.all(
        (orgUsers || []).map(async (orgUser) => {
          const { data: memberData } = await supabase
            .from('members')
            .select('firstname, lastname, email')
            .eq('user_id', orgUser.user_id)
            .single();

          return {
            ...orgUser,
            members: memberData || { 
              firstname: 'Unknown', 
              lastname: 'User', 
              email: 'No email' 
            }
          };
        })
      );

      // Combine the data
      const combinedDetails = {
        ...details,
        organization_users: usersWithDetails
      };

      setOrgDetails(combinedDetails);
      console.log('Organization details loaded:', combinedDetails);
    } catch (error) {
      console.error('Error loading organization details:', error);
      toast({
        title: "Error",
        description: "Failed to load organization details",
        variant: "destructive"
      });
    }
  };



  const handleLoginAsOrganization = async (org) => {
    console.log('Attempting to login as organization:', org);
    
    try {
      // Store current session info for later restoration
      localStorage.setItem('system_admin_session', JSON.stringify({
        user_id: user.id,
        email: user.email,
        return_url: '/admin-center',
        timestamp: new Date().toISOString()
      }));

      // Mark that we're impersonating an organization (not a specific user)
      localStorage.setItem('impersonating_organization', JSON.stringify({
        organization_id: org.id,
        organization_name: org.name,
        admin_name: 'System Admin',
        admin_email: user.email
      }));

      toast({
        title: "Switching to Organization",
        description: `Logging in as system admin for ${org.name}`,
      });
      
      // Navigate to dashboard with impersonation flag
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Error during login as:', error);
      toast({
        title: "Error",
        description: "Failed to login as organization admin",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Admin Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">System Administration</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">Platform Management Console</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm font-medium text-slate-900 dark:text-white">{user?.email}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">System Administrator</div>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
       

      {/* Access Denied Message */}
      {adminStatus === false && (
        <div className="mb-8 p-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">Access Denied</h2>
          <p className="text-red-600 dark:text-red-300">
            You need to be a system administrator to access the admin center.
          </p>
        </div>
      )}

      {/* Header */}
      <motion.div className="mb-8 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-indigo-600/5 blur-3xl rounded-3xl"></div>
        <div className="relative backdrop-blur-sm bg-white/90 dark:bg-slate-900/95 border border-white/30 dark:border-slate-700/50 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 bg-clip-text text-transparent">
                  Admin Center
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-lg">
                  Super Admin Dashboard - Manage Organizations & Users
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full animate-pulse ${adminStatus ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-slate-600 dark:text-slate-300">
                {adminStatus ? 'Admin Access' : 'Access Denied'}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards - Only show if user has admin access */}
      {adminStatus && (
        <motion.div className="grid gap-6 grid-cols-1 md:grid-cols-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{stats?.organizations?.total || 0}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Organizations</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats?.members?.total || 0}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Total Members</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{stats?.users?.total || 0}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Total Admins</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center">
                  <Shield className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-600">{organizations.filter(org => org.status === 'active').length}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Active Orgs</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main Tabs - Only show if user has admin access */}
      {adminStatus && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="organizations" className="flex items-center space-x-2">
            <Church className="h-4 w-4" />
            <span>Organizations</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Users</span>
          </TabsTrigger>
          <TabsTrigger value="demo" className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>Demo System</span>
          </TabsTrigger>
        </TabsList>

        {/* Organizations Tab */}
        <TabsContent value="organizations" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Organizations</h2>
              <p className="text-slate-600 dark:text-slate-400">Manage church organizations</p>
            </div>
            <Button onClick={() => setIsOrgDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Organization
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search organizations..."
                  value={orgSearch}
                  onChange={(e) => setOrgSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {organizations.map((org) => (
                <Card key={org.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{org.name}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {org.address ? (
                            typeof org.address === 'string' ? org.address : 
                            `${org.address.street}, ${org.address.city}, ${org.address.state} ${org.address.zip}`
                          ) : 'No address'}
                        </p>
                      </div>
                      <Badge variant={org.status === 'active' ? 'default' : 'secondary'}>
                        {org.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Members</span>
                        <span className="font-medium">{org.member_count || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Admins</span>
                        <span className="font-medium">{org.admin_count || 0}</span>
                      </div>

                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleViewOrganization(org)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleLoginAsOrganization(org)}
                      >
                        <LogIn className="h-4 w-4 mr-1" />
                        Login As
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => confirmDeleteOrganization(org)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Users</h2>
              <p className="text-slate-600 dark:text-slate-400">Manage users across all organizations</p>
            </div>
            <Button onClick={() => setIsUserDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-slate-50 dark:bg-slate-900">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">User</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Organization</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Role</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Last Login</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-medium">{user.firstname} {user.lastname}</div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">{user.email}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">{user.organization_name}</td>
                          <td className="px-4 py-3">
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                              {user.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm">{user.last_login}</td>
                          <td className="px-4 py-3">
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <LogIn className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Demo System Tab */}
        <TabsContent value="demo" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Demo System</h2>
              <p className="text-slate-600 dark:text-slate-400">Manage automated demo data generation for all organizations</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>System-Wide Demo Controls</span>
              </CardTitle>
              <CardDescription>
                Generate and manage demo data across all organizations in the system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Demo Data Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{stats?.organizations?.total || 0}</div>
                        <div className="text-sm text-blue-800 dark:text-blue-200">Organizations</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{stats?.members?.total || 0}</div>
                        <div className="text-sm text-green-800 dark:text-green-200">Total Members</div>
                      </div>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Demo data generation creates realistic church management scenarios with:
                      <ul className="mt-2 space-y-1 list-disc list-inside">
                        <li>100 members per organization</li>
                        <li>6 months of historical events</li>
                        <li>Realistic attendance patterns</li>
                        <li>Weekly donation records</li>
                        <li>Member profile images</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Demo Instructions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start space-x-2">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">1</div>
                        <div>
                          <strong>Deploy Edge Functions:</strong><br />
                          Run <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">npx supabase functions deploy</code>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">2</div>
                        <div>
                          <strong>Login as Organization:</strong><br />
                          Use "Login as Org" button in Organizations tab
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">3</div>
                        <div>
                          <strong>Access Demo System:</strong><br />
                          Go to Settings → Demo System in the organization
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">4</div>
                        <div>
                          <strong>Generate Data:</strong><br />
                          Click "Generate Initial Demo Data"
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Edge Functions Status</CardTitle>
                  <CardDescription>
                    Required Supabase Edge Functions for demo data generation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <div className="font-medium">generate-demo-data</div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            Creates initial demo data (100 members, events, attendance, donations)
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary">Function</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <div className="font-medium">weekly-demo-maintenance</div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            Automated weekly data refresh (new events, attendance, visitors)
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary">Function</Badge>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-800 dark:text-blue-200">Deployment Command</p>
                        <div className="text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded mt-1 font-mono text-xs">
                          <div>npx supabase functions deploy generate-demo-data</div>
                          <div>npx supabase functions deploy weekly-demo-maintenance</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Demo Data Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <h4 className="font-medium">Member Generation</h4>
                      <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
                        <li>• Realistic names and demographics</li>
                        <li>• Profile images from various services</li>
                        <li>• Varied attendance patterns</li>
                        <li>• Contact information</li>
                        <li>• Gender and member type data</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium">Event & Attendance</h4>
                      <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
                        <li>• Weekly Sunday services</li>
                        <li>• Wednesday Bible studies</li>
                        <li>• Monthly fellowship events</li>
                        <li>• Seasonal attendance variations</li>
                        <li>• Realistic check-in patterns</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium">Financial Data</h4>
                      <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
                        <li>• Weekly donation records</li>
                        <li>• Varied giving amounts</li>
                        <li>• Different payment methods</li>
                        <li>• Donor behavior patterns</li>
                        <li>• 26 weeks of history</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium">Automation</h4>
                      <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
                        <li>• Weekly data maintenance</li>
                        <li>• New visitor additions</li>
                        <li>• Upcoming event generation</li>
                        <li>• Data cleanup (&gt;1 year old)</li>
                        <li>• Self-maintaining system</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      )}

      {/* Add Organization Dialog */}
      <Dialog open={isOrgDialogOpen} onOpenChange={setIsOrgDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedOrg ? 'Edit Organization' : 'Add New Organization'}
            </DialogTitle>
            <DialogDescription>
              {selectedOrg ? 'Update organization details' : 'Create a new church organization'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name *</Label>
                <Input
                  id="org-name"
                  value={orgForm.name}
                  onChange={(e) => setOrgForm({...orgForm, name: e.target.value})}
                  placeholder="First Baptist Church"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Contact Email *</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={orgForm.contact_email}
                    onChange={(e) => setOrgForm({...orgForm, contact_email: e.target.value})}
                    placeholder="admin@church.org"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-phone">Contact Phone</Label>
                  <Input
                    id="contact-phone"
                    value={orgForm.contact_phone}
                    onChange={(e) => setOrgForm({...orgForm, contact_phone: e.target.value})}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={orgForm.address}
                  onChange={(e) => setOrgForm({...orgForm, address: e.target.value})}
                  placeholder="123 Church St, Springfield, IL 62701"
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOrgDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {selectedOrg ? 'Update Organization' : 'Create Organization'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Organization Dialog */}
      <Dialog open={isViewOrgDialogOpen} onOpenChange={setIsViewOrgDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-blue-500" />
              <span>Organization Details: {viewingOrg?.name}</span>
            </DialogTitle>
            <DialogDescription>
              Complete information about this organization and its users
            </DialogDescription>
          </DialogHeader>
          
          {viewingOrg && (
            <div className="space-y-6 py-4">
              {/* Organization Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">Organization Name</Label>
                    <div className="text-lg font-semibold">{viewingOrg.name}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">Status</Label>
                    <div>
                      <Badge variant={viewingOrg.is_active ? 'default' : 'secondary'}>
                        {viewingOrg.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">Contact Email</Label>
                    <div className="text-sm">{viewingOrg.contact_email}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">Contact Phone</Label>
                    <div className="text-sm">{viewingOrg.contact_phone || 'Not provided'}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">Address</Label>
                    <div className="text-sm">
                      {viewingOrg.address ? (
                        <>
                          {typeof viewingOrg.address === 'string' ? (
                            <>
                              {viewingOrg.address}<br />
                              {viewingOrg.city && `${viewingOrg.city}, `}
                              {viewingOrg.state} {viewingOrg.zip}
                            </>
                          ) : (
                            <>
                              {viewingOrg.address.street}<br />
                              {viewingOrg.address.city && `${viewingOrg.address.city}, `}
                              {viewingOrg.address.state} {viewingOrg.address.zip}
                            </>
                          )}
                        </>
                      ) : (
                        'Not provided'
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">Created</Label>
                    <div className="text-sm">
                      {viewingOrg.created_at ? new Date(viewingOrg.created_at).toLocaleDateString() : 'Unknown'}
                    </div>
                  </div>
                </div>
              </div>
              

              
                             {/* Organization Users */}
               <div>
                 <Label className="text-lg font-semibold mb-4 block">Organization Users</Label>
                 {orgDetails && orgDetails.organization_users ? (
                   <div className="border rounded-lg overflow-hidden">
                     <table className="w-full">
                       <thead className="bg-slate-50 dark:bg-slate-900">
                         <tr>
                           <th className="px-4 py-2 text-left text-sm font-medium">User</th>
                           <th className="px-4 py-2 text-left text-sm font-medium">Role</th>
                           <th className="px-4 py-2 text-left text-sm font-medium">Status</th>
                           <th className="px-4 py-2 text-left text-sm font-medium">Joined</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                         {orgDetails.organization_users.map((orgUser, index) => (
                           <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                             <td className="px-4 py-2">
                               <div>
                                 <div className="font-medium text-sm">
                                   {orgUser.members.firstname} {orgUser.members.lastname}
                                 </div>
                                 <div className="text-xs text-slate-500">{orgUser.members.email}</div>
                               </div>
                             </td>
                             <td className="px-4 py-2">
                               <Badge variant={orgUser.role === 'admin' ? 'default' : 'secondary'}>
                                 {orgUser.role || 'member'}
                               </Badge>
                             </td>
                             <td className="px-4 py-2">
                               <Badge variant={orgUser.approval_status === 'approved' ? 'default' : 'secondary'}>
                                 {orgUser.approval_status || 'pending'}
                               </Badge>
                             </td>
                             <td className="px-4 py-2 text-sm">
                               {orgUser.created_at ? 
                                 new Date(orgUser.created_at).toLocaleDateString() : 
                                 'Unknown'
                               }
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                 ) : (
                   <div className="text-center py-8 text-slate-500">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                     Loading organization users...
                   </div>
                 )}
               </div>
              
              {/* Quick Stats */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {orgDetails?.organization_users?.length || 0}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">Total Users</div>
                </div>
                <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {orgDetails?.organization_users?.filter(u => u.role === 'admin').length || 0}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">Administrators</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600">
                    {orgDetails?.organization_users?.filter(u => u.approval_status === 'pending').length || 0}
                  </div>
                  <div className="text-sm text-purple-700 dark:text-purple-300">Pending Users</div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsViewOrgDialogOpen(false);
                setViewingOrg(null);
                setOrgDetails(null);
              }}
            >
              Close
            </Button>
            {viewingOrg && (
              <Button 
                onClick={() => {
                  setIsViewOrgDialogOpen(false);
                  handleLoginAsOrganization(viewingOrg);
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Login as Admin
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedUser ? 'Edit User' : 'Add New User'}
            </DialogTitle>
            <DialogDescription>
              {selectedUser ? 'Update user details' : 'Create a new user account'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="user-organization">Organization *</Label>
                <Select value={userForm.organization_id} onValueChange={(value) => setUserForm({...userForm, organization_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id.toString()}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user-firstname">First Name *</Label>
                  <Input
                    id="user-firstname"
                    value={userForm.firstname}
                    onChange={(e) => setUserForm({...userForm, firstname: e.target.value})}
                    placeholder="John"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-lastname">Last Name *</Label>
                  <Input
                    id="user-lastname"
                    value={userForm.lastname}
                    onChange={(e) => setUserForm({...userForm, lastname: e.target.value})}
                    placeholder="Smith"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="user-email">Email Address *</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                  placeholder="john@church.org"
                  required
                />
              </div>
              
              {!selectedUser && (
                <div className="space-y-2">
                  <Label htmlFor="user-password">Password *</Label>
                  <Input
                    id="user-password"
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                    placeholder="Temporary password"
                    required
                  />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user-role">Role</Label>
                  <Select value={userForm.role} onValueChange={(value) => setUserForm({...userForm, role: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="pastor">Pastor</SelectItem>
                      <SelectItem value="deacon">Deacon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-status">Status</Label>
                  <Select value={userForm.status} onValueChange={(value) => setUserForm({...userForm, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsUserDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {selectedUser ? 'Update User' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Impersonation Dialog */}
      <Dialog open={isImpersonateDialogOpen} onOpenChange={setIsImpersonateDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-amber-500" />
              <span>Impersonate User</span>
            </DialogTitle>
            <DialogDescription>
              You are about to login as another user. This action will be logged for security purposes.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-200">Security Notice</p>
                  <p className="text-amber-700 dark:text-amber-300">
                    Your admin session will be temporarily stored. You can return to this admin panel by logging out of the impersonated account.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsImpersonateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              className="bg-amber-600 hover:bg-amber-700"
              onClick={() => {
                // TODO: Implement impersonation
                toast({
                  title: "Impersonation Started",
                  description: "You are now logged in as the selected user",
                });
                setIsImpersonateDialogOpen(false);
              }}
            >
              <LogIn className="h-4 w-4 mr-2" />
              Start Impersonation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Organization Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Delete Organization</span>
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the organization and all associated data.
            </DialogDescription>
          </DialogHeader>
          
          {orgToDelete && (
            <div className="py-4">
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-red-800 dark:text-red-200 mb-2">
                      You are about to delete:
                    </p>
                    <div className="space-y-1">
                      <p className="text-red-700 dark:text-red-300">
                        <strong>Organization:</strong> {orgToDelete.name}
                      </p>
                      <p className="text-red-700 dark:text-red-300">
                        <strong>Members:</strong> {orgToDelete.member_count || 0}
                      </p>
                      <p className="text-red-700 dark:text-red-300">
                        <strong>Email:</strong> {orgToDelete.email || 'No email'}
                      </p>
                    </div>
                    <p className="text-red-700 dark:text-red-300 mt-3 font-medium">
                      All members, donations, events, and other data will be permanently deleted.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Type <strong>DELETE</strong> to confirm:
                </p>
                <Input
                  placeholder="Type DELETE to confirm"
                  className="mt-2"
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setOrgToDelete(null);
                setDeleteConfirmText('');
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteOrganization}
              disabled={deleteConfirmText !== 'DELETE'}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Organization
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
} 
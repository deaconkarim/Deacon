import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Plus, 
  Filter, 
  Users, 
  Clock, 
  MapPin, 
  User, 
  Edit, 
  Trash2,
  UserPlus,
  UserMinus,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { getMembers, getGroups, getCurrentUserOrganizationId } from '@/lib/data';
import { getInitials } from '@/lib/utils/formatters';

export function Groups() {
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isViewGroupOpen, setIsViewGroupOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    leader_id: '',
    members: []
  });
  const [members, setMembers] = useState([]);
  const { toast } = useToast();
  const [isEditGroupOpen, setIsEditGroupOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);

  useEffect(() => {
    fetchGroups();
    fetchMembers();
  }, []);

  const fetchGroups = async () => {
    try {
      // Get groups with proper organization filtering
      const groupsData = await getGroups();
      
      // Get the current user's organization ID using the helper function
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) throw new Error('User not associated with any organization');

      // Fetch additional data for each group with organization filtering
      const enrichedGroups = await Promise.all(
        groupsData.map(async (group) => {
          // Get group members count
          const { count: memberCount } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id)
            .eq('organization_id', organizationId);

          // Get leader info only if leader_id exists
          let leader = null;
          if (group.leader_id) {
            const { data: leaderData } = await supabase
              .from('members')
              .select('firstname, lastname')
              .eq('id', group.leader_id)
              .eq('organization_id', organizationId)
              .single();
            leader = leaderData;
          }

          return {
            ...group,
            group_members: [{ count: memberCount || 0 }],
            leader: leader ? {
              ...leader,
              firstName: leader.firstname,
              lastName: leader.lastname
            } : null
          };
        })
      );

      setGroups(enrichedGroups || []);
      setFilteredGroups(enrichedGroups || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast({ title: 'Error', description: 'Failed to fetch groups', variant: 'destructive' });
    }
  };

  const fetchMembers = async () => {
    try {
      const data = await getMembers();
      setMembers(data || []);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch members', variant: 'destructive' });
    }
  };

  useEffect(() => {
    let filtered = [...groups];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(group => 
        group.name.toLowerCase().includes(query) || 
        (group.description && group.description.toLowerCase().includes(query))
      );
    }
    filtered.sort((a, b) => a.name.localeCompare(b.name));
    setFilteredGroups(filtered);
  }, [groups, searchQuery]);

  const handleAddGroup = async () => {
    if (!newGroup.name || !newGroup.leader_id) {
      toast({ title: 'Missing Information', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }
    try {
      // Get the current user's organization ID
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) throw new Error('User not associated with any organization');

      // Create the group with organization_id
      const { data, error } = await supabase
        .from('groups')
        .insert([{
          name: newGroup.name,
          description: newGroup.description,
          leader_id: newGroup.leader_id,
          organization_id: organizationId
        }])
        .select();
      
      if (error) throw error;

      // If there are members to add, add them to the group_members table
      if (newGroup.members && newGroup.members.length > 0) {
        const memberInserts = newGroup.members.map(memberId => ({
          group_id: data[0].id,
          member_id: memberId,
          organization_id: organizationId
        }));

        const { error: memberError } = await supabase
          .from('group_members')
          .insert(memberInserts);

        if (memberError) throw memberError;
      }

      setGroups(prev => [data[0], ...prev]);
      setIsAddGroupOpen(false);
      setNewGroup({
        name: '',
        description: '',
        leader_id: '',
        members: []
      });
      toast({ title: 'Group Added', description: `"${data[0].name}" has been added successfully.` });
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;
    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupToDelete.id);
      if (error) throw error;
      setGroups(prev => prev.filter(group => group.id !== groupToDelete.id));
      setGroupToDelete(null);
      setIsDeleteDialogOpen(false);
      toast({ title: 'Group Deleted', description: `"${groupToDelete.name}" has been removed.` });
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleViewGroup = async (group) => {
    try {
      // Fetch the complete group data including members
      const { data: completeGroup, error } = await supabase
        .from('groups')
        .select(`
          *,
          group_members(
            member_id,
            members(
              id,
              firstname,
              lastname,
              image_url
            )
          ),
          leader:members!leader_id(
            id,
            firstname,
            lastname,
            image_url
          )
        `)
        .eq('id', group.id)
        .single();

      if (error) throw error;

      // Transform the members data for display
      const transformedGroup = {
        ...completeGroup,
        leader: completeGroup.leader ? {
          ...completeGroup.leader,
          firstName: completeGroup.leader.firstname,
          lastName: completeGroup.leader.lastname,
          image_url: completeGroup.leader.image_url
        } : null,
        members: completeGroup.group_members.map(gm => ({
          id: gm.members.id,
          firstName: gm.members.firstname,
          lastName: gm.members.lastname,
          image_url: gm.members.image_url
        }))
      };

      setSelectedGroup(transformedGroup);
      setIsViewGroupOpen(true);
    } catch (error) {
      console.error('Error fetching group details:', error);
      toast({
        title: "Error",
        description: "Failed to load group details.",
        variant: "destructive"
      });
    }
  };

  const handleAddMemberToGroup = async (memberId) => {
    if (!selectedGroup) return;
    try {
      // First check if the member is already in the group
      const { data: existingMembers, error: checkError } = await supabase
        .from('group_members')
        .select('member_id')
        .eq('group_id', selectedGroup.id)
        .eq('member_id', memberId);

      if (checkError) throw checkError;

      if (existingMembers && existingMembers.length > 0) {
        toast({
          title: "Already Added",
          description: "This member is already in the group.",
          variant: "destructive"
        });
        return;
      }

      // Get the current user's organization ID
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) throw new Error('User not associated with any organization');

      const { error } = await supabase
        .from('group_members')
        .insert([{
          group_id: selectedGroup.id,
          member_id: memberId,
          organization_id: organizationId
        }]);

      if (error) throw error;

      // Refresh the group data
      const { data: updatedGroup, error: fetchError } = await supabase
        .from('groups')
        .select(`
          *,
          group_members(
            member_id,
            members(
              id,
              firstname,
              lastname
            )
          )
        `)
        .eq('id', selectedGroup.id)
        .single();

      if (fetchError) throw fetchError;

      // Transform the members data for display
      const transformedGroup = {
        ...updatedGroup,
        members: updatedGroup.group_members.map(gm => ({
          id: gm.member_id,
          firstName: gm.members.firstname,
          lastName: gm.members.lastname,
          fullName: `${gm.members.firstname} ${gm.members.lastname}`
        }))
      };

      setSelectedGroup(transformedGroup);
      setIsAddMemberOpen(false);
      toast({
        title: "Success",
        description: "Person added to group successfully."
      });
    } catch (error) {
      console.error('Error adding person to group:', error);
      toast({
        title: "Error",
        description: "Failed to add person to group.",
        variant: "destructive"
      });
    }
  };

  const handleRemoveMemberFromGroup = async (memberId) => {
    if (!selectedGroup) return;
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', selectedGroup.id)
        .eq('member_id', memberId);

      if (error) throw error;

      // Refresh the group data
      const { data: updatedGroup, error: fetchError } = await supabase
        .from('groups')
        .select(`
          *,
          group_members(
            member_id,
            members(
              id,
              firstname,
              lastname
            )
          )
        `)
        .eq('id', selectedGroup.id)
        .single();

      if (fetchError) throw fetchError;

      // Transform the members data for display
      const transformedGroup = {
        ...updatedGroup,
        members: updatedGroup.group_members.map(gm => ({
          id: gm.member_id,
          firstName: gm.members.firstname,
          lastName: gm.members.lastname,
          fullName: `${gm.members.firstname} ${gm.members.lastname}`
        }))
      };

      setSelectedGroup(transformedGroup);
      toast({
        title: "Success",
        description: "Member removed from group successfully."
      });
    } catch (error) {
      console.error('Error removing member from group:', error);
      toast({
        title: "Error",
        description: "Failed to remove member from group.",
        variant: "destructive"
      });
    }
  };

  const handleEditGroup = async () => {
    if (!editingGroup || !editingGroup.name || !editingGroup.leader_id) {
      toast({ title: 'Missing Information', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }
    try {
      const { data, error } = await supabase
        .from('groups')
        .update({
          name: editingGroup.name,
          description: editingGroup.description,
          leader_id: editingGroup.leader_id
        })
        .eq('id', editingGroup.id)
        .select();
      if (error) throw error;
      
      setGroups(prev => prev.map(group => 
        group.id === editingGroup.id ? data[0] : group
      ));
      setFilteredGroups(prev => prev.map(group => 
        group.id === editingGroup.id ? data[0] : group
      ));
      setIsEditGroupOpen(false);
      setEditingGroup(null);
      toast({ title: 'Group Updated', description: `"${data[0].name}" has been updated successfully.` });
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };
  
  return (
    <motion.div 
      className="min-h-screen bg-white dark:bg-slate-900"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Mobile Header - Hidden on Desktop */}
      <div className="lg:hidden sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between p-4">
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Groups</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Manage your church groups</p>
          </div>
          <Button onClick={() => setIsAddGroupOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Group
          </Button>
        </div>
      </div>

      {/* Desktop Header - Hidden on Mobile */}
      <div className="hidden lg:block bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Groups</h1>
              <p className="text-slate-600 dark:text-slate-400">
                Manage your church groups, ministries, and committees.
              </p>
            </div>
            <Button onClick={() => setIsAddGroupOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Group
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Content */}
      <div className="lg:hidden p-4 space-y-4">
        {/* Search and Filters */}
        <motion.div variants={itemVariants}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search groups..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </motion.div>
      </div>

      {/* Desktop Content */}
      <div className="hidden lg:block max-w-7xl mx-auto px-6 py-6">
        {/* Search and Filters */}
        <motion.div variants={itemVariants} className="mb-6">
          <div className="flex items-center justify-between">
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search groups..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </motion.div>
      
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={() => setIsAddGroupOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Group
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="grid" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="grid">
          {filteredGroups.length > 0 ? (
            <motion.div 
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredGroups.map((group) => (
                <motion.div key={group.id} variants={itemVariants}>
                  <Card className="overflow-hidden h-full flex flex-col border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-800">
                    <div className="relative h-24 bg-gradient-to-r from-blue-500 to-indigo-600">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20"></div>
                      <div className="absolute top-3 right-3 flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                          onClick={() => {
                            setEditingGroup(group);
                            setIsEditGroupOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                          onClick={() => {
                            setGroupToDelete(group);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-6 flex-grow">
                      <div className="mb-4">
                        <CardTitle className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                          {group.name}
                        </CardTitle>
                        <CardDescription className="text-slate-600 dark:text-slate-400 line-clamp-2">
                          {group.description || 'No description provided'}
                        </CardDescription>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-900 dark:text-white">
                              Leader
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400 truncate">
                              {group.leader ? `${group.leader.firstName} ${group.leader.lastName}` : 'Not assigned'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                            <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-900 dark:text-white">
                              Members
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              {group.group_members?.[0]?.count || 0} people
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <div className="p-6 pt-0">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600"
                        onClick={() => handleViewGroup(group)}
                      >
                        <ChevronRight className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div variants={itemVariants} className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mb-6">
                <Users className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No groups found</h3>
              <p className="text-slate-600 dark:text-slate-400 max-w-md">
                {searchQuery 
                  ? "Try adjusting your search criteria to find what you're looking for."
                  : "Get started by creating your first church group, ministry, or committee."}
              </p>
              {!searchQuery && (
                <Button className="mt-6" onClick={() => setIsAddGroupOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Group
                </Button>
              )}
            </motion.div>
          )}
        </TabsContent>
        
        <TabsContent value="list">
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
              <CardContent className="p-0">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="h-12 px-6 text-left align-middle font-semibold text-slate-900 dark:text-white">Name</th>
                        <th className="h-12 px-6 text-left align-middle font-semibold text-slate-900 dark:text-white">Leader</th>
                        <th className="h-12 px-6 text-left align-middle font-semibold text-slate-900 dark:text-white">Members</th>
                        <th className="h-12 px-6 text-right align-middle font-semibold text-slate-900 dark:text-white">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {filteredGroups.length > 0 ? (
                        filteredGroups.map((group) => (
                          <tr 
                            key={group.id} 
                            className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          >
                            <td className="p-6 align-middle">
                              <div>
                                <div className="font-semibold text-slate-900 dark:text-white">{group.name}</div>
                                {group.description && (
                                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-1">
                                    {group.description}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-6 align-middle">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                  <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="text-slate-900 dark:text-white">
                                  {group.leader ? `${group.leader.firstName} ${group.leader.lastName}` : 'Not assigned'}
                                </span>
                              </div>
                            </td>
                            <td className="p-6 align-middle">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                  <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </div>
                                <span className="text-slate-900 dark:text-white font-medium">
                                  {group.group_members?.[0]?.count || 0}
                                </span>
                              </div>
                            </td>
                            <td className="p-6 align-middle text-right">
                              <div className="flex justify-end space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleViewGroup(group)}
                                  className="hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600"
                                >
                                  <ChevronRight className="h-4 w-4 mr-2" />
                                  View
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-700"
                                  onClick={() => {
                                    setEditingGroup(group);
                                    setIsEditGroupOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  onClick={() => {
                                    setGroupToDelete(group);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="p-12 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mb-4">
                                <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                              </div>
                              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No groups found</h3>
                              <p className="text-slate-600 dark:text-slate-400">
                                {searchQuery ? "Try adjusting your search criteria." : "Get started by creating your first group."}
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
      
      {/* Mobile Groups List */}
      <div className="lg:hidden space-y-4">
        {filteredGroups.length > 0 ? (
          <motion.div 
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filteredGroups.map((group) => (
              <motion.div key={group.id} variants={itemVariants}>
                <Card className="overflow-hidden border-0 shadow-lg bg-white dark:bg-slate-800">
                  <div className="relative h-20 bg-gradient-to-r from-blue-500 to-indigo-600">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20"></div>
                    <div className="absolute top-2 right-2 flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                        onClick={() => {
                          setEditingGroup(group);
                          setIsEditGroupOpen(true);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                        onClick={() => {
                          setGroupToDelete(group);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="mb-3">
                      <CardTitle className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                        {group.name}
                      </CardTitle>
                      <CardDescription className="text-slate-600 dark:text-slate-400 line-clamp-2">
                        {group.description || 'No description provided'}
                      </CardDescription>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center">
                          <User className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-slate-900 dark:text-white">Leader</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 truncate">
                            {group.leader ? `${group.leader.firstName} ${group.leader.lastName}` : 'Not assigned'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded flex items-center justify-center">
                          <Users className="h-3 w-3 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-slate-900 dark:text-white">Members</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">
                            {group.group_members?.[0]?.count || 0} people
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600"
                      onClick={() => handleViewGroup(group)}
                    >
                      <ChevronRight className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div variants={itemVariants} className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No groups found</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              {searchQuery 
                ? "Try adjusting your search criteria."
                : "Get started by creating your first church group."}
            </p>
            {!searchQuery && (
              <Button className="mt-4" onClick={() => setIsAddGroupOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Group
              </Button>
            )}
          </motion.div>
        )}
      </div>
      
      {/* Add Group Dialog */}
      <Dialog open={isAddGroupOpen} onOpenChange={setIsAddGroupOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Group</DialogTitle>
            <DialogDescription>
              Create a new group, ministry, or committee.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Group Name *</Label>
              <Input
                id="name"
                value={newGroup.name}
                onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={newGroup.description}
                onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leader">Group Leader *</Label>
              <Select 
                value={newGroup.leader_id} 
                onValueChange={(value) => setNewGroup({...newGroup, leader_id: value})}
              >
                <SelectTrigger id="leader">
                  <SelectValue placeholder="Select leader">
                    {newGroup.leader_id && (() => {
                      const leaderMember = members.find(m => m.id === newGroup.leader_id);
                      return leaderMember ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {leaderMember.firstname?.[0]}{leaderMember.lastname?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span>
                            {leaderMember.firstname} {leaderMember.lastname}
                          </span>
                        </div>
                      ) : null;
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {members.map(member => (
                    <SelectItem key={member.id} value={`${member.id}`}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {member.firstname?.[0]}{member.lastname?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span>{member.firstname} {member.lastname}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddGroupOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddGroup}>
              Add Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this group? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {groupToDelete && (
            <div className="py-4">
              <p className="font-medium">{groupToDelete.name}</p>
              <p className="text-sm text-muted-foreground">
                {groupToDelete.group_members.length} members
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteGroup}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View Group Dialog */}
      <Dialog open={isViewGroupOpen} onOpenChange={setIsViewGroupOpen}>
        <DialogContent className="sm:max-w-[600px]">
          {selectedGroup && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedGroup.name}</DialogTitle>
                <DialogDescription>
                  {selectedGroup.description}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Leader</h4>
                    {selectedGroup.leader ? (
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={selectedGroup.leader.image_url} />
                          <AvatarFallback>{getInitials(selectedGroup.leader.firstName, selectedGroup.leader.lastName)}</AvatarFallback>
                        </Avatar>
                        <span>{`${selectedGroup.leader.firstName} ${selectedGroup.leader.lastName}`}</span>
                      </div>
                    ) : (
                      <p>Not assigned</p>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Members ({selectedGroup.members.length})</h4>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsAddMemberOpen(true)}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add Person
                      </Button>
                    </div>
                    <div className="border rounded-md divide-y">
                      {selectedGroup.members.length > 0 ? (
                        selectedGroup.members.map((member) => (
                          <div key={member.id} className="flex items-center justify-between p-3">
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={member.image_url} />
                                <AvatarFallback>{getInitials(member.firstName, member.lastName)}</AvatarFallback>
                              </Avatar>
                              <span>{`${member.firstName} ${member.lastName}`}</span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleRemoveMemberFromGroup(member.id)}
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-muted-foreground">
                          No members in this group
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewGroupOpen(false)}>
                  Close
                </Button>
                <Button>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Group
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Person Dialog */}
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Person to Group</DialogTitle>
            <DialogDescription>
              Select a person to add to {selectedGroup?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              className="pl-8 mb-4"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {members
              .filter(member => !selectedGroup?.members.some(m => m.id === member.id))
              .filter(member => {
                const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
                return fullName.includes(searchQuery.toLowerCase());
              })
              .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`))
              .map((member) => (
                <div 
                  key={member.id} 
                  className="flex items-center space-x-2 p-2 hover:bg-muted rounded-lg cursor-pointer"
                  onClick={() => handleAddMemberToGroup(member.id)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.image_url} />
                    <AvatarFallback>{getInitials(member.firstName, member.lastName)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium">{`${member.firstName} ${member.lastName}`}</span>
                    {member.email && (
                      <span className="text-sm text-muted-foreground">{member.email}</span>
                    )}
                  </div>
                </div>
              ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={isEditGroupOpen} onOpenChange={setIsEditGroupOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>
              Update the group's information.
            </DialogDescription>
          </DialogHeader>
          {editingGroup && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Group Name *</Label>
                <Input
                  id="edit-name"
                  value={editingGroup.name}
                  onChange={(e) => setEditingGroup({...editingGroup, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={editingGroup.description || ''}
                  onChange={(e) => setEditingGroup({...editingGroup, description: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-leader">Group Leader *</Label>
                <Select 
                  value={editingGroup.leader_id} 
                  onValueChange={(value) => setEditingGroup({...editingGroup, leader_id: value})}
                >
                  <SelectTrigger id="edit-leader">
                    <SelectValue placeholder="Select leader">
                      {editingGroup.leader_id && (() => {
                        const leaderMember = members.find(m => m.id === editingGroup.leader_id);
                        return leaderMember ? (
                                                  <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {leaderMember.firstname?.[0]}{leaderMember.lastname?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span>
                            {leaderMember.firstname} {leaderMember.lastname}
                          </span>
                        </div>
                        ) : (
                          <span className="text-slate-500">Leader not found</span>
                        );
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {members.map(member => (
                      <SelectItem key={member.id} value={`${member.id}`}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {member.firstname?.[0]}{member.lastname?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span>{member.firstname} {member.lastname}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditGroupOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditGroup}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </motion.div>
  );
}

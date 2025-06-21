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
import { getMembers, getGroups } from '@/lib/data';
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
      
      // Get the current user's organization ID for additional queries
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: orgData } = await supabase
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (!orgData?.organization_id) throw new Error('User not associated with any organization');

      // Fetch additional data for each group with organization filtering
      const enrichedGroups = await Promise.all(
        groupsData.map(async (group) => {
          // Get group members count
          const { count: memberCount } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id)
            .eq('organization_id', orgData.organization_id);

          // Get leader info
          const { data: leader } = await supabase
            .from('members')
            .select('firstname, lastname')
            .eq('id', group.leader_id)
            .eq('organization_id', orgData.organization_id)
            .single();

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
      // Create the group without the members field
      const { data, error } = await supabase
        .from('groups')
        .insert([{
          name: newGroup.name,
          description: newGroup.description,
          leader_id: newGroup.leader_id
        }])
        .select();
      
      if (error) throw error;

      // If there are members to add, add them to the group_members table
      if (newGroup.members && newGroup.members.length > 0) {
        const memberInserts = newGroup.members.map(memberId => ({
          group_id: data[0].id,
          member_id: memberId
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

      const { error } = await supabase
        .from('group_members')
        .insert([{
          group_id: selectedGroup.id,
          member_id: memberId
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
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Groups</h1>
        <p className="text-muted-foreground">
          Manage your church groups, ministries, and committees.
        </p>
      </div>
      
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
                  <Card className="overflow-hidden h-full flex flex-col">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="mb-1">
                            <CardTitle className="text-xl">{group.name}</CardTitle>
                            <CardDescription className="line-clamp-2 mt-1">
                              {group.description}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
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
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setGroupToDelete(group);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3 flex-grow">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <User className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>Leader: {group.leader ? `${group.leader.firstName} ${group.leader.lastName}` : 'Not assigned'}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>{group.group_members?.[0]?.count || 0} members</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-gray-50 py-2 border-t mt-auto">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleViewGroup(group)}
                      >
                        View Details
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No groups found</h3>
              <p className="text-muted-foreground mt-1">
                {searchQuery 
                  ? "Try adjusting your search criteria."
                  : "Get started by adding your first church group."}
              </p>
              {!searchQuery && (
                <Button className="mt-4" onClick={() => setIsAddGroupOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Group
                </Button>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="list">
          <Card>
            <CardContent className="p-0">
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <th className="h-12 px-4 text-left align-middle font-medium">Name</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Leader</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Members</th>
                      <th className="h-12 px-4 text-right align-middle font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {filteredGroups.length > 0 ? (
                      filteredGroups.map((group) => (
                        <tr 
                          key={group.id} 
                          className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                        >
                          <td className="p-4 align-middle font-medium">{group.name}</td>
                          <td className="p-4 align-middle">{group.leader ? `${group.leader.firstName} ${group.leader.lastName}` : 'Not assigned'}</td>
                          <td className="p-4 align-middle">
                            <div className="flex -space-x-2">
                              {group.group_members?.[0]?.count > 0 && (
                                <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted text-xs font-medium">
                                  {group.group_members[0].count}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4 align-middle text-right">
                            <div className="flex justify-end space-x-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleViewGroup(group)}
                              >
                                View
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
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
                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
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
                        <td colSpan="5" className="p-4 text-center text-muted-foreground">
                          No groups found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
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
                    {newGroup.leader_id && members.find(m => m.id === newGroup.leader_id) && (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {members.find(m => m.id === newGroup.leader_id)?.firstName?.[0]}
                            {members.find(m => m.id === newGroup.leader_id)?.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          {members.find(m => m.id === newGroup.leader_id)?.firstName}{' '}
                          {members.find(m => m.id === newGroup.leader_id)?.lastName}
                        </span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {members.map(member => (
                    <SelectItem key={member.id} value={`${member.id}`}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {member.firstName?.[0]}{member.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span>{member.firstName} {member.lastName}</span>
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
                      {editingGroup.leader_id && members.find(m => m.id === editingGroup.leader_id) && (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {members.find(m => m.id === editingGroup.leader_id)?.firstName?.[0]}
                              {members.find(m => m.id === editingGroup.leader_id)?.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span>
                            {members.find(m => m.id === editingGroup.leader_id)?.firstName}{' '}
                            {members.find(m => m.id === editingGroup.leader_id)?.lastName}
                          </span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {members.map(member => (
                      <SelectItem key={member.id} value={`${member.id}`}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {member.firstName?.[0]}{member.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span>{member.firstName} {member.lastName}</span>
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
  );
}

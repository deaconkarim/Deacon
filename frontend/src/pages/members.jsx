import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  Search, 
  Plus, 
  Filter, 
  Mail, 
  Phone, 
  Calendar, 
  User, 
  Edit, 
  Trash2, 
  X,
  Check,
  Users,
  Grid,
  List,
  UserPlus,
  MapPin,
  ChevronDown,
  ChevronUp,
  Pencil,
  Clock,
  RefreshCw,
  Heart,
  Baby,
  Crown,
  ArrowRight,
  MoreVertical,
  Star,
  MessageSquare,
  Hash,
  UserMinus
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { PermissionGuard, PermissionButton } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/lib/permissions.jsx';
import { getMembers, addMember, deleteMember, getGroups, getCurrentUserOrganizationId } from '@/lib/data';
import { familyService } from '@/lib/familyService';
import { useToast } from '@/components/ui/use-toast';
import MemberForm from '@/components/members/MemberForm';
import { supabase } from '@/lib/supabaseClient';

export function People() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [members, setMembers] = useState([]);
  const [families, setFamilies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ageFilter, setAgeFilter] = useState('adults');
  const [sortField, setSortField] = useState('lastname');
  const [sortDirection, setSortDirection] = useState('asc');
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isFamilyDialogOpen, setIsFamilyDialogOpen] = useState(false);
  const [isFamilyDetailsDialogOpen, setIsFamilyDetailsDialogOpen] = useState(false);
  
  // Selected items
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [selectedFamilyForDetails, setSelectedFamilyForDetails] = useState(null);
  const [isEditFamilyDialogOpen, setIsEditFamilyDialogOpen] = useState(false);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [newFamily, setNewFamily] = useState({
    family_name: '',
    primary_contact_id: ''
  });
  
  // Groups state
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [isDeleteGroupDialogOpen, setIsDeleteGroupDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isViewGroupOpen, setIsViewGroupOpen] = useState(false);
  const [isAddMemberToGroupOpen, setIsAddMemberToGroupOpen] = useState(false);
  const [isEditGroupOpen, setIsEditGroupOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    leader_id: '',
    members: []
  });
  


  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3
      }
    }
  };

  useEffect(() => {
    loadMembers();
    loadFamilies();
    loadGroups();
  }, []);

  const loadMembers = async () => {
    try {
      setIsLoading(true);
      const data = await getMembers();
      setMembers(data);
    } catch (error) {
      console.error('Error loading members:', error);
      toast({
        title: "Error",
        description: "Failed to load members",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadFamilies = async () => {
    try {
      const data = await familyService.getFamilies();
      setFamilies(data);
    } catch (error) {
      console.error('Error loading families:', error);
      toast({
        title: "Error",
        description: "Failed to load families",
        variant: "destructive",
      });
    }
  };

  const loadGroups = async () => {
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

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;
    
    try {
      await deleteMember(selectedMember.id);
      await loadMembers();
      setIsDeleteDialogOpen(false);
      setSelectedMember(null);
      toast({
        title: "Success",
        description: "Member deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting member:', error);
      toast({
        title: "Error",
        description: "Failed to delete member",
        variant: "destructive",
      });
    }
  };

  const handleMemberClick = (memberId) => {
    navigate(`/members/${memberId}`);
  };

  // Group management functions
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

      await loadGroups();
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
      await loadGroups();
      setGroupToDelete(null);
      setIsDeleteGroupDialogOpen(false);
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
      await handleViewGroup({ id: selectedGroup.id });
      setIsAddMemberToGroupOpen(false);
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
      await handleViewGroup({ id: selectedGroup.id });
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
      
      await loadGroups();
      setIsEditGroupOpen(false);
      setEditingGroup(null);
      toast({ title: 'Group Updated', description: `"${data[0].name}" has been updated successfully.` });
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleAddMember = async (memberData) => {
    try {
      const addedMember = await addMember(memberData);
      setMembers(prev => [addedMember, ...prev]);
      
      setIsAddDialogOpen(false);
      toast({
        title: "Success",
        description: "Member added successfully"
      });
    } catch (error) {
      console.error('Error adding member:', error);
      toast({
        title: "Error",
        description: "Failed to add member",
        variant: "destructive",
      });
    }
  };

  const handleFamilyCardClick = (family) => {
    setSelectedFamilyForDetails(family);
    setIsFamilyDetailsDialogOpen(true);
  };

  const handleEditFamily = async (family) => {
    console.log('handleEditFamily called with family:', family);
    setMemberSearchQuery(''); // Clear search query when dialog opens
    try {
      // Get fresh family data to ensure we have the latest member information
      console.log('Getting fresh family data for ID:', family.id);
      const freshFamily = await familyService.getFamily(family.id);
      console.log('Fresh family data:', freshFamily);
      if (freshFamily) {
        setSelectedFamily(freshFamily);
      } else {
        setSelectedFamily(family);
      }
      
      // Get members that can be added to this family (unassigned + current family members)
      console.log('Getting available members for family ID:', family.id);
      const available = await familyService.getAvailableMembers(family.id);
      console.log('Available members:', available);
      setAvailableMembers(available);
      setIsEditFamilyDialogOpen(true);
    } catch (error) {
      console.error('Error loading family data:', error);
      setSelectedFamily(family); // Fallback to original family data
      toast({
        title: "Error",
        description: "Failed to load family data",
        variant: "destructive",
      });
    }
  };

  const handleAddMemberToFamily = async (memberId, relationshipType = 'other') => {
    try {
      await familyService.addMemberToFamily(selectedFamily.id, memberId, relationshipType);
      await loadFamilies(); // Reload to get updated family data
      await loadMembers(); // Reload members to update their family status
      
      // Update the selected family and available members in the dialog
      const updatedFamilies = await familyService.getFamilies();
      const updatedFamily = updatedFamilies.find(f => f.id === selectedFamily.id);
      setSelectedFamily(updatedFamily);
      
      const available = await familyService.getAvailableMembers(selectedFamily.id);
      setAvailableMembers(available);
      
      toast({
        title: "Success",
        description: "Member added to family"
      });
    } catch (error) {
      console.error('Error adding member to family:', error);
      toast({
        title: "Error",
        description: "Failed to add member to family",
        variant: "destructive",
      });
    }
  };

  const handleUpdateMemberRole = async (memberId, newRelationshipType) => {
    try {
      await familyService.updateFamilyRelationship(selectedFamily.id, memberId, {
        relationship_type: newRelationshipType
      });
      await loadFamilies(); // Reload to get updated family data
      
      // Update the selected family in the dialog
      const updatedFamilies = await familyService.getFamilies();
      const updatedFamily = updatedFamilies.find(f => f.id === selectedFamily.id);
      setSelectedFamily(updatedFamily);
      
      toast({
        title: "Success",
        description: "Member role updated"
      });
    } catch (error) {
      console.error('Error updating member role:', error);
      toast({
        title: "Error",
        description: "Failed to update member role",
        variant: "destructive",
      });
    }
  };

  const handleCreateFamily = async () => {
    console.log('handleCreateFamily called with:', newFamily);
    try {
      if (!newFamily.family_name.trim()) {
        console.log('Family name is empty');
        toast({
          title: "Error",
          description: "Family name is required",
          variant: "destructive",
        });
        return;
      }

      console.log('Creating family with data:', newFamily);
      const result = await familyService.createFamily(newFamily);
      console.log('Family created:', result);
      
      await loadFamilies(); // Reload families to get the complete data with members
      setIsFamilyDialogOpen(false);
      setNewFamily({
        family_name: '',
        primary_contact_id: ''
      });
      toast({
        title: "Success",
        description: "Family created successfully"
      });
    } catch (error) {
      console.error('Error creating family:', error);
      toast({
        title: "Error",
        description: "Failed to create family",
        variant: "destructive",
      });
    }
  };

  const formatName = (firstname, lastname) => {
    return `${firstname} ${lastname}`.trim();
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
  };

  const getInitials = (firstname, lastname) => {
    return `${firstname?.charAt(0) || ''}${lastname?.charAt(0) || ''}`.toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  // Filter groups
  useEffect(() => {
    let filtered = [...groups];
    if (groupSearchQuery) {
      const query = groupSearchQuery.toLowerCase();
      filtered = filtered.filter(group => 
        group.name.toLowerCase().includes(query) || 
        (group.description && group.description.toLowerCase().includes(query))
      );
    }
    filtered.sort((a, b) => a.name.localeCompare(b.name));
    setFilteredGroups(filtered);
  }, [groups, groupSearchQuery]);

  // Filter and sort members
  const filteredMembers = members
    .filter(member => {
      const matchesSearch = searchQuery === '' || 
        `${member.firstname} ${member.lastname}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.phone?.includes(searchQuery);
      
      const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
      
      const matchesAge = ageFilter === 'all' || 
        (ageFilter === 'adults' && member.member_type === 'adult') ||
        (ageFilter === 'children' && member.member_type === 'child');
      
      return matchesSearch && matchesStatus && matchesAge;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'lastname':
          aValue = `${a.lastname} ${a.firstname}`;
          bValue = `${b.lastname} ${b.firstname}`;
          break;
        case 'email':
          aValue = a.email || '';
          bValue = b.email || '';
          break;
        case 'phone':
          aValue = a.phone || '';
          bValue = b.phone || '';
          break;
        case 'joinDate':
          aValue = a.joinDate || a.created_at || '';
          bValue = b.joinDate || b.created_at || '';
          break;
        default:
          aValue = a[sortField] || '';
          bValue = b[sortField] || '';
      }
      
      if (sortDirection === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

  const EmptyState = ({ onAddMember }) => (
    <div className="text-center py-8 sm:py-12 px-4">
      <Users className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-2 text-lg font-semibold text-foreground">No people</h3>
      <p className="mt-1 text-sm sm:text-base text-muted-foreground">Get started by adding a new person.</p>
      <div className="mt-6">
        <Button onClick={onAddMember} className="h-10 px-6">
          <Plus className="mr-2 h-4 w-4" />
          Add Person
        </Button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] px-4">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading people...</p>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard permission={PERMISSIONS.MEMBERS_VIEW}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        {/* Modern header with gradient */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-700/50 px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                People
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">Church directory & family management</p>
            </div>
            <PermissionButton 
              permission={PERMISSIONS.MEMBERS_CREATE}
              onClick={() => setIsAddDialogOpen(true)}
              className="h-12 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
            >
              <Plus className="mr-2 h-5 w-5" />
              Add Person
            </PermissionButton>
          </div>
        </div>

        {/* Enhanced search and filters */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm px-6 py-4 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Search people by name, email, or phone..."
                className="pl-12 h-12 bg-white/80 dark:bg-slate-700/80 border-slate-200 dark:border-slate-600 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-12 bg-white/80 dark:bg-slate-700/80 border-slate-200 dark:border-slate-600 rounded-xl shadow-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="visitor">Visitor</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={ageFilter} onValueChange={setAgeFilter}>
                <SelectTrigger className="h-12 bg-white/80 dark:bg-slate-700/80 border-slate-200 dark:border-slate-600 rounded-xl shadow-sm">
                  <SelectValue placeholder="Age" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ages</SelectItem>
                  <SelectItem value="adults">Adults</SelectItem>
                  <SelectItem value="children">Children</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Content area with enhanced spacing */}
        <div className="px-6 py-6">
          {members.length === 0 ? (
            <EmptyState onAddMember={() => setIsAddDialogOpen(true)} />
          ) : (
            <Tabs defaultValue="list" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6 h-14 bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm rounded-xl p-1 shadow-sm border border-slate-200/50 dark:border-slate-600/50">
                <TabsTrigger value="list" className="text-sm font-medium rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md">
                  <Users className="w-4 h-4 mr-2" />
                  Member List
                </TabsTrigger>
                <TabsTrigger value="families" className="text-sm font-medium rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md">
                  <Heart className="w-4 h-4 mr-2" />
                  Families
                </TabsTrigger>
                <TabsTrigger value="groups" className="text-sm font-medium rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md">
                  <Hash className="w-4 h-4 mr-2" />
                  Groups
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="list">
                <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/50 shadow-lg rounded-xl overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative w-full overflow-auto">
                      <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b border-slate-200/50 dark:border-slate-600/50">
                          <tr className="border-b border-slate-200/50 dark:border-slate-600/50 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-700/50 data-[state=selected]:bg-slate-100/50 dark:data-[state=selected]:bg-slate-600/50">
                            <th className="h-16 px-6 text-left align-middle font-semibold text-slate-700 dark:text-slate-300">
                              <Button 
                                variant="ghost" 
                                className="flex items-center gap-2 h-12 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-700/50"
                                onClick={() => handleSort('lastname')}
                              >
                                <User className="w-4 h-4" />
                                Name
                                {sortField === 'lastname' && (
                                  sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </th>
                            <th className="h-16 px-6 text-left align-middle font-semibold text-slate-700 dark:text-slate-300 hidden md:table-cell">
                              <Button 
                                variant="ghost" 
                                className="flex items-center gap-2 h-12 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-700/50"
                                onClick={() => handleSort('email')}
                              >
                                <Mail className="w-4 h-4" />
                                Email
                                {sortField === 'email' && (
                                  sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </th>
                            <th className="h-16 px-6 text-left align-middle font-semibold text-slate-700 dark:text-slate-300 hidden lg:table-cell">
                              <Button 
                                variant="ghost" 
                                className="flex items-center gap-2 h-12 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-700/50"
                                onClick={() => handleSort('phone')}
                              >
                                <Phone className="w-4 h-4" />
                                Phone
                                {sortField === 'phone' && (
                                  sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </th>
                            <th className="h-16 px-6 align-middle font-semibold text-slate-700 dark:text-slate-300">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                          {filteredMembers.map((member) => (
                            <tr 
                              key={member.id} 
                              className="border-b border-slate-200/50 dark:border-slate-600/50 transition-all duration-200 hover:bg-slate-50/80 dark:hover:bg-slate-700/80 data-[state=selected]:bg-slate-100/80 dark:data-[state=selected]:bg-slate-600/80 cursor-pointer group"
                              onClick={() => handleMemberClick(member.id)}
                            >
                              <td className="h-16 px-6 align-middle">
                                <div className="flex items-center space-x-4">
                                  <Avatar className="h-10 w-10 ring-2 ring-slate-200/50 dark:ring-slate-600/50 group-hover:ring-blue-200 dark:group-hover:ring-blue-600 transition-all duration-200">
                                    <AvatarImage src={member.image_url} />
                                    <AvatarFallback className="text-sm font-medium bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-600 dark:to-slate-700 text-slate-700 dark:text-slate-300">
                                      {getInitials(member.firstname, member.lastname)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                      {formatName(member.firstname, member.lastname)}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                      {member.member_type === 'child' ? 'Child' : 'Adult'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="h-16 px-6 align-middle hidden md:table-cell">
                                <div className="text-sm text-slate-600 dark:text-slate-300">{member.email}</div>
                              </td>
                              <td className="h-16 px-6 align-middle hidden lg:table-cell">
                                <div className="text-sm text-slate-600 dark:text-slate-300">{member.phone}</div>
                              </td>
                              <td className="h-16 px-6 align-middle">
                                {member.status === 'active' ? (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-300 border border-green-200/50 dark:border-green-700/50">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                    Active
                                  </span>
                                ) : member.status === 'visitor' ? (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-300 border border-blue-200/50 dark:border-blue-700/50">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                    Visitor
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 dark:from-slate-800/30 dark:to-gray-800/30 dark:text-slate-300 border border-slate-200/50 dark:border-slate-600/50">
                                    <div className="w-2 h-2 bg-slate-500 rounded-full mr-2"></div>
                                    Inactive
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="families">
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800 shadow-lg">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                        <CardTitle className="text-sm font-semibold text-blue-900 dark:text-blue-100">Total Families</CardTitle>
                        <Heart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{families.length}</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800 shadow-lg">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                        <CardTitle className="text-sm font-semibold text-green-900 dark:text-green-100">Total People</CardTitle>
                        <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-green-900 dark:text-green-100">{members.length}</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950 border-purple-200 dark:border-purple-800 shadow-lg">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                        <CardTitle className="text-sm font-semibold text-purple-900 dark:text-purple-100">In Families</CardTitle>
                        <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                          {families.reduce((total, family) => total + family.members.length, 0)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950 dark:to-rose-950 border-pink-200 dark:border-pink-800 shadow-lg">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                        <CardTitle className="text-sm font-semibold text-pink-900 dark:text-pink-100">Children</CardTitle>
                        <Baby className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-pink-900 dark:text-pink-100">
                          {members.filter(m => m.member_type === 'child').length}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      onClick={() => {
                        console.log('Create Family button clicked');
                        setIsFamilyDialogOpen(true);
                      }}
                      className="h-12 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Create Family
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {families.map((family) => (
                      <Card 
                        key={family.id} 
                        className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/50 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden"
                        onClick={() => handleFamilyCardClick(family)}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/50 dark:to-indigo-950/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <CardHeader className="relative">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {family.family_name}
                              </CardTitle>
                              <CardDescription className="text-slate-600 dark:text-slate-400">
                                {family.members.length} member{family.members.length !== 1 ? 's' : ''}
                              </CardDescription>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-8 w-8 p-0 bg-white/80 dark:bg-slate-700/80 hover:bg-white dark:hover:bg-slate-600 shadow-sm"
                                onClick={(e) => {
                                  console.log('Edit Family button clicked for family:', family);
                                  e.stopPropagation();
                                  handleEditFamily(family);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-8 w-8 p-0 bg-white/80 dark:bg-slate-700/80 hover:bg-white dark:hover:bg-slate-600 shadow-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsAddDialogOpen(true);
                                }}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4 relative">
                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Members</h4>
                            <div className="space-y-2">
                              {family.members.slice(0, 3).map((member) => (
                                <div key={member.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50/50 dark:bg-slate-700/50 hover:bg-slate-100/50 dark:hover:bg-slate-600/50 transition-colors">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8 ring-2 ring-slate-200/50 dark:ring-slate-600/50">
                                      <AvatarImage src={member.image_url} />
                                      <AvatarFallback className="text-xs font-medium bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-600 dark:to-slate-700 text-slate-700 dark:text-slate-300">
                                        {getInitials(member.firstname, member.lastname)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-slate-900 dark:text-slate-100">
                                        {member.firstname} {member.lastname}
                                      </span>
                                      {member.id === family.primary_contact_id && (
                                        <Crown className="w-4 h-4 text-yellow-500" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {family.members.length > 3 && (
                                <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                  +{family.members.length - 3} more member{family.members.length - 3 !== 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          </div>

                          {family.primary_contact_id && (
                            <div className="pt-3 border-t border-slate-200/50 dark:border-slate-600/50">
                              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Primary Contact</div>
                              <div className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/50 dark:to-orange-950/50 border border-yellow-200/50 dark:border-yellow-700/50">
                                <Crown className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                  {family.members.find(m => m.id === family.primary_contact_id)?.firstname} {family.members.find(m => m.id === family.primary_contact_id)?.lastname}
                                </span>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {families.length === 0 && (
                    <div className="text-center py-16">
                      <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mb-6">
                        <Heart className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">No families yet</h3>
                      <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
                        Get started by creating your first family to organize your church members
                      </p>
                      <Button 
                        onClick={() => setIsFamilyDialogOpen(true)}
                        className="h-12 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Create First Family
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="groups">
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800 shadow-lg">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                        <CardTitle className="text-sm font-semibold text-blue-900 dark:text-blue-100">Total Groups</CardTitle>
                        <Hash className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{groups.length}</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800 shadow-lg">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                        <CardTitle className="text-sm font-semibold text-green-900 dark:text-green-100">Active Groups</CardTitle>
                        <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                          {groups.filter(g => g.group_members?.[0]?.count > 0).length}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950 border-purple-200 dark:border-purple-800 shadow-lg">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                        <CardTitle className="text-sm font-semibold text-purple-900 dark:text-purple-100">Total Members</CardTitle>
                        <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                          {groups.reduce((total, group) => total + (group.group_members?.[0]?.count || 0), 0)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950 dark:to-rose-950 border-pink-200 dark:border-pink-800 shadow-lg">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                        <CardTitle className="text-sm font-semibold text-pink-900 dark:text-pink-100">Avg Group Size</CardTitle>
                        <Star className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-pink-900 dark:text-pink-100">
                          {groups.length > 0 ? Math.round(groups.reduce((total, group) => total + (group.group_members?.[0]?.count || 0), 0) / groups.length) : 0}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Search and Add Group */}
                  <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    <div className="flex-1 relative max-w-md">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input
                        placeholder="Search groups..."
                        className="pl-12 h-12 bg-white/80 dark:bg-slate-700/80 border-slate-200 dark:border-slate-600 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={groupSearchQuery}
                        onChange={(e) => setGroupSearchQuery(e.target.value)}
                      />
                    </div>
                    <Button 
                      onClick={() => setIsAddGroupOpen(true)}
                      className="h-12 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Create Group
                    </Button>
                  </div>

                  {/* Groups Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredGroups.map((group) => (
                      <Card 
                        key={group.id} 
                        className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/50 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden"
                        onClick={() => handleViewGroup(group)}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/50 dark:to-blue-950/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <CardHeader className="relative">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {group.name}
                              </CardTitle>
                              <CardDescription className="text-slate-600 dark:text-slate-400 line-clamp-2">
                                {group.description || 'No description provided'}
                              </CardDescription>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-8 w-8 p-0 bg-white/80 dark:bg-slate-700/80 hover:bg-white dark:hover:bg-slate-600 shadow-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingGroup(group);
                                  setIsEditGroupOpen(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-8 w-8 p-0 bg-white/80 dark:bg-slate-700/80 hover:bg-white dark:hover:bg-slate-600 shadow-sm text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setGroupToDelete(group);
                                  setIsDeleteGroupDialogOpen(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4 relative">
                          <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Leader</div>
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
                                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Members</div>
                                <div className="text-sm text-slate-600 dark:text-slate-400">
                                  {group.group_members?.[0]?.count || 0} people
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {filteredGroups.length === 0 && (
                    <div className="text-center py-16">
                      <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mb-6">
                        <Hash className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">No groups yet</h3>
                      <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
                        Get started by creating your first group, ministry, or committee
                      </p>
                      <Button 
                        onClick={() => setIsAddGroupOpen(true)}
                        className="h-12 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Create First Group
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {/* Add Person Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Add New Member</DialogTitle>
            <DialogDescription>
              Enter the member's information below.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[70vh] pr-2">
            <MemberForm
              initialData={{
                firstname: '',
                lastname: '',
                email: '',
                phone: '',
                status: 'active',
                image_url: '',
                gender: 'male',
                member_type: 'adult',
                role: 'member',
                birth_date: '',
                join_date: new Date().toISOString().split('T')[0],
                anniversary_date: '',
                spouse_name: '',
                has_children: false,
                marital_status: 'single',
                occupation: '',
                address: {
                  street: '',
                  city: '',
                  state: '',
                  zip: '',
                  country: ''
                },
                emergency_contact: {
                  name: '',
                  phone: '',
                  relationship: ''
                },
                notes: '',
                last_attendance_date: '',
                attendance_frequency: 'regular',
                ministry_involvement: [],
                communication_preferences: { sms: true, email: true, mail: false },
                tags: []
              }}
              onSave={async (memberData) => {
                try {
                  const addedMember = await addMember(memberData);
                  setMembers(prev => [addedMember, ...prev]);
                  setIsAddDialogOpen(false);
                  toast({
                    title: "Success",
                    description: "Member added successfully"
                  });
                } catch (error) {
                  console.error('Error adding member:', error);
                  toast({
                    title: "Error",
                    description: "Failed to add member",
                    variant: "destructive",
                  });
                }
              }}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-[425px] mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle>Delete Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedMember?.firstname} {selectedMember?.lastname}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteMember}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Family Details Dialog */}
      <Dialog open={isFamilyDetailsDialogOpen} onOpenChange={setIsFamilyDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden bg-white/95 backdrop-blur-xl border-0 shadow-2xl">
          <DialogHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-t-xl border-b border-blue-100">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Family Details
            </DialogTitle>
            <DialogDescription className="text-slate-600 text-base">
              View and manage family information with enhanced details.
            </DialogDescription>
          </DialogHeader>
          {selectedFamilyForDetails && (
            <div className="space-y-6 p-6 overflow-y-auto max-h-[60vh]">
              {/* Family Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800">{selectedFamilyForDetails.family_name}</h3>
                    <p className="text-slate-600">
                      {selectedFamilyForDetails.members?.length || 0} family member{selectedFamilyForDetails.members?.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Family Members */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h4 className="text-lg font-semibold text-slate-800">Family Members</h4>
                </div>
                <div className="space-y-3">
                  {(() => {
                    // Sort members: adults first, then children, both sorted alphabetically
                    const sortedMembers = selectedFamilyForDetails.members.sort((a, b) => {
                      // First sort by member type (adults before children)
                      if (a.member_type !== b.member_type) {
                        return a.member_type === 'adult' ? -1 : 1;
                      }
                      // Then sort alphabetically by name
                      return `${a.firstname} ${a.lastname}`.localeCompare(`${b.firstname} ${b.lastname}`);
                    });
                    
                    return sortedMembers.map((member) => (
                      <div 
                        key={member.id} 
                        className="group bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-4 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-200 transition-all duration-200 hover:shadow-lg"
                        onClick={() => navigate(`/members/${member.id}`)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 ring-2 ring-blue-100 group-hover:ring-blue-200 transition-all duration-200">
                              <AvatarImage src={member.image_url} />
                              <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                                {getInitials(member.firstname, member.lastname)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold text-slate-800 text-base">
                                {member.firstname} {member.lastname}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge 
                                  variant={member.member_type === 'adult' ? 'default' : 'secondary'}
                                  className={`text-xs ${
                                    member.member_type === 'adult' 
                                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                                      : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                  }`}
                                >
                                  {member.member_type}
                                </Badge>
                                <Badge 
                                  variant="outline" 
                                  className="text-xs border-slate-300 text-slate-600"
                                >
                                  {member.relationship_type}
                                </Badge>
                                {member.id === selectedFamilyForDetails.primary_contact_id && (
                                  <div className="flex items-center gap-1">
                                    <Crown className="w-3 h-3 text-yellow-500" />
                                    <span className="text-xs text-yellow-600 font-medium">Primary</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors duration-200" />
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Primary Contact Section */}
              {selectedFamilyForDetails.primary_contact_id && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                      <Crown className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">Primary Contact</h4>
                      <p className="text-slate-600 text-sm">
                        {selectedFamilyForDetails.members.find(m => m.id === selectedFamilyForDetails.primary_contact_id)?.firstname} {selectedFamilyForDetails.members.find(m => m.id === selectedFamilyForDetails.primary_contact_id)?.lastname}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Family Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Adults</p>
                      <p className="text-lg font-bold text-slate-800">
                        {selectedFamilyForDetails.members?.filter(m => m.member_type === 'adult').length || 0}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                      <Baby className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Children</p>
                      <p className="text-lg font-bold text-slate-800">
                        {selectedFamilyForDetails.members?.filter(m => m.member_type === 'child').length || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Family Dialog */}
      <Dialog open={isFamilyDialogOpen} onOpenChange={setIsFamilyDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Family</DialogTitle>
            <DialogDescription>
              Create a new family and optionally assign a primary contact.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="family_name">Family Name</Label>
              <Input
                id="family_name"
                placeholder="Enter family name"
                value={newFamily.family_name}
                onChange={(e) => setNewFamily(prev => ({ ...prev, family_name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="primary_contact">Primary Contact (Optional)</Label>
              <Select 
                value={newFamily.primary_contact_id || "none"} 
                onValueChange={(value) => setNewFamily(prev => ({ ...prev, primary_contact_id: value === "none" ? "" : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select primary contact" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No primary contact</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {formatName(member.firstname, member.lastname)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFamilyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFamily}>
              Create Family
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Family Dialog */}
      <Dialog open={isEditFamilyDialogOpen} onOpenChange={setIsEditFamilyDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Edit Family</DialogTitle>
            <DialogDescription>
              Manage family members and settings.
            </DialogDescription>
          </DialogHeader>
          {selectedFamily && (
            <div className="space-y-6 overflow-y-auto max-h-[60vh]">
              {/* Family Name */}
              <div className="space-y-2">
                <Label htmlFor="edit_family_name">Family Name</Label>
                <div className="flex gap-2">
                  <Input
                    id="edit_family_name"
                    value={selectedFamily.family_name}
                    onChange={(e) => setSelectedFamily(prev => ({ ...prev, family_name: e.target.value }))}
                  />
                  <Button 
                    size="sm"
                    onClick={async () => {
                      try {
                        await familyService.updateFamily(selectedFamily.id, { family_name: selectedFamily.family_name });
                        await loadFamilies();
                        toast({
                          title: "Success",
                          description: "Family name updated"
                        });
                      } catch (error) {
                        console.error('Error updating family name:', error);
                        toast({
                          title: "Error",
                          description: "Failed to update family name",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    Update
                  </Button>
                </div>
              </div>

              {/* Primary Contact */}
              <div className="space-y-2">
                <Label htmlFor="edit_primary_contact">Primary Contact</Label>
                <div className="flex gap-2">
                                     <Select 
                     value={selectedFamily.primary_contact_id || "none"} 
                     onValueChange={async (value) => {
                       try {
                         const contactId = value === "none" ? null : value;
                         await familyService.updateFamily(selectedFamily.id, { primary_contact_id: contactId });
                         await loadFamilies();
                         setSelectedFamily(prev => ({ ...prev, primary_contact_id: value === "none" ? "" : value }));
                         toast({
                           title: "Success",
                           description: "Primary contact updated"
                         });
                       } catch (error) {
                         console.error('Error updating primary contact:', error);
                         toast({
                           title: "Error",
                           description: "Failed to update primary contact",
                           variant: "destructive",
                         });
                       }
                     }}
                   >
                    <SelectTrigger>
                      <SelectValue placeholder="Select primary contact" />
                    </SelectTrigger>
                                         <SelectContent>
                       <SelectItem value="none">No primary contact</SelectItem>
                       {selectedFamily.members?.map((member) => (
                         <SelectItem key={member.id} value={member.id}>
                           {formatName(member.firstname, member.lastname)}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                </div>
              </div>

              {/* Add Member Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Add Member to Family</h4>
                <div className="space-y-2">
                  <Input
                    placeholder="Search available members..."
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                  />
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {availableMembers
                      .filter(member => 
                        member.firstname?.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                        member.lastname?.toLowerCase().includes(memberSearchQuery.toLowerCase())
                      )
                      .map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-2 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={member.image_url} />
                              <AvatarFallback className="text-xs">
                                {getInitials(member.firstname, member.lastname)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">
                              {formatName(member.firstname, member.lastname)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Select
                              defaultValue="other"
                              onValueChange={(value) => handleAddMemberToFamily(member.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Relationship" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="spouse">Spouse</SelectItem>
                                <SelectItem value="parent">Parent</SelectItem>
                                <SelectItem value="child">Child</SelectItem>
                                <SelectItem value="sibling">Sibling</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              onClick={() => handleAddMemberToFamily(member.id, 'other')}
                            >
                              Add
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Current Members */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Current Family Members</h4>
                <div className="space-y-2">
                  {selectedFamily.members?.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-2 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={member.image_url} />
                          <AvatarFallback className="text-xs">
                            {getInitials(member.firstname, member.lastname)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="text-sm font-medium">
                            {formatName(member.firstname, member.lastname)}
                          </span>
                          {member.id === selectedFamily.primary_contact_id && (
                            <div className="flex items-center gap-1">
                              <Crown className="w-3 h-3 text-yellow-500" />
                              <span className="text-xs text-slate-500">Primary Contact</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={member.relationship_type || 'other'}
                          onValueChange={(value) => handleUpdateMemberRole(member.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="spouse">Spouse</SelectItem>
                            <SelectItem value="parent">Parent</SelectItem>
                            <SelectItem value="child">Child</SelectItem>
                            <SelectItem value="sibling">Sibling</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              await familyService.removeMemberFromFamily(selectedFamily.id, member.id);
                              await loadFamilies();
                              await loadMembers();
                              toast({
                                title: "Success",
                                description: "Member removed from family"
                              });
                            } catch (error) {
                              console.error('Error removing member from family:', error);
                              toast({
                                title: "Error",
                                description: "Failed to remove member from family",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
      
      {/* Delete Group Confirmation Dialog */}
      <Dialog open={isDeleteGroupDialogOpen} onOpenChange={setIsDeleteGroupDialogOpen}>
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
                {groupToDelete.group_members?.[0]?.count || 0} members
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteGroupDialogOpen(false)}>
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
                        onClick={() => setIsAddMemberToGroupOpen(true)}
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
                <Button onClick={() => {
                  setEditingGroup(selectedGroup);
                  setIsEditGroupOpen(true);
                  setIsViewGroupOpen(false);
                }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Group
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Person to Group Dialog */}
      <Dialog open={isAddMemberToGroupOpen} onOpenChange={setIsAddMemberToGroupOpen}>
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
              value={memberSearchQuery}
              onChange={(e) => setMemberSearchQuery(e.target.value)}
            />
          </div>
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {members
              .filter(member => !selectedGroup?.members.some(m => m.id === member.id))
              .filter(member => {
                const fullName = `${member.firstname} ${member.lastname}`.toLowerCase();
                return fullName.includes(memberSearchQuery.toLowerCase());
              })
              .sort((a, b) => `${a.firstname} ${a.lastname}`.localeCompare(`${b.firstname} ${b.lastname}`))
              .map((member) => (
                <div 
                  key={member.id} 
                  className="flex items-center space-x-2 p-2 hover:bg-muted rounded-lg cursor-pointer"
                  onClick={() => handleAddMemberToGroup(member.id)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.image_url} />
                    <AvatarFallback>{getInitials(member.firstname, member.lastname)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium">{`${member.firstname} ${member.lastname}`}</span>
                    {member.email && (
                      <span className="text-sm text-muted-foreground">{member.email}</span>
                    )}
                  </div>
                </div>
              ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMemberToGroupOpen(false)}>
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
    </PermissionGuard>
  );
}
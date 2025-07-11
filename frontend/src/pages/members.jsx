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
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { getMembers, addMember, updateMember, deleteMember, getMemberAttendance } from '../lib/data';
import { familyService } from '../lib/familyService';
import { Badge } from '@/components/ui/badge';
import { AddressInput } from '@/components/ui/address-input';
import { useAuth } from '@/lib/authContext';
import { Textarea } from '@/components/ui/textarea';
import { formatName, getInitials, formatPhoneNumber } from '@/lib/utils/formatters';
import { useNavigate } from 'react-router-dom';
import MemberForm from '@/components/members/MemberForm';
import { PermissionGuard, PermissionButton, PermissionFeature } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/lib/permissions.jsx';

export function People() {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [families, setFamilies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ageFilter, setAgeFilter] = useState('adults'); // Default to adults
  const [viewMode, setViewMode] = useState('grid');
  const [sortField, setSortField] = useState('lastname');
  const [sortDirection, setSortDirection] = useState('asc');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFamilyDialogOpen, setIsFamilyDialogOpen] = useState(false);
  const [newFamily, setNewFamily] = useState({
    family_name: '',
    primary_contact_id: ''
  });
  const [isEditFamilyDialogOpen, setIsEditFamilyDialogOpen] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [isFamilyDetailsDialogOpen, setIsFamilyDetailsDialogOpen] = useState(false);
  const [selectedFamilyForDetails, setSelectedFamilyForDetails] = useState(null);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();
  const [memberAttendance, setMemberAttendance] = useState({});
  const [isAttendanceLoading, setIsAttendanceLoading] = useState({});
  const navigate = useNavigate();
  
  useEffect(() => {
    loadMembers();
    loadFamilies();
  }, []);
  
  const loadMembers = async () => {
    try {
      const data = await getMembers();
      // Sort the data by last name and first name
      const sortedData = data.sort((a, b) => {
        const lastNameCompare = (a.lastname || '').localeCompare(b.lastname || '');
        if (lastNameCompare !== 0) return lastNameCompare;
        return (a.firstname || '').localeCompare(b.firstname || '');
      });
      

      
      setMembers(sortedData);
      setFilteredMembers(sortedData);
    } catch (error) {
      console.error('Error loading people:', error);
      toast({
        title: "Error",
        description: "Failed to load people",
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
    }
  };

  const handleCreateFamily = async () => {
    try {
      if (!newFamily.family_name.trim()) {
        toast({
          title: "Error",
          description: "Family name is required",
          variant: "destructive",
        });
        return;
      }

      await familyService.createFamily(newFamily);
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

  const handleEditFamily = async (family) => {
    setMemberSearchQuery(''); // Clear search query when dialog opens
    try {
      // Get fresh family data to ensure we have the latest member information
      const freshFamily = await familyService.getFamily(family.id);
      if (freshFamily) {
        setSelectedFamily(freshFamily);
      } else {
        setSelectedFamily(family);
      }
      
      // Get members that can be added to this family (unassigned + current family members)
      const available = await familyService.getAvailableMembers(family.id);
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

  const handleRemoveMemberFromFamily = async (memberId) => {
    try {
      await familyService.removeMemberFromFamily(selectedFamily.id, memberId);
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
  };

  const handleUpdateFamilyName = async (familyId, newName) => {
    try {
      await familyService.updateFamily(familyId, { family_name: newName });
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
  };

  const handleUpdateFamilyPrimaryContact = async (familyId, primaryContactId) => {
    try {
      await familyService.updateFamily(familyId, { primary_contact_id: primaryContactId || null });
      await loadFamilies();
      
      // Update the selected family with fresh data
      const updatedFamilies = await familyService.getFamilies();
      const updatedFamily = updatedFamilies.find(f => f.id === familyId);
      if (updatedFamily) {
        setSelectedFamily(updatedFamily);
      }
      
      toast({
        title: "Success",
        description: "Primary contact updated successfully"
      });
    } catch (error) {
      console.error('Error updating primary contact:', error);
      toast({
        title: "Error",
        description: "Failed to update primary contact",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFamily = async (familyId) => {
    try {
      await familyService.deleteFamily(familyId);
      await loadFamilies();
      toast({
        title: "Success",
        description: "Family deleted"
      });
    } catch (error) {
      console.error('Error deleting family:', error);
      toast({
        title: "Error",
        description: "Failed to delete family",
        variant: "destructive",
      });
    }
  };

  const handleFamilyCardClick = (family) => {
    setSelectedFamilyForDetails(family);
    setIsFamilyDetailsDialogOpen(true);
  };
  
  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  useEffect(() => {
    let filtered = members;
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(member => 
        (member.firstname && member.firstname.toLowerCase().includes(query)) ||
        (member.lastname && member.lastname.toLowerCase().includes(query)) ||
        (member.email && member.email.toLowerCase().includes(query)) ||
        (member.phone && member.phone.toLowerCase().includes(query))
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(member => member.status === statusFilter);
    }

    // Apply age filter
    if (ageFilter === 'adults') {
      filtered = filtered.filter(member => isAdult(member));
    } else if (ageFilter === 'children') {
      filtered = filtered.filter(member => isChild(member));
    }
    // If ageFilter is 'all', don't filter by age

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField] || '';
      let bValue = b[sortField] || '';
      
      // Handle nested fields like address
      if (sortField === 'address') {
        aValue = a.address?.city || '';
        bValue = b.address?.city || '';
      }
      
      // Handle date fields
      if (sortField === 'created_at' || sortField === 'joinDate') {
        aValue = a[sortField] ? new Date(a[sortField]) : new Date(0);
        bValue = b[sortField] ? new Date(b[sortField]) : new Date(0);
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredMembers(filtered);
  }, [searchQuery, statusFilter, ageFilter, members, sortField, sortDirection]);
  

  

  
  const handleDeleteMember = async () => {
    try {
      await deleteMember(selectedMember.id);
      setMembers(prev => prev.filter(m => m.id !== selectedMember.id));
      setIsDeleteDialogOpen(false);
      setSelectedMember(null);
      toast({
        title: "Success",
        description: "Person deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting person:', error);
      toast({
        title: "Error",
        description: "Failed to delete person",
        variant: "destructive",
      });
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

  const EmptyState = ({ onAddMember }) => (
    <div className="text-center py-12">
      <Users className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-semibold text-gray-900">No people</h3>
      <p className="mt-1 text-sm text-gray-500">Get started by adding a new person.</p>
      <div className="mt-6">
        <Button onClick={onAddMember}>
          <Plus className="mr-2 h-4 w-4" />
          Add Person
        </Button>
      </div>
    </div>
  );
  
  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };
  
  const loadMemberAttendance = async (memberId) => {
    if (memberAttendance[memberId]) return; // Already loaded
    
    setIsAttendanceLoading(prev => ({ ...prev, [memberId]: true }));
    try {
      const data = await getMemberAttendance(memberId);
      setMemberAttendance(prev => ({ ...prev, [memberId]: data }));
    } catch (error) {
      console.error('Error loading member attendance:', error);
      toast({
        title: "Error",
        description: "Failed to load attendance history",
        variant: "destructive",
      });
    } finally {
      setIsAttendanceLoading(prev => ({ ...prev, [memberId]: false }));
    }
  };
  
  const handleMemberClick = (memberId) => {
    navigate(`/members/${memberId}`);
  };
  
  const getMemberTypeIcon = (memberType) => {
    return memberType === 'child' ? <Baby className="w-4 h-4" /> : <User className="w-4 h-4" />;
  };

  const getMemberTypeBadge = (memberType) => {
    return memberType === 'child' ? 
      <Badge variant="secondary" className="text-xs">Child</Badge> : 
      <Badge variant="default" className="text-xs">Adult</Badge>;
  };

  const getRelationshipBadge = (relationshipType) => {
    const colors = {
      spouse: 'bg-pink-100 text-pink-800',
      parent: 'bg-blue-100 text-blue-800',
      child: 'bg-green-100 text-green-800',
      sibling: 'bg-purple-100 text-purple-800',
      grandparent: 'bg-orange-100 text-orange-800',
      grandchild: 'bg-yellow-100 text-yellow-800',
      aunt: 'bg-indigo-100 text-indigo-800',
      uncle: 'bg-indigo-100 text-indigo-800',
      niece: 'bg-pink-100 text-pink-800',
      nephew: 'bg-blue-100 text-blue-800',
      cousin: 'bg-gray-100 text-gray-800',
      guardian: 'bg-red-100 text-red-800',
      other: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[relationshipType] || colors.other}`}>
        {relationshipType.charAt(0).toUpperCase() + relationshipType.slice(1)}
      </span>
    );
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const isAdult = (member) => {
    return member.member_type === 'adult';
  };

  const isChild = (member) => {
    return member.member_type === 'child';
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <PermissionGuard permission={PERMISSIONS.MEMBERS_VIEW}>
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">People</h1>
          <p className="text-muted-foreground">
            Manage your church's people directory.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search people..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="visitor">Visitor</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={ageFilter} onValueChange={setAgeFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Filter by age" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ages</SelectItem>
                <SelectItem value="adults">Adults</SelectItem>
                <SelectItem value="children">Children</SelectItem>
              </SelectContent>
            </Select>
            
            <PermissionButton 
              permission={PERMISSIONS.MEMBERS_CREATE}
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Person
            </PermissionButton>
          </div>
        </div>
      
      {members.length === 0 ? (
        <EmptyState onAddMember={() => setIsAddDialogOpen(true)} />
      ) : (
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="mb-4 w-full h-auto min-h-[48px] bg-muted p-1 rounded-lg">
            <TabsTrigger 
              value="grid" 
              className="flex-1 h-10 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <Grid className="w-4 h-4 mr-2 hidden sm:inline" />
              Grid
            </TabsTrigger>
            <TabsTrigger 
              value="list" 
              className="flex-1 h-10 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <List className="w-4 h-4 mr-2 hidden sm:inline" />
              List
            </TabsTrigger>
            <TabsTrigger 
              value="families" 
              className="flex-1 h-10 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <Heart className="w-4 h-4 mr-2 hidden sm:inline" />
              Families
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="grid">
            {filteredMembers.length > 0 ? (
              <motion.div 
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {filteredMembers.map((member) => (
                  <motion.div key={member.id} variants={itemVariants}>
                    <Card 
                      className="overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={member.image_url} />
                            <AvatarFallback>
                              {member.firstname.charAt(0)}{member.lastname.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-xl">{formatName(member.firstname, member.lastname)}</CardTitle>
                            <CardDescription>
                              {member.status === 'active' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  Active
                                </span>
                              ) : member.status === 'visitor' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  Visitor
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  Inactive
                                </span>
                              )}
                            </CardDescription>
                          </div>
                          </div>

                        </div>
                      </CardHeader>
                      <CardContent className="pb-3 cursor-pointer" onClick={() => handleMemberClick(member.id)}>
                        <div className="space-y-2">
                          <div className="flex items-center text-sm">
                            <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>{member.email}</span>
                          </div>
                          {member.phone && (
                            <div className="flex items-center text-sm">
                              <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                              <span>{member.phone}</span>
                            </div>
                          )}
                          {member.address && (
                            <div className="flex items-center text-sm">
                              <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                              <span>
                                {[
                                  member.address.street,
                                  member.address.city,
                                  member.address.state,
                                  member.address.zip
                                ].filter(Boolean).join(', ')}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center text-sm">
                            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>Joined {formatDate(member.joinDate || member.created_at)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Search className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
                  <p className="text-muted-foreground text-center">
                    Try adjusting your search or filter criteria.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="list">
            <Card>
              <CardContent className="p-0">
                <div className="relative w-full overflow-auto touch-scroll">
                  <table className="w-full caption-bottom text-sm tablet-table">
                    <thead className="[&_tr]:border-b">
                      <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <th className="h-16 px-4 text-left align-middle font-medium">
                            <Button 
                              variant="ghost" 
                              className="flex items-center gap-1 touch-target"
                                                    onClick={() => handleSort('lastname')}
                            >
                              Name
                        {sortField === 'lastname' && (
                                sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                        </th>
                        <th className="h-16 px-4 text-left align-middle font-medium hidden sm:table-cell">
                          <Button 
                            variant="ghost" 
                            className="flex items-center gap-1 touch-target"
                            onClick={() => handleSort('email')}
                          >
                            Email
                            {sortField === 'email' && (
                              sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </th>
                        <th className="h-16 px-4 text-left align-middle font-medium hidden tablet:table-cell">
                          <Button 
                            variant="ghost" 
                            className="flex items-center gap-1 touch-target"
                            onClick={() => handleSort('phone')}
                          >
                            Phone
                            {sortField === 'phone' && (
                              sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </th>
                        <th className="h-16 px-4 text-left align-middle font-medium hidden lg:table-cell">
                          <Button 
                            variant="ghost" 
                            className="flex items-center gap-1 touch-target"
                            onClick={() => handleSort('address')}
                          >
                            Address
                            {sortField === 'address' && (
                              sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </th>
                        <th className="h-16 px-4 text-left align-middle font-medium hidden xl:table-cell">
                          <Button 
                            variant="ghost" 
                            className="flex items-center gap-1 touch-target"
                            onClick={() => handleSort('created_at')}
                          >
                            Joined
                            {sortField === 'created_at' && (
                              sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </th>
                        <th className="h-16 px-4 text-left align-middle font-medium">
                          Status
                        </th>


                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {filteredMembers.map((member) => (
                        <tr 
                          key={member.id} 
                          className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted cursor-pointer"
                          onClick={() => handleMemberClick(member.id)}
                        >
                          <td className="h-16 px-4 align-middle">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-12 w-12">
                                  <AvatarImage src={member.image_url} />
                                <AvatarFallback className="text-sm font-medium">
                                    {getInitials(member.firstname, member.lastname)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                <div className="font-semibold text-base">{formatName(member.firstname, member.lastname)}</div>
                              </div>
                            </div>
                          </td>
                          <td className="h-16 px-4 align-middle hidden sm:table-cell">
                            <div className="text-base">{member.email || '-'}</div>
                          </td>
                          <td className="h-16 px-4 align-middle hidden tablet:table-cell">
                            <div className="text-base">{member.phone ? formatPhoneNumber(member.phone) : '-'}</div>
                          </td>
                          <td className="h-16 px-4 align-middle hidden lg:table-cell">
                            <div className="text-base">
                              {member.address ? (
                                [
                                  member.address.street,
                                  member.address.city,
                                  member.address.state,
                                  member.address.zip
                                ].filter(Boolean).join(', ')
                              ) : '-'}
                            </div>
                          </td>
                          <td className="h-16 px-4 align-middle hidden xl:table-cell">
                            <div className="text-base">{formatDate(member.joinDate || member.created_at)}</div>
                          </td>
                          <td className="h-16 px-4 align-middle">
                            {member.status === 'active' ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                Active
                              </span>
                            ) : member.status === 'visitor' ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                Visitor
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
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
              {/* Family Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Families</CardTitle>
                    <Heart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{families.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total People</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{members.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">In Families</CardTitle>
                    <User className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {families.reduce((total, family) => total + family.members.length, 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {members.length - families.reduce((total, family) => total + family.members.length, 0)} unassigned
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Children</CardTitle>
                    <Baby className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {members.filter(m => m.member_type === 'child').length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {members.filter(m => m.member_type === 'adult').length} adults
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Create Family Button */}
              <div className="flex justify-end">
                <Button onClick={() => setIsFamilyDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Family
                </Button>
              </div>

              {/* Families Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {families.map((family) => (
                  <Card 
                    key={family.id} 
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleFamilyCardClick(family)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{family.family_name}</CardTitle>
                          <CardDescription>
                            {family.members.length} member{family.members.length !== 1 ? 's' : ''}
                          </CardDescription>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditFamily(family);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFamily(family.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Family Members */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Members</h4>
                        <div className="space-y-1">
                          {(() => {
                            // Sort members: adults first, then children, both sorted alphabetically
                            const sortedMembers = family.members.sort((a, b) => {
                              // First sort by member type (adults before children)
                              if (a.member_type !== b.member_type) {
                                return a.member_type === 'adult' ? -1 : 1;
                              }
                              // Then sort alphabetically by name
                              return `${a.firstname} ${a.lastname}`.localeCompare(`${b.firstname} ${b.lastname}`);
                            });
                            
                            return sortedMembers.slice(0, 3).map((member) => (
                              <div key={member.id} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={member.image_url} />
                                    <AvatarFallback className="text-xs">
                                      {getInitials(member.firstname, member.lastname)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex items-center gap-1">
                                    <span>{member.firstname} {member.lastname}</span>
                                    {member.id === family.primary_contact_id && (
                                      <Crown className="w-3 h-3 text-yellow-500" />
                                    )}
                                  </div>
                                  {getMemberTypeBadge(member.member_type)}
                                  {getRelationshipBadge(member.relationship_type)}
                                </div>
                              </div>
                            ));
                          })()}
                          {family.members.length > 3 && (
                            <div className="text-xs text-muted-foreground">
                              +{family.members.length - 3} more member{family.members.length - 3 !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Primary Contact */}
                      {family.primary_contact_id && (
                        <div className="pt-2 border-t">
                          <div className="text-xs text-muted-foreground">Primary Contact</div>
                          <div className="text-sm font-medium flex items-center gap-1">
                            <Crown className="w-3 h-3 text-yellow-500" />
                            {family.members.find(m => m.id === family.primary_contact_id)?.firstname} {family.members.find(m => m.id === family.primary_contact_id)?.lastname}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Empty State for Families */}
              {families.length === 0 && (
                <div className="text-center py-12">
                  <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No families yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Get started by creating your first family
                  </p>
                  <Button onClick={() => setIsFamilyDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Family
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
      
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
      
      {/* Edit Member Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
            <DialogDescription>
              Update the member's information below.
            </DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <div className="overflow-y-auto max-h-[70vh] pr-2">
            <MemberForm
                key={selectedMember.id}
              initialData={{
                  // Basic fields (these should exist in the database)
                  id: selectedMember.id,
                  firstname: selectedMember.firstname || '',
                  lastname: selectedMember.lastname || '',
                  email: selectedMember.email || '',
                  phone: selectedMember.phone || '',
                  status: selectedMember.status || 'active',
                  image_url: selectedMember.image_url || '',
                  
                  // New schema fields (may not exist in older records)
                  gender: selectedMember.gender || 'male',
                  member_type: selectedMember.member_type || 'adult',
                  role: selectedMember.role || 'member',
                  birth_date: selectedMember.birth_date || '',
                  join_date: selectedMember.join_date || '',
                  anniversary_date: selectedMember.anniversary_date || '',
                  spouse_name: selectedMember.spouse_name || '',
                  has_children: selectedMember.has_children || false,
                  marital_status: selectedMember.marital_status || 'single',
                  occupation: selectedMember.occupation || '',
                  
                  // Complex fields with proper defaults
                  address: selectedMember.address || {
                    street: '',
                    city: '',
                    state: '',
                    zip: '',
                    country: ''
                  },
                  emergency_contact: selectedMember.emergency_contact || {
                    name: '',
                    phone: '',
                    relationship: ''
                  },
                  notes: selectedMember.notes || '',
                  last_attendance_date: selectedMember.last_attendance_date || '',
                  attendance_frequency: selectedMember.attendance_frequency || 'regular',
                  ministry_involvement: selectedMember.ministry_involvement || [],
                  communication_preferences: selectedMember.communication_preferences || { sms: true, email: true, mail: false },
                  tags: selectedMember.tags || []
              }}
              onSave={async (memberData) => {
                try {
                    const updatedMember = await updateMember(selectedMember.id, memberData);
                  setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
                  setIsEditDialogOpen(false);
                  setSelectedMember(null);
                  toast({
                    title: "Success",
                    description: "Member updated successfully"
                  });
                } catch (error) {
                  console.error('Error updating member:', error);
                  toast({
                    title: "Error",
                    description: "Failed to update member",
                    variant: "destructive",
                  });
                }
              }}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedMember(null);
              }}
            />
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Person</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this person? This action cannot be undone.
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

      {/* Create Family Dialog */}
      <Dialog open={isFamilyDialogOpen} onOpenChange={setIsFamilyDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Family</DialogTitle>
            <DialogDescription>
              Enter the family name and select a primary contact.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="family_name">Family Name *</Label>
              <Input
                id="family_name"
                value={newFamily.family_name}
                onChange={(e) => setNewFamily(prev => ({ ...prev, family_name: e.target.value }))}
                placeholder="e.g., Smith Family"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="primary_contact">Primary Contact</Label>
                              <Select
                  value={newFamily.primary_contact_id || 'none'}
                  onValueChange={(value) => setNewFamily(prev => ({ ...prev, primary_contact_id: value === 'none' ? '' : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a primary contact (optional)" />
                  </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No primary contact</SelectItem>
                  {members
                    .filter(member => member.member_type === 'adult' && member.status === 'active')
                    .sort((a, b) => `${a.firstname} ${a.lastname}`.localeCompare(`${b.firstname} ${b.lastname}`))
                    .map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.firstname} {member.lastname}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The primary contact is the main person to contact for this family.
              </p>
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Family</DialogTitle>
            <DialogDescription>
              Manage family members and settings.
            </DialogDescription>
          </DialogHeader>
          {selectedFamily && (
            <div className="space-y-6">
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
                    onClick={() => handleUpdateFamilyName(selectedFamily.id, selectedFamily.family_name)}
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
                    value={selectedFamily.primary_contact_id || 'none'}
                    onValueChange={(value) => setSelectedFamily(prev => ({ ...prev, primary_contact_id: value === 'none' ? '' : value }))}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a primary contact" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No primary contact</SelectItem>
                      
                      {/* Adults Section */}
                      {selectedFamily.members.filter(member => member.member_type === 'adult').length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground bg-muted">
                            Adults
                          </div>
                          {selectedFamily.members
                            .filter(member => member.member_type === 'adult')
                            .sort((a, b) => `${a.firstname} ${a.lastname}`.localeCompare(`${b.firstname} ${b.lastname}`))
                            .map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.firstname} {member.lastname}
                              </SelectItem>
                            ))}
                        </>
                      )}
                      
                      {/* Children Section */}
                      {selectedFamily.members.filter(member => member.member_type === 'child').length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground bg-muted">
                            Children
                          </div>
                          {selectedFamily.members
                            .filter(member => member.member_type === 'child')
                            .sort((a, b) => `${a.firstname} ${a.lastname}`.localeCompare(`${b.firstname} ${b.lastname}`))
                            .map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.firstname} {member.lastname}
                              </SelectItem>
                            ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <Button 
                    size="sm"
                    onClick={() => handleUpdateFamilyPrimaryContact(selectedFamily.id, selectedFamily.primary_contact_id)}
                  >
                    Update
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  The primary contact is the main person to contact for this family.
                </p>
              </div>

              {/* Current Members */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Current Members</h4>
                {selectedFamily.members.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No members in this family yet.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedFamily.members.map((member) => (
                      <div 
                        key={member.id} 
                        className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/members/${member.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.image_url} />
                            <AvatarFallback className="text-xs">
                              {getInitials(member.firstname, member.lastname)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">
                              {member.firstname} {member.lastname}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {member.member_type} • {member.relationship_type}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={member.relationship_type}
                            onValueChange={async (value) => {
                              // Update relationship type
                              await familyService.updateFamilyRelationship(selectedFamily.id, member.id, { relationship_type: value });
                              
                              // Refresh the dialog data
                              const updatedFamilies = await familyService.getFamilies();
                              const updatedFamily = updatedFamilies.find(f => f.id === selectedFamily.id);
                              setSelectedFamily(updatedFamily);
                              
                              const available = await familyService.getAvailableMembers(selectedFamily.id);
                              setAvailableMembers(available);
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
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
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveMemberFromFamily(member.id);
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Members */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Add Members</h4>
                <div className="space-y-3">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search members to add..."
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {/* Smart Suggestions */}
                  {(() => {
                    const familyName = selectedFamily?.family_name?.toLowerCase() || '';
                    const familyNameWords = familyName.split(/\s+/).filter(word => word.length > 2);
                    
                    // Get suggested members based on family name
                    const suggestedMembers = availableMembers
                      .filter(m => !selectedFamily.members.find(fm => fm.id === m.id))
                      .filter(m => {
                        const memberLastName = m.lastname?.toLowerCase() || '';
                        const memberFirstName = m.firstname?.toLowerCase() || '';
                        
                        // Check if any word in family name matches member's last name
                        const lastNameMatch = familyNameWords.some(word => 
                          memberLastName.includes(word) || word.includes(memberLastName)
                        );
                        
                        // Check if family name contains member's last name
                        const familyContainsLastName = familyName.includes(memberLastName);
                        
                        // Check if member's last name contains family name
                        const lastNameContainsFamily = memberLastName.includes(familyName);
                        
                        return lastNameMatch || familyContainsLastName || lastNameContainsFamily;
                      })
                      .slice(0, 3); // Limit to top 3 suggestions
                    
                    // Get filtered members based on search query
                    const filteredMembers = availableMembers
                      .filter(m => !selectedFamily.members.find(fm => fm.id === m.id))
                      .filter(m => 
                        m.firstname?.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                        m.lastname?.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                        m.email?.toLowerCase().includes(memberSearchQuery.toLowerCase())
                      );
                    
                    // Show suggestions if no search query and we have suggestions
                    if (!memberSearchQuery && suggestedMembers.length > 0) {
                      return (
                        <div className="space-y-3">
                          <div className="text-xs font-medium text-muted-foreground">
                            Suggested members for "{selectedFamily?.family_name}":
                          </div>
                          <div className="space-y-2">
                            {suggestedMembers.map((member) => (
                              <div 
                                key={member.id} 
                                className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50 bg-blue-50 border-blue-200"
                                onClick={() => navigate(`/members/${member.id}`)}
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={member.image_url} />
                                    <AvatarFallback className="text-xs">
                                      {getInitials(member.firstname, member.lastname)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium text-sm">
                                      {member.firstname} {member.lastname}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {member.member_type} • {member.email}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Select
                                    defaultValue="other"
                                    onValueChange={(value) => handleAddMemberToFamily(member.id, value)}
                                    onClick={(e) => e.stopPropagation()}
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
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddMemberToFamily(member.id, 'other');
                                    }}
                                  >
                                    Add
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                          {filteredMembers.length > 0 && (
                            <div className="pt-2 border-t">
                              <div className="text-xs font-medium text-muted-foreground mb-2">
                                All available members:
                              </div>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {filteredMembers.map((member) => (
                                  <div 
                                    key={member.id} 
                                    className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                                    onClick={() => navigate(`/members/${member.id}`)}
                                  >
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage src={member.image_url} />
                                        <AvatarFallback className="text-xs">
                                          {getInitials(member.firstname, member.lastname)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <div className="font-medium text-sm">
                                          {member.firstname} {member.lastname}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {member.member_type} • {member.email}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Select
                                        defaultValue="other"
                                        onValueChange={(value) => handleAddMemberToFamily(member.id, value)}
                                        onClick={(e) => e.stopPropagation()}
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
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAddMemberToFamily(member.id, 'other');
                                        }}
                                      >
                                        Add
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }
                    
                    // Show filtered results when searching
                    if (filteredMembers.length === 0) {
                      return (
                        <div className="text-center py-4">
                          <p className="text-sm text-muted-foreground">
                            {memberSearchQuery ? 'No members found matching your search.' : 'No available members to add.'}
                          </p>
                        </div>
                      );
                    }
                    
                    return (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {filteredMembers.map((member) => (
                          <div 
                            key={member.id} 
                            className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                            onClick={() => navigate(`/members/${member.id}`)}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={member.image_url} />
                                <AvatarFallback className="text-xs">
                                  {getInitials(member.firstname, member.lastname)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-sm">
                                  {member.firstname} {member.lastname}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {member.member_type} • {member.email}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Select
                                defaultValue="other"
                                onValueChange={(value) => handleAddMemberToFamily(member.id, value)}
                                onClick={(e) => e.stopPropagation()}
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddMemberToFamily(member.id, 'other');
                                }}
                              >
                                Add
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Family Details Dialog */}
      <Dialog open={isFamilyDetailsDialogOpen} onOpenChange={setIsFamilyDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Family Details</DialogTitle>
            <DialogDescription>
              View and manage family information.
            </DialogDescription>
          </DialogHeader>
          {selectedFamilyForDetails && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{selectedFamilyForDetails.family_name}</h3>
                
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Family Members</h4>
                  <div className="space-y-2">
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
                          className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/members/${member.id}`)}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.image_url} />
                              <AvatarFallback className="text-xs">
                                {getInitials(member.firstname, member.lastname)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">
                                {member.firstname} {member.lastname}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {member.member_type} • {member.relationship_type}
                              </div>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {selectedFamilyForDetails.primary_contact_id && (
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Primary Contact</h4>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Crown className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm">
                        {selectedFamilyForDetails.members.find(m => m.id === selectedFamilyForDetails.primary_contact_id)?.firstname} {selectedFamilyForDetails.members.find(m => m.id === selectedFamilyForDetails.primary_contact_id)?.lastname}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </PermissionGuard>
  );
}
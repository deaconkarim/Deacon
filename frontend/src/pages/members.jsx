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
  MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { PermissionGuard, PermissionButton } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/lib/permissions.jsx';
import { getMembers, deleteMember } from '@/lib/data';
import { familyService } from '@/lib/familyService';
import { useToast } from '@/components/ui/use-toast';

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
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        {/* Clean header */}
        <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">People</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Church directory</p>
            </div>
            <PermissionButton 
              permission={PERMISSIONS.MEMBERS_CREATE}
              onClick={() => setIsAddDialogOpen(true)}
              className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add
            </PermissionButton>
          </div>
        </div>

        {/* Simple search */}
        <div className="bg-white dark:bg-slate-800 px-4 py-3 border-b border-gray-200 dark:border-slate-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search people..."
              className="pl-10 h-11 bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 rounded-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Simple filters */}
        <div className="bg-white dark:bg-slate-800 px-4 py-3 border-b border-gray-200 dark:border-slate-700">
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 rounded-lg">
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
              <SelectTrigger className="h-10 bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 rounded-lg">
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

        {/* Content area */}
        <div className="px-4 py-4">
          {members.length === 0 ? (
            <EmptyState onAddMember={() => setIsAddDialogOpen(true)} />
          ) : (
            <Tabs defaultValue="list" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 h-12 bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                <TabsTrigger value="list" className="text-sm rounded-md">List</TabsTrigger>
                <TabsTrigger value="families" className="text-sm rounded-md">Families</TabsTrigger>
              </TabsList>
              
              <TabsContent value="list">
                <Card>
                  <CardContent className="p-0">
                    <div className="relative w-full overflow-auto">
                      <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b">
                          <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <th className="h-16 px-4 text-left align-middle font-medium">
                              <Button 
                                variant="ghost" 
                                className="flex items-center gap-1 h-12"
                                onClick={() => handleSort('lastname')}
                              >
                                Name
                                {sortField === 'lastname' && (
                                  sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </th>
                            <th className="h-16 px-4 text-left align-middle font-medium hidden md:table-cell">
                              <Button 
                                variant="ghost" 
                                className="flex items-center gap-1 h-12"
                                onClick={() => handleSort('email')}
                              >
                                Email
                                {sortField === 'email' && (
                                  sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </th>
                            <th className="h-16 px-4 text-left align-middle font-medium hidden lg:table-cell">
                              <Button 
                                variant="ghost" 
                                className="flex items-center gap-1 h-12"
                                onClick={() => handleSort('phone')}
                              >
                                Phone
                                {sortField === 'phone' && (
                                  sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </th>
                            <th className="h-16 px-4 align-middle">
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
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={member.image_url} />
                                    <AvatarFallback className="text-xs">
                                      {getInitials(member.firstname, member.lastname)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{formatName(member.firstname, member.lastname)}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="h-16 px-4 align-middle hidden md:table-cell">
                                <div className="text-sm">{member.email}</div>
                              </td>
                              <td className="h-16 px-4 align-middle hidden lg:table-cell">
                                <div className="text-sm">{member.phone}</div>
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
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Card className="p-3">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                        <CardTitle className="text-xs font-medium">Total Families</CardTitle>
                        <Heart className="h-3 w-3 text-muted-foreground" />
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="text-xl font-bold">{families.length}</div>
                      </CardContent>
                    </Card>
                    <Card className="p-3">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                        <CardTitle className="text-xs font-medium">Total People</CardTitle>
                        <Users className="h-3 w-3 text-muted-foreground" />
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="text-xl font-bold">{members.length}</div>
                      </CardContent>
                    </Card>
                    <Card className="p-3">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                        <CardTitle className="text-xs font-medium">In Families</CardTitle>
                        <User className="h-3 w-3 text-muted-foreground" />
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="text-xl font-bold">
                          {families.reduce((total, family) => total + family.members.length, 0)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="p-3">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                        <CardTitle className="text-xs font-medium">Children</CardTitle>
                        <Baby className="h-3 w-3 text-muted-foreground" />
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="text-xl font-bold">
                          {members.filter(m => m.member_type === 'child').length}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => setIsFamilyDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Family
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {families.map((family) => (
                      <Card 
                        key={family.id} 
                        className="hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => navigate(`/families/${family.id}`)}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg">{family.family_name}</CardTitle>
                              <CardDescription>
                                {family.members.length} member{family.members.length !== 1 ? 's' : ''}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Members</h4>
                            <div className="space-y-1">
                              {family.members.slice(0, 3).map((member) => (
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
                                  </div>
                                </div>
                              ))}
                              {family.members.length > 3 && (
                                <div className="text-xs text-muted-foreground">
                                  +{family.members.length - 3} more member{family.members.length - 3 !== 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          </div>

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
        </div>
      </div>

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
    </PermissionGuard>
  );
}
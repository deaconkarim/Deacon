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
  MoreVertical,
  UserPlus,
  MapPin,
  ChevronDown,
  ChevronUp,
  Pencil,
  Clock,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { getMembers, addMember, updateMember, deleteMember, getMemberAttendance } from '../lib/data';
import { Badge } from '@/components/ui/badge';
import { AddressInput } from '@/components/ui/address-input';
import { useAuth } from '@/lib/authContext';
import { Textarea } from '@/components/ui/textarea';
import { formatName, getInitials, formatPhoneNumber } from '@/lib/utils/formatters';
import { useNavigate } from 'react-router-dom';
import MemberForm from '@/components/members/MemberForm';

export function People() {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [viewMode, setViewMode] = useState('grid');
  const [sortField, setSortField] = useState('lastName');
  const [sortDirection, setSortDirection] = useState('asc');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [newMember, setNewMember] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: ''
    },
    status: 'active',
    notes: '',
    joinDate: new Date().toISOString().split('T')[0]
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const [memberAttendance, setMemberAttendance] = useState({});
  const [isAttendanceLoading, setIsAttendanceLoading] = useState({});
  const navigate = useNavigate();
  
  useEffect(() => {
    loadMembers();
  }, []);
  
  const loadMembers = async () => {
    try {
      const data = await getMembers();
      // Sort the data by last name and first name
      const sortedData = data.sort((a, b) => {
        const lastNameCompare = (a.lastName || '').localeCompare(b.lastName || '');
        if (lastNameCompare !== 0) return lastNameCompare;
        return (a.firstName || '').localeCompare(b.firstName || '');
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
        member.firstName.toLowerCase().includes(query) ||
        member.lastName.toLowerCase().includes(query) ||
        (member.email && member.email.toLowerCase().includes(query)) ||
        (member.phone && member.phone.toLowerCase().includes(query))
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(member => member.status === statusFilter);
    }

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
  }, [searchQuery, statusFilter, members, sortField, sortDirection]);
  
  const handleAddMember = async () => {
    try {
      // Only include address if at least one field is filled
      const hasAddress = newMember.address.street || newMember.address.city || newMember.address.state || newMember.address.zip;
      const memberData = {
        ...newMember,
        address: hasAddress ? {
          street: newMember.address.street || '',
          city: newMember.address.city || '',
          state: newMember.address.state || '',
          zip: newMember.address.zip || ''
        } : null
      };
      console.log('Adding person with data:', memberData);
      const addedMember = await addMember(memberData);
      console.log('Added person:', addedMember);
      setMembers(prev => [addedMember, ...prev]);
      setIsAddDialogOpen(false);
      setNewMember({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: {
          street: '',
          city: '',
          state: '',
          zip: ''
        },
        status: 'active',
        notes: '',
        joinDate: new Date().toISOString().split('T')[0]
      });
      toast({
        title: "Success",
        description: "Person added successfully"
      });
    } catch (error) {
      console.error('Error adding person:', error);
      toast({
        title: "Error",
        description: "Failed to add person",
        variant: "destructive",
      });
    }
  };
  
  const handleUpdateMember = async () => {
    try {
      const memberData = {
        ...selectedMember,
        firstName: selectedMember.firstName.trim(),
        lastName: selectedMember.lastName.trim(),
        email: selectedMember.email.trim() || null,
        phone: selectedMember.phone.trim() || null,
        address: selectedMember.address.street.trim() ? selectedMember.address : null
      };
      const updatedMember = await updateMember(selectedMember.id, memberData);
      setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
      setIsEditDialogOpen(false);
      setSelectedMember(null);
      toast({
        title: "Success",
        description: "Person updated successfully"
      });
    } catch (error) {
      console.error('Error updating person:', error);
      toast({
        title: "Error",
        description: error.message === 'A member with this email already exists' 
          ? "A person with this email already exists. Please use a different email."
          : "Failed to update person",
        variant: "destructive",
      });
    }
  };
  
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
  
  const handleSelectMember = (memberId) => {
    setSelectedMembers(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };
  
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedMembers(filteredMembers.map(member => member.id));
    } else {
      setSelectedMembers([]);
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
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
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
          
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Person
          </Button>
        </div>
      </div>
      
      {members.length === 0 ? (
        <EmptyState onAddMember={() => setIsAddDialogOpen(true)} />
      ) : (
        <Tabs defaultValue="grid" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
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
                      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleMemberClick(member.id)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={member.image_url} />
                            <AvatarFallback>
                              {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-xl">{formatName(member.firstName, member.lastName)}</CardTitle>
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
                      </CardHeader>
                      <CardContent className="pb-3">
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
                        <th className="h-12 tablet:h-14 px-3 tablet:px-4 text-left align-middle font-medium">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="select-all" 
                              onCheckedChange={handleSelectAll}
                              checked={selectedMembers.length === filteredMembers.length && filteredMembers.length > 0}
                              className="touch-target"
                            />
                            <Button 
                              variant="ghost" 
                              className="flex items-center gap-1 touch-target"
                              onClick={() => handleSort('lastName')}
                            >
                              Name
                              {sortField === 'lastName' && (
                                sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </th>
                        <th className="h-12 tablet:h-14 px-3 tablet:px-4 text-left align-middle font-medium hidden sm:table-cell">
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
                        <th className="h-12 tablet:h-14 px-3 tablet:px-4 text-left align-middle font-medium hidden tablet:table-cell">
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
                        <th className="h-12 tablet:h-14 px-3 tablet:px-4 text-left align-middle font-medium hidden lg:table-cell">
                          <Button 
                            variant="ghost" 
                            className="flex items-center gap-1 touch-target"
                            onClick={() => handleSort('joinDate')}
                          >
                            Join Date
                            {sortField === 'joinDate' && (
                              sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </th>
                        <th className="h-12 tablet:h-14 px-3 tablet:px-4 text-left align-middle font-medium">
                          <Button 
                            variant="ghost" 
                            className="flex items-center gap-1 touch-target"
                            onClick={() => handleSort('status')}
                          >
                            Status
                            {sortField === 'status' && (
                              sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </th>

                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {filteredMembers.length > 0 ? (
                        filteredMembers.map((member) => (
                          <tr 
                            key={member.id} 
                            className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                          >
                            <td className="p-3 tablet:p-4 align-middle">
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id={`select-${member.id}`} 
                                  checked={selectedMembers.includes(member.id)}
                                  onCheckedChange={() => handleSelectMember(member.id)}
                                  className="touch-target"
                                />
                                <div className="flex items-center">
                                  <Avatar className="h-8 w-8 tablet:h-10 tablet:w-10 mr-2">
                                    <AvatarImage src={member.image_url} />
                                    <AvatarFallback className="text-xs tablet:text-sm">
                                      {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0">
                                    <span className="tablet:text-base">{member.firstName} {member.lastName}</span>
                                    <div className="sm:hidden text-xs text-gray-500 truncate">{member.email}</div>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 tablet:p-4 align-middle hidden sm:table-cell tablet:text-base">{member.email}</td>
                            <td className="p-3 tablet:p-4 align-middle hidden tablet:table-cell tablet:text-base">{formatPhoneNumber(member.phone)}</td>
                            <td className="p-3 tablet:p-4 align-middle hidden lg:table-cell tablet:text-base">{formatDate(member.joinDate || member.created_at)}</td>
                            <td className="p-3 tablet:p-4 align-middle">
                              {member.status === 'active' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs tablet:text-sm font-medium bg-green-100 text-green-800">
                                  Active
                                </span>
                              ) : member.status === 'visitor' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs tablet:text-sm font-medium bg-blue-100 text-blue-800">
                                  Visitor
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs tablet:text-sm font-medium bg-gray-100 text-gray-800">
                                  Inactive
                                </span>
                              )}
                            </td>

                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-muted-foreground">
                            No people found matching your criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
              {selectedMembers.length > 0 && (
                <CardFooter className="border-t p-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      {selectedMembers.length} {selectedMembers.length === 1 ? 'person' : 'people'} selected
                    </span>
                    <Button variant="outline" size="sm" onClick={() => setSelectedMembers([])}>
                      Clear Selection
                    </Button>
                    <Button variant="outline" size="sm">
                      <Mail className="mr-2 h-4 w-4" />
                      Email Selected
                    </Button>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Selected
                    </Button>
                  </div>
                </CardFooter>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      )}
      
      {/* Add Person Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Member</DialogTitle>
            <DialogDescription>
              Enter the member's information below.
            </DialogDescription>
          </DialogHeader>
          <MemberForm
            initialData={{
              firstname: '',
              lastname: '',
              email: '',
              phone: '',
              status: 'active',
              image_url: ''
            }}
            onSave={async (memberData) => {
              try {
                const addedMember = await addMember({
                  firstName: memberData.firstname,
                  lastName: memberData.lastname,
                  email: memberData.email,
                  phone: memberData.phone,
                  status: memberData.status,
                  image_url: memberData.image_url
                });
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
        </DialogContent>
      </Dialog>
      
      {/* Edit Member Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
            <DialogDescription>
              Update the member's information below.
            </DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <MemberForm
              initialData={{
                firstname: selectedMember.firstName,
                lastname: selectedMember.lastName,
                email: selectedMember.email,
                phone: selectedMember.phone,
                status: selectedMember.status,
                image_url: selectedMember.image_url
              }}
              onSave={async (memberData) => {
                try {
                  const updatedMember = await updateMember(selectedMember.id, {
                    firstName: memberData.firstname,
                    lastName: memberData.lastname,
                    email: memberData.email,
                    phone: memberData.phone,
                    status: memberData.status,
                    image_url: memberData.image_url
                  });
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
    </div>
  );
}

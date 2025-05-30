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
  Pencil
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { getMembers, addMember, updateMember, deleteMember } from '../lib/data';
import { Badge } from '@/components/ui/badge';
import { AddressInput } from '@/components/ui/address-input';
import { useAuth } from '@/lib/authContext';
import { Textarea } from '@/components/ui/textarea';

export function People() {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
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
      const memberData = {
        ...newMember,
        firstName: newMember.firstName.trim(),
        lastName: newMember.lastName.trim(),
        email: newMember.email.trim() || null,
        phone: newMember.phone.trim() || null,
        address: newMember.address.street.trim() ? newMember.address : null
      };
      const addedMember = await addMember(memberData);
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
  };
  
  const handleDeleteMember = async () => {
    try {
      await deleteMember(selectedMember.id);
      setMembers(prev => prev.filter(m => m.id !== selectedMember.id));
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
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Users className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">No Members Yet</h3>
      <p className="text-muted-foreground mb-4">
        Start building your church community by adding your first member.
      </p>
      <Button onClick={onAddMember}>
        <UserPlus className="mr-2 h-4 w-4" />
        Add First Member
      </Button>
    </div>
  );
  
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
          Manage your church members and their information.
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
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
                    <Card className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar>
                              <AvatarFallback>
                                {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg">
                                {member.firstName} {member.lastName}
                              </CardTitle>
                              <CardDescription>
                                {member.email || 'No email provided'}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                            {member.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {member.phone && (
                            <div className="flex items-center text-sm">
                              <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                              {member.phone}
                            </div>
                          )}
                          {member.address && (
                            <div className="flex items-center text-sm">
                              <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                              {member.address.street}, {member.address.city}, {member.address.state} {member.address.zip}
                            </div>
                          )}
                          <div className="flex items-center text-sm">
                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                            Joined {format(new Date(member.joinDate || member.created_at), 'MMM d, yyyy')}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="border-t p-4">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedMember(member);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setSelectedMember(member);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No members found matching your criteria.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="list">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="[&_tr]:border-b">
                      <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <th className="h-12 px-4 text-left align-middle font-medium">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="select-all" 
                              onCheckedChange={handleSelectAll}
                              checked={selectedMembers.length === filteredMembers.length && filteredMembers.length > 0}
                            />
                            <Button 
                              variant="ghost" 
                              className="flex items-center gap-1"
                              onClick={() => handleSort('lastName')}
                            >
                              Last Name
                              {sortField === 'lastName' && (
                                <ChevronUp className={`h-4 w-4 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                              )}
                            </Button>
                          </div>
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium">
                          <Button 
                            variant="ghost" 
                            className="flex items-center gap-1"
                            onClick={() => handleSort('firstName')}
                          >
                            First Name
                            {sortField === 'firstName' && (
                              <ChevronUp className="h-4 w-4" />
                            )}
                          </Button>
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium">
                          <Button 
                            variant="ghost" 
                            className="flex items-center gap-1"
                            onClick={() => handleSort('email')}
                          >
                            Email
                            {sortField === 'email' && (
                              <ChevronUp className="h-4 w-4" />
                            )}
                          </Button>
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium">
                          <Button 
                            variant="ghost" 
                            className="flex items-center gap-1"
                            onClick={() => handleSort('phone')}
                          >
                            Phone
                            {sortField === 'phone' && (
                              <ChevronUp className="h-4 w-4" />
                            )}
                          </Button>
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium">
                          <Button 
                            variant="ghost" 
                            className="flex items-center gap-1"
                            onClick={() => handleSort('joinDate')}
                          >
                            Join Date
                            {sortField === 'joinDate' && (
                              <ChevronUp className="h-4 w-4" />
                            )}
                          </Button>
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium">
                          <Button 
                            variant="ghost" 
                            className="flex items-center gap-1"
                            onClick={() => handleSort('status')}
                          >
                            Status
                            {sortField === 'status' && (
                              <ChevronUp className="h-4 w-4" />
                            )}
                          </Button>
                        </th>
                        <th className="h-12 px-4 text-right align-middle font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {filteredMembers.length > 0 ? (
                        filteredMembers.map((member) => (
                          <tr 
                            key={member.id} 
                            className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                          >
                            <td className="p-4 align-middle">
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id={`select-${member.id}`} 
                                  checked={selectedMembers.includes(member.id)}
                                  onCheckedChange={() => handleSelectMember(member.id)}
                                />
                                <div className="flex items-center">
                                  <Avatar className="h-8 w-8 mr-2">
                                    <AvatarFallback className="text-xs">
                                      {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{member.firstName} {member.lastName}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 align-middle">{member.email}</td>
                            <td className="p-4 align-middle">{member.phone}</td>
                            <td className="p-4 align-middle">{format(new Date(member.joinDate || member.created_at), 'MMM d, yyyy')}</td>
                            <td className="p-4 align-middle">
                              <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                                {member.status}
                              </Badge>
                            </td>
                            <td className="p-4 align-middle text-right">
                              <div className="flex justify-end space-x-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={() => {
                                    setSelectedMember(member);
                                    setIsEditDialogOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => {
                                    setSelectedMember(member);
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
                          <td colSpan={6} className="p-4 text-center text-muted-foreground">
                            No members found matching your criteria.
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
                      {selectedMembers.length} {selectedMembers.length === 1 ? 'member' : 'members'} selected
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
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={newMember.firstName}
                onChange={(e) => setNewMember(prev => ({ ...prev, firstName: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={newMember.lastName}
                onChange={(e) => setNewMember(prev => ({ ...prev, lastName: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newMember.email}
                onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={newMember.phone}
                onChange={(e) => setNewMember(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <AddressInput
                value={newMember.address}
                onChange={(address) => setNewMember(prev => ({ ...prev, address }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={newMember.status}
                onValueChange={(value) => setNewMember(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="visitor">Visitor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newMember.notes}
                onChange={(e) => setNewMember(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMember}>
              Add Person
            </Button>
          </DialogFooter>
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
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit_firstName">First Name</Label>
                <Input
                  id="edit_firstName"
                  value={selectedMember.firstName}
                  onChange={(e) => setSelectedMember(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_lastName">Last Name</Label>
                <Input
                  id="edit_lastName"
                  value={selectedMember.lastName}
                  onChange={(e) => setSelectedMember(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_email">Email</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={selectedMember.email}
                  onChange={(e) => setSelectedMember(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_phone">Phone</Label>
                <Input
                  id="edit_phone"
                  type="tel"
                  value={selectedMember.phone}
                  onChange={(e) => setSelectedMember(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <AddressInput
                  value={selectedMember.address}
                  onChange={(address) => setSelectedMember(prev => ({ ...prev, address }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_status">Status</Label>
                <Select
                  value={selectedMember.status}
                  onValueChange={(value) => setSelectedMember(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="visitor">Visitor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_notes">Notes</Label>
                <Textarea
                  id="edit_notes"
                  value={selectedMember.notes}
                  onChange={(e) => setSelectedMember(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateMember}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Member Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this member? This action cannot be undone.
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
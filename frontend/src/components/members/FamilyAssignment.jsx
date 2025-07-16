import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Users, Plus, Search, UserPlus, Home, ChevronRight, Mail, Phone } from 'lucide-react';
import { familyService } from '@/lib/familyService';
import { formatName, getInitials, formatPhoneNumber } from '@/lib/utils/formatters';
import { supabase } from '@/lib/supabase';

export default function FamilyAssignment({ member, onFamilyUpdate }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [families, setFamilies] = useState([]);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState('');
  const [newFamilyName, setNewFamilyName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentFamily, setCurrentFamily] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadFamilies();
    loadCurrentFamily();
  }, [member]);

  const loadFamilies = async () => {
    try {
      const familiesData = await familyService.getFamilies();
      setFamilies(familiesData);
    } catch (error) {
      console.error('Error loading families:', error);
      toast({
        title: "Error",
        description: "Failed to load families",
        variant: "destructive",
      });
    }
  };

  const loadCurrentFamily = async () => {
    if (!member) return;
    
    try {
      const familiesData = await familyService.getFamilies();
      const memberFamily = familiesData.find(family => 
        family.members.some(m => m.id === member.id)
      );
      setCurrentFamily(memberFamily);
    } catch (error) {
      console.error('Error loading current family:', error);
    }
  };

  const loadAvailableMembers = async (familyId) => {
    try {
      const members = await familyService.getAvailableMembers(familyId);
      setAvailableMembers(members);
    } catch (error) {
      console.error('Error loading available members:', error);
      toast({
        title: "Error",
        description: "Failed to load available members",
        variant: "destructive",
      });
    }
  };

  const handleCreateFamily = async () => {
    if (!newFamilyName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a family name",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const newFamily = await familyService.createFamily({
        family_name: newFamilyName.trim()
      });

      if (newFamily) {
        // Add the current member to the new family
        await familyService.addMemberToFamily(newFamily.id, member.id, 'other', true);
        
        toast({
          title: "Success",
          description: `Created family "${newFamilyName}" and added ${formatName(member.firstname, member.lastname)}`,
        });

        setNewFamilyName('');
        setIsCreateDialogOpen(false);
        await loadFamilies();
        await loadCurrentFamily();
        if (onFamilyUpdate) onFamilyUpdate();
      }
    } catch (error) {
      console.error('Error creating family:', error);
      toast({
        title: "Error",
        description: "Failed to create family",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignToFamily = async () => {
    if (!selectedFamily) {
      toast({
        title: "Error",
        description: "Please select a family",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await familyService.addMemberToFamily(selectedFamily, member.id, 'other', false);
      
      const selectedFamilyData = families.find(f => f.id === selectedFamily);
      toast({
        title: "Success",
        description: `Added ${formatName(member.firstname, member.lastname)} to ${selectedFamilyData?.family_name || 'family'}`,
      });

      setSelectedFamily('');
      setIsAssignDialogOpen(false);
      await loadFamilies();
      await loadCurrentFamily();
      if (onFamilyUpdate) onFamilyUpdate();
    } catch (error) {
      console.error('Error assigning to family:', error);
      toast({
        title: "Error",
        description: "Failed to assign to family",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromFamily = async () => {
    if (!currentFamily) return;

    setIsLoading(true);
    try {
      // Remove the member from the family relationship
      const { error } = await supabase
        .from('family_relationships')
        .delete()
        .eq('family_id', currentFamily.id)
        .eq('member_id', member.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Removed ${formatName(member.firstname, member.lastname)} from family`,
      });

      setCurrentFamily(null);
      await loadFamilies();
      if (onFamilyUpdate) onFamilyUpdate();
    } catch (error) {
      console.error('Error removing from family:', error);
      toast({
        title: "Error",
        description: "Failed to remove from family",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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

  const getRelationshipText = (familyMember) => {
    const parts = [];
    
    // Member type
    parts.push(familyMember.member_type || 'Member');
    
    // Relationship (if available)
    if (familyMember.relationship) {
      parts.push(familyMember.relationship);
    }
    
    // Age (if available)
    if (familyMember.birth_date) {
      const age = calculateAge(familyMember.birth_date);
      if (age) {
        parts.push(`${age} years old`);
      }
    }
    
    return parts.join(' • ');
  };

  const filteredFamilies = families.filter(family =>
    family.family_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Current Family Status */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4 bg-gradient-to-r from-pink-50 to-pink-100 dark:from-pink-950/20 dark:to-pink-900/20 border-b border-pink-200 dark:border-pink-800">
          <CardTitle className="text-lg font-bold text-pink-900 dark:text-pink-100 flex items-center gap-2">
            <Home className="h-5 w-5" />
            Family Assignment
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {currentFamily ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-pink-900 dark:text-pink-100">
                    {currentFamily.family_name}
                  </h4>
                  <p className="text-sm text-pink-600 dark:text-pink-400">
                    {currentFamily.members.length} member{currentFamily.members.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRemoveFromFamily}
                  disabled={isLoading}
                  className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                >
                  Remove from Family
                </Button>
              </div>
              
              {/* Family Members - Detailed cards with images and info */}
              <div className="space-y-3">
                <h5 className="text-sm font-medium text-pink-800 dark:text-pink-200">Family Members:</h5>
                <div className="space-y-3">
                  {currentFamily.members.map((familyMember) => (
                    <div 
                      key={familyMember.id} 
                      className="flex items-center p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                      onClick={() => navigate(`/members/${familyMember.id}`)}
                    >
                      <Avatar className="h-12 w-12 mr-4">
                        <AvatarImage src={familyMember.image_url} />
                        <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-slate-500 to-slate-600 text-white">
                          {getInitials(familyMember.firstname, familyMember.lastname)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {formatName(familyMember.firstname, familyMember.lastname)}
                                                      {familyMember.id === member.id && " (Current)"}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                          {getRelationshipText(familyMember)}
                        </div>
                        <div className="space-y-1">
                          {familyMember.email && (
                            <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                              <Mail className="h-3 w-3 mr-2" />
                              {familyMember.email}
                            </div>
                          )}
                          {familyMember.phone && (
                            <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                              <Phone className="h-3 w-3 mr-2" />
                              {formatPhoneNumber(familyMember.phone)}
                            </div>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-pink-400 mx-auto mb-3" />
              <p className="text-pink-600 dark:text-pink-400 mb-2">Not in a family</p>
              <p className="text-sm text-pink-500 dark:text-pink-300 mb-4">
                {formatName(member?.firstname, member?.lastname)} is not currently assigned to any family.
              </p>
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={() => setIsAssignDialogOpen(true)}
                  disabled={isLoading}
                  className="bg-pink-500 hover:bg-pink-600"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Assign to Existing Family
                </Button>
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  disabled={isLoading}
                  variant="outline"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Family
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create New Family Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Family</DialogTitle>
            <DialogDescription>
              Create a new family and add {formatName(member?.firstname, member?.lastname)} as the primary contact.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="familyName">Family Name</Label>
              <Input
                id="familyName"
                value={newFamilyName}
                onChange={(e) => setNewFamilyName(e.target.value)}
                placeholder="Enter family name"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFamily} disabled={isLoading || !newFamilyName.trim()}>
              {isLoading ? 'Creating...' : 'Create Family'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign to Existing Family Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign to Existing Family</DialogTitle>
            <DialogDescription>
              Select an existing family to add {formatName(member?.firstname, member?.lastname)} to.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="searchFamily">Search Families</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="searchFamily"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search families..."
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="selectFamily">Select Family</Label>
              <Select value={selectedFamily} onValueChange={setSelectedFamily}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a family" />
                </SelectTrigger>
                <SelectContent>
                  {filteredFamilies.map((family) => (
                    <SelectItem key={family.id} value={family.id}>
                      {family.family_name} ({family.members.length} members)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignToFamily} disabled={isLoading || !selectedFamily}>
              {isLoading ? 'Assigning...' : 'Assign to Family'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
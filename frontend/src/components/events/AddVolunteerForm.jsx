import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getMembers, getEventVolunteers, addEventVolunteer } from '@/lib/data';
import { useToast } from '@/components/ui/use-toast';
import { getInitials } from '@/lib/utils/formatters';

export const AddVolunteerForm = ({ eventId, availableRoles, onVolunteerAdded }) => {
  const [members, setMembers] = useState([]);
  const [existingVolunteers, setExistingVolunteers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [role, setRole] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadMembers();
    loadExistingVolunteers();
  }, [eventId]);

  const loadMembers = async () => {
    try {
      const data = await getMembers();
      setMembers(data || []);
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const loadExistingVolunteers = async () => {
    try {
      const data = await getEventVolunteers(eventId);
      setExistingVolunteers(data || []);
    } catch (error) {
      console.error('Error loading existing volunteers:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedMemberId || !role.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a member and enter a role",
        variant: "destructive",
      });
      return;
    }

    // Check if member is already assigned
    const isAlreadyAssigned = existingVolunteers.some(v => v.member_id === selectedMemberId);
    if (isAlreadyAssigned) {
      toast({
        title: "Already Assigned",
        description: "This member is already assigned to this event",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await addEventVolunteer({
        eventId,
        memberId: selectedMemberId,
        role: role.trim(),
        notes: notes.trim() || null
      });

      toast({
        title: "Success",
        description: "Volunteer added successfully"
      });

      // Reset form
      setSelectedMemberId('');
      setRole('');
      setNotes('');
      
      // Refresh data
      loadExistingVolunteers();
      if (onVolunteerAdded) onVolunteerAdded();
    } catch (error) {
      console.error('Error adding volunteer:', error);
      toast({
        title: "Error",
        description: "Failed to add volunteer",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter out members who are already assigned
  const availableMembers = members.filter(member => 
    !existingVolunteers.some(v => v.member_id === member.id)
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="member">Select Member *</Label>
          <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a member to assign" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {availableMembers.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.image_url} />
                      <AvatarFallback>
                        {getInitials(member.firstname, member.lastname)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{member.firstname} {member.lastname}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {availableMembers.length === 0 && (
            <p className="text-sm text-muted-foreground">
              All members are already assigned to this event.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Role *</Label>
          {availableRoles.length > 0 ? (
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((roleItem, index) => (
                  <SelectItem key={index} value={roleItem.role || roleItem}>
                    {roleItem.role || roleItem}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom Role</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Enter volunteer role (e.g., Usher, Greeter, Worship Team)"
            />
          )}
          {role === 'custom' && (
            <Input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Enter custom role"
              className="mt-2"
            />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes about this volunteer assignment"
            rows="3"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button 
          type="submit" 
          disabled={isLoading || !selectedMemberId || !role.trim() || availableMembers.length === 0}
          className="flex-1"
        >
          {isLoading ? "Adding..." : "Add Volunteer"}
        </Button>
      </div>

      {existingVolunteers.length > 0 && (
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">Already Assigned ({existingVolunteers.length})</h4>
          <div className="space-y-2">
            {existingVolunteers.map((volunteer) => (
              <div key={volunteer.id} className="flex items-center gap-2 text-sm">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={volunteer.member?.image_url} />
                  <AvatarFallback className="text-xs">
                    {getInitials(volunteer.member?.firstname, volunteer.member?.lastname)}
                  </AvatarFallback>
                </Avatar>
                <span>{volunteer.member?.firstname} {volunteer.member?.lastname}</span>
                <span className="text-muted-foreground">- {volunteer.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}; 
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils/formatters';
import { UserPlus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function VolunteerDialog({ isOpen, onClose, event, onVolunteerUpdate }) {
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [notes, setNotes] = useState('');
  const [members, setMembers] = useState([]);
  const [currentVolunteers, setCurrentVolunteers] = useState([]);
  const { toast } = useToast();
  const [isCreateMemberOpen, setIsCreateMemberOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    status: 'active'
  });

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const { data, error } = await supabase
          .from('members')
          .select('id, firstname, lastname, image_url')
          .order('firstname');

        if (error) throw error;
        setMembers(data || []);
      } catch (error) {
        console.error('Error fetching members:', error);
        toast({
          title: 'Error',
          description: 'Failed to load members list',
          variant: 'destructive',
        });
      }
    };

    const fetchCurrentVolunteers = async () => {
      if (!event?.id) return;

      try {
        const { data, error } = await supabase
          .from('event_volunteers')
          .select(`
            *,
            members (
              id,
              firstname,
              lastname,
              image_url
            )
          `)
          .eq('event_id', event.id);

        if (error) throw error;
        setCurrentVolunteers(data || []);
      } catch (error) {
        console.error('Error fetching current volunteers:', error);
        toast({
          title: 'Error',
          description: 'Failed to load current volunteers',
          variant: 'destructive',
        });
      }
    };

    if (isOpen) {
      fetchMembers();
      fetchCurrentVolunteers();
    }
  }, [isOpen, event, toast]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedMemberId('');
      setSelectedRole('');
      setNotes('');
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!event?.id) {
      toast({
        title: 'Error',
        description: 'No event selected',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedMemberId || !selectedRole) {
      toast({
        title: 'Error',
        description: 'Please select a member and role',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Create or update the volunteer record
      const { error: volunteerError } = await supabase
        .from('event_volunteers')
        .upsert({
          event_id: event.id,
          member_id: selectedMemberId,
          role: selectedRole,
          notes: notes
        });

      if (volunteerError) throw volunteerError;

      // Create or update the event attendance
      const { error: attendanceError } = await supabase
        .from('event_attendance')
        .upsert({
          event_id: event.id,
          member_id: selectedMemberId,
          status: 'attending'
        });

      if (attendanceError) throw attendanceError;

      // Refresh the volunteers list
      const { data: updatedVolunteers, error: fetchError } = await supabase
        .from('event_volunteers')
        .select(`
          *,
          members (
            id,
            firstname,
            lastname,
            image_url
          )
        `)
        .eq('event_id', event.id);

      if (fetchError) throw fetchError;
      setCurrentVolunteers(updatedVolunteers || []);

      toast({
        title: 'Success',
        description: 'Volunteer role assigned successfully!',
      });

      // Call onVolunteerUpdate to refresh the parent component's event data
      onVolunteerUpdate();
      onClose();
    } catch (error) {
      console.error('Error submitting volunteer:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit volunteer. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCreateMember = async () => {
    if (!newMember.firstname || !newMember.lastname) {
      toast({
        title: 'Error',
        description: 'First name and last name are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('members')
        .insert([newMember])
        .select()
        .single();

      if (error) throw error;

      // Add the new member to the members list
      setMembers(prev => [...prev, data]);

      // Reset the form
      setNewMember({
        firstname: '',
        lastname: '',
        email: '',
        phone: '',
        status: 'active'
      });

      setIsCreateMemberOpen(false);

      toast({
        title: 'Success',
        description: 'New person created successfully',
      });
    } catch (error) {
      console.error('Error creating member:', error);
      toast({
        title: 'Error',
        description: 'Failed to create new person',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteVolunteer = async (volunteerId) => {
    if (!event?.id) return;

    try {
      // Delete the volunteer record
      const { error: volunteerError } = await supabase
        .from('event_volunteers')
        .delete()
        .eq('id', volunteerId);

      if (volunteerError) throw volunteerError;

      // Refresh the volunteers list
      const { data: updatedVolunteers, error: fetchError } = await supabase
        .from('event_volunteers')
        .select(`
          *,
          members (
            id,
            firstname,
            lastname,
            image_url
          )
        `)
        .eq('event_id', event.id);

      if (fetchError) throw fetchError;
      setCurrentVolunteers(updatedVolunteers || []);

      toast({
        title: 'Success',
        description: 'Volunteer role removed successfully',
      });

      // Call onVolunteerUpdate to refresh the parent component's event data
      onVolunteerUpdate();
    } catch (error) {
      console.error('Error deleting volunteer:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove volunteer. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (!event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full h-screen sm:max-w-full sm:h-screen p-0">
        <DialogHeader className="p-8 border-b">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-3xl">Volunteer Management{event?.title ? ` - ${event.title}` : ''}</DialogTitle>
              <DialogDescription className="text-lg mt-2">
                Assign volunteer roles for this event
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-sm h-9"
              onClick={() => setIsCreateMemberOpen(true)}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Create New Person
            </Button>
          </div>
        </DialogHeader>

        <div className="p-8">
          <div className="space-y-8">
            <div>
              <Label htmlFor="member" className="text-xl mb-4 block">Select Volunteer</Label>
              <Select
                value={selectedMemberId}
                onValueChange={setSelectedMemberId}
              >
                <SelectTrigger className="h-14 text-lg">
                  <SelectValue placeholder="Select a member" />
                </SelectTrigger>
                <SelectContent className="max-h-[50vh]">
                  {members
                    .filter(member => !currentVolunteers.some(volunteer => volunteer.member_id === member.id))
                    .map((member) => (
                      <SelectItem key={member.id} value={member.id} className="text-lg">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
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
            </div>
            
            <div>
              <Label htmlFor="role" className="text-xl mb-4 block">Volunteer Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="h-14 text-lg">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="max-h-[50vh]">
                  {event.volunteer_roles?.map((role) => (
                    <SelectItem key={role.role} value={role.role} className="text-lg">
                      {role.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes" className="text-xl mb-4 block">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-32 text-lg"
              />
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Current Volunteers</h3>
            <div className="space-y-4">
              {currentVolunteers.length === 0 ? (
                <p className="text-lg text-muted-foreground">No volunteers assigned yet</p>
              ) : (
                currentVolunteers.map((volunteer) => (
                  <div key={volunteer.id} className="flex items-start gap-6 p-6 border rounded-lg">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={volunteer.members?.image_url} />
                      <AvatarFallback>
                        {getInitials(volunteer.members?.firstname, volunteer.members?.lastname)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="text-xl font-medium">
                        {volunteer.members?.firstname} {volunteer.members?.lastname}
                      </div>
                      <div className="text-lg text-muted-foreground">
                        {volunteer.role}
                      </div>
                      {volunteer.notes && (
                        <div className="text-base text-muted-foreground mt-2">
                          {volunteer.notes}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteVolunteer(volunteer.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="p-8 border-t">
          <Button variant="outline" onClick={onClose} className="text-lg h-14">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedMemberId || !selectedRole} className="text-lg h-14">
            Assign Volunteer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
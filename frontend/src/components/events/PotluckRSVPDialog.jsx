import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils/formatters';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function PotluckRSVPDialog({ isOpen, onClose, event, onRSVP }) {
  const [dishType, setDishType] = useState('');
  const [dishDescription, setDishDescription] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [members, setMembers] = useState([]);
  const [existingRSVP, setExistingRSVP] = useState(null);
  const [currentRSVPs, setCurrentRSVPs] = useState([]);
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

    const fetchCurrentRSVPs = async () => {
      try {
        const { data, error } = await supabase
          .from('potluck_rsvps')
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
        setCurrentRSVPs(data || []);
      } catch (error) {
        console.error('Error fetching current RSVPs:', error);
        toast({
          title: 'Error',
          description: 'Failed to load current RSVPs',
          variant: 'destructive',
        });
      }
    };

    if (isOpen) {
      fetchMembers();
      fetchCurrentRSVPs();
    }
  }, [isOpen, event, toast]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setDishType('');
      setDishDescription('');
      setSelectedMemberId('');
      setExistingRSVP(null);
    }
  }, [isOpen]);

  // Check for existing RSVP when member is selected
  useEffect(() => {
    const checkExistingRSVP = async () => {
      if (!selectedMemberId || !event) return;

      try {
        const { data, error } = await supabase
          .from('potluck_rsvps')
          .select('*')
          .eq('event_id', event.id)
          .eq('member_id', selectedMemberId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setExistingRSVP(data);
          setDishType(data.dish_type);
          setDishDescription(data.dish_description || '');
        } else {
          setExistingRSVP(null);
          setDishType('');
          setDishDescription('');
        }
      } catch (error) {
        console.error('Error checking existing RSVP:', error);
        toast({
          title: 'Error',
          description: 'Failed to check existing RSVP',
          variant: 'destructive',
        });
      }
    };

    checkExistingRSVP();
  }, [selectedMemberId, event, toast]);

  const handleSubmit = async () => {
    if (!selectedMemberId) {
      toast({
        title: 'Error',
        description: 'Please select a member',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Create or update the potluck RSVP
      const { error: rsvpError } = await supabase
        .from('potluck_rsvps')
        .upsert({
          id: existingRSVP?.id,
          event_id: event.id,
          member_id: selectedMemberId,
          dish_type: dishType,
          dish_description: dishDescription
        });

      if (rsvpError) throw rsvpError;

      // Create or update the event attendance
      const { error: attendanceError } = await supabase
        .from('event_attendance')
        .upsert({
          event_id: event.id,
          member_id: selectedMemberId,
          status: 'attending'
        });

      if (attendanceError) throw attendanceError;

      // Refresh the RSVPs list
      const { data: updatedRSVPs, error: fetchError } = await supabase
        .from('potluck_rsvps')
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
      setCurrentRSVPs(updatedRSVPs || []);

      toast({
        title: existingRSVP ? 'RSVP Updated' : 'RSVP Submitted',
        description: existingRSVP 
          ? 'Your potluck RSVP has been updated!'
          : 'Thank you for signing up for the potluck!',
      });

      // Call onRSVP to refresh the parent component's event data
      onRSVP();
      onClose();
    } catch (error) {
      console.error('Error submitting RSVP:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit RSVP. Please try again.',
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

  const handleDeleteRSVP = async (rsvpId) => {
    try {
      // Get the RSVP details first to get the member_id
      const { data: rsvp, error: fetchError } = await supabase
        .from('potluck_rsvps')
        .select('member_id')
        .eq('id', rsvpId)
        .single();

      if (fetchError) throw fetchError;

      // Delete the event attendance record
      const { error: attendanceError } = await supabase
        .from('event_attendance')
        .delete()
        .eq('event_id', event.id)
        .eq('member_id', rsvp.member_id);

      if (attendanceError) throw attendanceError;

      // Delete the potluck RSVP
      const { error: rsvpError } = await supabase
        .from('potluck_rsvps')
        .delete()
        .eq('id', rsvpId);

      if (rsvpError) throw rsvpError;

      // Refresh the RSVPs list
      const { data: updatedRSVPs, error: listError } = await supabase
        .from('potluck_rsvps')
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

      if (listError) throw listError;
      setCurrentRSVPs(updatedRSVPs || []);

      toast({
        title: 'RSVP Deleted',
        description: 'The potluck RSVP has been removed.',
      });

      // Call onRSVP to refresh the parent component's event data
      onRSVP();
    } catch (error) {
      console.error('Error deleting RSVP:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete RSVP. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const renderRSVPList = (type) => {
    const rsvps = currentRSVPs.filter(rsvp => rsvp.dish_type === type);
    return (
      <div className="space-y-2">
        {rsvps.length === 0 ? (
          <p className="text-sm text-muted-foreground">No {type} dishes signed up yet</p>
        ) : (
          rsvps.map(rsvp => (
            <div key={rsvp.id} className="flex items-center space-x-2 p-2 rounded-md bg-muted/50">
              <Avatar className="h-8 w-8">
                <AvatarImage src={rsvp.members.image_url} />
                <AvatarFallback>
                  {getInitials(rsvp.members.firstname, rsvp.members.lastname)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {rsvp.members.firstname} {rsvp.members.lastname}
                </p>
                {rsvp.dish_description && (
                  <p className="text-xs text-muted-foreground">{rsvp.dish_description}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full h-screen sm:max-w-full sm:h-screen p-0">
        <DialogHeader className="p-8 border-b">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-3xl">Potluck RSVP{event?.title ? ` - ${event.title}` : ''}</DialogTitle>
              <DialogDescription className="text-lg mt-2">
                {existingRSVP ? 'Update your potluck dish' : 'Sign up to bring a dish to the potluck'}
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
          <Tabs defaultValue="rsvp" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-14">
              <TabsTrigger value="rsvp" className="text-lg">RSVP</TabsTrigger>
              <TabsTrigger value="list" className="text-lg">Current RSVPs</TabsTrigger>
            </TabsList>
            <TabsContent value="rsvp" className="mt-8">
              <div className="space-y-8">
                <div>
                  <Label htmlFor="member" className="text-xl mb-4 block">Who is bringing the dish?</Label>
                  <Select
                    value={selectedMemberId}
                    onValueChange={setSelectedMemberId}
                  >
                    <SelectTrigger className="h-14 text-lg">
                      <SelectValue placeholder="Select a member" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[50vh]">
                      {members
                        .filter(member => !currentRSVPs.some(rsvp => rsvp.member_id === member.id))
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
                  <Label htmlFor="dishType" className="text-xl mb-4 block">Dish Type</Label>
                  <Select value={dishType} onValueChange={setDishType}>
                    <SelectTrigger className="h-14 text-lg">
                      <SelectValue placeholder="Select dish type" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[50vh]">
                      <SelectItem value="main" className="text-lg">Main Dish</SelectItem>
                      <SelectItem value="side" className="text-lg">Side Dish</SelectItem>
                      <SelectItem value="dessert" className="text-lg">Dessert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dishDescription" className="text-xl mb-4 block">Dish Description</Label>
                  <Textarea
                    id="dishDescription"
                    placeholder="Describe what you're bringing..."
                    value={dishDescription}
                    onChange={(e) => setDishDescription(e.target.value)}
                    className="h-32 text-lg"
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="list" className="mt-8">
              <div className="space-y-6 max-h-[calc(100vh-400px)] overflow-y-auto">
                {currentRSVPs.length === 0 ? (
                  <p className="text-xl text-muted-foreground">No RSVPs yet</p>
                ) : (
                  currentRSVPs.map((rsvp) => (
                    <div key={rsvp.id} className="flex items-start gap-6 p-6 border rounded-lg">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={rsvp.members?.image_url} />
                        <AvatarFallback>
                          {getInitials(rsvp.members?.firstname, rsvp.members?.lastname)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="text-xl font-medium">
                          {rsvp.members?.firstname} {rsvp.members?.lastname}
                        </div>
                        <div className="text-lg text-muted-foreground">
                          {rsvp.dish_type.charAt(0).toUpperCase() + rsvp.dish_type.slice(1)}
                          {rsvp.dish_description && ` - ${rsvp.dish_description}`}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteRSVP(rsvp.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="p-8 border-t">
          <Button variant="outline" onClick={onClose} className="text-lg h-14">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedMemberId || !dishType} className="text-lg h-14">
            {existingRSVP ? 'Update RSVP' : 'Submit RSVP'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
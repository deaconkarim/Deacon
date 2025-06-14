import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils/formatters';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function PotluckRSVPDialog({ isOpen, onClose, event, onRSVP }) {
  const [dishType, setDishType] = useState('');
  const [dishDescription, setDishDescription] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [members, setMembers] = useState([]);
  const [existingRSVP, setExistingRSVP] = useState(null);
  const [currentRSVPs, setCurrentRSVPs] = useState([]);
  const { toast } = useToast();

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
      const { error } = await supabase
        .from('potluck_rsvps')
        .upsert({
          id: existingRSVP?.id,
          event_id: event.id,
          member_id: selectedMemberId,
          dish_type: dishType,
          dish_description: dishDescription
        });

      if (error) throw error;

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

      onRSVP();
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit RSVP. Please try again.',
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

  const handleMemberClick = async (member) => {
    try {
      // First create the event_attendance record
      const { error: attendanceError } = await supabase
        .from('event_attendance')
        .insert({
          event_id: event.id,
          member_id: member.id,
          status: 'attending'
        });

      if (attendanceError) throw attendanceError;

      // Then create the potluck_rsvp record
      const { error: rsvpError } = await supabase
        .from('potluck_rsvps')
        .insert({
          event_id: event.id,
          member_id: member.id,
          category: selectedCategory,
          description: description
        });

      if (rsvpError) throw rsvpError;

      // Move member to Already RSVP'd list
      setAlreadyRSVPMembers(prev => [...prev, member]);
      
      // Remove member from Available People list
      setMembers(prev => prev.filter(m => m.id !== member.id));

      toast({
        title: "Success",
        description: `${member.firstname} ${member.lastname} has been added to the potluck`
      });

      // Reset form
      setSelectedCategory('');
      setDescription('');
    } catch (error) {
      console.error('Error adding member:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add member. Please try again."
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[90vw]">
        <DialogHeader>
          <DialogTitle>
            {existingRSVP ? 'Update Potluck RSVP' : 'Potluck RSVP'}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="member">Who is bringing the dish?</Label>
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a member" />
                </SelectTrigger>
                <SelectContent>
                  {members
                    .filter(member => !currentRSVPs.some(rsvp => rsvp.member_id === member.id))
                    .map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={member.image_url} />
                            <AvatarFallback>{getInitials(member.firstname, member.lastname)}</AvatarFallback>
                          </Avatar>
                          <span>{`${member.firstname} ${member.lastname}`}</span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dishType">What type of dish will you bring?</Label>
              <Select value={dishType} onValueChange={setDishType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select dish type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">Main Dish</SelectItem>
                  <SelectItem value="side">Side Dish</SelectItem>
                  <SelectItem value="dessert">Dessert</SelectItem>
                  <SelectItem value="drink">Drink</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dishDescription">Describe your dish (optional)</Label>
              <Textarea
                id="dishDescription"
                placeholder="e.g., Homemade lasagna, Vegetarian option available"
                value={dishDescription}
                onChange={(e) => setDishDescription(e.target.value)}
                className="h-20"
              />
            </div>
            <Button 
              onClick={handleSubmit}
              className="w-full"
              disabled={!selectedMemberId || !dishType}
            >
              {existingRSVP ? 'Update RSVP' : 'Submit RSVP'}
            </Button>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Current RSVPs</h3>
            <Tabs defaultValue="main" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="main">Main</TabsTrigger>
                <TabsTrigger value="side">Sides</TabsTrigger>
                <TabsTrigger value="dessert">Desserts</TabsTrigger>
                <TabsTrigger value="drink">Drinks</TabsTrigger>
              </TabsList>
              <TabsContent value="main" className="mt-4">
                {renderRSVPList('main')}
              </TabsContent>
              <TabsContent value="side" className="mt-4">
                {renderRSVPList('side')}
              </TabsContent>
              <TabsContent value="dessert" className="mt-4">
                {renderRSVPList('dessert')}
              </TabsContent>
              <TabsContent value="drink" className="mt-4">
                {renderRSVPList('drink')}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Search, UserPlus, CheckCircle2, XCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { getMembers } from '@/lib/data';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

export function WorshipCheckIn() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isCheckInDialogOpen, setIsCheckInDialogOpen] = useState(false);
  const [isNewMemberDialogOpen, setIsNewMemberDialogOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [checkedInMembers, setCheckedInMembers] = useState([]);
  const [newMember, setNewMember] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: ''
  });

  // Load members when component mounts
  useEffect(() => {
    const loadMembers = async () => {
      try {
        const data = await getMembers();
        setMembers(data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load members",
          variant: "destructive",
        });
      }
    };
    loadMembers();
  }, [toast]);

  // Find or create today's worship event
  useEffect(() => {
    const setupWorshipEvent = async () => {
      try {
        const today = new Date();
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);

        // First, find the recurring Sunday Morning Worship event
        const { data: recurringEvents, error: recurringError } = await supabase
          .from('events')
          .select('*')
          .eq('title', 'Sunday Morning Worship')
          .eq('is_recurring', true)
          .order('start_date', { ascending: false })
          .limit(1);

        if (recurringError) {
          throw recurringError;
        }

        const recurringEvent = recurringEvents?.[0];

        if (!recurringEvent) {
          // If no recurring event exists, create it
          const { data: newRecurringEvent, error: createError } = await supabase
            .from('events')
            .insert([{
              id: `sunday-morning-worship-recurring-${Date.now()}`,
              title: 'Sunday Morning Worship',
              description: 'Weekly Sunday Morning Worship Service',
              start_date: new Date(today.setHours(11, 0, 0, 0)).toISOString(),
              end_date: new Date(today.setHours(12, 0, 0, 0)).toISOString(),
              location: 'Main Sanctuary',
              is_recurring: true,
              recurrence_pattern: 'weekly'
            }])
            .select()
            .single();

          if (createError) throw createError;
          recurringEvent = newRecurringEvent;
        }

        // Find the next instance of the recurring event
        const { data: instances, error: instanceError } = await supabase
          .from('events')
          .select('*')
          .eq('parent_event_id', recurringEvent.id)
          .gte('start_date', startOfDay.toISOString())
          .order('start_date', { ascending: true })
          .limit(1);

        if (instanceError) {
          throw instanceError;
        }

        let nextInstance = instances?.[0];

        if (!nextInstance) {
          // If no next instance exists, create one
          const nextSunday = new Date(today);
          nextSunday.setDate(today.getDate() + (7 - today.getDay())); // Get next Sunday
          nextSunday.setHours(11, 0, 0, 0);

          const { data: newInstance, error: createInstanceError } = await supabase
            .from('events')
            .insert([{
              id: `sunday-morning-worship-${format(nextSunday, 'yyyy-MM-dd')}-${Date.now()}`,
              title: 'Sunday Morning Worship',
              description: 'Weekly Sunday Morning Worship Service',
              start_date: nextSunday.toISOString(),
              end_date: new Date(nextSunday.setHours(12, 0, 0, 0)).toISOString(),
              location: 'Main Sanctuary',
              parent_event_id: recurringEvent.id,
              is_recurring: false
            }])
            .select()
            .single();

          if (createInstanceError) throw createInstanceError;
          nextInstance = newInstance;
        }

        setCurrentEvent(nextInstance);

        // Load checked-in members
        if (nextInstance) {
          const { data: attendance, error: attendanceError } = await supabase
            .from('event_attendance')
            .select(`
              *,
              members (
                id,
                firstname,
                lastname,
                image_url
              )
            `)
            .eq('event_id', nextInstance.id)
            .eq('status', 'attending');

          if (attendanceError) throw attendanceError;
          setCheckedInMembers(attendance.map(a => a.members));
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to setup worship event",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    setupWorshipEvent();
  }, [toast]);

  const handleCheckIn = async (member) => {
    try {
      if (!currentEvent) return;

      const { error } = await supabase
        .from('event_attendance')
        .upsert({
          event_id: currentEvent.id,
          memberid: member.id,
          status: 'attending'
        });

      if (error) throw error;

      setCheckedInMembers(prev => [...prev, member]);
      setSearchQuery('');
      setSelectedMembers(prev => [...prev, member.id]);

      toast({
        title: "Success",
        description: `${member.firstname} ${member.lastname} checked in successfully.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check in member",
        variant: "destructive",
      });
    }
  };

  const handleRemoveCheckIn = async (memberId) => {
    try {
      if (!currentEvent) return;

      const { error } = await supabase
        .from('event_attendance')
        .delete()
        .eq('event_id', currentEvent.id)
        .eq('memberid', memberId);

      if (error) throw error;

      setCheckedInMembers(prev => prev.filter(m => m.id !== memberId));
      setSelectedMembers(prev => prev.filter(id => id !== memberId));

      toast({
        title: "Success",
        description: "Member removed from check-in list."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove member from check-in",
        variant: "destructive",
      });
    }
  };

  // Filter members based on search query and exclude already checked-in members
  const filteredMembers = members
    .filter(member => {
      const fullName = `${member.firstname} ${member.lastname}`.toLowerCase();
      const query = searchQuery.toLowerCase();
      const isCheckedIn = checkedInMembers.some(m => m.id === member.id);
      return fullName.includes(query) && !isCheckedIn;
    })
    .sort((a, b) => {
      const nameA = `${a.firstname} ${a.lastname}`;
      const nameB = `${b.firstname} ${b.lastname}`;
      return nameA.localeCompare(nameB);
    });

  const getInitials = (firstname, lastname) => {
    return `${firstname[0]}${lastname[0]}`.toUpperCase();
  };

  const handleCreateMember = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .insert([{
          firstname: newMember.firstname,
          lastname: newMember.lastname,
          email: newMember.email,
          phone: newMember.phone,
          address: newMember.address,
          city: newMember.city,
          state: newMember.state,
          zip: newMember.zip,
          status: 'active'
        }])
        .select()
        .single();

      if (error) throw error;

      // Add the new member to the members list
      setMembers(prev => [...prev, data]);
      
      // Close the dialog and reset form
      setIsNewMemberDialogOpen(false);
      setNewMember({
        firstname: '',
        lastname: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip: ''
      });

      toast({
        title: "Success",
        description: "New person created successfully."
      });

      // Automatically check in the new member
      handleCheckIn(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create new member",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sunday Worship Check-In</h1>
          <p className="text-muted-foreground">
            Check in members for {currentEvent ? format(new Date(currentEvent.start_date), 'EEEE, MMMM d, yyyy') : 'today\'s'} worship service.
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto tablet-spacing">
          <Button 
            onClick={() => setIsNewMemberDialogOpen(true)}
            variant="outline"
            className="w-full md:w-auto btn-tablet"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Person
          </Button>
          <Button 
            onClick={() => setIsCheckInDialogOpen(true)}
            className="w-full md:w-auto bg-primary hover:bg-primary/90 btn-tablet"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Check In Member
          </Button>
        </div>
      </div>

      <Card className="tablet-card">
        <CardHeader>
          <CardTitle>Checked In Members</CardTitle>
          <CardDescription>
            {checkedInMembers.length} members checked in for today's service
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {checkedInMembers.length > 0 ? (
              <div className="grid gap-3 tablet:gap-4">
                {checkedInMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 tablet:p-4 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 tablet:h-10 tablet:w-10">
                        <AvatarImage src={member.image_url} />
                        <AvatarFallback>{getInitials(member.firstname, member.lastname)}</AvatarFallback>
                      </Avatar>
                      <span className="tablet:text-base">{member.firstname} {member.lastname}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCheckIn(member.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 touch-target tablet:min-h-[44px]"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No members checked in yet.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Check In Dialog */}
      <Dialog open={isCheckInDialogOpen} onOpenChange={setIsCheckInDialogOpen}>
        <DialogContent className="sm:max-w-[425px] tablet:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Check In Member</DialogTitle>
            <DialogDescription>
              Search and select members to check in for today's service.
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 tablet-form-input"
            />
          </div>
          <div className="max-h-[300px] tablet:max-h-[400px] overflow-y-auto space-y-2 touch-scroll">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 tablet:p-4 hover:bg-muted/50 rounded-lg cursor-pointer touch-target"
                onClick={() => handleCheckIn(member)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 tablet:h-10 tablet:w-10">
                    <AvatarImage src={member.image_url} />
                    <AvatarFallback>{getInitials(member.firstname, member.lastname)}</AvatarFallback>
                  </Avatar>
                  <span className="tablet:text-base">{member.firstname} {member.lastname}</span>
                </div>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
            ))}
            {filteredMembers.length === 0 && (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No members found.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsCheckInDialogOpen(false)} className="btn-tablet">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Member Dialog */}
      <Dialog open={isNewMemberDialogOpen} onOpenChange={setIsNewMemberDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Person</DialogTitle>
            <DialogDescription>
              Create a new person profile and check them in for today's service.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstname">First Name</Label>
                <Input
                  id="firstname"
                  value={newMember.firstname}
                  onChange={(e) => setNewMember(prev => ({ ...prev, firstname: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastname">Last Name</Label>
                <Input
                  id="lastname"
                  value={newMember.lastname}
                  onChange={(e) => setNewMember(prev => ({ ...prev, lastname: e.target.value }))}
                />
              </div>
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
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={newMember.address}
                onChange={(e) => setNewMember(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={newMember.city}
                  onChange={(e) => setNewMember(prev => ({ ...prev, city: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={newMember.state}
                  onChange={(e) => setNewMember(prev => ({ ...prev, state: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip">ZIP</Label>
                <Input
                  id="zip"
                  value={newMember.zip}
                  onChange={(e) => setNewMember(prev => ({ ...prev, zip: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewMemberDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateMember}
              disabled={!newMember.firstname || !newMember.lastname}
            >
              Create & Check In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
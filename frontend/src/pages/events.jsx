import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { format, parse, isAfter } from 'date-fns';
import { 
  Calendar as CalendarIcon, 
  Search, 
  RefreshCw,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getMembers } from '../lib/data';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/lib/authContext';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1
  }
};

export function Events() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [attendance, setAttendance] = useState({});
  const [members, setMembers] = useState([]);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [attendingMembers, setAttendingMembers] = useState([]);
  const [lastEventAttendance, setLastEventAttendance] = useState({});

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
      
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          event_attendance (
            id,
            memberid,
            status
          )
        `)
        .gte('start_date', today) // Only get events from today onwards
        .order('start_date', { ascending: true });

      if (error) throw error;

      // Process events to include attendance count
      const processedEvents = data.map(event => ({
        ...event,
        attendance: event.event_attendance?.filter(a => a.status === 'attending').length || 0
      }));

      setEvents(processedEvents);
      setFilteredEvents(processedEvents);

      // Set attendance map for filtering
      const attendanceMap = {};
      processedEvents.forEach(event => {
        attendanceMap[event.id] = event.attendance;
      });
      setAttendance(attendanceMap);

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchEventsFromWebsite = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/events/fetch', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      toast({
        title: "Success",
        description: `Updated ${result.count} events.`
      });

      // Refresh the events list
      fetchEvents();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch events from website."
      });
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    let filtered = [...events];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply date filter
    if (selectedDate) {
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.start_date);
        return eventDate.toDateString() === selectedDate.toDateString();
      });
    }

    // Apply status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(event => attendance[event.id] === selectedStatus);
    }

    setFilteredEvents(filtered);
  }, [events, searchQuery, selectedDate, selectedStatus, attendance]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'attending':
        return 'bg-green-500';
      case 'declined':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };

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

  // Add function to fetch last event attendance
  const fetchLastEventAttendance = async (eventId) => {
    try {
      const { data, error } = await supabase
        .from('event_attendance')
        .select(`
          memberid,
          status,
          events!inner (
            start_date
          )
        `)
        .eq('event_id', eventId)
        .order('events(start_date)', { ascending: false })
        .limit(1);

      if (error) throw error;

      // Create a map of memberid to their attendance status
      const attendanceMap = {};
      if (data && data.length > 0) {
        data.forEach(record => {
          attendanceMap[record.memberid] = record.status;
        });
      }
      setLastEventAttendance(attendanceMap);
    } catch (error) {
      console.error('Error fetching last event attendance:', error);
    }
  };

  const handleRSVP = async (eventId) => {
    try {
      // Reset all state first
      setSelectedEvent({ id: eventId });
      setSelectedMembers([]);
      setMemberSearchQuery('');
      setIsMemberDialogOpen(true);
      
      // Fetch existing attendance records
      const { data: existingRecords, error: fetchError } = await supabase
        .from('event_attendance')
        .select('*')
        .eq('event_id', eventId);

      if (fetchError) {
        throw fetchError;
      }

      // Set selected members based on existing records
      if (existingRecords && existingRecords.length > 0) {
        const memberIds = existingRecords.map(record => record.memberid);
        setSelectedMembers(memberIds);
      }

      // Fetch last event attendance
      await fetchLastEventAttendance(eventId);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load existing RSVPs. Please try again."
      });
    }
  };

  const handleMemberClick = async (member) => {
    try {
      // Add Person to event attendance
      const { error } = await supabase
        .from('event_attendance')
        .upsert({
          event_id: selectedEvent.id,
          memberid: member.id,
          status: 'attending'
        });

      if (error) throw error;

      // Update local state
      setSelectedMembers(prev => [...prev, member.id]);
      setMemberSearchQuery('');

      toast({
        title: "Success",
        description: "Member added to the event."
      });

      // Refresh the selected members list
      const { data: existingRecords, error: fetchError } = await supabase
        .from('event_attendance')
        .select('*')
        .eq('event_id', selectedEvent.id);

      if (!fetchError && existingRecords) {
        setSelectedMembers(existingRecords.map(record => record.memberid));
      }

      // Refresh the events list to update attendance count
      fetchEvents();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add person to the event. Please try again."
      });
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      // Remove member from event attendance
      const { error } = await supabase
        .from('event_attendance')
        .delete()
        .eq('event_id', selectedEvent.id)
        .eq('memberid', memberId);

      if (error) throw error;

      // Update local state
      setSelectedMembers(prev => prev.filter(id => id !== memberId));

      toast({
        title: "Success",
        description: "Member removed from the event."
      });

      // Refresh the selected members list
      const { data: existingRecords, error: fetchError } = await supabase
        .from('event_attendance')
        .select('*')
        .eq('event_id', selectedEvent.id);

      if (!fetchError && existingRecords) {
        setSelectedMembers(existingRecords.map(record => record.memberid));
      }

      // Refresh the events list to update attendance count
      fetchEvents();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove member from the event. Please try again."
      });
    }
  };

  const handleDone = () => {
    setIsMemberDialogOpen(false);
    setSelectedEvent(null);
    setSelectedMembers([]);
    setMemberSearchQuery('');
  };

  const getRSVPButton = (eventId) => {
    return (
      <Button 
        variant="default" 
        size="sm"
        className="bg-blue-600 hover:bg-blue-700"
        onClick={() => handleRSVP(eventId)}
      >
        <HelpCircle className="mr-2 h-4 w-4 text-white" />
        RSVP
      </Button>
    );
  };

  // Filter members based on search query and exclude already RSVP'd members
  const filteredMembers = members
    .filter(member => {
      const fullName = `${member.firstname} ${member.lastname}`.toLowerCase();
      const query = memberSearchQuery.toLowerCase();
      const isSelected = selectedMembers.includes(member.id);
      // Only include members that haven't RSVP'd yet and match the search query
      return fullName.includes(query) && !isSelected;
    })
    .sort((a, b) => {
      // First sort by active status
      if (a.is_active && !b.is_active) return -1;
      if (!a.is_active && b.is_active) return 1;

      // Then sort by last event attendance
      const aAttendance = lastEventAttendance[a.id];
      const bAttendance = lastEventAttendance[b.id];
      
      // If one attended and the other didn't, put the attendee first
      if (aAttendance === 'attending' && bAttendance !== 'attending') return -1;
      if (aAttendance !== 'attending' && bAttendance === 'attending') return 1;

      // If both have the same attendance status or neither attended, sort by name
      return `${a.firstname} ${a.lastname}`.localeCompare(`${b.firstname} ${b.lastname}`);
    });

  const fetchAttendingMembers = async (eventId) => {
    try {
      const { data, error } = await supabase
        .from('event_attendance')
        .select(`
          memberid,
          members (
            id,
            firstname,
            lastname,
            email,
            phone
          )
        `)
        .eq('event_id', eventId)
        .eq('status', 'attending');

      if (error) throw error;
      // Transform the data to camelCase for the frontend
      setAttendingMembers(data.map(item => ({
        ...item.members,
        firstName: item.members.firstname,
        lastName: item.members.lastname
      })));
    } catch (error) {
      console.error('Error fetching attending members:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground">View upcoming church events and activities.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => fetchEventsFromWebsite()} disabled={isLoading} variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Fetch from Website'}
          </Button>
          <Button onClick={() => fetchEvents()} disabled={isLoading} variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Refresh Events'}
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full md:w-[200px]">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : "Select date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="attending">Attending</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="all">All Events</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming">
          <div className="space-y-4">
            {filteredEvents.length > 0 ? (
              filteredEvents.map(event => (
                <Card key={event.id}>
                  <CardHeader>
                    <CardTitle>{event.title}</CardTitle>
                    <CardDescription>
                      {format(new Date(event.start_date), "EEEE, MMMM d, yyyy • h:mm a")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{event.location}</Badge>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          {event.attendance} {event.attendance === 1 ? 'person' : 'people'} attending
                        </div>
                        <div className="flex gap-2">
                          {getRSVPButton(event.id)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No upcoming events found.</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="all">
          <div className="space-y-4">
            {filteredEvents.length > 0 ? (
              filteredEvents.map(event => (
                <Card key={event.id}>
                  <CardHeader>
                    <CardTitle>{event.title}</CardTitle>
                    <CardDescription>
                      {format(new Date(event.start_date), "EEEE, MMMM d, yyyy • h:mm a")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{event.location}</Badge>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          {event.attendance} {event.attendance === 1 ? 'person' : 'people'} attending
                        </div>
                        <div className="flex gap-2">
                          {getRSVPButton(event.id)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No events found.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Member Selection Dialog */}
      <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Member</DialogTitle>
            <DialogDescription>
              Choose members who will be attending this event.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-6 flex-1 min-h-0">
            {/* Left Column - Select Member */}
            <div className="flex flex-col min-h-0">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  className="pl-8 mb-4"
                />
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                {filteredMembers.length > 0 ? (
                  <div className="space-y-2">
                    {filteredMembers.map((member) => (
                      <div 
                        key={member.id} 
                        className="flex items-center space-x-2 p-2 hover:bg-muted rounded-lg cursor-pointer"
                        onClick={() => handleMemberClick(member)}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {member.firstname?.charAt(0)}{member.lastname?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">{member.firstname} {member.lastname}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    {memberSearchQuery ? "No members found matching your search." : "No more members to add."}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Already RSVP'd */}
            <div className="flex flex-col min-h-0">
              <h4 className="text-sm font-medium mb-2">Already RSVP'd</h4>
              <div className="flex-1 overflow-y-auto min-h-0">
                {selectedEvent && selectedMembers.length > 0 ? (
                  <div className="space-y-2">
                    {members.filter(member => selectedMembers.includes(member.id)).map((member) => (
                      <div 
                        key={member.id} 
                        className="flex items-center space-x-2 p-2 bg-muted/50 rounded-lg"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {member.firstname?.charAt(0)}{member.lastname?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">{member.firstname} {member.lastname}</span>
                        <div className="ml-auto flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No members have RSVP'd yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button onClick={handleDone}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
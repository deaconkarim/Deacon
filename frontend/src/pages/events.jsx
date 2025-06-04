import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { format, parse, isAfter } from 'date-fns';
import { 
  Calendar as CalendarIcon, 
  Search, 
  RefreshCw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  UserPlus,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  ExternalLink
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
import EventForm from '@/components/events/EventForm';
import { addEvent, updateEvent, deleteEvent } from '@/lib/data';

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

const EventCard = ({ event, onEdit, onDelete, onRSVP }) => {
  console.log('Rendering event:', event); // Add debug log
  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);
  const isRecurring = event.is_recurring;
  const isInstance = event.is_instance;

  return (
    <Card key={event.id} className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold">
              {event.title}
              {isRecurring && (
                <Badge variant="secondary" className="ml-2">
                  {event.recurrence_pattern}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {format(startDate, 'EEEE, MMMM d, yyyy')}
              <br />
              {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            {!isInstance && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(event)}
              >
                Edit
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {event.description && (
            <p className="text-sm text-gray-600">{event.description}</p>
          )}
          {event.location && (
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                <MapPin className="mr-1 h-3 w-3" />
                {event.location}
              </Badge>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {event.attendance || 0} {event.attendance === 1 ? 'person' : 'people'} attending
            </div>
            <div className="flex gap-2">
              {onRSVP(event.id)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export function Events() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [attendance, setAttendance] = useState({});
  const [members, setMembers] = useState([]);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [attendingMembers, setAttendingMembers] = useState([]);
  const [lastEventAttendance, setLastEventAttendance] = useState({});
  const [isCreateMemberOpen, setIsCreateMemberOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    status: 'active'
  });
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [isEditEventOpen, setIsEditEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      console.log('Fetching events from:', today.toISOString()); // Debug log
      
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
        .gte('start_date', today.toISOString())
        .order('start_date', { ascending: true });

      if (error) throw error;

      console.log('Fetched events:', data); // Debug log

      // Process events to include attendance count and handle recurring events
      const processedEvents = data.reduce((acc, event) => {
        // Skip if it's a duplicate instance (events with double timestamps in ID)
        if (event.id.includes('--')) {
          return acc;
        }

        // If it's a recurring event instance
        if (event.parent_event_id) {
          // Skip if we already have an instance of this recurring event
          const hasInstance = acc.some(e => 
            e.parent_event_id === event.parent_event_id || 
            (e.title.toLowerCase().includes('sunday') && 
             e.start_date === event.start_date)
          );
          if (hasInstance) return acc;

          // Only add this instance if it's the next one
          const otherInstances = data.filter(e => 
            e.parent_event_id === event.parent_event_id && 
            new Date(e.start_date) >= today
          ).sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

          if (otherInstances[0]?.id === event.id) {
            acc.push({
              ...event,
              attendance: event.event_attendance?.filter(a => a.status === 'attending').length || 0,
              is_instance: true
            });
          }
          return acc;
        }

        // If it's a recurring event (parent)
        if (event.is_recurring) {
          // Skip if we already have an instance of this recurring event
          const hasInstance = acc.some(e => 
            e.parent_event_id === event.id || 
            (e.title.toLowerCase().includes('sunday') && 
             e.is_recurring)
          );
          if (hasInstance) return acc;

          // Find all instances of this recurring event
          const instances = data.filter(e => 
            e.parent_event_id === event.id && 
            new Date(e.start_date) >= today
          ).sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

          // If we have instances, add only the next one
          if (instances.length > 0) {
            const nextInstance = instances[0];
            acc.push({
              ...nextInstance,
              attendance: nextInstance.event_attendance?.filter(a => a.status === 'attending').length || 0,
              is_instance: true
            });
          } else {
            // If no instances exist yet, add the recurring event itself
            acc.push({
              ...event,
              attendance: event.event_attendance?.filter(a => a.status === 'attending').length || 0,
              is_instance: false
            });
          }
          return acc;
        }

        // For non-recurring events, add them as non-instances
        acc.push({
          ...event,
          attendance: event.event_attendance?.filter(a => a.status === 'attending').length || 0,
          is_instance: false
        });
        return acc;
      }, []);

      // Remove any events that are not on their correct day of the week
      const filteredEvents = processedEvents.filter(event => {
        if (event.title.toLowerCase().includes('sunday')) {
          const eventDate = new Date(event.start_date);
          return eventDate.getDay() === 0; // 0 is Sunday
        }
        return true;
      });

      console.log('Processed events:', filteredEvents); // Debug log

      // Sort events by start date
      filteredEvents.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

      setEvents(filteredEvents);
      setFilteredEvents(filteredEvents);

      // Set attendance map for filtering
      const attendanceMap = {};
      filteredEvents.forEach(event => {
        attendanceMap[event.id] = event.attendance;
      });
      setAttendance(attendanceMap);

    } catch (error) {
      console.error('Error fetching events:', error); // Debug log
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Update the filtering effect
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
      const filterDate = new Date(selectedDate);
      filterDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(filterDate);
      nextDay.setDate(nextDay.getDate() + 1);

      filtered = filtered.filter(event => {
        const eventDate = new Date(event.start_date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= filterDate && eventDate < nextDay;
      });
    }

    console.log('Filtered events:', filtered);
    setFilteredEvents(filtered);
  }, [events, searchQuery, selectedDate]);

  // Helper function to generate recurring events
  const generateRecurringEvents = (event) => {
    const occurrences = [];
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    const duration = endDate.getTime() - startDate.getTime();
    
    // Generate events for the next 3 months
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    
    let currentDate = new Date(startDate);
    
    while (currentDate <= maxDate) {
      const occurrenceEndDate = new Date(currentDate.getTime() + duration);
      const instanceId = `${event.id}-${currentDate.toISOString()}`;
      
      occurrences.push({
        ...event,
        id: instanceId,
        start_date: currentDate.toISOString(),
        end_date: occurrenceEndDate.toISOString(),
        attendance: event.event_attendance?.filter(a => a.status === 'attending').length || 0
      });
      
      // Increment based on recurrence pattern
      switch (event.recurrence_pattern) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'biweekly':
          currentDate.setDate(currentDate.getDate() + 14);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        default:
          currentDate.setDate(currentDate.getDate() + 7); // Default to weekly
      }
    }
    
    return occurrences;
  };

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

  // Add this debug log
  useEffect(() => {
    console.log('Current events:', events);
  }, [events]);

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

  const handleCreateMember = async () => {
    if (!newMember.firstname || !newMember.lastname) {
      toast({
        title: "Missing Information",
        description: "Please provide at least first and last name.",
        variant: "destructive"
      });
      return;
    }

    try {
      // If email is empty, set it to null to avoid unique constraint issues
      const memberData = {
        firstname: newMember.firstname,
        lastname: newMember.lastname,
        email: newMember.email || null,
        phone: newMember.phone || null,
        status: newMember.status
      };

      const { data, error } = await supabase
        .from('members')
        .insert([memberData])
        .select()
        .single();

      if (error) {
        if (error.code === '23505' && error.message.includes('members_email_key')) {
          toast({
            title: "Email Already Exists",
            description: "A person with this email already exists. Please use a different email or leave it empty.",
            variant: "destructive"
          });
          return;
        }
        throw error;
      }

      // Add the new member to the event
      await handleMemberClick(data);

      // Reset form and close dialog
      setNewMember({
        firstname: '',
        lastname: '',
        email: '',
        phone: '',
        status: 'active'
      });
      setIsCreateMemberOpen(false);

      toast({
        title: "Success",
        description: "New person created and added to the event."
      });

      // Refresh members list
      const updatedMembers = await getMembers();
      setMembers(updatedMembers);
    } catch (error) {
      console.error('Error creating member:', error);
      toast({
        title: "Error",
        description: "Failed to create new person. Please try again.",
        variant: "destructive"
      });
    }
  };

  const fetchEventAttendance = async (eventId) => {
    try {
      const { data, error } = await supabase
        .from('event_attendance')
        .select(`
          *,
          members (
            id,
            firstname,
            lastname
          )
        `)
        .eq('event_id', eventId);

      if (error) throw error;

      setAttendance(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch attendance",
        variant: "destructive",
      });
    }
  };

  const handleCreateEvent = async (eventData) => {
    try {
      await addEvent(eventData);
      setIsCreateEventOpen(false);
      fetchEvents();
      toast({
        title: "Success",
        description: "Event created successfully."
      });
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create event. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEditEvent = async (eventData) => {
    try {
      // For recurring events, we need to handle the original event ID
      const eventId = eventData.id;
      
      const updates = {
        ...eventData,
        startDate: new Date(eventData.startDate).toISOString(),
        endDate: new Date(eventData.endDate).toISOString()
      };

      await updateEvent(eventId, updates);
      setIsEditEventOpen(false);
      setEditingEvent(null);
      fetchEvents();
      toast({
        title: "Success",
        description: "Event updated successfully."
      });
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update event. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
      await deleteEvent(eventId);
      fetchEvents();
      toast({
        title: "Success",
        description: "Event deleted successfully."
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete event. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEditClick = (event) => {
    setEditingEvent(event);
    setIsEditEventOpen(true);
  };

  const renderEventCard = (event) => {
    console.log('Rendering event card:', event); // Debug log
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    const isRecurring = event.is_recurring;
    const isInstance = event.is_instance;

    return (
      <Card key={event.id} className="mb-4">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl font-bold">
                {event.title}
                {isRecurring && (
                  <Badge variant="secondary" className="ml-2">
                    {event.recurrence_pattern}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {format(startDate, 'EEEE, MMMM d, yyyy')}
                <br />
                {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              {!isInstance && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditClick(event)}
                >
                  Edit
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {event.description && (
            <p className="text-sm text-gray-600 mb-2">{event.description}</p>
          )}
          {event.location && (
            <p className="text-sm text-gray-600">
              <MapPin className="inline-block mr-1 h-4 w-4" />
              {event.location}
            </p>
          )}
          {event.url && (
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline mt-2 inline-block"
            >
              <ExternalLink className="inline-block mr-1 h-4 w-4" />
              Event Link
            </a>
          )}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              {event.attendance || 0} {event.attendance === 1 ? 'person' : 'people'} attending
            </div>
            <div className="flex gap-2">
              {getRSVPButton(event.id)}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const processRecurringEvents = (events) => {
    const processedEvents = [];
    const now = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3); // Show events for next 3 months

    events.forEach(event => {
      if (!event.is_recurring) {
        processedEvents.push(event);
        return;
      }

      const startDate = new Date(event.start_date);
      const endTime = new Date(event.end_date);
      const duration = endTime - startDate;

      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        if (currentDate >= now) {
          const eventInstance = {
            ...event,
            id: `${event.id}_${currentDate.toISOString()}`,
            start_date: new Date(currentDate),
            end_date: new Date(currentDate.getTime() + duration),
            is_instance: true
          };
          processedEvents.push(eventInstance);
        }

        // Calculate next occurrence based on recurrence pattern
        switch (event.recurrence_pattern) {
          case 'daily':
            currentDate.setDate(currentDate.getDate() + 1);
            break;
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case 'biweekly':
            currentDate.setDate(currentDate.getDate() + 14);
            break;
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
          case 'monthly_weekday':
            // Get the next month
            currentDate.setMonth(currentDate.getMonth() + 1);
            // Set to first day of the month
            currentDate.setDate(1);
            
            // Get the target weekday (0-6, where 0 is Sunday)
            const targetWeekday = parseInt(event.monthly_weekday);
            // Get the target week (1-5, where 5 means last week)
            const targetWeek = parseInt(event.monthly_week);
            
            // Find the target date
            if (targetWeek === 5) {
              // For last week, start from the end of the month
              currentDate.setMonth(currentDate.getMonth() + 1);
              currentDate.setDate(0); // Last day of the month
              // Go backwards to find the target weekday
              while (currentDate.getDay() !== targetWeekday) {
                currentDate.setDate(currentDate.getDate() - 1);
              }
            } else {
              // For other weeks, find the first occurrence of the target weekday
              while (currentDate.getDay() !== targetWeekday) {
                currentDate.setDate(currentDate.getDate() + 1);
              }
              // Add weeks to get to the target week
              currentDate.setDate(currentDate.getDate() + (targetWeek - 1) * 7);
            }
            break;
          default:
            currentDate = endDate; // Stop processing for unknown patterns
        }
      }
    });

    return processedEvents;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground">View upcoming church events and activities.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreateEventOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Event
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
      </div>
      
      <div className="space-y-4">
        {filteredEvents && filteredEvents.length > 0 ? (
          filteredEvents.map(event => renderEventCard(event))
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No events found.</p>
          </div>
        )}
      </div>

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
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search members..."
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateMemberOpen(true)}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  New Person
                </Button>
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

      {/* Create New Member Dialog */}
      <Dialog open={isCreateMemberOpen} onOpenChange={setIsCreateMemberOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Person</DialogTitle>
            <DialogDescription>
              Add a new person and automatically RSVP them to this event.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstname">First Name *</Label>
                <Input
                  id="firstname"
                  value={newMember.firstname}
                  onChange={(e) => setNewMember({...newMember, firstname: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastname">Last Name *</Label>
                <Input
                  id="lastname"
                  value={newMember.lastname}
                  onChange={(e) => setNewMember({...newMember, lastname: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={newMember.phone}
                  onChange={(e) => setNewMember({...newMember, phone: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={newMember.status}
                onValueChange={(value) => setNewMember({...newMember, status: value})}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateMemberOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateMember}>
              Create & RSVP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Event Dialog */}
      <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
            <DialogDescription>
              Add a new event to the calendar.
            </DialogDescription>
          </DialogHeader>
          <EventForm
            initialData={{
              title: '',
              description: '',
              startDate: '',
              endDate: '',
              location: '',
              url: '',
              is_recurring: false,
              recurrence_pattern: ''
            }}
            onSave={handleCreateEvent}
            onCancel={() => setIsCreateEventOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={isEditEventOpen} onOpenChange={setIsEditEventOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>
              Update event details.
            </DialogDescription>
          </DialogHeader>
          {editingEvent && (
            <>
              <EventForm
                initialData={{
                  ...editingEvent,
                  startDate: new Date(editingEvent.start_date).toISOString().slice(0, 16),
                  endDate: new Date(editingEvent.end_date).toISOString().slice(0, 16)
                }}
                onSave={handleEditEvent}
                onCancel={() => {
                  setIsEditEventOpen(false);
                  setEditingEvent(null);
                }}
              />
              <div className="flex justify-end mt-4">
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this event?')) {
                      handleDeleteEvent(editingEvent.id);
                      setIsEditEventOpen(false);
                      setEditingEvent(null);
                    }
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Event
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
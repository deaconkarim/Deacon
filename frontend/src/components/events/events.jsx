import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  ExternalLink,
  CheckCircle,
  Utensils,
  Users
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/lib/authContext';
import EventForm from '@/components/events/EventForm';
import { addEvent, updateEvent, deleteEvent } from '@/lib/data';
import { getInitials } from '@/lib/utils/formatters';
import { PotluckRSVPDialog } from '@/components/events/PotluckRSVPDialog';
import { automationService } from '@/lib/automationService';

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

const formatRecurrencePattern = (pattern, monthlyWeek, monthlyWeekday) => {
  switch (pattern) {
    case 'daily':
      return 'Daily';
    case 'weekly':
      return 'Weekly';
    case 'biweekly':
      return 'Bi-weekly';
    case 'monthly':
      return 'Monthly';
    case 'monthly_weekday':
      const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const weekLabels = ['First', 'Second', 'Third', 'Fourth', 'Last'];
      const weekday = weekdays[parseInt(monthlyWeekday)];
      const week = weekLabels[parseInt(monthlyWeek) - 1];
      return `${week} ${weekday}`;
    case 'fifth_sunday':
      return 'Fifth Sunday';
    default:
      return pattern;
  }
};

const EventCard = ({ event, onRSVP, onPotluckRSVP, onEdit, onDelete }) => {
  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);
  const isRecurring = event.is_recurring;
  const isInstance = event.is_instance;
  const isPotluck = event.title.toLowerCase().includes('potluck');
  const isCheckIn = event.attendance_type === 'check-in';
  const isBibleStudy = event.title.toLowerCase().includes('bible study');

  return (
    <Card key={event.id} className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold">
              {event.title}
              {isRecurring && (
                <Badge variant="secondary" className="ml-2">
                  {formatRecurrencePattern(event.recurrence_pattern, event.monthly_week, event.monthly_weekday)}
                </Badge>
              )}
              {isPotluck && (
                <Badge variant="outline" className="ml-2 text-green-600 border-green-600">
                  Potluck Sunday
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
            <Button variant="ghost" size="sm" onClick={() => onEdit(event)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(event)}>
              <Trash2 className="h-4 w-4" />
            </Button>
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
            {event.allow_rsvp ? (
              `${event.attendance || 0} ${event.attendance === 1 ? 'person' : 'people'} ${isCheckIn ? 'checked in' : 'attending'}`
            ) : (
              <span className="flex items-center gap-1">
                <HelpCircle className="h-3 w-3" />
                Announcement only
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {event.allow_rsvp && (
              <div className="flex items-center gap-2">
                {isCheckIn ? (
                  <Button
                    onClick={() => onRSVP(event)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Check In
                  </Button>
                ) : isPotluck ? (
                  <Button
                    onClick={() => onPotluckRSVP(event)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Utensils className="mr-2 h-4 w-4" />
                    Potluck RSVP
                  </Button>
                ) : (
                  <Button
                    onClick={() => onRSVP(event)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    RSVP
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export function Events() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Debug user context
  console.log('🔍 Events component - User context:', user);
  console.log('🔍 Events component - User organization_id:', user?.organization_id);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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
  const [isPotluckRSVPDialogOpen, setIsPotluckRSVPDialogOpen] = useState(false);
  const [selectedPotluckEvent, setSelectedPotluckEvent] = useState(null);
  const [potluckRSVPs, setPotluckRSVPs] = useState([]);
  const [alreadyRSVPMembers, setAlreadyRSVPMembers] = useState([]);
  const [attendanceFilter, setAttendanceFilter] = useState('all');
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogDescription, setDialogDescription] = useState('');
  const [dialogButtonText, setDialogButtonText] = useState('');
  const [dialogButtonVariant, setDialogButtonVariant] = useState('');
  const [dialogButtonClassName, setDialogButtonClassName] = useState('');
  const [dialogButtonIcon, setDialogButtonIcon] = useState(null);
  const [dialogSuccessMessage, setDialogSuccessMessage] = useState('');
  const [dialogErrorMessage, setDialogErrorMessage] = useState('');
  const [dialogSectionTitle, setDialogSectionTitle] = useState('');
  const [dialogSectionDescription, setDialogSectionDescription] = useState('');
  const [showRecurringEditDialog, setShowRecurringEditDialog] = useState(false);
  const [pendingEditEvent, setPendingEditEvent] = useState(null);

  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Get current user's organization ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: orgUser, error: orgError } = await supabase
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (orgError || !orgUser) throw new Error('Unable to determine organization');
      
      const { data: events, error } = await supabase
        .from('events')
        .select(`
          *,
          event_attendance (
            id,
            member_id,
            status
          ),
          potluck_rsvps (
            id,
            member_id
          )
        `)
        .eq('organization_id', orgUser.organization_id)
        .order('start_date', { ascending: true });

      if (error) throw error;

      console.log('=== DEBUG: Event Processing ===');
      console.log('1. Raw events from DB:', events.map(e => ({
        id: e.id,
        title: e.title,
        date: e.start_date,
        parent_id: e.parent_event_id
      })));

      // Group events by their parent event ID
      const eventGroups = events.reduce((groups, event) => {
        const key = event.parent_event_id || event.id;
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(event);
        return groups;
      }, {});

      console.log('3. Event groups:', Object.entries(eventGroups).map(([key, events]) => ({
        group_id: key,
        title: events[0].title,
        instance_count: events.length,
        dates: events.map(e => e.start_date)
      })));

      // For each group, process all instances
      const processedEvents = Object.values(eventGroups).map(group => {
        // Sort all instances by date
        const sortedInstances = group.sort((a, b) => a.start_date.localeCompare(b.start_date));
        
        console.log('4. Processing group:', {
          title: group[0].title,
          sorted_dates: sortedInstances.map(e => e.start_date)
        });

        // If it's not a recurring event, return it as is
        if (!group[0].is_recurring) {
          const isPotluck = group[0].title.toLowerCase().includes('potluck');
          return {
            ...group[0],
            attendance: isPotluck 
              ? group[0].potluck_rsvps?.length || 0
              : group[0].event_attendance?.length || 0
          };
        }

        // For recurring events, find the next occurrence
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Find the next occurrence that is today or in the future
        const nextInstance = sortedInstances.find(instance => {
          const instanceDate = new Date(instance.start_date);
          instanceDate.setHours(0, 0, 0, 0);
          return instanceDate >= today;
        });

        // If no future instance found, use the master event as a placeholder
        // but mark it clearly as needing instance creation
        if (!nextInstance) {
          const masterEvent = sortedInstances.find(e => e.is_master) || sortedInstances[0];
          const lastInstance = sortedInstances[sortedInstances.length - 1];
          const nextDate = new Date(lastInstance.start_date);
          const duration = new Date(lastInstance.end_date) - nextDate;
          
          // Calculate next occurrence based on recurrence pattern
          switch (lastInstance.recurrence_pattern) {
            case 'daily':
              nextDate.setDate(nextDate.getDate() + 1);
              break;
            case 'weekly':
              nextDate.setDate(nextDate.getDate() + 7);
              break;
            case 'biweekly':
              nextDate.setDate(nextDate.getDate() + 14);
              break;
            case 'monthly':
              nextDate.setMonth(nextDate.getMonth() + 1);
              break;
            case 'monthly_weekday':
              // Get the next month
              nextDate.setMonth(nextDate.getMonth() + 1);
              // Set to first day of the month
              nextDate.setDate(1);
              
              // Get the target weekday (0-6, where 0 is Sunday)
              const targetWeekday = parseInt(lastInstance.monthly_weekday);
              // Get the target week (1-5, where 5 means last week)
              const targetWeek = parseInt(lastInstance.monthly_week);
              
              // Find the target date
              if (targetWeek === 5) {
                // For last week, start from the end of the month
                nextDate.setMonth(nextDate.getMonth() + 1);
                nextDate.setDate(0); // Last day of the month
                // Go backwards to find the target weekday
                while (nextDate.getDay() !== targetWeekday) {
                  nextDate.setDate(nextDate.getDate() - 1);
                }
              } else {
                // For other weeks, find the first occurrence of the target weekday
                while (nextDate.getDay() !== targetWeekday) {
                  nextDate.setDate(nextDate.getDate() + 1);
                }
                // Add weeks to get to the target week
                nextDate.setDate(nextDate.getDate() + (targetWeek - 1) * 7);
              }
              break;
            default:
              return null; // Skip unknown patterns
          }

          const nextEndDate = new Date(nextDate.getTime() + duration);
          const isPotluck = lastInstance.title.toLowerCase().includes('potluck');
          
          // CRITICAL FIX: Use the master event ID and mark as virtual instance
          return {
            ...lastInstance,
            id: masterEvent.id, // Use master event ID for editing
            master_id: masterEvent.id, // Keep reference to master
            start_date: nextDate.toISOString(),
            end_date: nextEndDate.toISOString(),
            is_virtual_instance: true, // Mark as virtual for frontend logic
            attendance: isPotluck 
              ? lastInstance.potluck_rsvps?.length || 0
              : lastInstance.event_attendance?.length || 0
          };
        }

        // Return the next instance
        const isPotluck = nextInstance.title.toLowerCase().includes('potluck');
        return {
          ...nextInstance,
          attendance: isPotluck 
            ? nextInstance.potluck_rsvps?.length || 0
            : nextInstance.event_attendance?.length || 0
        };
      }).filter(Boolean); // Remove any null entries

      console.log('8. Final processed events:', processedEvents.map(e => ({
        title: e.title,
        date: e.start_date,
        attendance: e.attendance
      })));

      setEvents(processedEvents);
      setFilteredEvents(processedEvents);

      // Set attendance map for filtering
      const attendanceMap = {};
      processedEvents.forEach(event => {
        attendanceMap[event.id] = event.attendance;
      });
      setAttendance(attendanceMap);

    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to fetch events",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Update the filtering effect to only handle search and attendance filters
  useEffect(() => {
    let filtered = [...events];

    // Filter out past events
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    filtered = filtered.filter(event => {
      const eventDate = new Date(event.start_date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= today;
    });

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply attendance filter
    if (attendanceFilter !== 'all') {
      filtered = filtered.filter(event => {
        if (attendanceFilter === 'attending') {
          return event.attendance > 0;
        } else if (attendanceFilter === 'not_attending') {
          return !event.attendance || event.attendance === 0;
        }
        return true;
      });
    }

    console.log('Filtered events:', filtered);
    setFilteredEvents(filtered);
  }, [events, searchQuery, attendanceFilter]);

  const generateNextInstance = (event) => {
    if (!event.is_recurring) return null;

    const lastDate = new Date(event.start_date);
    const duration = new Date(event.end_date) - lastDate;
    let nextDate;

    switch (event.recurrence_pattern) {
      case 'weekly':
        nextDate = new Date(lastDate);
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'biweekly':
        nextDate = new Date(lastDate);
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case 'monthly':
        nextDate = new Date(lastDate);
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'monthly_weekday':
        nextDate = new Date(lastDate);
        nextDate.setMonth(nextDate.getMonth() + 1);
        // Adjust to the correct week and weekday
        const week = parseInt(event.monthly_week);
        const weekday = parseInt(event.monthly_weekday);
        nextDate.setDate(1); // Start from the first day of the month
        while (nextDate.getDay() !== weekday) {
          nextDate.setDate(nextDate.getDate() + 1);
        }
        nextDate.setDate(nextDate.getDate() + (week - 1) * 7);
        break;
      default:
        return null;
    }

    const nextEndDate = new Date(nextDate.getTime() + duration);

    return {
      ...event,
      id: `${event.id}-${nextDate.toISOString()}`,
      start_date: nextDate.toISOString(),
      end_date: nextEndDate.toISOString(),
      is_instance: true,
      parent_event_id: event.id
    };
  };

  // Helper function to generate recurring events
  const generateRecurringEvents = (event) => {
    const occurrences = [];
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    const duration = endDate.getTime() - startDate.getTime();
    
    // Only generate the next occurrence
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentDate = new Date(startDate);
    
    // Find the next occurrence from today
    while (currentDate < today) {
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
    
    // Only add the next occurrence
    const occurrenceEndDate = new Date(currentDate.getTime() + duration);
    const instanceId = `${event.id}-${currentDate.toISOString()}`;
    
    occurrences.push({
      ...event,
      id: instanceId,
      start_date: currentDate.toISOString(),
      end_date: occurrenceEndDate.toISOString(),
      attendance: event.event_attendance?.length || 0,
      is_instance: true,
      parent_event_id: event.id
    });
    
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

  const fetchMembers = useCallback(async () => {
    try {
      // Get current user's organization ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: orgUser, error: orgError } = await supabase
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (orgError || !orgUser) throw new Error('Unable to determine organization');

      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('organization_id', orgUser.organization_id)
        .order('firstname', { ascending: true });
      
      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      alert('Failed to load members. Please try again.');
    }
  }, []);

  // Load members when component mounts
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Add function to fetch last event attendance
  const fetchLastEventAttendance = async (eventId) => {
    try {
      const { data, error } = await supabase
        .from('event_attendance')
        .select(`
          member_id,
          status,
          events!inner (
            start_date
          )
        `)
        .eq('event_id', eventId)
        .order('events(start_date)', { ascending: false })
        .limit(1);

      if (error) throw error;

      // Create a map of member_id to their attendance status
      const attendanceMap = {};
      if (data && data.length > 0) {
        data.forEach(record => {
          attendanceMap[record.member_id] = record.status;
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
              const memberIds = existingRecords.map(record => record.member_id);
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
          member_id: member.id,
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
        setSelectedMembers(existingRecords.map(record => record.member_id));
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
      const { error } = await supabase
        .from('event_attendance')
        .delete()
        .eq('event_id', selectedEvent.id)
        .eq('member_id', memberId);

      if (error) throw error;

      // Update the alreadyRSVPMembers list
      setAlreadyRSVPMembers(alreadyRSVPMembers.filter(member => member.id !== memberId));
      
      // Refresh the members list to include the removed member
      const { data: memberData } = await supabase
        .from('members')
        .select('*')
        .eq('id', memberId)
        .single();

      if (memberData) {
        setMembers(prev => [...prev, memberData]);
      }

      toast({
        title: "Success",
        description: "Member removed successfully"
      });
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove member. Please try again."
      });
    }
  };

  const handleDone = async () => {
    try {
      const rsvpsToAdd = selectedMembers.map(memberId => ({
        event_id: selectedEvent.id,
        member_id: memberId,
        status: 'attending'
      }));

      const { data: attendanceData, error } = await supabase
        .from('event_attendance')
        .insert(rsvpsToAdd)
        .select();

      if (error) throw error;

      // Trigger automation for each attendance record
      if (user?.organization_id && attendanceData) {
        for (const attendance of attendanceData) {
          try {
            // Get member details for automation
            const member = members.find(m => m.id === attendance.member_id);
            if (member) {
              await automationService.triggerAutomation(
                'event_attendance',
                {
                  id: attendance.id,
                  event_id: selectedEvent.id,
                  member_id: attendance.member_id,
                  status: 'attending',
                  event_type: selectedEvent.event_type,
                  member_type: member.status === 'visitor' ? 'visitor' : (member.member_type || 'adult'),
                  attendance_status: 'attended',
                  is_first_visit: member.status === 'visitor',
                  firstname: member.firstname,
                  lastname: member.lastname,
                  phone: member.phone
                },
                user.organization_id
              );
            }
          } catch (automationError) {
            console.error('Automation trigger failed for member:', attendance.member_id, automationError);
            // Don't fail the main operation if automation fails
          }
        }
      }

      // Update the alreadyRSVPMembers list with the newly added members
      const { data: newMembers } = await supabase
        .from('members')
        .select('*')
        .in('id', selectedMembers);

      if (newMembers) {
        setAlreadyRSVPMembers(prev => [...prev, ...newMembers]);
      }

      // Remove the added members from the Available People list
      setMembers(prev => prev.filter(member => !selectedMembers.includes(member.id)));
      
      setSelectedMembers([]);
      setIsMemberDialogOpen(false);
      toast({
        title: "Success",
        description: "Members added successfully"
      });
    } catch (error) {
      console.error('Error adding members:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add members. Please try again."
      });
    }
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
          member_id,
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
      // Get organization_id for the new member
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) {
        throw new Error('User not associated with any organization');
      }

      // If email is empty, set it to null to avoid unique constraint issues
      const memberData = {
        firstname: newMember.firstname,
        lastname: newMember.lastname,
        email: newMember.email || null,
        phone: newMember.phone || null,
        status: newMember.status,
        organization_id: organizationId
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
      console.log('=== HANDLE EDIT EVENT ===');
      console.log('Editing event:', editingEvent);
      console.log('Event data:', eventData);
      
      // Determine if we're editing an instance or the master
      const isVirtualInstance = editingEvent.is_virtual_instance;
      const isMasterEvent = editingEvent.is_master;
      const hasParent = editingEvent.parent_event_id;
      
      console.log('Edit context:', {
        isVirtualInstance,
        isMasterEvent, 
        hasParent,
        eventId: editingEvent.id
      });
      
      // For virtual instances (computed future occurrences), use the master ID
      // For real instances or master events, use the actual ID
      const eventId = isVirtualInstance ? editingEvent.master_id || editingEvent.id : editingEvent.id;
      
      const updates = {
        ...eventData,
        startDate: new Date(eventData.startDate).toISOString(),
        endDate: new Date(eventData.endDate).toISOString()
      };

      console.log('Updating event with ID:', eventId);
      console.log('Updates:', updates);

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

  const handleDeleteEvent = async (event) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
      await deleteEvent(event.id);
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
    console.log('Edit click for event:', event);
    
    // If it's a recurring event, show the choice dialog
    if (event.is_recurring && !event.is_virtual_instance) {
      console.log('Showing recurring edit dialog for event:', event.title);
      setPendingEditEvent(event);
      setShowRecurringEditDialog(true);
    } else {
      // For non-recurring events or virtual instances, edit directly
      console.log('Editing event directly:', event.title);
      setEditingEvent(event);
      setIsEditEventOpen(true);
    }
  };

  const handleRecurringEditChoice = (editType) => {
    console.log('Recurring edit choice:', editType);
    
    if (editType === 'instance') {
      // Edit this instance only - mark as virtual instance for proper handling
      const instanceEvent = {
        ...pendingEditEvent,
        is_virtual_instance: true,
        master_id: pendingEditEvent.id
      };
      console.log('Editing instance:', instanceEvent);
      setEditingEvent(instanceEvent);
    } else if (editType === 'series') {
      // Edit the entire series - use the master event
      console.log('Editing series:', pendingEditEvent);
      setEditingEvent(pendingEditEvent);
    }
    
    setShowRecurringEditDialog(false);
    setPendingEditEvent(null);
    setIsEditEventOpen(true);
  };

  const handleOpenDialog = async (event) => {
    setSelectedEvent(event);
    setSelectedMembers([]);
    setMemberSearchQuery('');
    setIsMemberDialogOpen(true);
    
    try {
      // Get current user's organization ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: orgUser, error: orgError } = await supabase
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (orgError || !orgUser) throw new Error('Unable to determine organization');

      // Fetch all members
      const { data: allMembers, error: membersError } = await supabase
        .from('members')
        .select('*')
        .eq('organization_id', orgUser.organization_id)
        .order('firstname');

      if (membersError) throw membersError;

      // Fetch already RSVP'd/Checked In People
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('event_attendance')
        .select(`
          member_id,
          members (
            id,
            firstname,
            lastname,
            email,
            image_url
          )
        `)
        .eq('event_id', event.id);

      if (attendanceError) throw attendanceError;

      // Get IDs of members who have already RSVP'd/checked in
      const attendingMemberIds = attendanceData.map(record => record.member_id);
      
      // Filter out members who have already RSVP'd/checked in
      const availableMembers = allMembers.filter(member => !attendingMemberIds.includes(member.id));
      
      // Get the full member data for already RSVP'd/Checked In People
      const alreadyAttendingMembers = attendanceData.map(record => record.members);

      setMembers(availableMembers);
      setAlreadyRSVPMembers(alreadyAttendingMembers || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load members. Please try again."
      });
    }
  };

  const handleCloseDialog = () => {
    setIsMemberDialogOpen(false);
    setSelectedEvent(null);
    setSelectedMembers([]);
    setMembers([]);
    setAlreadyRSVPMembers([]);
  };

  const handlePotluckRSVP = useCallback(async (event) => {
    setSelectedPotluckEvent(event);
    setIsPotluckRSVPDialogOpen(true);
    
    try {
      const { data: rsvps, error } = await supabase
        .from('potluck_rsvps')
        .select('*')
        .eq('event_id', event.id);
      
      if (error) throw error;
      setPotluckRSVPs(rsvps || []);
    } catch (error) {
      console.error('Error fetching potluck RSVPs:', error);
      alert('Failed to load potluck RSVPs. Please try again.');
    }
  }, []);

  const handlePotluckRSVPUpdate = useCallback(() => {
    if (selectedPotluckEvent) {
      handlePotluckRSVP(selectedPotluckEvent);
    }
  }, [selectedPotluckEvent, handlePotluckRSVP]);

  const renderEventCard = useCallback((event) => {
    return (
      <EventCard
        key={event.id}
        event={event}
        onRSVP={handleOpenDialog}
        onPotluckRSVP={handlePotluckRSVP}
        onEdit={handleEditClick}
        onDelete={handleDeleteEvent}
      />
    );
  }, [handleOpenDialog, handlePotluckRSVP, handleEditClick, handleDeleteEvent]);

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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedEvent?.attendance_type === 'check-in' ? 'Check In People' : 'RSVP Members'}
            </DialogTitle>
            <DialogDescription>
              {selectedEvent?.attendance_type === 'check-in'
                ? 'Check In People for the event'
                : `Select members to RSVP for ${selectedEvent?.title}`}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Available People</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center space-x-2 p-2 rounded-md cursor-pointer hover:bg-gray-100"
                    onClick={async () => {
                      console.log('🖱️ Member clicked:', member.firstname, member.lastname);
                      console.log('🖱️ Selected event:', selectedEvent);
                      try {
                        // Add member to event attendance
                        const { data: attendanceData, error } = await supabase
                          .from('event_attendance')
                          .insert({
                            event_id: selectedEvent.id,
                            member_id: member.id,
                            status: 'attending'
                          })
                          .select()
                          .single();

                        if (error) throw error;

                        // Trigger automation for event attendance
                        console.log('🔍 Checking if automation should trigger...');
                        console.log('👤 User organization_id:', user?.organization_id);
                        console.log('👤 Member status:', member.status);
                        console.log('🎯 Event type:', selectedEvent.event_type);
                        
                        if (user?.organization_id) {
                          try {
                            const triggerData = {
                              id: attendanceData.id,
                              event_id: selectedEvent.id,
                              member_id: member.id,
                              status: 'attending',
                              event_type: selectedEvent.event_type,
                              member_type: member.status === 'visitor' ? 'visitor' : (member.member_type || 'adult'),
                              attendance_status: 'attended',
                              is_first_visit: member.status === 'visitor',
                              firstname: member.firstname,
                              lastname: member.lastname,
                              phone: member.phone
                            };
                            
                            console.log('🎯 Event data:', selectedEvent);
                            console.log('👤 Member data:', member);
                            console.log('🚀 Triggering automation with data:', triggerData);
                            
                            await automationService.triggerAutomation(
                              'event_attendance',
                              triggerData,
                              user.organization_id
                            );
                          } catch (automationError) {
                            console.error('Automation trigger failed:', automationError);
                            // Don't fail the main operation if automation fails
                          }
                        } else {
                          console.log('❌ No organization_id found, skipping automation');
                        }

                        // Move member to Already RSVP'd list
                        setAlreadyRSVPMembers(prev => [...prev, member]);
                        
                        // Remove member from Available People list
                        setMembers(prev => prev.filter(m => m.id !== member.id));

                        toast({
                          title: "Success",
                          description: selectedEvent?.attendance_type === 'check-in'
                            ? `${member.firstname} ${member.lastname} has been checked in`
                            : `${member.firstname} ${member.lastname} has been added`
                        });
                      } catch (error) {
                        console.error('Error adding member:', error);
                        toast({
                          variant: "destructive",
                          title: "Error",
                          description: selectedEvent?.attendance_type === 'check-in'
                            ? "Failed to check in member. Please try again."
                            : "Failed to add member. Please try again."
                        });
                      }
                    }}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.image_url} />
                      <AvatarFallback>
                        {member.firstname?.charAt(0)}{member.lastname?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {member.firstname} {member.lastname}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">
                {selectedEvent?.attendance_type === 'check-in' ? 'Checked In People' : "Already RSVP'd"}
              </h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {alreadyRSVPMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center space-x-2 p-2 bg-gray-50 rounded"
                  >
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.image_url} />
                      <AvatarFallback>
                        {member.firstname?.charAt(0)}{member.lastname?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm flex-1">
                      {member.firstname} {member.lastname}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {alreadyRSVPMembers.length === 0 && (
                  <p className="text-sm text-gray-500 italic">
                    {selectedEvent?.attendance_type === 'check-in'
                      ? 'No members have checked in yet'
                      : "No members have RSVP'd yet"}
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant={selectedEvent?.attendance_type === 'check-in' ? 'default' : 'outline'}
              onClick={handleCloseDialog}
              className={selectedEvent?.attendance_type === 'check-in' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              Close
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
              recurrence_pattern: '',
              allow_rsvp: true
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
            <DialogTitle>
              Edit {editingEvent?.is_recurring ? 'Recurring Event Series' : 'Event'}
            </DialogTitle>
            <DialogDescription>
              {editingEvent?.is_recurring 
                ? `Update event details. Changes will apply to "${editingEvent.title}" and all future instances.`
                : 'Update event details.'
              }
            </DialogDescription>
          </DialogHeader>
          {editingEvent && (
            <>
              <EventForm
                initialData={{
                  ...editingEvent,
                  startDate: editingEvent.start_date,
                  endDate: editingEvent.end_date,
                  allow_rsvp: editingEvent.allow_rsvp !== undefined ? editingEvent.allow_rsvp : true
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
                    const eventType = editingEvent.is_recurring ? 'recurring event series' : 'event';
                    const message = editingEvent.is_recurring 
                      ? `Are you sure you want to delete "${editingEvent.title}" and all its recurring instances? This cannot be undone.`
                      : `Are you sure you want to delete "${editingEvent.title}"? This cannot be undone.`;
                    
                                         if (confirm(message)) {
                        const deleteId = editingEvent.master_id || editingEvent.id;
                        handleDeleteEvent(deleteId);
                        setIsEditEventOpen(false);
                        setEditingEvent(null);
                      }
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete {editingEvent?.is_recurring ? 'Series' : 'Event'}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <PotluckRSVPDialog
        isOpen={isPotluckRSVPDialogOpen}
        onClose={() => {
          setIsPotluckRSVPDialogOpen(false);
          setSelectedPotluckEvent(null);
          setPotluckRSVPs([]);
        }}
        event={selectedPotluckEvent}
        onRSVP={handlePotluckRSVPUpdate}
      />

      {/* Recurring Event Edit Choice Dialog */}
      <Dialog open={showRecurringEditDialog} onOpenChange={setShowRecurringEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Recurring Event</DialogTitle>
            <DialogDescription>
              This is a recurring event. What would you like to edit?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start p-4 h-auto"
                onClick={() => handleRecurringEditChoice('instance')}
              >
                <div className="text-left">
                  <div className="font-medium">Edit This Instance Only</div>
                  <div className="text-sm text-muted-foreground">
                    Changes will only apply to this specific occurrence on {pendingEditEvent ? format(new Date(pendingEditEvent.start_date), 'MMM d, yyyy') : ''}
                  </div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start p-4 h-auto"
                onClick={() => handleRecurringEditChoice('series')}
              >
                <div className="text-left">
                  <div className="font-medium">Edit Entire Series</div>
                  <div className="text-sm text-muted-foreground">
                    Changes will apply to all future occurrences of this recurring event
                  </div>
                </div>
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRecurringEditDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
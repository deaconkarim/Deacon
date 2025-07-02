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
  Users,
  Calendar,
  Clock,
  X,
  Handshake,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/lib/authContext';
import EventForm from '@/components/events/EventForm';
import { addEvent, updateEvent, deleteEvent, getEventVolunteers, addEventVolunteer, updateEventVolunteer, removeEventVolunteer, parseVolunteerRoles } from '@/lib/data';
import { getInitials } from '@/lib/utils/formatters';
import { PotluckRSVPDialog } from '@/components/events/PotluckRSVPDialog';
import { VolunteerList } from '@/components/events/VolunteerList';
import { AddVolunteerForm } from '@/components/events/AddVolunteerForm';
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

const EventCard = ({ event, onRSVP, onPotluckRSVP, onEdit, onDelete, onManageVolunteers, isPastEvent = false }) => {
  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);
  const isRecurring = event.is_recurring;
  const isInstance = event.is_instance;
  const isPotluck = event.title.toLowerCase().includes('potluck');
  const isCheckIn = event.attendance_type === 'check-in';
  const isBibleStudy = event.title.toLowerCase().includes('bible study');

  return (
    <Card key={event.id} className="mb-4">
      <CardHeader className="p-3 md:p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 md:gap-0">
          <div className="flex-1">
            <CardTitle className="text-xl md:text-2xl font-bold flex flex-wrap items-center gap-2 mb-2">
              {event.title}
              {isRecurring && (
                <Badge variant="secondary" className="ml-0 md:ml-2 text-xs md:text-sm">
                  {formatRecurrencePattern(event.recurrence_pattern, event.monthly_week, event.monthly_weekday)}
                </Badge>
              )}
              {isPotluck && (
                <Badge variant="outline" className="ml-0 md:ml-2 text-xs md:text-sm text-green-600 border-green-600">
                  Potluck Sunday
                </Badge>
              )}
              {event.needs_volunteers && (
                <Badge variant="outline" className="ml-0 md:ml-2 text-xs md:text-sm text-yellow-600 border-yellow-600 flex items-center gap-1">
                  <Handshake className="h-3 w-3" />
                  Volunteers Needed
                </Badge>
              )}
              {isPastEvent && (
                <Badge variant="outline" className="ml-0 md:ml-2 text-xs md:text-sm text-gray-600 border-gray-600">
                  Past Event
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-base md:text-lg">
              {format(startDate, 'EEEE, MMMM d, yyyy')}
              <br />
              {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
            </CardDescription>
          </div>
          <div className="flex justify-end md:justify-start">
            <Button variant="ghost" size="sm" onClick={() => onEdit(event)} className="h-10 w-10 md:h-8 md:w-8 p-0">
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
        {event.description && (
          <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4">{event.description}</p>
        )}
        {event.location && (
          <p className="text-sm md:text-base text-gray-600 mb-2">
            <MapPin className="inline-block mr-1 h-4 w-4" />
            {event.location}
          </p>
        )}
        {event.url && (
          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm md:text-base text-blue-600 hover:underline mt-2 inline-block"
          >
            <ExternalLink className="inline-block mr-1 h-4 w-4" />
            Event Link
          </a>
        )}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0 mt-4 md:mt-6">
          <div className="text-sm md:text-base text-muted-foreground">
            {event.allow_rsvp ? (
              `${event.attendance || 0} ${event.attendance === 1 ? 'person' : 'people'} ${isCheckIn ? 'checked in' : 'attending'}`
            ) : (
              <span className="flex items-center gap-1">
                <HelpCircle className="h-3 w-3" />
                Announcement only
              </span>
            )}
          </div>
          <div className="flex flex-col md:flex-row gap-2">
            {event.needs_volunteers && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onManageVolunteers(event)}
                className="h-12 md:h-9 text-base md:text-sm"
              >
                <Handshake className="mr-2 h-4 w-4" />
                Manage Volunteers
              </Button>
            )}
            {event.allow_rsvp && (
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
                {isPastEvent ? (
                  <Button
                    onClick={() => onRSVP(event)}
                    className="bg-orange-600 hover:bg-orange-700 text-white h-12 md:h-9 text-base md:text-sm"
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Attendance
                  </Button>
                ) : isCheckIn ? (
                  <Button
                    onClick={() => onRSVP(event)}
                    className="bg-green-600 hover:bg-green-700 h-12 md:h-9 text-base md:text-sm"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Check In
                  </Button>
                ) : isPotluck ? (
                  <Button
                    onClick={() => onPotluckRSVP(event)}
                    className="bg-blue-600 hover:bg-blue-700 text-white h-12 md:h-9 text-base md:text-sm"
                  >
                    <Utensils className="mr-2 h-4 w-4" />
                    Potluck RSVP
                  </Button>
                ) : (
                  <Button
                    onClick={() => onRSVP(event)}
                    className="bg-blue-600 hover:bg-blue-700 text-white h-12 md:h-9 text-base md:text-sm"
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

export default function Events() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [events, setEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [filteredPastEvents, setFilteredPastEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPast, setIsLoadingPast] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pastSearchQuery, setPastSearchQuery] = useState('');
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
    status: 'visitor'
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
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().split('T')[0]);
  const [months, setMonths] = useState([
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ]);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    attendance_type: 'rsvp'
  });
  const [isVolunteerDialogOpen, setIsVolunteerDialogOpen] = useState(false);
  const [volunteerDialogEvent, setVolunteerDialogEvent] = useState(null);
  const [suggestedMembers, setSuggestedMembers] = useState([]);
  const [memberAttendanceCount, setMemberAttendanceCount] = useState({});
  const [activeTab, setActiveTab] = useState('upcoming');
  const [isEditingPastEvent, setIsEditingPastEvent] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('events')
        .select('*, event_attendance(*)')
        .gte('start_date', today.toISOString())
        .order('start_date', { ascending: true });

      if (error) throw error;

      // Process events to only show next instance of recurring events and add attendance count
      const processedEvents = data.reduce((acc, event) => {
        // Add attendance count to the event
        const eventWithAttendance = {
          ...event,
          attendance: event.event_attendance?.length || 0
        };

        // If it's not a recurring event, add it
        if (!event.recurrence_pattern) {
          acc.push(eventWithAttendance);
          return acc;
        }

        // For recurring events, check if we already have an instance of this event
        const existingEvent = acc.find(e => 
          e.title === event.title && 
          e.recurrence_pattern === event.recurrence_pattern
        );

        if (existingEvent) {
          // If we already have an instance, only keep the earlier one
          if (new Date(event.start_date) < new Date(existingEvent.start_date)) {
            acc = acc.filter(e => e.id !== existingEvent.id);
            acc.push(eventWithAttendance);
          }
        } else {
          acc.push(eventWithAttendance);
        }
        return acc;
      }, []);

      setEvents(processedEvents);
      setFilteredEvents(processedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: 'Error',
        description: 'Failed to load events',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchPastEvents = useCallback(async () => {
    try {
      setIsLoadingPast(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get events from the last week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      oneWeekAgo.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('events')
        .select('*, event_attendance(*)')
        .gte('start_date', oneWeekAgo.toISOString())
        .lt('start_date', today.toISOString())
        .order('start_date', { ascending: false });

      if (error) throw error;

      // Process past events and add attendance count
      const processedPastEvents = data.map(event => ({
        ...event,
        attendance: event.event_attendance?.length || 0
      }));

      setPastEvents(processedPastEvents);
      setFilteredPastEvents(processedPastEvents);
    } catch (error) {
      console.error('Error fetching past events:', error);
      toast({
        title: 'Error',
        description: 'Failed to load past events',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingPast(false);
    }
  }, [toast]);

  // Update the filtering effect to only handle search and attendance filters
  useEffect(() => {
    let filtered = [...events];

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

    setFilteredEvents(filtered);
  }, [events, searchQuery, attendanceFilter]);

  // Filter past events
  useEffect(() => {
    let filtered = [...pastEvents];

    // Apply search filter
    if (pastSearchQuery) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(pastSearchQuery.toLowerCase()) ||
        event.location?.toLowerCase().includes(pastSearchQuery.toLowerCase())
      );
    }

    setFilteredPastEvents(filtered);
  }, [pastEvents, pastSearchQuery]);

  // Initial fetch
  useEffect(() => {
    fetchEvents();
    fetchPastEvents();
  }, [fetchEvents, fetchPastEvents]);

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
      attendance: event.event_attendance?.filter(a => a.status === 'attending').length || 0,
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
    // console.log('Current events:', events);
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
      const { data, error } = await supabase
        .from('members')
        .select('*')
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
      const { data: attendanceData, error } = await supabase
        .from('event_attendance')
        .upsert({
          event_id: selectedEvent.id,
          member_id: member.id,
          status: 'attending'
        })
        .select()
        .single();

      if (error) throw error;

      // Trigger automation for event attendance
      console.log('🔍 User object for event attendance:', user);
      
      // Get organization_id from organization_users table
      let organizationId = null;
      try {
        const { data: orgData, error: orgError } = await supabase
          .from('organization_users')
          .select('organization_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();
        
        if (orgError) {
          console.error('Error fetching organization_id for event attendance:', orgError);
        } else {
          organizationId = orgData?.organization_id;
          console.log('🔍 Found organization_id for event attendance:', organizationId);
        }
      } catch (error) {
        console.error('Error fetching organization_id for event attendance:', error);
      }
      
      if (organizationId) {
        try {
          console.log('🚀 Triggering event_attendance automation for member:', member);
          console.log('🎯 Event data:', selectedEvent);
          const triggerData = {
            id: attendanceData.id,
            event_id: selectedEvent.id,
            member_id: member.id,
            status: 'attending',
            event_type: selectedEvent.event_type,
            member_type: member.status === 'visitor' ? 'visitor' : (member.member_type || 'adult'),
            attendance_status: 'attended',
            is_first_visit: member.status === 'visitor',
            event_date: selectedEvent.start_date,
            firstname: member.firstname,
            lastname: member.lastname,
            phone: member.phone
          };
          console.log('📊 Trigger data:', triggerData);
          await automationService.triggerAutomation(
            'event_attendance',
            triggerData,
            organizationId
          );
        } catch (automationError) {
          console.error('Automation trigger failed:', automationError);
          // Don't fail the main operation if automation fails
        }
      } else {
        console.log('❌ No organization_id found for event attendance, skipping automation');
      }

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
      await fetchEvents();

      // Close the dialog if all members have been added
      if (selectedEvent?.attendance_type === 'check-in') {
        setIsMemberDialogOpen(false);
      }
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

      // Refresh the events list to update attendance count
      await fetchEvents();

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

      // Refresh the events list to update attendance count
      await fetchEvents();

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
      // If email is empty, set it to null to avoid unique constraint issues
      const memberData = {
        firstname: newMember.firstname,
        lastname: newMember.lastname,
        email: newMember.email || null,
        phone: newMember.phone || null,
        status: 'visitor' // Always set to visitor for new people added during check-in
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

      // Trigger automation for new visitor creation
      console.log('🔍 User object:', user);
      console.log('🔍 Automation service:', automationService);
      
      // Get organization_id from organization_users table
      let organizationId = null;
      try {
        const { data: orgData, error: orgError } = await supabase
          .from('organization_users')
          .select('organization_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();
        
        if (orgError) {
          console.error('Error fetching organization_id:', orgError);
        } else {
          organizationId = orgData?.organization_id;
          console.log('🔍 Found organization_id:', organizationId);
        }
      } catch (error) {
        console.error('Error fetching organization_id:', error);
      }
      
      if (organizationId) {
        try {
          console.log('🚀 Triggering member_created automation for new visitor:', data);
          await automationService.triggerAutomation(
            'member_created',
            {
              id: data.id,
              firstname: data.firstname,
              lastname: data.lastname,
              email: data.email,
              phone: data.phone,
              status: 'visitor',
              member_type: 'visitor',
              created_at: data.created_at
            },
            organizationId
          );
        } catch (automationError) {
          console.error('Automation trigger failed for new visitor:', automationError);
          // Don't fail the main operation if automation fails
        }
      } else {
        console.log('❌ No organization_id found, skipping automation');
      }

      // Reset form and close dialog
      setNewMember({
        firstname: '',
        lastname: '',
        email: '',
        phone: '',
        status: 'visitor'
      });
      setIsCreateMemberOpen(false);

      toast({
        title: "Success",
        description: `New visitor created and ${selectedEvent?.attendance_type === 'check-in' ? 'checked in' : 'RSVP\'d'} to the event.`
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
      await updateEvent(editingEvent.id, eventData);
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
        variant: "destructive",
        title: "Error",
        description: "Failed to update event. Please try again."
      });
    }
  };

  const handleViewAttendance = async (event) => {
    try {
      setSelectedEvent(event);
      setIsMemberDialogOpen(true);
      
      // First get all members who have already RSVP'd/checked in
      const { data: attendingMembers, error: attendanceError } = await supabase
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
      
      // Get the IDs of members who have already RSVP'd/checked in
      const attendingMemberIds = attendingMembers?.map(a => a.member_id) || [];
      
      // Then get all members who haven't RSVP'd/checked in
      const { data: availableMembers, error: membersError } = await supabase
        .from('members')
        .select('*')
        .not('id', 'in', `(${attendingMemberIds.join(',')})`);

      if (membersError) throw membersError;
      
      setMembers(availableMembers || []);
      setAlreadyRSVPMembers(attendingMembers?.map(a => a.members) || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch attendance data. Please try again."
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

  const handleOpenDialog = async (event) => {
    setSelectedEvent(event);
    setSelectedMembers([]);
    setMemberSearchQuery('');
    setIsMemberDialogOpen(true);
    
    // Check if this is a past event
    const eventDate = new Date(event.start_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isPastEvent = eventDate < today;
    setIsEditingPastEvent(isPastEvent);
    
    try {
      // Fetch all members
      const { data: allMembers, error: membersError } = await supabase
        .from('members')
        .select('*')
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

      // If this is a recurring event, get attendance suggestions based on previous instances
      let suggestedMembers = [];
      let attendanceCounts = {};
      if (event.is_recurring || event.recurrence_pattern) {
        try {
          // Get previous instances of this event (or similar events of the same type)
          const { data: previousAttendance, error: prevError } = await supabase
            .from('event_attendance')
            .select(`
              member_id,
              status,
              events!inner (
                id,
                title,
                event_type,
                start_date,
                is_recurring,
                recurrence_pattern
              )
            `)
            .eq('events.event_type', event.event_type)
            .eq('events.is_recurring', true)
            .gte('events.start_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()); // Last 90 days

          if (!prevError && previousAttendance) {
            // Count attendance frequency for each member
            previousAttendance.forEach(record => {
              const memberId = record.member_id;
              attendanceCounts[memberId] = (attendanceCounts[memberId] || 0) + 1;
            });

            // Sort members by attendance frequency (most frequent first)
            const sortedMemberIds = Object.keys(attendanceCounts)
              .sort((a, b) => attendanceCounts[b] - attendanceCounts[a]);

            // Get the top 10 most frequent attendees who are available
            const topAttendees = sortedMemberIds
              .slice(0, 10)
              .map(memberId => availableMembers.find(m => m.id === memberId))
              .filter(Boolean);

            suggestedMembers = topAttendees;
          }
        } catch (error) {
          console.error('Error fetching attendance suggestions:', error);
          // Continue without suggestions if there's an error
        }
      }

      // Sort available members: suggested members first, then alphabetically
      const sortedAvailableMembers = [
        ...suggestedMembers,
        ...availableMembers.filter(member => !suggestedMembers.find(s => s.id === member.id))
      ];

      setMembers(sortedAvailableMembers);
      setSuggestedMembers(suggestedMembers);
      setMemberAttendanceCount(attendanceCounts);
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
    setSuggestedMembers([]);
    setMemberAttendanceCount({});
    setIsEditingPastEvent(false);
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

  const handlePotluckRSVPUpdate = useCallback(async () => {
    // Refresh the events list to update attendance counts
    await fetchEvents();
    
    if (selectedPotluckEvent) {
      handlePotluckRSVP(selectedPotluckEvent);
    }
  }, [selectedPotluckEvent, handlePotluckRSVP, fetchEvents]);

  const handleManageVolunteers = (event) => {
    setVolunteerDialogEvent(event);
    setIsVolunteerDialogOpen(true);
  };

  const renderEventCard = useCallback((event) => {
    return (
      <EventCard
        key={event.id}
        event={event}
        onRSVP={handleOpenDialog}
        onPotluckRSVP={handlePotluckRSVP}
        onEdit={handleEditClick}
        onDelete={handleDeleteEvent}
        onManageVolunteers={handleManageVolunteers}
      />
    );
  }, [handleOpenDialog, handlePotluckRSVP, handleEditClick, handleDeleteEvent, handleManageVolunteers]);

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
    <div className="w-full px-0 md:px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 px-2 md:px-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Events</h1>
          <p className="text-gray-600 text-lg">Manage and track event attendance</p>
        </div>
        <Button
          onClick={() => setIsCreateEventOpen(true)}
          className="w-full md:w-auto h-14 text-lg"
        >
          Create New Event
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full px-2 md:px-0">
        <TabsList className="grid w-full grid-cols-2 h-14 mb-6">
          <TabsTrigger value="upcoming" className="text-lg">Upcoming Events</TabsTrigger>
          <TabsTrigger value="past" className="text-lg">Past Events</TabsTrigger>
        </TabsList>

        {/* Upcoming Events Tab */}
        <TabsContent value="upcoming" className="space-y-4">
          {/* Search and Filters for Upcoming Events */}
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search upcoming events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-14 text-lg"
              />
            </div>
            <Select value={attendanceFilter} onValueChange={setAttendanceFilter}>
              <SelectTrigger className="w-full md:w-48 h-14 text-lg">
                <SelectValue placeholder="Filter by attendance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="attending">With Attendance</SelectItem>
                <SelectItem value="not_attending">No Attendance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Upcoming Events List */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="p-6">
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onRSVP={handleOpenDialog}
                  onPotluckRSVP={handlePotluckRSVP}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteEvent}
                  onManageVolunteers={handleManageVolunteers}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming events</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || attendanceFilter !== 'all' 
                  ? 'No events match your current filters.' 
                  : 'Get started by creating your first event.'}
              </p>
              {!searchQuery && attendanceFilter === 'all' && (
                <Button onClick={() => setIsCreateEventOpen(true)}>
                  Create Event
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        {/* Past Events Tab */}
        <TabsContent value="past" className="space-y-4">
          {/* Search for Past Events */}
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search past events..."
                value={pastSearchQuery}
                onChange={(e) => setPastSearchQuery(e.target.value)}
                className="w-full h-14 text-lg"
              />
            </div>
            <Button
              onClick={fetchPastEvents}
              variant="outline"
              className="w-full md:w-auto h-14 text-lg"
              disabled={isLoadingPast}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingPast ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Past Events List */}
          {isLoadingPast ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="p-6">
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredPastEvents.length > 0 ? (
            <div className="space-y-4">
              {filteredPastEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onRSVP={handleOpenDialog}
                  onPotluckRSVP={handlePotluckRSVP}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteEvent}
                  onManageVolunteers={handleManageVolunteers}
                  isPastEvent={true}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No past events</h3>
              <p className="text-gray-500 mb-4">
                {pastSearchQuery 
                  ? 'No past events match your search.' 
                  : 'No events from the last week found.'}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Event Dialog */}
      <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
        <DialogContent className="w-full max-w-full h-full md:h-auto md:max-w-3xl p-0">
          <DialogHeader className="p-3 md:p-6 border-b">
            <DialogTitle className="text-2xl md:text-3xl">
              {editingEvent ? 'Edit Event' : 'Create New Event'}
            </DialogTitle>
          </DialogHeader>

          <div className="p-3 md:p-6">
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
                allow_rsvp: true,
                attendance_type: 'rsvp',
                event_type: 'Sunday Worship Service'
              }}
              onSave={handleCreateEvent}
              onCancel={() => setIsCreateEventOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Member Selection Dialog */}
      <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
        <DialogContent className="w-full max-w-full h-full md:h-auto md:max-w-3xl p-0">
          <DialogHeader className="p-3 md:p-6 border-b">
            <div className="space-y-2">
              <DialogTitle className="text-2xl md:text-3xl">
                {isEditingPastEvent 
                  ? 'Edit Attendance' 
                  : selectedEvent?.attendance_type === 'check-in' 
                    ? 'Check In People' 
                    : 'RSVP Members'
                } - {selectedEvent?.title}
              </DialogTitle>
              {suggestedMembers.length > 0 && (
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-green-600" />
                  <span className="text-lg text-green-600 font-normal">
                    Smart suggestions available
                  </span>
                </div>
              )}
            </div>
            <DialogDescription className="text-lg mt-2">
              {isEditingPastEvent
                ? `Edit attendance records for ${selectedEvent?.title}`
                : selectedEvent?.attendance_type === 'check-in'
                  ? 'Check In People for the event'
                  : `Select members to RSVP for ${selectedEvent?.title}`
              }
            </DialogDescription>
            {suggestedMembers.length > 0 && (
              <div className="mt-2 text-sm text-green-600">
                Members who frequently attend similar events are highlighted below
              </div>
            )}
          </DialogHeader>

          <div className="p-3 md:p-6">
            <Tabs defaultValue="available" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-14">
                <TabsTrigger value="available" className="text-lg">
                  {isEditingPastEvent ? 'Add Attendance' : 'Available People'}
                </TabsTrigger>
                <TabsTrigger value="checked-in" className="text-lg">
                  {selectedEvent?.attendance_type === 'check-in' ? 'Checked In' : 'RSVP\'d'}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="available" className="mt-4 md:mt-8">
                <div className="space-y-4 md:space-y-6">
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1">
                      <Input
                        placeholder="Search people..."
                        value={memberSearchQuery}
                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                        className="w-full h-14 text-lg"
                      />
                    </div>
                    <Button
                      onClick={() => setIsCreateMemberOpen(true)}
                      className="w-full md:w-auto h-14 text-lg bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Person
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {suggestedMembers.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-green-700 mb-2 flex items-center gap-2">
                          <Star className="h-5 w-5" />
                          Suggested Based on Previous Attendance
                        </h3>
                        <div className="space-y-2">
                          {suggestedMembers
                            .filter(member => 
                              member.firstname?.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                              member.lastname?.toLowerCase().includes(memberSearchQuery.toLowerCase())
                            )
                            .map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center space-x-4 p-3 md:p-4 rounded-lg border-2 border-green-200 bg-green-50 cursor-pointer hover:bg-green-100 transition-colors"
                              onClick={() => handleMemberClick(member)}
                            >
                              <Avatar className="h-12 w-12 md:h-16 md:w-16">
                                <AvatarImage src={member.image_url} />
                                <AvatarFallback className="text-lg md:text-xl">
                                  {getInitials(member.firstname, member.lastname)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="text-lg md:text-xl font-medium">
                                  {member.firstname} {member.lastname}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                                    {memberAttendanceCount[member.id] || 0} previous attendances
                                  </Badge>
                                  <span className="text-sm text-green-600">Frequent attendee</span>
                                </div>
                              </div>
                              <Star className="h-5 w-5 text-green-600" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      {members
                        .filter(member => 
                          !suggestedMembers.find(s => s.id === member.id) &&
                          (member.firstname?.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                           member.lastname?.toLowerCase().includes(memberSearchQuery.toLowerCase()))
                        )
                        .map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center space-x-4 p-3 md:p-4 rounded-lg border cursor-pointer hover:bg-gray-50"
                          onClick={() => handleMemberClick(member)}
                        >
                          <Avatar className="h-12 w-12 md:h-16 md:w-16">
                            <AvatarImage src={member.image_url} />
                            <AvatarFallback className="text-lg md:text-xl">
                              {getInitials(member.firstname, member.lastname)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-lg md:text-xl font-medium">
                              {member.firstname} {member.lastname}
                            </p>
                            {memberAttendanceCount[member.id] && (
                              <div className="mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {memberAttendanceCount[member.id]} previous attendances
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="checked-in" className="mt-4 md:mt-8">
                <div className="space-y-2">
                  {alreadyRSVPMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 md:p-4 rounded-lg border"
                    >
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12 md:h-16 md:w-16">
                          <AvatarImage src={member.image_url} />
                          <AvatarFallback className="text-lg md:text-xl">
                            {getInitials(member.firstname, member.lastname)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-lg md:text-xl font-medium">
                            {member.firstname} {member.lastname}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="lg"
                        onClick={() => handleRemoveMember(member.id)}
                        className="h-12 w-12 md:h-14 md:w-14 p-0"
                      >
                        <X className="h-6 w-6" />
                      </Button>
                    </div>
                  ))}
                  {alreadyRSVPMembers.length === 0 && (
                    <p className="text-base md:text-lg text-gray-500 italic p-4">
                      {selectedEvent?.attendance_type === 'check-in'
                        ? 'No members have checked in yet'
                        : "No members have RSVP'd yet"}
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="p-3 md:p-6 border-t">
            <div className="flex flex-col md:flex-row gap-3 w-full">
              <Button
                onClick={() => setIsCreateMemberOpen(true)}
                className="w-full md:w-auto text-lg h-14 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Person
              </Button>
              <Button
                variant={selectedEvent?.attendance_type === 'check-in' ? 'default' : 'outline'}
                onClick={handleCloseDialog}
                className={`w-full md:w-auto text-lg h-14 ${
                  selectedEvent?.attendance_type === 'check-in' ? 'bg-green-600 hover:bg-green-700' : ''
                }`}
              >
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create New Member Dialog */}
      <Dialog open={isCreateMemberOpen} onOpenChange={setIsCreateMemberOpen}>
        <DialogContent className="w-full max-w-full h-full md:h-auto md:max-w-3xl p-0">
          <DialogHeader className="p-3 md:p-6 border-b">
            <DialogTitle className="text-2xl md:text-3xl">Create New Person</DialogTitle>
            <DialogDescription className="text-lg mt-2">
              Add a new person and automatically {selectedEvent?.attendance_type === 'check-in' ? 'check them in' : 'RSVP them'} to this event.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 md:p-6">
            <form onSubmit={handleCreateMember} className="space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstname" className="text-lg">First Name</Label>
                  <Input
                    id="firstname"
                    name="firstname"
                    value={newMember.firstname}
                    onChange={(e) => setNewMember({...newMember, firstname: e.target.value})}
                    className="h-14 text-lg"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastname" className="text-lg">Last Name</Label>
                  <Input
                    id="lastname"
                    name="lastname"
                    value={newMember.lastname}
                    onChange={(e) => setNewMember({...newMember, lastname: e.target.value})}
                    className="h-14 text-lg"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-lg">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                  className="h-14 text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-lg">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={newMember.phone}
                  onChange={(e) => setNewMember({...newMember, phone: e.target.value})}
                  className="h-14 text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-lg">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={newMember.notes}
                  onChange={(e) => setNewMember({...newMember, notes: e.target.value})}
                  className="h-32 text-lg"
                />
              </div>
            </form>
          </div>

          <DialogFooter className="p-3 md:p-6 border-t">
            <Button
              type="submit"
              onClick={handleCreateMember}
              className="w-full md:w-auto text-lg h-14"
            >
              Create and {selectedEvent?.attendance_type === 'check-in' ? 'Check In' : 'RSVP'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={isEditEventOpen} onOpenChange={setIsEditEventOpen}>
        <DialogContent className="w-full max-w-full h-full md:h-auto md:max-w-3xl p-0">
          <DialogHeader className="p-3 md:p-6 border-b">
            <DialogTitle className="text-2xl md:text-3xl">
              Edit {editingEvent?.is_recurring ? 'Recurring Event Series' : 'Event'}
            </DialogTitle>
            <DialogDescription className="text-lg mt-2">
              {editingEvent?.is_recurring 
                ? `Update event details. Changes will apply to "${editingEvent.title}" and all future instances.`
                : 'Update event details.'
              }
            </DialogDescription>
          </DialogHeader>
          {editingEvent && (
            <>
              <div className="p-3 md:p-6">
                <EventForm
                  initialData={{
                    ...editingEvent,
                    startDate: new Date(editingEvent.start_date).toISOString().slice(0, 16),
                    endDate: new Date(editingEvent.end_date).toISOString().slice(0, 16),
                    allow_rsvp: editingEvent.allow_rsvp !== undefined ? editingEvent.allow_rsvp : true,
                    event_type: 'Sunday Worship Service'
                  }}
                  onSave={handleEditEvent}
                  onCancel={() => {
                    setIsEditEventOpen(false);
                    setEditingEvent(null);
                  }}
                />
              </div>
              <div className="p-3 md:p-6 border-t">
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
                  className="w-full md:w-auto text-lg h-14"
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

      {/* Volunteer Management Dialog */}
      <Dialog open={isVolunteerDialogOpen} onOpenChange={setIsVolunteerDialogOpen}>
        <DialogContent className="w-full max-w-full h-full md:h-auto md:max-w-4xl p-0">
          <DialogHeader className="p-3 md:p-6 border-b">
            <DialogTitle className="text-2xl md:text-3xl">
              Manage Volunteers - {volunteerDialogEvent?.title}
            </DialogTitle>
            <DialogDescription className="text-lg mt-2">
              Assign and manage volunteers for this event. {volunteerDialogEvent?.volunteer_roles && 
                `Available roles: ${parseVolunteerRoles(volunteerDialogEvent.volunteer_roles).map(r => r.role || r).join(', ')}`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 md:p-6 flex-1 overflow-hidden">
            <Tabs defaultValue="current" className="h-full">
              <TabsList className="grid w-full grid-cols-2 h-14">
                <TabsTrigger value="current" className="text-lg">Current Volunteers</TabsTrigger>
                <TabsTrigger value="add" className="text-lg">Add Volunteer</TabsTrigger>
              </TabsList>

              <TabsContent value="current" className="mt-4 h-full overflow-y-auto">
                <VolunteerList 
                  eventId={volunteerDialogEvent?.id}
                  availableRoles={parseVolunteerRoles(volunteerDialogEvent?.volunteer_roles)}
                  onVolunteerUpdated={() => {
                    // Refresh volunteer list
                  }}
                  onVolunteerRemoved={() => {
                    // Refresh volunteer list
                  }}
                />
              </TabsContent>

              <TabsContent value="add" className="mt-4 h-full overflow-y-auto">
                <AddVolunteerForm 
                  eventId={volunteerDialogEvent?.id}
                  availableRoles={parseVolunteerRoles(volunteerDialogEvent?.volunteer_roles)}
                  onVolunteerAdded={() => {
                    // Refresh volunteer list
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="p-3 md:p-6 border-t">
            <Button 
              onClick={() => setIsVolunteerDialogOpen(false)}
              className="w-full md:w-auto text-lg h-14"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
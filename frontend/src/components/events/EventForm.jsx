import React, { useState, useEffect } from 'react';
import { format, isAfter, addDays } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { parseVolunteerRoles, getCurrentUserOrganizationId } from '@/lib/data';
import { locationService } from '@/lib/locationService';
import { eventReminderService } from '@/lib/eventReminderService';
import { supabase } from '@/lib/supabaseClient';
import { 
  getOrganizationTimezone, 
  createTimezoneAwareDateInput, 
  parseTimezoneAwareDateInput,
  TIMEZONE_OPTIONS 
} from '@/lib/timezoneService';
import { AlertTriangle, CheckCircle, MapPin, Users, Building, Bell, MessageSquare, Clock, Plus, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const EventForm = ({ initialData, onSave, onCancel }) => {
  const [organizationTimezone, setOrganizationTimezone] = useState('America/New_York');
  const [eventData, setEventData] = useState({
    ...initialData,
    title: initialData.title || '',
    description: initialData.description || '',
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '10:00',
    location: initialData.location || '',
    location_id: initialData.location_id || '',
    
    is_recurring: initialData.is_recurring || false,
    recurrence_pattern: initialData.recurrence_pattern || '',
    monthly_week: initialData.monthly_week || '',
    monthly_weekday: initialData.monthly_weekday || '',
    allow_rsvp: initialData.allow_rsvp !== undefined ? initialData.allow_rsvp : true,
    attendance_type: initialData.attendance_type || 'rsvp',
    event_type: initialData.event_type || 'Worship Service',
    needs_volunteers: initialData.needs_volunteers || false,
    volunteer_roles: parseVolunteerRoles(initialData.volunteer_roles),
    
    // Reminder settings
    enable_reminders: initialData.enable_reminders || false,
    reminders: initialData.reminders || [
      {
        id: null,
        reminder_type: 'sms',
        timing_unit: 'hours',
        timing_value: 24,
        message_template: 'Reminder: {event_title} on {event_date} at {event_time}. {event_location}',
        target_type: 'all',
        target_groups: [],
        is_enabled: true
      }
    ]
  });
  const [locations, setLocations] = useState([]);
  const [availableLocations, setAvailableLocations] = useState([]);
  const [locationConflict, setLocationConflict] = useState(null);
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);
  const [groups, setGroups] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    console.log('=== EventForm useEffect START ===');
    console.log('EventForm useEffect - initialData:', initialData);
    console.log('EventForm useEffect - initialData.reminders:', initialData.reminders);
    console.log('EventForm useEffect - initialData.enable_reminders:', initialData.enable_reminders);
    console.log('EventForm useEffect - initialData.reminders type:', typeof initialData.reminders);
    console.log('EventForm useEffect - initialData.reminders is array:', Array.isArray(initialData.reminders));
    console.log('EventForm useEffect - initialData.reminders length:', initialData.reminders?.length || 0);
    
    setEventData({
      ...initialData,
      title: initialData.title || '',
      description: initialData.description || '',
      startDate: initialData.startDate ? (() => {
        const date = new Date(initialData.startDate);
        // Preserve the original time by treating it as UTC
        const utcYear = date.getUTCFullYear();
        const utcMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
        const utcDay = String(date.getUTCDate()).padStart(2, '0');
        const utcHours = String(date.getUTCHours()).padStart(2, '0');
        const utcMinutes = String(date.getUTCMinutes()).padStart(2, '0');
        return `${utcYear}-${utcMonth}-${utcDay}T${utcHours}:${utcMinutes}`;
      })() : '',
      endDate: initialData.endDate ? (() => {
        const date = new Date(initialData.endDate);
        // Preserve the original time by treating it as UTC
        const utcYear = date.getUTCFullYear();
        const utcMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
        const utcDay = String(date.getUTCDate()).padStart(2, '0');
        const utcHours = String(date.getUTCHours()).padStart(2, '0');
        const utcMinutes = String(date.getUTCMinutes()).padStart(2, '0');
        return `${utcYear}-${utcMonth}-${utcDay}T${utcHours}:${utcMinutes}`;
      })() : '',
      startTime: initialData.startDate ? (() => {
        const date = new Date(initialData.startDate);
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
      })() : '09:00',
      endTime: initialData.endDate ? (() => {
        const date = new Date(initialData.endDate);
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
      })() : '10:00',
      location: initialData.location || '',
      location_id: initialData.location_id || '',

      is_recurring: initialData.is_recurring || false,
      recurrence_pattern: initialData.recurrence_pattern || '',
      monthly_week: initialData.monthly_week || '',
      monthly_weekday: initialData.monthly_weekday || '',
      allow_rsvp: initialData.allow_rsvp !== undefined ? initialData.allow_rsvp : true,
      attendance_type: initialData.attendance_type || 'rsvp',
      event_type: initialData.event_type || 'Worship Service',
      needs_volunteers: initialData.needs_volunteers || false,
      volunteer_roles: parseVolunteerRoles(initialData.volunteer_roles),
      
      // Reminder settings
      enable_reminders: initialData.enable_reminders || false,
      reminders: initialData.reminders || [
        {
          id: null,
          reminder_type: 'sms',
          timing_unit: 'hours',
          timing_value: 24,
          message_template: 'Reminder: {event_title} on {event_date} at {event_time}. {event_location}',
          target_type: 'all',
          target_groups: [],
          is_enabled: true
        }
      ]
    });
    
    console.log('EventForm useEffect - final eventData:', {
      enable_reminders: initialData.enable_reminders || false,
      reminders: initialData.reminders || [],
      remindersLength: (initialData.reminders || []).length
    });
    console.log('=== EventForm useEffect END ===');
  }, [initialData]);

  // Load organization timezone and initialize form data
  useEffect(() => {
    const initializeForm = async () => {
      console.log('=== EVENT FORM INITIALIZATION START ===');
      console.log('Initial data:', initialData);
      
      try {
        const orgId = await getCurrentUserOrganizationId();
        console.log('Organization ID:', orgId);
        
        if (orgId) {
          const tz = await getOrganizationTimezone(orgId);
          console.log('Organization timezone:', tz);
          setOrganizationTimezone(tz);
          
          // Initialize form data with proper timezone handling
          if (initialData.startDate) {
            console.log('=== INITIALIZING START DATE ===');
            console.log('Original start date (UTC):', initialData.startDate);
            
            // Parse the UTC date and convert to local timezone
            const startDate = new Date(initialData.startDate);
            console.log('Start date object (local):', startDate.toString());
            
            // Extract components in local timezone
            const startDateStr = startDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format
            const startTimeStr = startDate.toLocaleTimeString('en-CA', { 
              hour: '2-digit', 
              minute: '2-digit', 
              hour12: false 
            });
            
            console.log('Extracted start date components (local):', {
              startDateStr,
              startTimeStr
            });
            
            setEventData(prev => ({
              ...prev,
              startDate: startDateStr,
              startTime: startTimeStr
            }));
          }
          
          if (initialData.endDate) {
            console.log('=== INITIALIZING END DATE ===');
            console.log('Original end date (UTC):', initialData.endDate);
            
            // Parse the UTC date and convert to local timezone
            const endDate = new Date(initialData.endDate);
            console.log('End date object (local):', endDate.toString());
            
            // Extract components in local timezone
            const endDateStr = endDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format
            const endTimeStr = endDate.toLocaleTimeString('en-CA', { 
              hour: '2-digit', 
              minute: '2-digit', 
              hour12: false 
            });
            
            console.log('Extracted end date components (local):', {
              endDateStr,
              endTimeStr
            });
            
            setEventData(prev => ({
              ...prev,
              endDate: endDateStr,
              endTime: endTimeStr
            }));
          }
        }
      } catch (error) {
        console.error('Error initializing form with timezone:', error);
      }
      
      console.log('=== EVENT FORM INITIALIZATION END ===');
    };
    
    initializeForm();
    loadLocations();
    loadGroups();
  }, [initialData]);

  // Check for conflicts when location or dates change
  useEffect(() => {
    if (eventData.location_id && eventData.startDate && eventData.endDate) {
      checkLocationConflict();
    } else {
      setLocationConflict(null);
    }
  }, [eventData.location_id, eventData.startDate, eventData.endDate]);

  // Load available locations when dates change
  useEffect(() => {
    if (eventData.startDate && eventData.endDate) {
      loadAvailableLocations();
    }
  }, [eventData.startDate, eventData.endDate]);

  const loadLocations = async () => {
    try {
      const data = await locationService.getLocations();
      setLocations(data);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const loadGroups = async () => {
    try {
      const data = await eventReminderService.getTargetGroups();
      setGroups(data);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const loadAvailableLocations = async () => {
    // Temporarily disable available locations until database function is fixed
    setAvailableLocations([]);
    return;
    
    try {
      const startDate = new Date(eventData.startDate);
      const endDate = new Date(eventData.endDate);
      const data = await locationService.getAvailableLocations(startDate, endDate);
      setAvailableLocations(data);
    } catch (error) {
      console.error('Error loading available locations:', error);
    }
  };

  const checkLocationConflict = async () => {
    if (!eventData.location_id || eventData.location_id === 'no-location' || !eventData.startDate || !eventData.endDate) {
      setLocationConflict(null);
      return;
    }

    setIsCheckingConflict(true);
    try {
      const startDate = new Date(eventData.startDate);
      const endDate = new Date(eventData.endDate);
      
      // Direct query to check for conflicts
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) {
        setLocationConflict(null);
        return;
      }

      // Get all events at this location and check for conflicts manually
      // When editing, exclude the current event by ID, and also check by title and time to avoid false conflicts
      
      // Check if initialData.id is a valid UUID before using it in the query
      const isValidUUID = initialData.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(initialData.id);
      
      let query = supabase
        .from('events')
        .select('id, title, start_date, end_date, parent_event_id')
        .eq('organization_id', organizationId)
        .eq('location_id', eventData.location_id);
      
      // Only exclude by ID if it's a valid UUID (exists in database)
      if (isValidUUID) {
        query = query.neq('id', initialData.id);
      }
      
      const { data: events, error } = await query;

      if (error) {
        console.error('Error fetching events for conflict check:', error);
        setLocationConflict(null);
        return;
      }

      // Check for overlapping events
      const conflictingEvent = events.find(event => {
        const eventStart = new Date(event.start_date);
        const eventEnd = new Date(event.end_date);
        
        // Check if the new event overlaps with existing event
        // Two events overlap if:
        // 1. New event starts before existing event ends AND
        // 2. New event ends after existing event starts
        const hasConflict = startDate < eventEnd && endDate > eventStart;
        
        // Additional checks to avoid false conflicts when editing the same event
        if (initialData.id) {
          // Don't conflict with events of the same title when editing (prevents self-conflict)
          if (event.title === initialData.title) {
            return false;
          }
          
          // Don't conflict with related recurring events (same parent or same master)
          if (initialData.parent_event_id && event.parent_event_id === initialData.parent_event_id) {
            return false;
          }
          
          // Don't conflict with the master event if editing an instance
          if (initialData.parent_event_id && event.id === initialData.parent_event_id) {
            return false;
          }
          
          // Don't conflict with instances if editing the master
          if (initialData.is_master && event.parent_event_id === initialData.id) {
            return false;
          }
        }
        
        return hasConflict;
      });

      if (conflictingEvent) {
        setLocationConflict({
          conflicting_event_title: conflictingEvent.title,
          conflicting_start_date: conflictingEvent.start_date,
          conflicting_end_date: conflictingEvent.end_date
        });
      } else {
        setLocationConflict(null);
      }
    } catch (error) {
      console.error('Error checking location conflict:', error);
      setLocationConflict(null);
    } finally {
      setIsCheckingConflict(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    console.log('Form field changed:', { name, value, type, checked });
    
    if (name === 'startDate' && value) {
      // Set end date to 1 hour after start date when start date changes
      const startDateTime = new Date(value);
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // Add 1 hour
      const endDateString = endDateTime.toISOString().slice(0, 16); // Format as YYYY-MM-DDTHH:MM
      
      console.log('Auto-setting end date:', {
        startDateTime: startDateTime.toString(),
        endDateTime: endDateTime.toString(),
        endDateString,
        endTime: endDateTime.toTimeString().slice(0, 5)
      });
      
      setEventData(prev => {
        const newData = {
          ...prev,
          [name]: value,
          endDate: endDateString,
          endTime: endDateTime.toTimeString().slice(0, 5) // Update end time to HH:MM
        };
        console.log('Updated eventData after start date change:', newData);
        return newData;
      });
    } else {
      setEventData(prev => {
        const newData = {
          ...prev,
          [name]: type === 'checkbox' ? checked : value
        };
        console.log('Updated eventData:', newData);
        return newData;
      });
    }
  };

  const handleSelectChange = (name, value) => {
    setEventData(prev => ({ ...prev, [name]: value }));
  };

  const handleRecurringChange = (checked) => {
    setEventData(prev => ({
      ...prev,
      is_recurring: checked,
      recurrence_pattern: checked ? prev.recurrence_pattern || 'weekly' : null
    }));
  };

  const handleRecurrencePatternChange = (value) => {
    setEventData(prev => ({
      ...prev,
      recurrence_pattern: value
    }));
  };

  const handleSubmit = (e) => {
    console.log('=== FORM SUBMIT TRIGGERED ===');
    e.preventDefault();
    
    console.log('=== EVENT FORM SUBMIT START ===');
    console.log('Current eventData:', JSON.stringify(eventData, null, 2));
    console.log('Organization timezone:', organizationTimezone);
    
    if (!eventData.title || !eventData.startDate || !eventData.endDate) {
      console.log('Missing required fields:', {
        title: !!eventData.title,
        startDate: !!eventData.startDate,
        endDate: !!eventData.endDate
      });
      toast({ title: "Missing Information", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    // Validate reminder settings
    if (eventData.enable_reminders && eventData.reminders) {
      for (const reminder of eventData.reminders) {
        if (reminder.is_enabled && reminder.target_type === 'groups' && (reminder.target_groups || []).length === 0) {
          toast({ title: "Reminder Configuration Error", description: "Please select at least one group when targeting specific groups.", variant: "destructive" });
          return;
        }
      }
    }

    // Check for location conflicts
    if (locationConflict) {
      toast({ 
        title: "Location Conflict", 
        description: "This location is already booked for the selected time. Please choose a different location or time.", 
        variant: "destructive" 
      });
      return;
    }

    // PROPER SOLUTION: Create Date objects and convert to UTC
    console.log('=== PROPER DATE PROCESSING ===');
    console.log('User entered dates:', {
      startDate: eventData.startDate,
      startTime: eventData.startTime,
      endDate: eventData.endDate,
      endTime: eventData.endTime
    });
    
    // Validate that dates are provided
    if (!eventData.startDate || !eventData.endDate || !eventData.startTime || !eventData.endTime) {
      console.error('Missing date/time fields');
      toast({ title: "Missing Information", description: "Please fill in all date and time fields.", variant: "destructive" });
      return;
    }
    
    // Create proper Date objects from the user input
    // Extract just the date part (before the T) and combine with time
    const startDateOnly = eventData.startDate.split('T')[0];
    const endDateOnly = eventData.endDate.split('T')[0];
    
    const startDateTime = `${startDateOnly}T${eventData.startTime}:00`;
    const endDateTime = `${endDateOnly}T${eventData.endTime}:00`;
    
    console.log('Combined date strings:', {
      startDateTime,
      endDateTime
    });
    
    // Create Date objects (these will be interpreted as local time)
    const startDateObj = new Date(startDateTime);
    const endDateObj = new Date(endDateTime);
    
    console.log('Date objects created:', {
      startDateObj: startDateObj.toString(),
      endDateObj: endDateObj.toString(),
      startDateValid: !isNaN(startDateObj.getTime()),
      endDateValid: !isNaN(endDateObj.getTime()),
      startDateTime: startDateTime,
      endDateTime: endDateTime
    });
    
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      console.error('Invalid date objects created');
      console.error('Input strings that failed:', {
        startDateTime,
        endDateTime
      });
      toast({ title: "Invalid Dates", description: "Please enter valid start and end dates.", variant: "destructive" });
      return;
    }
    
    // Add date comparison validation
    if (startDateObj >= endDateObj) {
      console.error('Start date is not before end date');
      console.error('Comparison:', {
        startDateObj: startDateObj.toISOString(),
        endDateObj: endDateObj.toISOString(),
        startDateObjTime: startDateObj.getTime(),
        endDateObjTime: endDateObj.getTime()
      });
      toast({ title: "Invalid Dates", description: "End date must be after start date.", variant: "destructive" });
      return;
    }
    
    // Convert to UTC for database storage
    const finalStartDateISO = startDateObj.toISOString();
    const finalEndDateISO = endDateObj.toISOString();
    
    console.log('Final UTC dates:', {
      finalStartDateISO,
      finalEndDateISO
    });
    
    console.log('=== FINAL DATES ===');
    console.log('Final ISO dates:', {
      finalStartDateISO,
      finalEndDateISO
    });

    // Format volunteer roles as JSON array of objects
    const formattedVolunteerRoles = Array.isArray(eventData.volunteer_roles) 
      ? eventData.volunteer_roles.map(role => {
          const roleName = typeof role === 'object' ? role.role : String(role);
          return { role: roleName.trim(), description: '' };
        })
      : [];

    const formattedData = {
      ...eventData,
      startDate: finalStartDateISO,
      endDate: finalEndDateISO,
      volunteer_roles: formattedVolunteerRoles,
      // Include reminder settings
      enable_reminders: eventData.enable_reminders,
      reminders: eventData.reminders || []
    };

    console.log('=== FINAL FORMATTED DATA ===');
    console.log('Formatted data being sent to onSave:', JSON.stringify(formattedData, null, 2));
    console.log('=== EVENT FORM SUBMIT END ===');

    onSave(formattedData);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="title">Event Title *</Label>
        <Input id="title" name="title" value={eventData.title} onChange={handleFormChange} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input id="description" name="description" value={eventData.description} onChange={handleFormChange} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="event_type">Event Type</Label>
        <Select
          value={eventData.event_type}
          onValueChange={(value) => handleSelectChange('event_type', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select event type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Worship Service">Worship Service</SelectItem>
            <SelectItem value="Bible Study or Class">Bible Study or Class</SelectItem>
            <SelectItem value="Prayer Meeting">Prayer Meeting</SelectItem>
            <SelectItem value="Fellowship Gathering">Fellowship Gathering</SelectItem>
            <SelectItem value="Potluck">Potluck</SelectItem>
            <SelectItem value="Youth Group">Youth Group</SelectItem>
            <SelectItem value="Children's Ministry">Children's Ministry</SelectItem>
            <SelectItem value="Men's Ministry">Men's Ministry</SelectItem>
            <SelectItem value="Women's Ministry">Women's Ministry</SelectItem>
            <SelectItem value="Board Meeting">Board Meeting</SelectItem>
            <SelectItem value="Community Service">Community Service</SelectItem>
            <SelectItem value="Special Event">Special Event</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Timezone Display */}
      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <Clock className="h-4 w-4 text-blue-600" />
        <span className="text-sm text-blue-800">
          All times are in <strong>{TIMEZONE_OPTIONS.find(tz => tz.value === organizationTimezone)?.label || organizationTimezone}</strong>
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date & Time *</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input 
              id="startDate" 
              name="startDate" 
              type="date" 
              value={eventData.startDate ? eventData.startDate.split('T')[0] : ''} 
              onChange={(e) => {
                const date = e.target.value;
                const time = eventData.startTime || '09:00';
                const dateTime = `${date}T${time}`;
                console.log('Start date input changed:', { date, time, dateTime });
                handleFormChange({ target: { name: 'startDate', value: dateTime } });
              }}
              required 
            />
            <Select 
              value={eventData.startTime || '09:00'} 
              onValueChange={(time) => {
                const date = eventData.startDate ? eventData.startDate.split('T')[0] : '';
                const dateTime = date ? `${date}T${time}` : '';
                console.log('Start time select changed:', { time, date, dateTime });
                setEventData(prev => ({ ...prev, startTime: time }));
                if (dateTime) {
                  handleFormChange({ target: { name: 'startDate', value: dateTime } });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Time" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {Array.from({ length: 48 }, (_, i) => {
                  const hour = Math.floor(i / 2);
                  const minute = (i % 2) * 30;
                  const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                  const displayTime = new Date(`2000-01-01T${time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
                  return (
                    <SelectItem key={time} value={time}>
                      {displayTime}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date & Time *</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input 
              id="endDate" 
              name="endDate" 
              type="date" 
              value={eventData.endDate ? eventData.endDate.split('T')[0] : ''} 
              onChange={(e) => {
                const date = e.target.value;
                const time = eventData.endTime || '10:00';
                const dateTime = `${date}T${time}`;
                console.log('End date input changed:', { date, time, dateTime });
                handleFormChange({ target: { name: 'endDate', value: dateTime } });
              }}
              required 
            />
            <Select 
              value={eventData.endTime || '10:00'} 
              onValueChange={(time) => {
                const date = eventData.endDate ? eventData.endDate.split('T')[0] : '';
                const dateTime = date ? `${date}T${time}` : '';
                console.log('End time select changed:', { time, date, dateTime });
                setEventData(prev => ({ ...prev, endTime: time }));
                if (dateTime) {
                  handleFormChange({ target: { name: 'endDate', value: dateTime } });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Time" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {Array.from({ length: 48 }, (_, i) => {
                  const hour = Math.floor(i / 2);
                  const minute = (i % 2) * 30;
                  const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                  const displayTime = new Date(`2000-01-01T${time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
                  return (
                    <SelectItem key={time} value={time}>
                      {displayTime}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="location_id">Location</Label>
        <Select
          value={eventData.location_id || 'no-location'}
          onValueChange={(value) => {
            if (value === 'no-location') {
              setEventData(prev => ({
                ...prev,
                location_id: null,
                location: ''
              }));
            } else {
              const selectedLocation = locations.find(l => l.id === value);
              setEventData(prev => ({
                ...prev,
                location_id: value,
                location: selectedLocation ? selectedLocation.name : ''
              }));
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no-location">No location</SelectItem>
            {locations.map((location) => (
              <SelectItem key={location.id} value={location.id}>
                <div className="flex items-center space-x-2">
                  {location.location_type === 'room' && <Building className="h-4 w-4" />}
                  {location.location_type === 'outdoor' && <MapPin className="h-4 w-4" />}
                  {location.location_type === 'virtual' && <Calendar className="h-4 w-4" />}
                  <span>{location.name}</span>
                  {location.capacity && (
                    <span className="text-xs text-gray-500">({location.capacity} capacity)</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Location Conflict Warning */}
        {locationConflict && (
          <Alert variant="destructive" className="mt-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Location Conflict:</strong> This location is already booked for "{locationConflict.conflicting_event_title}" 
              from {format(new Date(locationConflict.conflicting_start_date), 'MMM d, h:mm a')} to {format(new Date(locationConflict.conflicting_end_date), 'h:mm a')}.
            </AlertDescription>
          </Alert>
        )}

        {/* Available Locations Suggestion */}
        {eventData.startDate && eventData.endDate && availableLocations.length > 0 && !eventData.location_id && (
          <Alert className="mt-2">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Available locations:</strong> {availableLocations.map(l => l.location_name).join(', ')}
            </AlertDescription>
          </Alert>
        )}

        {/* Custom Location Input (fallback) */}
        <div className="mt-2">
          <Label htmlFor="location">Custom Location (if not in list)</Label>
          <Input 
            id="location" 
            name="location" 
            value={eventData.location} 
            onChange={handleFormChange}
            placeholder="Enter custom location if not in the list above"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="allow_rsvp"
            checked={eventData.allow_rsvp}
            onCheckedChange={(checked) => setEventData(prev => ({ ...prev, allow_rsvp: checked }))}
          />
          <Label htmlFor="allow_rsvp">Track Attendance</Label>
        </div>
        {eventData.allow_rsvp && (
          <div className="space-y-2">
            <Label htmlFor="attendance_type">Attendance Type</Label>
            <Select
              value={eventData.attendance_type}
              onValueChange={(value) => handleSelectChange('attendance_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select attendance type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rsvp">RSVP</SelectItem>
                <SelectItem value="check-in">Check-in</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="recurring">Recurring Event</Label>
        <Select value={eventData.is_recurring ? "yes" : "no"} onValueChange={(value) => handleRecurringChange(value === "yes")}>
          <SelectTrigger id="recurring"><SelectValue placeholder="Is this recurring?" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="no">No</SelectItem>
            <SelectItem value="yes">Yes</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {eventData.is_recurring && (
        <div className="space-y-2">
          <Label htmlFor="recurrencePattern">Recurrence Pattern</Label>
          <Select
            value={eventData.recurrence_pattern}
            onValueChange={(value) => {
              setEventData({
                ...eventData,
                recurrence_pattern: value,
                is_recurring: value !== 'none'
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select recurrence pattern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Recurrence</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="biweekly">Biweekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="monthly_weekday">Monthly (Specific Weekday)</SelectItem>
              <SelectItem value="fifth_sunday">Fifth Sunday Potluck</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      {eventData.recurrence_pattern === 'monthly_weekday' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="monthly_week">Week of Month</Label>
            <Select
              value={eventData.monthly_week}
              onValueChange={(value) => setEventData({
                ...eventData,
                monthly_week: value
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select week" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">First</SelectItem>
                <SelectItem value="2">Second</SelectItem>
                <SelectItem value="3">Third</SelectItem>
                <SelectItem value="4">Fourth</SelectItem>
                <SelectItem value="5">Last</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="monthly_weekday">Day of Week</Label>
            <Select
              value={eventData.monthly_weekday}
              onValueChange={(value) => setEventData({
                ...eventData,
                monthly_weekday: value
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Sunday</SelectItem>
                <SelectItem value="1">Monday</SelectItem>
                <SelectItem value="2">Tuesday</SelectItem>
                <SelectItem value="3">Wednesday</SelectItem>
                <SelectItem value="4">Thursday</SelectItem>
                <SelectItem value="5">Friday</SelectItem>
                <SelectItem value="6">Saturday</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      {eventData.recurrence_pattern === 'fifth_sunday' && (
        <div className="space-y-2">
          <Label>Event will occur on the fifth Sunday of each month</Label>
          <p className="text-sm text-muted-foreground">
            This event will automatically be marked as a potluck event where members can RSVP and specify what dish they'll bring.
          </p>
        </div>
      )}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="needs_volunteers"
            checked={eventData.needs_volunteers}
            onCheckedChange={(checked) => setEventData(prev => ({ ...prev, needs_volunteers: checked }))}
          />
          <Label htmlFor="needs_volunteers">Needs Volunteers</Label>
        </div>
      </div>
      {eventData.needs_volunteers && (
        <div className="space-y-2">
          <Label htmlFor="volunteer_roles">Volunteer Roles (one per line)</Label>
          <textarea
            id="volunteer_roles"
            name="volunteer_roles"
            value={Array.isArray(eventData.volunteer_roles) 
              ? eventData.volunteer_roles.map(role => typeof role === 'object' ? role.role : role).join('\n')
              : ''
            }
            onChange={(e) => {
              const roles = e.target.value.split('\n').filter(role => role.trim() !== '');
              setEventData(prev => ({ ...prev, volunteer_roles: roles }));
            }}
            placeholder="Enter volunteer roles, one per line (e.g., Usher, Greeter, Worship Team)"
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-sm text-muted-foreground">
            Enter each volunteer role on a separate line. These roles will be available when assigning volunteers to this event.
          </p>
        </div>
      )}
      
      {/* Multiple Reminders Configuration Section */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Event Reminders</h3>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="enable_reminders"
              checked={eventData.enable_reminders}
              onCheckedChange={(checked) => setEventData(prev => ({ ...prev, enable_reminders: checked }))}
            />
            <Label htmlFor="enable_reminders">Enable automatic reminders for this event</Label>
          </div>
        </div>
        
        {console.log('Rendering reminder section - enable_reminders:', eventData.enable_reminders, 'reminders:', eventData.reminders)}
        {eventData.enable_reminders && (
          <div className="space-y-4 pl-6">
            {/* Reminders List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Reminder Schedule</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newReminder = {
                      id: null,
                      reminder_type: 'sms',
                      timing_unit: 'hours',
                      timing_value: 24,
                      message_template: 'Reminder: {event_title} on {event_date} at {event_time}. {event_location}',
                      target_type: 'all',
                      target_groups: [],
                      is_enabled: true
                    };
                    setEventData(prev => ({
                      ...prev,
                      reminders: [...(prev.reminders || []), newReminder]
                    }));
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Reminder
                </Button>
              </div>
              
              {console.log('About to map reminders:', eventData.reminders)}
              {(eventData.reminders || []).map((reminder, index) => {
                console.log('Rendering reminder:', reminder, 'at index:', index);
                return (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={reminder.is_enabled}
                        onCheckedChange={(checked) => {
                          const updatedReminders = [...(eventData.reminders || [])];
                          updatedReminders[index].is_enabled = checked;
                          setEventData(prev => ({ ...prev, reminders: updatedReminders }));
                        }}
                      />
                      <Label className="font-medium">Reminder {index + 1}</Label>
                    </div>
                    {(eventData.reminders || []).length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const updatedReminders = (eventData.reminders || []).filter((_, i) => i !== index);
                          setEventData(prev => ({ ...prev, reminders: updatedReminders }));
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  {reminder.is_enabled && (
                    <div className="space-y-4 pl-6">
                      {/* Reminder Type */}
                      <div className="space-y-2">
                        <Label>Reminder Type</Label>
                        <Select
                          value={reminder.reminder_type}
                          onValueChange={(value) => {
                            const updatedReminders = [...(eventData.reminders || [])];
                            updatedReminders[index].reminder_type = value;
                            setEventData(prev => ({ ...prev, reminders: updatedReminders }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select reminder type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sms">
                              <div className="flex items-center space-x-2">
                                <MessageSquare className="h-4 w-4" />
                                <span>SMS Text Message</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="email">
                              <div className="flex items-center space-x-2">
                                <Users className="h-4 w-4" />
                                <span>Email</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Timing Configuration */}
                      <div className="space-y-2">
                        <Label>Send reminder</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            min="1"
                            value={reminder.timing_value}
                            onChange={(e) => {
                              const updatedReminders = [...(eventData.reminders || [])];
                              updatedReminders[index].timing_value = parseInt(e.target.value) || 1;
                              setEventData(prev => ({ ...prev, reminders: updatedReminders }));
                            }}
                            className="w-20"
                          />
                          <Select
                            value={reminder.timing_unit}
                            onValueChange={(value) => {
                              const updatedReminders = [...(eventData.reminders || [])];
                              updatedReminders[index].timing_unit = value;
                              setEventData(prev => ({ ...prev, reminders: updatedReminders }));
                            }}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="minutes">minutes</SelectItem>
                              <SelectItem value="hours">hours</SelectItem>
                              <SelectItem value="days">days</SelectItem>
                              <SelectItem value="weeks">weeks</SelectItem>
                            </SelectContent>
                          </Select>
                          <span className="text-sm text-gray-600">before the event</span>
                        </div>
                      </div>
                      
                      {/* Target Configuration */}
                      <div className="space-y-2">
                        <Label>Send to</Label>
                        <Select
                          value={reminder.target_type}
                          onValueChange={(value) => {
                            const updatedReminders = [...(eventData.reminders || [])];
                            updatedReminders[index].target_type = value;
                            updatedReminders[index].target_groups = value === 'groups' ? reminder.target_groups : [];
                            setEventData(prev => ({ ...prev, reminders: updatedReminders }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select target audience" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All active members</SelectItem>
                            <SelectItem value="groups">Specific groups</SelectItem>
                            <SelectItem value="rsvp_attendees">Only RSVP attendees</SelectItem>
                            <SelectItem value="rsvp_declined">Only RSVP declined</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Group Selection */}
                      {reminder.target_type === 'groups' && (
                        <div className="space-y-2">
                          <Label>
                            Select Groups
                            {(reminder.target_groups || []).length > 0 && (
                              <span className="text-sm text-blue-600 ml-2">
                                ({(reminder.target_groups || []).length} selected)
                              </span>
                            )}
                          </Label>
                          <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                            {groups.map((group) => (
                              <div key={group.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`group-${index}-${group.id}`}
                                  checked={(reminder.target_groups || []).includes(group.id)}
                                  onCheckedChange={(checked) => {
                                    const updatedReminders = [...(eventData.reminders || [])];
                                    updatedReminders[index].target_groups = checked
                                      ? [...(reminder.target_groups || []), group.id]
                                      : (reminder.target_groups || []).filter(id => id !== group.id);
                                    setEventData(prev => ({ ...prev, reminders: updatedReminders }));
                                  }}
                                />
                                <Label htmlFor={`group-${index}-${group.id}`} className="text-sm cursor-pointer">
                                  {group.name}
                                  {group.description && (
                                    <span className="text-gray-500 ml-1">({group.description})</span>
                                  )}
                                </Label>
                              </div>
                            ))}
                          </div>
                          {(reminder.target_groups || []).length === 0 && (
                            <p className="text-sm text-orange-600">Please select at least one group</p>
                          )}
                        </div>
                      )}
                      
                      {/* Message Template */}
                      <div className="space-y-2">
                        <Label>Message Template</Label>
                        <Textarea
                          value={reminder.message_template}
                          onChange={(e) => {
                            const updatedReminders = [...(eventData.reminders || [])];
                            updatedReminders[index].message_template = e.target.value;
                            setEventData(prev => ({ ...prev, reminders: updatedReminders }));
                          }}
                          placeholder="Reminder: {event_title} on {event_date} at {event_time}. {event_location}"
                          className="min-h-[100px]"
                        />
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>Available variables: {'{event_title}'}, {'{event_date}'}, {'{event_time}'}, {'{event_location}'}, {'{hours_until_event}'}, {'{member_name}'}</p>
                          <p className="font-medium">Preview: {reminder.message_template
                            .replace(/{event_title}/g, eventData.title || 'Event')
                            .replace(/{event_date}/g, eventData.startDate ? format(new Date(eventData.startDate), 'MM/dd/yyyy') : 'Date')
                            .replace(/{event_time}/g, eventData.startTime || 'Time')
                            .replace(/{event_location}/g, eventData.location || 'Location')
                            .replace(/{hours_until_event}/g, reminder.timing_value.toString())
                            .replace(/{member_name}/g, 'John Doe')
                          }</p>
                          <p className="text-blue-600">Note: {eventData.startTime ? 'Times will be sent in your organization\'s timezone' : 'Time will be sent in your organization\'s timezone'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )})}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save Event</Button>
      </div>
    </form>
  );
};

export default EventForm;
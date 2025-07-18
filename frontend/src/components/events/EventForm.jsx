import React, { useState, useEffect } from 'react';
import { format, isAfter, addDays } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { parseVolunteerRoles, getCurrentUserOrganizationId } from '@/lib/data';
import { locationService } from '@/lib/locationService';
import { supabase } from '@/lib/supabaseClient';
import { AlertTriangle, CheckCircle, MapPin, Users, Building } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const EventForm = ({ initialData, onSave, onCancel }) => {
  const [eventData, setEventData] = useState({
    ...initialData,
    title: initialData.title || '',
    description: initialData.description || '',
    startDate: initialData.startDate ? format(new Date(initialData.startDate), 'yyyy-MM-dd\'T\'HH:mm') : '',
    endDate: initialData.endDate ? format(new Date(initialData.endDate), 'yyyy-MM-dd\'T\'HH:mm') : '',
    startTime: initialData.startDate ? format(new Date(initialData.startDate), 'HH:mm') : '09:00',
    endTime: initialData.endDate ? format(new Date(initialData.endDate), 'HH:mm') : '10:00',
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
    volunteer_roles: parseVolunteerRoles(initialData.volunteer_roles)
  });
  const [locations, setLocations] = useState([]);
  const [availableLocations, setAvailableLocations] = useState([]);
  const [locationConflict, setLocationConflict] = useState(null);
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setEventData({
      ...initialData,
      title: initialData.title || '',
      description: initialData.description || '',
      startDate: initialData.startDate ? format(new Date(initialData.startDate), 'yyyy-MM-dd\'T\'HH:mm') : '',
      endDate: initialData.endDate ? format(new Date(initialData.endDate), 'yyyy-MM-dd\'T\'HH:mm') : '',
      startTime: initialData.startDate ? format(new Date(initialData.startDate), 'HH:mm') : '09:00',
      endTime: initialData.endDate ? format(new Date(initialData.endDate), 'HH:mm') : '10:00',
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
      volunteer_roles: parseVolunteerRoles(initialData.volunteer_roles)
    });
  }, [initialData]);

  // Load locations on component mount
  useEffect(() => {
    loadLocations();
  }, []);

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
      const { data: events, error } = await supabase
        .from('events')
        .select('id, title, start_date, end_date')
        .eq('organization_id', organizationId)
        .eq('location_id', eventData.location_id)
        .neq('id', initialData.id || ''); // Exclude current event if editing

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
    
    if (name === 'startDate' && value) {
      // Set end date to 1 hour after start date when start date changes
      const startDateTime = new Date(value);
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // Add 1 hour
      const endDateString = endDateTime.toISOString().slice(0, 16); // Format as YYYY-MM-DDTHH:MM
      
      setEventData(prev => ({
        ...prev,
        [name]: value,
        endDate: endDateString,
        endTime: endDateTime.toTimeString().slice(0, 5) // Update end time to HH:MM
      }));
    } else {
      setEventData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
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
    e.preventDefault();
    if (!eventData.title || !eventData.startDate || !eventData.endDate) {
      toast({ title: "Missing Information", description: "Please fill in all required fields.", variant: "destructive" });
      return;
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

    // Convert local datetime to ISO string
    const startDate = new Date(eventData.startDate);
    const endDate = new Date(eventData.endDate);

    if (isAfter(startDate, endDate)) {
      toast({ title: "Invalid Dates", description: "End date must be after start date.", variant: "destructive" });
      return;
    }

    // Format volunteer roles as JSON array of objects
    const formattedVolunteerRoles = Array.isArray(eventData.volunteer_roles) 
      ? eventData.volunteer_roles.map(role => {
          const roleName = typeof role === 'object' ? role.role : String(role);
          return { role: roleName.trim(), description: '' };
        })
      : [];

    // Format dates for submission
    const formattedData = {
      ...eventData,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      volunteer_roles: formattedVolunteerRoles
    };

    onSave(formattedData);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
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
                handleFormChange({ target: { name: 'startDate', value: dateTime } });
              }}
              required 
            />
            <Select 
              value={eventData.startTime || '09:00'} 
              onValueChange={(time) => {
                const date = eventData.startDate ? eventData.startDate.split('T')[0] : '';
                const dateTime = date ? `${date}T${time}` : '';
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
                handleFormChange({ target: { name: 'endDate', value: dateTime } });
              }}
              required 
            />
            <Select 
              value={eventData.endTime || '10:00'} 
              onValueChange={(time) => {
                const date = eventData.endDate ? eventData.endDate.split('T')[0] : '';
                const dateTime = date ? `${date}T${time}` : '';
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
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save Event</Button>
      </div>
    </form>
  );
};

export default EventForm;
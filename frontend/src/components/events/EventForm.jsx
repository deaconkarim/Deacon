import React, { useState, useEffect } from 'react';
import { format, isAfter, addDays } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';

const EventForm = ({ initialData, onSave, onCancel }) => {
  const [eventData, setEventData] = useState({
    ...initialData,
    title: initialData.title || '',
    description: initialData.description || '',
    startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().slice(0, 16) : '',
    endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().slice(0, 16) : '',
    startTime: initialData.startDate ? new Date(initialData.startDate).toISOString().slice(11, 16) : '09:00',
    endTime: initialData.endDate ? new Date(initialData.endDate).toISOString().slice(11, 16) : '10:00',
    location: initialData.location || '',
    url: initialData.url || '',
    is_recurring: initialData.is_recurring || false,
    recurrence_pattern: initialData.recurrence_pattern || '',
    monthly_week: initialData.monthly_week || '',
    monthly_weekday: initialData.monthly_weekday || '',
    allow_rsvp: initialData.allow_rsvp !== undefined ? initialData.allow_rsvp : true
  });
  const { toast } = useToast();

  useEffect(() => {
    setEventData({
      ...initialData,
      title: initialData.title || '',
      description: initialData.description || '',
      startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().slice(0, 16) : '',
      endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().slice(0, 16) : '',
      startTime: initialData.startDate ? new Date(initialData.startDate).toISOString().slice(11, 16) : '09:00',
      endTime: initialData.endDate ? new Date(initialData.endDate).toISOString().slice(11, 16) : '10:00',
      location: initialData.location || '',
      url: initialData.url || '',
      is_recurring: initialData.is_recurring || false,
      recurrence_pattern: initialData.recurrence_pattern || '',
      monthly_week: initialData.monthly_week || '',
      monthly_weekday: initialData.monthly_weekday || '',
      allow_rsvp: initialData.allow_rsvp !== undefined ? initialData.allow_rsvp : true
    });
  }, [initialData]);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'startDate' && value) {
      // Always set end date to match start date when start date changes
      setEventData(prev => ({
        ...prev,
        [name]: value,
        endDate: value
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

    // Convert local datetime to ISO string
    const startDate = new Date(eventData.startDate);
    const endDate = new Date(eventData.endDate);

    if (isAfter(startDate, endDate)) {
      toast({ title: "Invalid Dates", description: "End date must be after start date.", variant: "destructive" });
      return;
    }

    // Format dates for submission
    const formattedData = {
      ...eventData,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
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
        <Label htmlFor="location">Location</Label>
        <Input id="location" name="location" value={eventData.location} onChange={handleFormChange} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="url">URL</Label>
        <Input id="url" name="url" type="url" value={eventData.url} onChange={handleFormChange} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="allow_rsvp">Allow RSVP</Label>
          <Select value={eventData.allow_rsvp ? "yes" : "no"} onValueChange={(value) => setEventData(prev => ({ ...prev, allow_rsvp: value === "yes" }))}>
            <SelectTrigger id="allow_rsvp"><SelectValue placeholder="Allow people to RSVP?" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes - Allow RSVPs</SelectItem>
              <SelectItem value="no">No - Announcement Only</SelectItem>
            </SelectContent>
          </Select>
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
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save Event</Button>
      </div>
    </form>
  );
};

export default EventForm;
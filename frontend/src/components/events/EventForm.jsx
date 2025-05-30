import React, { useState, useEffect } from 'react';
import { format, isAfter, addDays } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const EventForm = ({ initialData, onSave, onCancel }) => {
  const [eventData, setEventData] = useState(initialData);
  const { toast } = useToast();

  useEffect(() => {
    setEventData(initialData);
  }, [initialData]);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEventData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSelectChange = (name, value) => {
    setEventData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!eventData.title || !eventData.startDate || !eventData.endDate) {
      toast({ title: "Missing Information", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    const startDate = new Date(eventData.startDate);
    const endDate = new Date(eventData.endDate);
    if (isAfter(startDate, endDate)) {
      toast({ title: "Invalid Dates", description: "End date must be after start date.", variant: "destructive" });
      return;
    }
    onSave({ ...eventData, attendees: parseInt(eventData.attendees) || 0 });
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
          <Input id="startDate" name="startDate" type="datetime-local" value={eventData.startDate} onChange={handleFormChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date & Time *</Label>
          <Input id="endDate" name="endDate" type="datetime-local" value={eventData.endDate} onChange={handleFormChange} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input id="location" name="location" value={eventData.location} onChange={handleFormChange} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="organizer">Organizer</Label>
          <Input id="organizer" name="organizer" value={eventData.organizer} onChange={handleFormChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="attendees">Expected Attendees</Label>
          <Input id="attendees" name="attendees" type="number" min="0" value={eventData.attendees} onChange={handleFormChange} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Event Type</Label>
          <Select value={eventData.type} onValueChange={(value) => handleSelectChange('type', value)}>
            <SelectTrigger id="type"><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="worship">Worship</SelectItem>
              <SelectItem value="study">Bible Study</SelectItem>
              <SelectItem value="youth">Youth</SelectItem>
              <SelectItem value="fellowship">Fellowship</SelectItem>
              <SelectItem value="prayer">Prayer</SelectItem>
              <SelectItem value="music">Music</SelectItem>
              <SelectItem value="outreach">Outreach</SelectItem>
              <SelectItem value="training">Training</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="recurring">Recurring Event</Label>
          <Select value={eventData.recurring ? "yes" : "no"} onValueChange={(value) => handleSelectChange('recurring', value === "yes")}>
            <SelectTrigger id="recurring"><SelectValue placeholder="Is this recurring?" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="yes">Yes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {eventData.recurring && (
        <div className="space-y-2">
          <Label htmlFor="recurrencePattern">Recurrence Pattern</Label>
          <Select value={eventData.recurrencePattern || ""} onValueChange={(value) => handleSelectChange('recurrencePattern', value)}>
            <SelectTrigger id="recurrencePattern"><SelectValue placeholder="Select pattern" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
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
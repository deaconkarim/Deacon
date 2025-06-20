import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getEventVolunteers, updateEventVolunteer, removeEventVolunteer } from '@/lib/data';
import { useToast } from '@/components/ui/use-toast';
import { getInitials } from '@/lib/utils/formatters';
import { Edit2, Trash2, X, Check } from 'lucide-react';

export const VolunteerList = ({ eventId, availableRoles, onVolunteerUpdated, onVolunteerRemoved }) => {
  const [volunteers, setVolunteers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ role: '', notes: '' });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadVolunteers();
  }, [eventId]);

  const loadVolunteers = async () => {
    try {
      const data = await getEventVolunteers(eventId);
      setVolunteers(data || []);
    } catch (error) {
      console.error('Error loading volunteers:', error);
    }
  };

  const handleEdit = (volunteer) => {
    setEditingId(volunteer.id);
    setEditForm({
      role: volunteer.role,
      notes: volunteer.notes || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ role: '', notes: '' });
  };

  const handleSaveEdit = async () => {
    if (!editForm.role.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a role",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateEventVolunteer(editingId, {
        role: editForm.role.trim(),
        notes: editForm.notes.trim() || null
      });

      toast({
        title: "Success",
        description: "Volunteer updated successfully"
      });

      setEditingId(null);
      setEditForm({ role: '', notes: '' });
      loadVolunteers();
      if (onVolunteerUpdated) onVolunteerUpdated();
    } catch (error) {
      console.error('Error updating volunteer:', error);
      toast({
        title: "Error",
        description: "Failed to update volunteer",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (volunteerId) => {
    if (!confirm('Are you sure you want to remove this volunteer from the event?')) {
      return;
    }

    setIsLoading(true);
    try {
      await removeEventVolunteer(volunteerId);
      
      toast({
        title: "Success",
        description: "Volunteer removed successfully"
      });

      loadVolunteers();
      if (onVolunteerRemoved) onVolunteerRemoved();
    } catch (error) {
      console.error('Error removing volunteer:', error);
      toast({
        title: "Error",
        description: "Failed to remove volunteer",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (volunteers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No volunteers assigned to this event yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {volunteers.map((volunteer) => (
        <Card key={volunteer.id} className="relative">
          <CardContent className="p-4">
            {editingId === volunteer.id ? (
              // Edit mode
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={volunteer.member?.image_url} />
                    <AvatarFallback>
                      {getInitials(volunteer.member?.firstname, volunteer.member?.lastname)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold">
                      {volunteer.member?.firstname} {volunteer.member?.lastname}
                    </h4>
                    <p className="text-sm text-muted-foreground">{volunteer.member?.email}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor={`role-${volunteer.id}`}>Role *</Label>
                    {availableRoles.length > 0 ? (
                      <Select value={editForm.role} onValueChange={(value) => setEditForm(prev => ({ ...prev, role: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableRoles.map((roleItem, index) => (
                            <SelectItem key={index} value={roleItem.role || roleItem}>
                              {roleItem.role || roleItem}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">Custom Role</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id={`role-${volunteer.id}`}
                        value={editForm.role}
                        onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                        placeholder="Enter volunteer role"
                      />
                    )}
                    {editForm.role === 'custom' && (
                      <Input
                        value={editForm.role}
                        onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                        placeholder="Enter custom role"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`notes-${volunteer.id}`}>Notes</Label>
                    <Textarea
                      id={`notes-${volunteer.id}`}
                      value={editForm.notes}
                      onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Optional notes"
                      rows="2"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    disabled={isLoading || !editForm.role.trim()}
                    className="flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              // View mode
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={volunteer.member?.image_url} />
                    <AvatarFallback>
                      {getInitials(volunteer.member?.firstname, volunteer.member?.lastname)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">
                        {volunteer.member?.firstname} {volunteer.member?.lastname}
                      </h4>
                      <Badge variant="secondary">{volunteer.role}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{volunteer.member?.email}</p>
                    {volunteer.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{volunteer.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(volunteer)}
                    disabled={isLoading}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemove(volunteer.id)}
                    disabled={isLoading}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}; 
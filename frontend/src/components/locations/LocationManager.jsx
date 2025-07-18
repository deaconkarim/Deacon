import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Users, 
  Building, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { locationService } from '@/lib/locationService';
import { format } from 'date-fns';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

export default function LocationManager() {
  const [locations, setLocations] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [usageStats, setUsageStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: '',
    location_type: 'room'
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [locationsData, conflictsData, statsData] = await Promise.all([
        locationService.getLocations(),
        locationService.getLocationConflicts(),
        locationService.getLocationUsageStats(
          new Date(new Date().getFullYear(), 0, 1).toISOString(), // Start of year
          new Date().toISOString()
        )
      ]);
      
      setLocations(locationsData);
      setConflicts(conflictsData);
      setUsageStats(statsData);
    } catch (error) {
      console.error('Error loading location data:', error);
      toast({
        title: "Error",
        description: "Failed to load location data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLocation = () => {
    setEditingLocation(null);
    setFormData({
      name: '',
      description: '',
      capacity: '',
      location_type: 'room'
    });
    setIsDialogOpen(true);
  };

  const handleEditLocation = (location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      description: location.description || '',
      capacity: location.capacity?.toString() || '',
      location_type: location.location_type || 'room'
    });
    setIsDialogOpen(true);
  };

  const handleDeleteLocation = async (location) => {
    if (!confirm(`Are you sure you want to delete "${location.name}"? This will remove it from all future events.`)) {
      return;
    }

    try {
      await locationService.deleteLocation(location.id);
      toast({
        title: "Success",
        description: "Location deleted successfully"
      });
      loadData();
    } catch (error) {
      console.error('Error deleting location:', error);
      toast({
        title: "Error",
        description: "Failed to delete location",
        variant: "destructive"
      });
    }
  };

  const handleSaveLocation = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Location name is required",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const locationData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        location_type: formData.location_type
      };

      if (editingLocation) {
        await locationService.updateLocation(editingLocation.id, locationData);
        toast({
          title: "Success",
          description: "Location updated successfully"
        });
      } else {
        await locationService.createLocation(locationData);
        toast({
          title: "Success",
          description: "Location created successfully"
        });
      }

      setIsDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error saving location:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save location",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getLocationTypeIcon = (type) => {
    switch (type) {
      case 'room': return <Building className="h-4 w-4" />;
      case 'outdoor': return <MapPin className="h-4 w-4" />;
      case 'virtual': return <Calendar className="h-4 w-4" />;
      default: return <Building className="h-4 w-4" />;
    }
  };

  const getLocationTypeColor = (type) => {
    switch (type) {
      case 'room': return 'bg-blue-100 text-blue-800';
      case 'outdoor': return 'bg-green-100 text-green-800';
      case 'virtual': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading locations...</span>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Location Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your organization's locations and spaces</p>
        </div>
        <Button onClick={handleCreateLocation}>
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </motion.div>

      {/* Stats Overview */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Locations</p>
                <p className="text-2xl font-bold text-gray-900">{locations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Active Conflicts</p>
                <p className="text-2xl font-bold text-gray-900">{conflicts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">
                  {usageStats.reduce((sum, stat) => sum + stat.eventCount, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Hours</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(usageStats.reduce((sum, stat) => sum + stat.totalHours, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Locations List */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Locations</CardTitle>
            <CardDescription>Manage your organization's spaces and rooms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${getLocationTypeColor(location.location_type)}`}>
                      {getLocationTypeIcon(location.location_type)}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{location.name}</h3>
                      {location.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{location.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {location.location_type}
                        </Badge>
                        {location.capacity && (
                          <div className="flex items-center text-xs text-gray-500">
                            <Users className="h-3 w-3 mr-1" />
                            {location.capacity} capacity
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditLocation(location)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteLocation(location)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {locations.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Building className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No locations found. Create your first location to get started.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Location Conflicts */}
      {conflicts.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Location Conflicts
              </CardTitle>
              <CardDescription>Events that are scheduled at the same time in the same location</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conflicts.map((conflict, index) => (
                  <div key={index} className="p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-red-900 dark:text-red-100">
                        {conflict.location_name}
                      </h4>
                      <Badge variant="destructive" className="text-xs">
                        Conflict
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{conflict.event1_title}</p>
                        <p className="text-gray-600 dark:text-gray-400">
                          {format(new Date(conflict.event1_start), 'MMM d, yyyy h:mm a')} - 
                          {format(new Date(conflict.event1_end), 'h:mm a')}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{conflict.event2_title}</p>
                        <p className="text-gray-600 dark:text-gray-400">
                          {format(new Date(conflict.event2_start), 'MMM d, yyyy h:mm a')} - 
                          {format(new Date(conflict.event2_end), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Location Usage Stats */}
      {usageStats.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Location Usage Statistics
              </CardTitle>
              <CardDescription>Usage statistics for the current year</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {usageStats.map((stat) => (
                  <div key={stat.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{stat.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {stat.eventCount} events • {Math.round(stat.totalHours)} hours
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {stat.capacity ? `${stat.eventCount}/${stat.capacity}` : stat.eventCount}
                      </p>
                      <p className="text-xs text-gray-500">events</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Location Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingLocation ? 'Edit Location' : 'Add New Location'}
            </DialogTitle>
            <DialogDescription>
              {editingLocation 
                ? 'Update the location details below.'
                : 'Add a new location to your organization.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Location Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Main Sanctuary"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the location"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  placeholder="e.g., 200"
                />
              </div>
              <div>
                <Label htmlFor="location_type">Type</Label>
                <Select
                  value={formData.location_type}
                  onValueChange={(value) => setFormData({ ...formData, location_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="room">Room</SelectItem>
                    <SelectItem value="outdoor">Outdoor</SelectItem>
                    <SelectItem value="virtual">Virtual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveLocation} disabled={isSaving}>
              {isSaving ? 'Saving...' : (editingLocation ? 'Update' : 'Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
} 
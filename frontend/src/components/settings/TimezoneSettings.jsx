import React, { useState, useEffect } from 'react';
import { Clock, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { getCurrentUserOrganizationId } from '@/lib/data';
import { 
  getOrganizationTimezone, 
  updateOrganizationTimezone, 
  TIMEZONE_OPTIONS,
  getCurrentTimeInOrganizationTimezone 
} from '@/lib/timezoneService';

const TimezoneSettings = () => {
  const [organizationId, setOrganizationId] = useState(null);
  const [currentTimezone, setCurrentTimezone] = useState('America/New_York');
  const [selectedTimezone, setSelectedTimezone] = useState('America/New_York');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const initializeTimezone = async () => {
      try {
        const orgId = await getCurrentUserOrganizationId();
        if (orgId) {
          setOrganizationId(orgId);
          const tz = await getOrganizationTimezone(orgId);
          setCurrentTimezone(tz);
          setSelectedTimezone(tz);
        }
      } catch (error) {
        console.error('Error loading organization timezone:', error);
        toast({
          title: "Error",
          description: "Failed to load timezone settings.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeTimezone();
  }, [toast]);

  useEffect(() => {
    // Update current time every minute
    const updateTime = () => {
      if (selectedTimezone) {
        const time = getCurrentTimeInOrganizationTimezone(selectedTimezone);
        setCurrentTime(time);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [selectedTimezone]);

  const handleSaveTimezone = async () => {
    if (!organizationId) return;

    setIsSaving(true);
    try {
      await updateOrganizationTimezone(organizationId, selectedTimezone);
      setCurrentTimezone(selectedTimezone);
      
      toast({
        title: "Success",
        description: "Timezone updated successfully. All event times will now be displayed in your selected timezone.",
      });
    } catch (error) {
      console.error('Error updating timezone:', error);
      toast({
        title: "Error",
        description: "Failed to update timezone. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Timezone Settings</h3>
        <p className="text-sm text-muted-foreground">
          Set your organization's timezone. All event times will be displayed and stored in this timezone.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="timezone">Organization Timezone</Label>
          <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
            <SelectTrigger>
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONE_OPTIONS.map((timezone) => (
                <SelectItem key={timezone.value} value={timezone.value}>
                  {timezone.label} ({timezone.offset})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Current Time Display */}
        {currentTime && (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
            <Clock className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-800">
              Current time in {TIMEZONE_OPTIONS.find(tz => tz.value === selectedTimezone)?.label}: <strong>{currentTime}</strong>
            </span>
          </div>
        )}

        {/* Warning if timezone changed */}
        {selectedTimezone !== currentTimezone && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Changing your timezone will affect how all event times are displayed. 
              Existing events will be converted to the new timezone.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={handleSaveTimezone} 
            disabled={isSaving || selectedTimezone === currentTimezone}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Timezone'}
          </Button>
          
          {selectedTimezone !== currentTimezone && (
            <Button 
              variant="outline" 
              onClick={() => setSelectedTimezone(currentTimezone)}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Timezone Information */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2">How Timezone Works</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• All event times are stored in your organization's timezone</li>
          <li>• When you create or edit events, times are interpreted in your selected timezone</li>
          <li>• Event times are displayed consistently across all users in your organization</li>
          <li>• Changing timezone will update how existing events are displayed</li>
        </ul>
      </div>
    </div>
  );
};

export default TimezoneSettings;

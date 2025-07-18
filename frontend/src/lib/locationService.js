import { supabase } from './supabaseClient';
import { getCurrentUserOrganizationId } from './data';

export const locationService = {
  // Get all locations for the current organization
  async getLocations() {
    try {
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) {
        throw new Error('User not associated with any organization');
      }

      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }
  },

  // Get a specific location by ID
  async getLocation(id) {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching location:', error);
      throw error;
    }
  },

  // Create a new location
  async createLocation(locationData) {
    try {
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) {
        throw new Error('User not associated with any organization');
      }

      const { data, error } = await supabase
        .from('locations')
        .insert({
          ...locationData,
          organization_id: organizationId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating location:', error);
      throw error;
    }
  },

  // Update a location
  async updateLocation(id, updates) {
    try {
      const { data, error } = await supabase
        .from('locations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  },

  // Delete a location (soft delete by setting is_active to false)
  async deleteLocation(id) {
    try {
      const { error } = await supabase
        .from('locations')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting location:', error);
      throw error;
    }
  },

  // Check for location conflicts
  async checkLocationConflict(locationId, startDate, endDate, eventId = null) {
    try {
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) {
        throw new Error('User not associated with any organization');
      }

      const { data, error } = await supabase
        .rpc('check_location_conflict', {
          p_location_id: locationId,
          p_start_date: startDate,
          p_end_date: endDate,
          p_event_id: eventId,
          p_organization_id: organizationId
        });

      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Error checking location conflict:', error);
      throw error;
    }
  },

  // Get available locations for a time slot
  async getAvailableLocations(startDate, endDate) {
    try {
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) {
        throw new Error('User not associated with any organization');
      }

      const { data, error } = await supabase
        .rpc('get_available_locations', {
          p_start_date: startDate,
          p_end_date: endDate,
          p_organization_id: organizationId
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting available locations:', error);
      throw error;
    }
  },

  // Get location conflicts for the organization
  async getLocationConflicts() {
    try {
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) {
        throw new Error('User not associated with any organization');
      }

      const { data, error } = await supabase
        .from('location_conflicts')
        .select('*')
        .eq('organization_id', organizationId)
        .order('event1_start');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching location conflicts:', error);
      throw error;
    }
  },

  // Get location usage statistics
  async getLocationUsageStats(startDate, endDate) {
    try {
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) {
        throw new Error('User not associated with any organization');
      }

      const { data, error } = await supabase
        .from('events')
        .select(`
          location_id,
          locations (
            id,
            name,
            capacity
          )
        `)
        .eq('organization_id', organizationId)
        .gte('start_date', startDate)
        .lte('end_date', endDate)
        .not('location_id', 'is', null);

      if (error) throw error;

      // Process the data to get usage statistics
      const usageStats = {};
      data.forEach(event => {
        if (event.locations) {
          const locationId = event.location_id;
          if (!usageStats[locationId]) {
            usageStats[locationId] = {
              id: locationId,
              name: event.locations.name,
              capacity: event.locations.capacity,
              eventCount: 0,
              totalHours: 0
            };
          }
          usageStats[locationId].eventCount++;
          
          // Calculate hours (simplified - you might want to make this more accurate)
          const start = new Date(event.start_date);
          const end = new Date(event.end_date);
          const hours = (end - start) / (1000 * 60 * 60);
          usageStats[locationId].totalHours += hours;
        }
      });

      return Object.values(usageStats);
    } catch (error) {
      console.error('Error fetching location usage stats:', error);
      throw error;
    }
  }
}; 
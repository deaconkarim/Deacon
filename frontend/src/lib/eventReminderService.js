import { supabase } from './supabaseClient';
import { userCacheService } from './userCache';
import { smsService } from './smsService';

// Import the function to get current user's organization ID
const getCurrentUserOrganizationId = async () => {
  return await userCacheService.getCurrentUserOrganizationId();
};

export const eventReminderService = {
  // Get all reminder configurations for an event
  async getEventReminders(eventId) {
    try {
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) {
        throw new Error('User not associated with any organization');
      }

      const { data, error } = await supabase
        .from('event_reminder_configs')
        .select(`
          *,
          event:events (
            id,
            title,
            start_date,
            end_date,
            location
          )
        `)
        .eq('event_id', eventId)
        .eq('organization_id', organizationId)
        .order('timing_hours', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting event reminders:', error);
      throw error;
    }
  },

  // Create a new reminder configuration
  async createEventReminder(reminderData) {
    try {
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) {
        throw new Error('User not associated with any organization');
      }

      const { data, error } = await supabase
        .from('event_reminder_configs')
        .insert({
          ...reminderData,
          organization_id: organizationId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating event reminder:', error);
      throw error;
    }
  },

  // Update an existing reminder configuration
  async updateEventReminder(reminderId, updates) {
    try {
      const { data, error } = await supabase
        .from('event_reminder_configs')
        .update(updates)
        .eq('id', reminderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating event reminder:', error);
      throw error;
    }
  },

  // Delete a reminder configuration
  async deleteEventReminder(reminderId) {
    try {
      const { error } = await supabase
        .from('event_reminder_configs')
        .delete()
        .eq('id', reminderId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting event reminder:', error);
      throw error;
    }
  },

  // Get reminder logs for an event
  async getEventReminderLogs(eventId, limit = 50) {
    try {
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) {
        throw new Error('User not associated with any organization');
      }

      const { data, error } = await supabase
        .from('event_reminder_logs')
        .select(`
          *,
          member:members (
            id,
            firstname,
            lastname,
            image_url
          ),
          reminder_config:event_reminder_configs (
            id,
            name,
            timing_hours
          )
        `)
        .eq('event_id', eventId)
        .eq('organization_id', organizationId)
        .order('sent_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting event reminder logs:', error);
      throw error;
    }
  },

  // Get reminder statistics for an event
  async getEventReminderStats(eventId) {
    try {
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) {
        throw new Error('User not associated with any organization');
      }

      // Get total reminders sent
      const { count: totalSent, error: sentError } = await supabase
        .from('event_reminder_logs')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('organization_id', organizationId);

      if (sentError) throw sentError;

      // Get delivered reminders
      const { count: delivered, error: deliveredError } = await supabase
        .from('event_reminder_logs')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('organization_id', organizationId)
        .eq('status', 'delivered');

      if (deliveredError) throw deliveredError;

      // Get failed reminders
      const { count: failed, error: failedError } = await supabase
        .from('event_reminder_logs')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('organization_id', organizationId)
        .eq('status', 'failed');

      if (failedError) throw failedError;

      // Get reminders by timing
      const { data: timingBreakdown, error: timingError } = await supabase
        .from('event_reminder_logs')
        .select(`
          reminder_config:event_reminder_configs (
            timing_hours
          )
        `)
        .eq('event_id', eventId)
        .eq('organization_id', organizationId);

      if (timingError) throw timingError;

      const timingStats = timingBreakdown.reduce((acc, log) => {
        const hours = log.reminder_config?.timing_hours || 0;
        acc[hours] = (acc[hours] || 0) + 1;
        return acc;
      }, {});

      return {
        totalSent: totalSent || 0,
        delivered: delivered || 0,
        failed: failed || 0,
        deliveryRate: totalSent > 0 ? Math.round((delivered / totalSent) * 100) : 0,
        timingBreakdown: timingStats
      };
    } catch (error) {
      console.error('Error getting event reminder stats:', error);
      throw error;
    }
  },

  // Send a test reminder
  async sendTestReminder(reminderConfigId, testPhoneNumber) {
    try {
      // Get the reminder configuration
      const { data: config, error: configError } = await supabase
        .from('event_reminder_configs')
        .select(`
          *,
          event:events (
            id,
            title,
            start_date,
            end_date,
            location
          )
        `)
        .eq('id', reminderConfigId)
        .single();

      if (configError) throw configError;

      // Render the message template
      let messageText = config.message_template;
      const event = config.event;
      
      if (event) {
        const hoursUntilEvent = Math.ceil((new Date(event.start_date) - new Date()) / (1000 * 60 * 60));
        
        messageText = messageText
          .replace(/{event_title}/g, event.title || 'Event')
          .replace(/{event_time}/g, new Date(event.start_date).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          }))
          .replace(/{event_date}/g, new Date(event.start_date).toLocaleDateString())
          .replace(/{event_location}/g, event.location || 'TBD')
          .replace(/{hours_until_event}/g, hoursUntilEvent.toString())
          .replace(/{member_name}/g, 'Test User');
      }

      // Send the test SMS
      const result = await smsService.sendMessage({
        to_number: testPhoneNumber,
        body: `[TEST] ${messageText}`,
        conversation_id: null // Create new conversation for test
      });

      return result;
    } catch (error) {
      console.error('Error sending test reminder:', error);
      throw error;
    }
  },

  // Get available target groups for reminders
  async getTargetGroups() {
    try {
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) {
        throw new Error('User not associated with any organization');
      }

      const { data, error } = await supabase
        .from('groups')
        .select('id, name, description')
        .eq('organization_id', organizationId)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting target groups:', error);
      throw error;
    }
  },

  // Get available target members for reminders
  async getTargetMembers() {
    try {
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) {
        throw new Error('User not associated with any organization');
      }

      const { data, error } = await supabase
        .from('members')
        .select('id, firstname, lastname, phone, email')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .not('phone', 'is', null)
        .order('firstname', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting target members:', error);
      throw error;
    }
  },

  // Get reminder templates
  async getReminderTemplates() {
    try {
      const { data, error } = await supabase
        .from('sms_templates')
        .select('*')
        .or('name.ilike.%reminder%,name.ilike.%event%')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting reminder templates:', error);
      throw error;
    }
  },

  // Preview reminder message with template variables
  async previewReminderMessage(template, eventId) {
    try {
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;

      let previewText = template;
      const hoursUntilEvent = Math.ceil((new Date(event.start_date) - new Date()) / (1000 * 60 * 60));
      
      previewText = previewText
        .replace(/{event_title}/g, event.title || 'Event')
        .replace(/{event_time}/g, new Date(event.start_date).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        }))
        .replace(/{event_date}/g, new Date(event.start_date).toLocaleDateString())
        .replace(/{event_location}/g, event.location || 'TBD')
        .replace(/{hours_until_event}/g, hoursUntilEvent.toString())
        .replace(/{member_name}/g, 'John Doe');

      return previewText;
    } catch (error) {
      console.error('Error previewing reminder message:', error);
      throw error;
    }
  },

  // Get recipient count for a reminder configuration
  async getRecipientCount(reminderConfig) {
    try {
      const { data, error } = await supabase.rpc('get_event_reminder_recipients', {
        p_event_id: reminderConfig.event_id,
        p_target_type: reminderConfig.target_type,
        p_target_groups: reminderConfig.target_groups || '[]',
        p_target_members: reminderConfig.target_members || '[]'
      });

      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      console.error('Error getting recipient count:', error);
      return 0;
    }
  },

  // Enable/disable reminders for an event
  async toggleEventReminders(eventId, enabled) {
    try {
      const { data, error } = await supabase
        .from('events')
        .update({ reminders_enabled: enabled })
        .eq('id', eventId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error toggling event reminders:', error);
      throw error;
    }
  },

  // Get default reminder settings for an event
  async getEventReminderSettings(eventId) {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('reminders_enabled, default_reminder_hours, reminder_message_template')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting event reminder settings:', error);
      throw error;
    }
  },

  // Update default reminder settings for an event
  async updateEventReminderSettings(eventId, settings) {
    try {
      const { data, error } = await supabase
        .from('events')
        .update(settings)
        .eq('id', eventId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating event reminder settings:', error);
      throw error;
    }
  }
};
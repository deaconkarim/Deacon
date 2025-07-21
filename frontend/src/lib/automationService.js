import { supabase } from './supabaseClient';
import { formatPhoneNumber } from './utils/formatters';

function formatDate(dateString) {
  if (!dateString) return 'Unknown date';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short'
  });
}

export class AutomationService {
  constructor() {
    this.supabase = supabase;
  }

  // Get automation settings for an organization
  async getAutomationSettings(organizationId) {
    try {
      const { data, error } = await this.supabase
        .from('automation_settings')
        .select('*')
        .eq('organization_id', organizationId);

      if (error) throw error;

      // Convert to key-value pairs for easier access
      const settings = {};
      data.forEach(setting => {
        settings[setting.setting_key] = setting.setting_value;
      });

      return settings;
    } catch (error) {
      console.error('Error fetching automation settings:', error);
      throw error;
    }
  }

  // Update automation setting
  async updateAutomationSetting(organizationId, settingKey, settingValue, description = null) {
    try {
      // First try to update existing setting
      const { data, error } = await this.supabase
        .from('automation_settings')
        .update({ 
          setting_value: settingValue,
          description: description,
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', organizationId)
        .eq('setting_key', settingKey)
        .select();

      if (error) throw error;

      // If no rows were updated, insert new setting
      if (data.length === 0) {
        const { data: insertData, error: insertError } = await this.supabase
          .from('automation_settings')
          .insert({
            organization_id: organizationId,
            setting_key: settingKey,
            setting_value: settingValue,
            description: description
          })
          .select();

        if (insertError) throw insertError;
        return insertData[0];
      }

      return data[0];
    } catch (error) {
      console.error('Error updating automation setting:', error);
      throw error;
    }
  }

  // Get automation rules for an organization
  async getAutomationRules(organizationId) {
    try {
      const { data, error } = await this.supabase
        .from('automation_rules')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('📋 Automation rules for org', organizationId, ':', data);
      return data;
    } catch (error) {
      console.error('Error fetching automation rules:', error);
      throw error;
    }
  }

  // Create new automation rule
  async createAutomationRule(ruleData) {
    try {
      const { data, error } = await this.supabase
        .from('automation_rules')
        .insert(ruleData)
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error creating automation rule:', error);
      throw error;
    }
  }

  // Update automation rule
  async updateAutomationRule(ruleId, updates) {
    try {
      const { data, error } = await this.supabase
        .from('automation_rules')
        .update(updates)
        .eq('id', ruleId)
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error updating automation rule:', error);
      throw error;
    }
  }

  // Delete automation rule
  async deleteAutomationRule(ruleId) {
    try {
      const { error } = await this.supabase
        .from('automation_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting automation rule:', error);
      throw error;
    }
  }

  // Get automation executions for an organization
  async getAutomationExecutions(organizationId, limit = 50) {
    try {
      const { data, error } = await this.supabase
        .from('automation_executions')
        .select(`
          *,
          automation_rules(name, description)
        `)
        .eq('organization_id', organizationId)
        .order('executed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching automation executions:', error);
      throw error;
    }
  }

  // Trigger automation for a specific event
  async triggerAutomation(triggerType, triggerData, organizationId) {
    try {
      console.log('🔧 Automation triggered:', { triggerType, triggerData, organizationId });
      
      // Get active rules for this trigger type
      const { data: rules, error: rulesError } = await this.supabase
        .from('automation_rules')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('trigger_type', triggerType)
        .eq('is_active', true);

      if (rulesError) throw rulesError;

      console.log('📋 Found automation rules:', rules);

      const executions = [];

      for (const rule of rules) {
        console.log('🔍 Checking rule:', rule.name);
        console.log('📝 Rule conditions:', rule.trigger_conditions);
        console.log('📊 Trigger data:', triggerData);
        
        // Check if conditions are met
        const conditionsMet = this.checkTriggerConditions(rule.trigger_conditions, triggerData);
        console.log('✅ Conditions met:', conditionsMet);
        
        if (conditionsMet) {
          console.log('🚀 Executing rule:', rule.name);
          
          // Create execution record
          const { data: execution, error: execError } = await this.supabase
            .from('automation_executions')
            .insert({
              organization_id: organizationId,
              rule_id: rule.id,
              trigger_record_id: triggerData.id,
              trigger_record_type: triggerType,
              status: 'pending'
            })
            .select();

          if (execError) throw execError;
          executions.push(execution[0]);

          // Execute the action
          await this.executeAutomationAction(rule, triggerData, execution[0].id);
        }
      }

      console.log('🎯 Automation executions:', executions);
      return executions;
    } catch (error) {
      console.error('❌ Error triggering automation:', error);
      throw error;
    }
  }

  // Check if trigger conditions are met
  checkTriggerConditions(conditions, triggerData) {
    try {
      const cond = typeof conditions === 'string' ? JSON.parse(conditions) : conditions;
      console.log('🔍 Checking conditions:', cond);
      console.log('📊 Against trigger data:', triggerData);
      
      for (const [key, value] of Object.entries(cond)) {
        console.log(`🔍 Comparing ${key}: expected=${value}, actual=${triggerData[key]}`);
        if (triggerData[key] !== value) {
          console.log(`❌ Condition failed: ${key} !== ${value}`);
          return false;
        }
      }
      
      console.log('✅ All conditions met!');
      return true;
    } catch (error) {
      console.error('❌ Error checking trigger conditions:', error);
      return false;
    }
  }

  // Execute automation action
  async executeAutomationAction(rule, triggerData, executionId) {
    try {
      const actionData = typeof rule.action_data === 'string' 
        ? JSON.parse(rule.action_data) 
        : rule.action_data;

      let result = null;

      switch (rule.action_type) {
        case 'create_task':
          result = await this.createTaskFromAutomation(actionData, triggerData);
          break;
        case 'send_email':
          result = await this.sendEmailFromAutomation(actionData, triggerData);
          break;
        case 'send_sms':
          result = await this.sendSMSFromAutomation(actionData, triggerData);
          break;
        default:
          throw new Error(`Unknown action type: ${rule.action_type}`);
      }

      // Update execution status
      await this.supabase
        .from('automation_executions')
        .update({
          status: 'completed',
          result_data: result,
          completed_at: new Date().toISOString()
        })
        .eq('id', executionId);

    } catch (error) {
      console.error('Error executing automation action:', error);
      
      // Update execution status to failed
      await this.supabase
        .from('automation_executions')
        .update({
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', executionId);
    }
  }

  // Create task from automation
  async createTaskFromAutomation(actionData, triggerData) {
    try {
      console.log('🔧 Creating task from automation:', { actionData, triggerData });
      
      // Get the current user's organization ID
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: orgData } = await this.supabase
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (!orgData?.organization_id) throw new Error('User not associated with any organization');

      // Process the title and description templates
      let title = actionData.title;
      let description = actionData.description;
      
      // Replace placeholders with actual data
      const memberName = triggerData.firstname && triggerData.lastname
        ? `${triggerData.firstname} ${triggerData.lastname}`
        : (triggerData.firstname || triggerData.lastname || '');
      const eventDateFormatted = triggerData.event_date
        ? formatDate(triggerData.event_date)
        : 'Unknown date';
      const phone = triggerData.phone ? formatPhoneNumber(triggerData.phone) : 'No phone provided';
      
      if (title) {
        title = title
          .replace('{member_name}', memberName)
          .replace('{event_date_formatted}', eventDateFormatted)
          .replace('{event_date}', triggerData.event_date || '')
          .replace('{phone}', phone);
      }
      if (description) {
        description = description
          .replace('{member_name}', memberName)
          .replace('{event_date_formatted}', eventDateFormatted)
          .replace('{event_date}', triggerData.event_date || '')
          .replace('{phone}', phone);
      }

      // Calculate due date if offset is specified
      let dueDate = null;
      if (actionData.due_date_offset_days) {
        const dueDateObj = new Date();
        dueDateObj.setDate(dueDateObj.getDate() + actionData.due_date_offset_days);
        dueDate = dueDateObj.toISOString();
      }

      // Find assignee based on actionData.assigned_to
      let assigneeId = null;
      let requestorId = null;
      
      if (actionData.assigned_to) {
        // Check if it's a UUID (new format) or a role string (old format)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(actionData.assigned_to);
        
        if (isUUID) {
          // New format: assigned_to is a user ID
          const { data: memberData } = await this.supabase
            .from('members')
            .select('id')
            .eq('user_id', actionData.assigned_to)
            .eq('organization_id', orgData.organization_id)
            .single();
          
          if (memberData) {
            assigneeId = memberData.id;
            requestorId = memberData.id; // Use same person as requestor for now
          }
        } else {
          // Old format: assigned_to is a role string like "pastor" or "deacon"
          console.log('🔧 Using legacy role assignment:', actionData.assigned_to);
          
          if (actionData.assigned_to === 'pastor') {
            // Look for members with admin role
            const { data: staffMembers } = await this.supabase
              .from('organization_users')
              .select('user_id')
              .eq('organization_id', orgData.organization_id)
              .eq('role', 'admin')
              .eq('status', 'active')
              .limit(1);
            
            if (staffMembers && staffMembers.length > 0) {
              const { data: memberData } = await this.supabase
                .from('members')
                .select('id')
                .eq('user_id', staffMembers[0].user_id)
                .eq('organization_id', orgData.organization_id)
                .single();
              
              if (memberData) {
                assigneeId = memberData.id;
                requestorId = memberData.id;
              }
            }
          } else if (actionData.assigned_to === 'deacon') {
            // Look for members with deacon role
            const { data: staffMembers } = await this.supabase
              .from('organization_users')
              .select('user_id')
              .eq('organization_id', orgData.organization_id)
              .eq('role', 'deacon')
              .eq('status', 'active')
              .limit(1);
            
            if (staffMembers && staffMembers.length > 0) {
              const { data: memberData } = await this.supabase
                .from('members')
                .select('id')
                .eq('user_id', staffMembers[0].user_id)
                .eq('organization_id', orgData.organization_id)
                .single();
              
              if (memberData) {
                assigneeId = memberData.id;
                requestorId = memberData.id;
              }
            }
          }
        }
      }

      // Create the task
      const { data: task, error } = await this.supabase
        .from('tasks')
        .insert({
          title: title,
          description: description,
          priority: actionData.priority || 'medium',
          status: 'pending',
          assignee_id: assigneeId,
          requestor_id: requestorId,
          due_date: dueDate,
          organization_id: orgData.organization_id
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Task created successfully:', task);
      return { 
        action: 'create_task', 
        status: 'success',
        task_id: task.id,
        task_title: task.title
      };
    } catch (error) {
      console.error('❌ Error creating task from automation:', error);
      throw error;
    }
  }

  // Send email from automation
  async sendEmailFromAutomation(actionData, triggerData) {
    // This would integrate with your email service
    // For now, return a placeholder
    return { action: 'send_email', status: 'placeholder' };
  }

  // Send SMS from automation
  async sendSMSFromAutomation(actionData, triggerData) {
    // This would integrate with your SMS service
    // For now, return a placeholder
    return { action: 'send_sms', status: 'placeholder' };
  }
}

export const automationService = new AutomationService(); 
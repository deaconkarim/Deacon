import { supabase } from './supabaseClient';
import { smsService } from './smsService';
import { emailService } from './emailService';
import { userCacheService } from './userCache';

// Import the function to get current user's organization ID
const getCurrentUserOrganizationId = async () => {
  return await userCacheService.getCurrentUserOrganizationId();
};

export const messagingService = {
  // Combined conversation management
  async getConversations(messageType = 'all') {
    try {
      let smsConversations = [];
      let emailConversations = [];

      if (messageType === 'all' || messageType === 'sms') {
        smsConversations = await smsService.getConversations();
        // Add type identifier to SMS conversations
        smsConversations = smsConversations.map(conv => ({
          ...conv,
          messageType: 'sms',
          displayTitle: conv.title,
          lastActivity: conv.updated_at
        }));
      }

      if (messageType === 'all' || messageType === 'email') {
        emailConversations = await emailService.getConversations();
        // Add type identifier to email conversations
        emailConversations = emailConversations.map(conv => ({
          ...conv,
          messageType: 'email',
          displayTitle: conv.title,
          lastActivity: conv.updated_at
        }));
      }

      // Combine and sort by last activity
      const allConversations = [...smsConversations, ...emailConversations]
        .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));

      return allConversations;
    } catch (error) {
      console.error('Error getting messaging conversations:', error);
      throw error;
    }
  },

  // Get conversation details (SMS or Email)
  async getConversation(conversationId, messageType) {
    try {
      if (messageType === 'sms') {
        return await smsService.getConversation(conversationId);
      } else if (messageType === 'email') {
        return await emailService.getConversation(conversationId);
      } else {
        throw new Error('Invalid message type specified');
      }
    } catch (error) {
      console.error('Error getting conversation:', error);
      throw error;
    }
  },

  // Send message (SMS or Email)
  async sendMessage({ messageType, ...messageData }) {
    try {
      if (messageType === 'sms') {
        return await smsService.sendMessage(messageData);
      } else if (messageType === 'email') {
        // For email, we need to handle single vs bulk sending
        if (messageData.recipients && messageData.recipients.length > 1) {
          return await emailService.sendBulkEmails({
            recipients: messageData.recipients,
            subject: messageData.subject,
            body: messageData.body,
            conversation_type: messageData.conversation_type || 'general',
            selectedGroups: messageData.selectedGroups || []
          });
        } else {
          return await emailService.sendEmail({
            to: messageData.to_email || messageData.recipients?.[0]?.email,
            subject: messageData.subject,
            body: messageData.body,
            member_id: messageData.member_id,
            conversation_type: messageData.conversation_type || 'general'
          });
        }
      } else {
        throw new Error('Invalid message type specified');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Get templates (SMS and Email)
  async getTemplates(messageType = 'all') {
    try {
      let templates = [];

      if (messageType === 'all' || messageType === 'sms') {
        const smsTemplates = await smsService.getTemplates();
        templates.push(...smsTemplates.map(t => ({
          ...t,
          messageType: 'sms',
          template_subject: null // SMS doesn't have subjects
        })));
      }

      if (messageType === 'all' || messageType === 'email') {
        const emailTemplates = await emailService.getTemplates();
        templates.push(...emailTemplates.map(t => ({
          ...t,
          messageType: 'email',
          template_text: t.template_text || t.body, // Normalize field names
          template_subject: t.subject
        })));
      }

      return templates.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error getting templates:', error);
      throw error;
    }
  },

  // Create template (SMS or Email)
  async createTemplate(templateData) {
    try {
      const { messageType, ...data } = templateData;
      
      if (messageType === 'sms') {
        return await smsService.createTemplate(data);
      } else if (messageType === 'email') {
        return await emailService.createTemplate(data);
      } else {
        throw new Error('Invalid message type specified');
      }
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  },

  // Update template (SMS or Email)
  async updateTemplate(templateId, templateData) {
    try {
      const { messageType, ...data } = templateData;
      
      if (messageType === 'sms') {
        return await smsService.updateTemplate(templateId, data);
      } else if (messageType === 'email') {
        return await emailService.updateTemplate(templateId, data);
      } else {
        throw new Error('Invalid message type specified');
      }
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  },

  // Delete template (SMS or Email)
  async deleteTemplate(templateId, messageType) {
    try {
      if (messageType === 'sms') {
        return await smsService.deleteTemplate(templateId);
      } else if (messageType === 'email') {
        return await emailService.deleteTemplate(templateId);
      } else {
        throw new Error('Invalid message type specified');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  },

  // Get messaging statistics
  async getMessagingStats() {
    try {
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) {
        throw new Error('User not associated with any organization');
      }

      // Get SMS stats
      const smsStats = await smsService.getSMSStats();

      // Get email stats
      const { count: totalEmailsSent, error: emailError } = await supabase
        .from('email_messages')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('direction', 'outbound');

      if (emailError) {
        console.warn('Error getting email stats:', emailError);
      }

      const { count: emailConversations, error: emailConvError } = await supabase
        .from('email_conversations')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      if (emailConvError) {
        console.warn('Error getting email conversation stats:', emailConvError);
      }

      return {
        sms: {
          totalSent: smsStats.totalSent || 0,
          totalDelivered: smsStats.totalDelivered || 0,
          deliveryRate: smsStats.deliveryRate || 0,
          thisMonth: smsStats.thisMonth || 0
        },
        email: {
          totalSent: totalEmailsSent || 0,
          totalConversations: emailConversations || 0
        },
        combined: {
          totalMessages: (smsStats.totalSent || 0) + (totalEmailsSent || 0),
          totalConversations: (smsStats.recentConversations?.length || 0) + (emailConversations || 0)
        }
      };
    } catch (error) {
      console.error('Error getting messaging stats:', error);
      return {
        sms: { totalSent: 0, totalDelivered: 0, deliveryRate: 0, thisMonth: 0 },
        email: { totalSent: 0, totalConversations: 0 },
        combined: { totalMessages: 0, totalConversations: 0 }
      };
    }
  },

  // Render template (works for both SMS and Email)
  async renderTemplate(template, variables = {}) {
    try {
      if (template.messageType === 'sms') {
        return {
          body: await smsService.renderTemplate(template, variables),
          subject: null
        };
      } else if (template.messageType === 'email') {
        const rendered = emailService.renderTemplate(template, variables);
        return {
          body: rendered.body,
          subject: rendered.subject
        };
      } else {
        throw new Error('Invalid template message type');
      }
    } catch (error) {
      console.error('Error rendering template:', error);
      throw error;
    }
  },

  // Helper function to format recipients for display
  formatRecipients(recipients, messageType) {
    if (!recipients || recipients.length === 0) return 'No recipients';
    
    if (recipients.length === 1) {
      const recipient = recipients[0];
      const name = `${recipient.firstname || ''} ${recipient.lastname || ''}`.trim();
      const contact = messageType === 'sms' ? recipient.phone : recipient.email;
      return name ? `${name} (${contact})` : contact;
    }
    
    return `${recipients.length} recipients`;
  },

  // Helper function to get message type icon
  getMessageTypeIcon(messageType) {
    return messageType === 'sms' ? '💬' : '📧';
  },

  // Helper function to get message type color
  getMessageTypeColor(messageType) {
    return messageType === 'sms' ? 'text-teal-500' : 'text-blue-500';
  }
};
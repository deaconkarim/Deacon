import { supabase } from './supabaseClient';

export const emailService = {
  // Send a single email
  async sendEmail({ to, subject, body, member_id = null, conversation_type = 'general' }) {
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to,
          subject,
          body,
          member_id,
          conversation_type
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  },

  // Send bulk emails to multiple recipients
  async sendBulkEmails({ recipients, subject, body, conversation_type = 'general', selectedGroups = [] }) {
    try {
      const { data, error } = await supabase.functions.invoke('send-bulk-emails', {
        body: {
          recipients,
          subject,
          body,
          conversation_type,
          selectedGroups
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error sending bulk emails:', error);
      throw error;
    }
  },

  // Get email conversations
  async getConversations() {
    try {
      const { data, error } = await supabase
        .from('email_conversations')
        .select(`
          *,
          email_messages (
            id,
            subject,
            body,
            direction,
            status,
            sent_at,
            group_id,
            members (
              id,
              firstname,
              lastname
            ),
            groups (
              id,
              name
            )
          ),
          email_campaigns (
            id,
            subject,
            body,
            conversation_type,
            email_campaign_recipients (
              id,
              member_id,
              group_id,
              email_sent,
              sent_at,
              members (
                id,
                firstname,
                lastname
              ),
              groups (
                id,
                name
              )
            )
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching email conversations:', error);
      return [];
    }
  },

  // Get a specific email conversation
  async getConversation(conversationId) {
    try {
      const { data, error } = await supabase
        .from('email_conversations')
        .select(`
          *,
          email_messages (
            id,
            subject,
            body,
            direction,
            status,
            sent_at,
            from_email,
            to_email,
            members (
              id,
              firstname,
              lastname
            )
          )
        `)
        .eq('id', conversationId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching email conversation:', error);
      throw error;
    }
  },

  // Get email templates
  async getTemplates() {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching email templates:', error);
      return [];
    }
  },

  // Create email template
  async createTemplate(template) {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .insert([template])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating email template:', error);
      throw error;
    }
  },

  // Update email template
  async updateTemplate(templateId, updates) {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .update(updates)
        .eq('id', templateId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating email template:', error);
      throw error;
    }
  },

  // Delete email template
  async deleteTemplate(templateId) {
    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting email template:', error);
      throw error;
    }
  },

  // Create email conversation
  async createConversation(conversation) {
    try {
      const { data, error } = await supabase
        .from('email_conversations')
        .insert([conversation])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating email conversation:', error);
      throw error;
    }
  },

  // Send event reminder emails
  async sendEventReminder(event, members) {
    try {
      // Create conversation for this event reminder
      const conversation = await this.createConversation({
        title: `Event Reminder: ${event.title}`,
        conversation_type: 'event_reminder',
        status: 'active'
      });

      // Send email to each member
      const emailPromises = members.map(member => 
        this.sendEmail({
          to: member.email,
          subject: `Reminder: ${event.title}`,
          body: `
            <h2>Event Reminder</h2>
            <p>Hello ${member.firstname},</p>
            <p>This is a reminder about <strong>${event.title}</strong>.</p>
            <p><strong>Date:</strong> ${new Date(event.start_date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${event.start_time || 'TBD'}</p>
            ${event.location ? `<p><strong>Location:</strong> ${event.location}</p>` : ''}
            ${event.description ? `<p><strong>Description:</strong> ${event.description}</p>` : ''}
            <p>We hope to see you there!</p>
          `,
          member_id: member.id,
          conversation_type: 'event_reminder'
        })
      );

      await Promise.all(emailPromises);
      return conversation;
    } catch (error) {
      console.error('Error sending event reminder emails:', error);
      throw error;
    }
  },

  // Send newsletter
  async sendNewsletter(newsletter, members) {
    try {
      // Create conversation for this newsletter
      const conversation = await this.createConversation({
        title: `Newsletter: ${newsletter.title}`,
        conversation_type: 'newsletter',
        status: 'active'
      });

      // Send email to each member
      const emailPromises = members.map(member => 
        this.sendEmail({
          to: member.email,
          subject: newsletter.subject,
          body: newsletter.content,
          member_id: member.id,
          conversation_type: 'newsletter'
        })
      );

      await Promise.all(emailPromises);
      return conversation;
    } catch (error) {
      console.error('Error sending newsletter:', error);
      throw error;
    }
  },

  // Template rendering
  renderTemplate(template, variables = {}) {
    let renderedSubject = template.subject;
    let renderedBody = template.template_text;
    
    // Replace variables in template
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      renderedSubject = renderedSubject.replace(regex, variables[key]);
      renderedBody = renderedBody.replace(regex, variables[key]);
    });

    return {
      subject: renderedSubject,
      body: renderedBody
    };
  }
}; 
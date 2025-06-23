import { supabase } from './supabaseClient';

export const smsService = {
  // Conversation Management
  async getConversations(conversationType = null) {
    let query = supabase
      .from('sms_conversations')
      .select(`
        *,
        sms_messages (
          id,
          direction,
          body,
          status,
          sent_at,
          member:members (
            id,
          firstname,
          lastname
          )
        )
      `)
      .order('updated_at', { ascending: false });

    if (conversationType) {
      query = query.eq('conversation_type', conversationType);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getConversation(conversationId) {
    const { data, error } = await supabase
      .from('sms_conversations')
      .select(`
        *,
        sms_messages (
          id,
          direction,
          from_number,
          to_number,
          body,
          status,
          sent_at,
          delivered_at,
          member:members (
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
  },

  async createConversation(conversationData) {
    const { data, error } = await supabase
      .from('sms_conversations')
      .insert(conversationData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateConversation(conversationId, updates) {
    const { data, error } = await supabase
      .from('sms_conversations')
      .update(updates)
      .eq('id', conversationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Message Management
  async getMessages(conversationId = null, memberId = null) {
    let query = supabase
      .from('sms_messages')
      .select(`
        *,
        member:members (
          id,
          firstname,
          lastname
        ),
        conversation:sms_conversations (
          id,
          title,
          conversation_type
        )
      `)
      .order('sent_at', { ascending: false });

    if (conversationId) {
      query = query.eq('conversation_id', conversationId);
    }

    if (memberId) {
      query = query.eq('member_id', memberId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async sendMessage(messageData) {
    console.log('🚀 SMS Service: Starting sendMessage function');
    console.log('📱 Message Data:', JSON.stringify(messageData, null, 2));
    
    // Get Twilio phone number from environment
    const twilioPhoneNumber = import.meta.env.VITE_TWILIO_PHONE_NUMBER;
    console.log('📞 Twilio Phone Number:', twilioPhoneNumber ? '✅ Configured' : '❌ Not configured');
    
    if (!twilioPhoneNumber) {
      throw new Error('Twilio phone number not configured. Please set VITE_TWILIO_PHONE_NUMBER in your environment variables.');
    }

    // Create or find conversation for this message
    let conversationId = messageData.conversation_id;
    if (!conversationId) {
      console.log('💬 Creating new conversation for message...');
      
      // Try to find member by phone number
      let memberId = messageData.member_id;
      if (!memberId && messageData.to_number) {
        const { data: member, error: memberError } = await supabase
          .from('members')
          .select('id, firstname, lastname')
          .eq('phone', messageData.to_number)
          .maybeSingle(); // Use maybeSingle() instead of single() to handle no results
        
        if (memberError) {
          console.warn('⚠️ Member lookup error:', memberError);
        } else if (member) {
          memberId = member.id;
          console.log('✅ Found member:', member.firstname, member.lastname);
        } else {
          console.log('ℹ️ No member found for phone number:', messageData.to_number);
        }
      }

      // Create conversation
      const conversationTitle = memberId 
        ? `SMS with ${messageData.to_number}`
        : `SMS to ${messageData.to_number}`;
      
      const { data: conversation, error: conversationError } = await supabase
        .from('sms_conversations')
        .insert({
          title: conversationTitle,
          conversation_type: 'general',
          status: 'active'
        })
        .select()
        .single();

      if (conversationError) {
        console.error('❌ Conversation creation error:', conversationError);
        throw conversationError;
      }

      conversationId = conversation.id;
      console.log('✅ Conversation created:', conversationId);
    }

    // Create the message record with conversation_id
    console.log('💾 Creating message record in database...');
    const { data: message, error: messageError } = await supabase
      .from('sms_messages')
      .insert({
        ...messageData,
        conversation_id: conversationId,
        from_number: twilioPhoneNumber,
        direction: 'outbound',
        status: 'queued'
      })
      .select()
      .single();

    if (messageError) {
      console.error('❌ Database Error:', messageError);
      throw messageError;
    }

    console.log('✅ Message created in database:', message.id);

    // Then send via Twilio
    console.log('📤 Attempting to send via Edge Function...');
    try {
      const functionPayload = {
        to: messageData.to_number,
        body: messageData.body,
        messageId: message.id
      };
      
      console.log('📦 Function Payload:', JSON.stringify(functionPayload, null, 2));
      
      const { data: functionResponse, error: twilioError } = await supabase.functions.invoke('send-sms', {
        body: functionPayload
      });

      console.log('📡 Function Response:', functionResponse);
      console.log('🔍 Function Error:', twilioError);

      if (twilioError) {
        console.warn('⚠️ Edge function error, marking as queued:', twilioError.message);
        console.log('📋 Full Error Object:', JSON.stringify(twilioError, null, 2));
        
        // Don't throw error, just mark as queued for now
        await supabase
          .from('sms_messages')
          .update({ 
            status: 'queued',
            error_message: `Edge function error: ${twilioError.message}`
          })
          .eq('id', message.id);
        
        console.log('✅ Message marked as queued due to Edge Function error');
        return message;
      }

      // Update message status to sent
      console.log('✅ SMS sent successfully, updating status...');
      await supabase
        .from('sms_messages')
        .update({ status: 'sent' })
        .eq('id', message.id);

      console.log('🎉 SMS process completed successfully');
      return message;
    } catch (error) {
      console.error('💥 SMS sending failed:', error);
      console.log('📋 Full Error Object:', JSON.stringify(error, null, 2));
      console.log('🔍 Error Message:', error.message);
      console.log('🔍 Error Stack:', error.stack);
      
      // Don't throw error, just mark as queued for now
      await supabase
        .from('sms_messages')
        .update({ 
          status: 'queued',
          error_message: `SMS sending failed: ${error.message}`
        })
        .eq('id', message.id);
      
      console.log('✅ Message marked as queued due to sending error');
      return message;
    }
  },

  async updateMessageStatus(messageId, status, twilioSid = null, deliveredAt = null) {
    const updates = { status };
    if (twilioSid) updates.twilio_sid = twilioSid;
    if (deliveredAt) updates.delivered_at = deliveredAt;

    const { data, error } = await supabase
      .from('sms_messages')
      .update(updates)
      .eq('id', messageId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Template Management
  async getTemplates() {
    const { data, error } = await supabase
      .from('sms_templates')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  },

  async createTemplate(templateData) {
    const { data, error } = await supabase
      .from('sms_templates')
      .insert(templateData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTemplate(templateId, updates) {
    const { data, error } = await supabase
      .from('sms_templates')
      .update(updates)
      .eq('id', templateId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTemplate(templateId) {
    const { error } = await supabase
      .from('sms_templates')
      .delete()
      .eq('id', templateId);

    if (error) throw error;
  },

  // Utility Functions
  async sendPrayerRequestSMS(prayerRequest) {
    // Create conversation for this prayer request
    const conversation = await this.createConversation({
      title: `Prayer Request from ${prayerRequest.name}`,
      conversation_type: 'prayer_request',
      status: 'active'
    });

    // Get prayer team members using the group_members junction table
    const { data: prayerTeam, error } = await supabase
      .from('group_members')
      .select(`
        member_id,
        groups!inner (
          name
        ),
        members!inner (
          id,
          phone,
          firstname,
          lastname
        )
      `)
      .eq('groups.name', 'Prayer Team')
      .eq('members.status', 'active')
      .not('members.phone', 'is', null);

    if (error) throw error;

    // Transform the data to get member information
    const members = prayerTeam.map(item => item.members);

    // Send SMS to each prayer team member
    const messagePromises = members.map(member => 
      this.sendMessage({
        conversation_id: conversation.id,
        to_number: member.phone,
        body: `New Prayer Request from ${prayerRequest.name}:\n\n${prayerRequest.request}\n\nPhone: ${prayerRequest.phone}`,
        member_id: member.id
      })
    );

    await Promise.all(messagePromises);
    return conversation;
  },

  async sendEventReminder(event, members) {
    // Create conversation for this event reminder
    const conversation = await this.createConversation({
      title: `Event Reminder: ${event.title}`,
      conversation_type: 'event_reminder',
      status: 'active'
    });

    // Send SMS to each member
    const messagePromises = members.map(member => 
      this.sendMessage({
        conversation_id: conversation.id,
        to_number: member.phone,
        body: `Reminder: ${event.title} on ${new Date(event.start_date).toLocaleDateString()} at ${event.start_time || 'TBD'}. ${event.description || ''}`,
        member_id: member.id
      })
    );

    await Promise.all(messagePromises);
    return conversation;
  },

  async sendEmergencyNotification(message, members) {
    // Create conversation for emergency notification
    const conversation = await this.createConversation({
      title: 'Emergency Notification',
      conversation_type: 'emergency',
      status: 'active'
    });

    // Send SMS to each member
    const messagePromises = members.map(member => 
      this.sendMessage({
        conversation_id: conversation.id,
        to_number: member.phone,
        body: `URGENT: ${message}`,
        member_id: member.id
      })
    );

    await Promise.all(messagePromises);
    return conversation;
  },

  // Template rendering
  renderTemplate(template, variables = {}) {
    let renderedText = template.template_text;
    
    // Replace variables in template
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      renderedText = renderedText.replace(regex, variables[key]);
    });

    return renderedText;
  }
}; 
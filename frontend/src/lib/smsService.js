import { supabase } from './supabaseClient';
import { userCacheService } from './userCache';

// Import the function to get current user's organization ID
const getCurrentUserOrganizationId = async () => {
  return await userCacheService.getCurrentUserOrganizationId();
};

export const smsService = {
  // Conversation Management
  async getConversations(conversationType = null) {
    try {
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) {
        throw new Error('User not associated with any organization');
      }

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
              lastname,
              image_url
          )
        )
      `)
        .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false });

    if (conversationType) {
      query = query.eq('conversation_type', conversationType);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
    } catch (error) {
      console.error('Error getting conversations:', error);
      throw error;
    }
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
            lastname,
            image_url
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
    try {
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) {
        throw new Error('User not associated with any organization');
      }

    let query = supabase
      .from('sms_messages')
      .select(`
        *,
        member:members (
          id,
          firstname,
            lastname,
            image_url
        ),
        conversation:sms_conversations (
          id,
          title,
          conversation_type
        )
      `)
        .eq('organization_id', organizationId)
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
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  },

  async sendMessage(messageData) {
    console.log('🚀 SMS Service: Starting sendMessage function');
    console.log('📱 Message Data:', JSON.stringify(messageData, null, 2));
    
    // Get organization ID
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }
    
    // Get Twilio phone number from environment (try both VITE_ and non-VITE_ versions)
    const twilioPhoneNumber = import.meta.env.VITE_TWILIO_PHONE_NUMBER || import.meta.env.TWILIO_PHONE_NUMBER;
    console.log('📞 Twilio Phone Number:', twilioPhoneNumber ? '✅ Configured' : '❌ Not configured');
    
    // Debug: Check all available environment variables
    console.log('🔍 Available environment variables:', {
      VITE_TWILIO_PHONE_NUMBER: import.meta.env.VITE_TWILIO_PHONE_NUMBER,
      TWILIO_PHONE_NUMBER: import.meta.env.TWILIO_PHONE_NUMBER,
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Not set',
      NODE_ENV: import.meta.env.NODE_ENV
    });
    
    if (!twilioPhoneNumber) {
      throw new Error('Twilio phone number not configured. Please set VITE_TWILIO_PHONE_NUMBER or TWILIO_PHONE_NUMBER in your environment variables.');
    }

    // Render template if template_id is provided
    let finalMessageBody = messageData.body;
    if (messageData.template_id) {
      console.log('📝 Rendering template with ID:', messageData.template_id);
      
      // Get the template
      const { data: template, error: templateError } = await supabase
        .from('sms_templates')
        .select('*')
        .eq('id', messageData.template_id)
        .single();
      
      if (templateError) {
        console.error('❌ Template lookup error:', templateError);
        throw new Error(`Template not found: ${templateError.message}`);
      }
      
      // Extract variables from the message body (user-entered values)
      const variableValues = {};
      if (messageData.variables) {
        Object.entries(messageData.variables).forEach(([key, value]) => {
          variableValues[key] = value;
        });
      }
      
      // Render the template
      finalMessageBody = await this.renderTemplate(template, variableValues);
      console.log('✅ Template rendered:', finalMessageBody);
    }

    // Handle group messaging - if group_id is provided, use existing conversation
    if (messageData.group_id && !messageData.conversation_id) {
      console.log('👥 Group message detected, looking for existing group conversation...');
      
      // Look for existing conversation for this group
      const { data: existingConversation, error: conversationError } = await supabase
        .from('sms_conversations')
        .select('id')
        .eq('group_id', messageData.group_id)
        .eq('status', 'active')
        .maybeSingle(); // Use maybeSingle() to handle no results gracefully

      if (conversationError) {
        console.error('❌ Error looking for group conversation:', conversationError);
      }

      if (existingConversation) {
        messageData.conversation_id = existingConversation.id;
        console.log('✅ Found existing group conversation:', messageData.conversation_id);
      } else {
        console.log('📝 Creating new group conversation...');
        
        // Get group name for conversation title
        const { data: group } = await supabase
          .from('groups')
          .select('name')
          .eq('id', messageData.group_id)
          .single();

        const groupName = group?.name || 'Group';
        const truncatedMessage = finalMessageBody.length > 30 
          ? finalMessageBody.substring(0, 27) + '...' 
          : finalMessageBody;
        
        const conversationTitle = `Group: ${groupName} - ${truncatedMessage}`;
        
        // Determine conversation type based on message content or template
        let conversationType = 'general';
        if (messageData.template_id) {
          const template = await supabase
            .from('sms_templates')
            .select('name')
            .eq('id', messageData.template_id)
            .single();
          
          if (template?.data?.name) {
            const templateName = template.data.name.toLowerCase();
            if (templateName.includes('prayer')) {
              conversationType = 'prayer_request';
            } else if (templateName.includes('event') || templateName.includes('reminder')) {
              conversationType = 'event_reminder';
            } else if (templateName.includes('emergency')) {
              conversationType = 'emergency';
            } else if (templateName.includes('pastoral') || templateName.includes('care')) {
              conversationType = 'pastoral_care';
            }
          }
        }
        

        
        const { data: newConversation, error: createError } = await supabase
          .from('sms_conversations')
          .insert({
            title: conversationTitle,
            conversation_type: conversationType,
            group_id: messageData.group_id,
            status: 'active'
          })
          .select()
          .single();

        if (createError) {
          console.error('❌ Group conversation creation error:', createError);
          throw createError;
        }

        messageData.conversation_id = newConversation.id;
        console.log('✅ New group conversation created:', messageData.conversation_id);
      }
    }
    
    // Handle multi-recipient messaging (individual recipients, not groups)
    if (messageData.multiple_recipients && !messageData.conversation_id) {
      console.log('👥 Multi-recipient message detected, creating conversation...');
      
      const truncatedMessage = finalMessageBody.length > 30 
        ? finalMessageBody.substring(0, 27) + '...' 
        : finalMessageBody;
      
      const conversationTitle = `Multiple Recipients - ${truncatedMessage}`;
      
      // Determine conversation type based on message content or template
      let conversationType = 'general';
      if (messageData.template_id) {
        const template = await supabase
          .from('sms_templates')
          .select('name')
          .eq('id', messageData.template_id)
          .single();
        
        if (template?.data?.name) {
          const templateName = template.data.name.toLowerCase();
          if (templateName.includes('prayer')) {
            conversationType = 'prayer_request';
          } else if (templateName.includes('event') || templateName.includes('reminder')) {
            conversationType = 'event_reminder';
          } else if (templateName.includes('emergency')) {
            conversationType = 'emergency';
          } else if (templateName.includes('pastoral') || templateName.includes('care')) {
            conversationType = 'pastoral_care';
          }
        }
      }
      
      const { data: newConversation, error: createError } = await supabase
        .from('sms_conversations')
        .insert({
          title: conversationTitle,
          conversation_type: conversationType,
          status: 'active',
          organization_id: organizationId
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Multi-recipient conversation creation error:', createError);
        throw createError;
      }

      messageData.conversation_id = newConversation.id;
      console.log('✅ New multi-recipient conversation created:', messageData.conversation_id);
    }

    // Create or find conversation for this message (only if not already set by group logic)
    if (!messageData.conversation_id) {
      console.log('💬 Looking for existing conversation or creating new one...');
      
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

      // First, try to find an existing conversation for this member/phone number
      let existingConversation = null;
      
      if (memberId) {
        // Look for conversations where this member has messages
        const { data: memberConversations } = await supabase
          .from('sms_conversations')
          .select(`
            id,
            title,
            conversation_type,
            created_at,
            sms_messages!inner(member_id)
          `)
          .eq('sms_messages.member_id', memberId)
          .eq('status', 'active')
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (memberConversations && memberConversations.length > 0) {
          existingConversation = memberConversations[0];
          console.log('✅ Found existing conversation for member:', existingConversation.id);
        }
      }
      
      // If no member-based conversation found, look for phone number-based conversation
      if (!existingConversation && messageData.to_number) {
        const { data: phoneConversations } = await supabase
          .from('sms_conversations')
          .select(`
            id,
            title,
            conversation_type,
            created_at,
            sms_messages!inner(to_number)
          `)
          .eq('sms_messages.to_number', messageData.to_number)
          .eq('status', 'active')
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (phoneConversations && phoneConversations.length > 0) {
          existingConversation = phoneConversations[0];
          console.log('✅ Found existing conversation for phone number:', existingConversation.id);
        }
      }
      
      // If we found an existing conversation, use it
      if (existingConversation) {
        messageData.conversation_id = existingConversation.id;
        console.log('✅ Using existing conversation:', messageData.conversation_id);
      } else {
        // Create new conversation
        console.log('📝 Creating new conversation...');
        
        const createTitle = (messageBody, memberName, phoneNumber) => {
          // Truncate message to 50 characters for title
          const truncatedMessage = messageBody.length > 50 
            ? messageBody.substring(0, 47) + '...' 
            : messageBody
          
          if (memberName) {
            return `${memberName}: ${truncatedMessage}`
          } else {
            return `${phoneNumber}: ${truncatedMessage}`
          }
        }
        
        // Get member name if we have memberId
        let memberName = null;
        if (memberId) {
          const { data: member } = await supabase
            .from('members')
            .select('firstname, lastname')
            .eq('id', memberId)
            .single();
          
          if (member) {
            memberName = `${member.firstname} ${member.lastname}`;
          }
        }
        
        const conversationTitle = createTitle(messageData.body, memberName, messageData.to_number);
        
        // Determine conversation type based on message content or template
        let conversationType = 'general';
        if (messageData.template_id) {
          const template = await supabase
            .from('sms_templates')
            .select('name')
            .eq('id', messageData.template_id)
            .single();
          
          if (template?.data?.name) {
            const templateName = template.data.name.toLowerCase();
            if (templateName.includes('prayer')) {
              conversationType = 'prayer_request';
            } else if (templateName.includes('event') || templateName.includes('reminder')) {
              conversationType = 'event_reminder';
            } else if (templateName.includes('emergency')) {
              conversationType = 'emergency';
            } else if (templateName.includes('pastoral') || templateName.includes('care')) {
              conversationType = 'pastoral_care';
            }
          }
        }
        
        const { data: conversation, error: conversationError } = await supabase
          .from('sms_conversations')
          .insert({
            title: conversationTitle,
            conversation_type: conversationType,
            status: 'active',
            organization_id: organizationId
          })
          .select()
          .single();

        if (conversationError) {
          console.error('❌ Conversation creation error:', conversationError);
          throw conversationError;
        }

        messageData.conversation_id = conversation.id;
        console.log('✅ New conversation created:', messageData.conversation_id);
      }
    }

    // Create the message record with conversation_id
    console.log('💾 Creating message record in database...');
    
    // Remove template_id, variables, group_id, and multiple_recipients from messageData for database insert
    const { template_id, variables, group_id, multiple_recipients, ...messageDataForDb } = messageData;
    
    const { data: message, error: messageError } = await supabase
      .from('sms_messages')
      .insert({
        ...messageDataForDb,
        body: finalMessageBody, // Use the rendered template body
        conversation_id: messageData.conversation_id,
        from_number: twilioPhoneNumber,
        direction: 'outbound',
        status: 'queued',
        organization_id: organizationId
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
        body: finalMessageBody, // Use the rendered template body
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
    // Get organization ID
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    // Create conversation for this prayer request
    const conversation = await this.createConversation({
      title: `Prayer Request from ${prayerRequest.name}`,
      conversation_type: 'prayer_request',
      status: 'active',
      organization_id: organizationId
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
    // Get organization ID
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    // Create conversation for this event reminder
    const conversation = await this.createConversation({
      title: `Event Reminder: ${event.title}`,
      conversation_type: 'event_reminder',
      status: 'active',
      organization_id: organizationId
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
    // Get organization ID
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    // Create conversation for emergency notification
    const conversation = await this.createConversation({
      title: 'Emergency Notification',
      conversation_type: 'emergency',
      status: 'active',
      organization_id: organizationId
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

  // Get church settings
  async getChurchSettings() {
    const { data, error } = await supabase
      .from('church_settings')
      .select('*')
      .single();

    if (error) {
      console.warn('Could not fetch church settings:', error);
      return { church_name: 'Our Church' }; // Default fallback
    }

    return data || { church_name: 'Our Church' };
  },

  // Template rendering with automatic church_name
  async renderTemplate(template, variables = {}) {
    let renderedText = template.template_text;
    
    // Get church settings for automatic variables
    const churchSettings = await this.getChurchSettings();
    
    // Combine user variables with system variables
    const allVariables = {
      ...variables,
      church_name: churchSettings.church_name || 'Our Church'
    };
    
    // Replace variables in template
    Object.keys(allVariables).forEach(key => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      renderedText = renderedText.replace(regex, allVariables[key]);
    });

    return renderedText;
  },

  // Dashboard Statistics
  async getSMSStats() {
    try {
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) {
        throw new Error('User not associated with any organization');
      }

      // Get total messages count for this organization
      const { count: totalMessages, error: messagesError } = await supabase
        .from('sms_messages')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      if (messagesError) throw messagesError;

      // Get messages in last 30 days for this organization
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: recentMessages, error: recentError } = await supabase
        .from('sms_messages')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .gte('sent_at', thirtyDaysAgo.toISOString());

      if (recentError) throw recentError;

      // Get total conversations count for this organization
      const { count: totalConversations, error: conversationsError } = await supabase
        .from('sms_conversations')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      if (conversationsError) throw conversationsError;

      // Get active conversations (updated in last 7 days) for this organization
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: activeConversations, error: activeError } = await supabase
        .from('sms_conversations')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .gte('updated_at', sevenDaysAgo.toISOString());

      if (activeError) throw activeError;

      // Get messages by direction for this organization
      const { count: outboundMessages, error: outboundError } = await supabase
        .from('sms_messages')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('direction', 'outbound');

      if (outboundError) throw outboundError;

      const { count: inboundMessages, error: inboundError } = await supabase
        .from('sms_messages')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('direction', 'inbound');

      if (inboundError) throw inboundError;

      // Get conversations by type for this organization
      const { data: conversationTypes, error: typesError } = await supabase
        .from('sms_conversations')
        .select('conversation_type')
        .eq('organization_id', organizationId)
        .eq('status', 'active');

      if (typesError) throw typesError;

      const typeBreakdown = conversationTypes.reduce((acc, conv) => {
        const type = conv.conversation_type || 'general';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      // Get recent conversations for this organization
      const { data: recentConversations, error: recentConvError } = await supabase
        .from('sms_conversations')
        .select(`
          id,
          title,
          conversation_type,
          updated_at,
          sms_messages (
            id,
            direction,
            body,
            sent_at
          )
        `)
        .eq('organization_id', organizationId)
        .order('updated_at', { ascending: false })
        .limit(5);

      if (recentConvError) throw recentConvError;

      // Calculate delivery rate
      const deliveryRate = outboundMessages > 0 ? Math.round((outboundMessages / outboundMessages) * 100) : 0;
      
      return {
        totalSent: outboundMessages || 0,
        totalDelivered: outboundMessages || 0, // Simplified for now
        totalFailed: 0, // Would need to track failed messages
        deliveryRate: deliveryRate,
        thisMonth: recentMessages || 0,
        lastMonth: 0, // Would need to calculate last month's data
        typeBreakdown,
        recentConversations: recentConversations || []
      };
    } catch (error) {
      console.error('Error getting SMS stats:', error);
      throw error;
    }
  },

  // Clearstream-style new methods
  async getCampaigns() {
    try {
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) {
        throw new Error('User not associated with any organization');
      }

      const { data, error } = await supabase
        .from('sms_campaigns')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting campaigns:', error);
      throw error;
    }
  },

  async createCampaign(campaignData) {
    try {
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) {
        throw new Error('User not associated with any organization');
      }

      const { data, error } = await supabase
        .from('sms_campaigns')
        .insert({
          ...campaignData,
          organization_id: organizationId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  },

  async getABTests() {
    try {
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) {
        throw new Error('User not associated with any organization');
      }

      const { data, error } = await supabase
        .from('sms_ab_tests')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting A/B tests:', error);
      throw error;
    }
  },

  async createABTest(testData) {
    try {
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) {
        throw new Error('User not associated with any organization');
      }

      const { data, error } = await supabase
        .from('sms_ab_tests')
        .insert({
          ...testData,
          organization_id: organizationId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating A/B test:', error);
      throw error;
    }
  },

  async getAnalyticsData(dateRange = '30') {
    try {
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) {
        throw new Error('User not associated with any organization');
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      const { data, error } = await supabase
        .from('sms_analytics')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting analytics data:', error);
      throw error;
    }
  },

  async getTopRecipients(limit = 10) {
    try {
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) {
        throw new Error('User not associated with any organization');
      }

      const { data, error } = await supabase
        .from('sms_messages')
        .select(`
          member_id,
          member:members(firstname, lastname),
          count
        `)
        .eq('organization_id', organizationId)
        .eq('direction', 'outbound')
        .not('member_id', 'is', null)
        .group('member_id, member:members(firstname, lastname)')
        .order('count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting top recipients:', error);
      throw error;
    }
  },

  async logOptOut(memberId, phoneNumber, action, reason = null) {
    try {
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) {
        throw new Error('User not associated with any organization');
      }

      const { data, error } = await supabase
        .from('sms_opt_out_logs')
        .insert({
          organization_id: organizationId,
          member_id: memberId,
          phone_number: phoneNumber,
          action,
          reason
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error logging opt-out:', error);
      throw error;
    }
  }
}; 

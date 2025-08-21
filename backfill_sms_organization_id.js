const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function backfillSMSOrganizationId() {
  console.log('🔄 Starting SMS organization_id backfill...');

  try {
    // Get all conversations without organization_id
    const { data: conversations, error: convError } = await supabase
      .from('sms_conversations')
      .select('id, title, group_id, created_at')
      .is('organization_id', null);

    if (convError) {
      console.error('❌ Error fetching conversations:', convError);
      return;
    }

    console.log(`📝 Found ${conversations?.length || 0} conversations without organization_id`);

    // Process each conversation
    for (const conversation of conversations || []) {
      let organizationId = null;

      // Try to get organization_id from group if this is a group conversation
      if (conversation.group_id) {
        const { data: group } = await supabase
          .from('groups')
          .select('organization_id')
          .eq('id', conversation.group_id)
          .single();

        if (group?.organization_id) {
          organizationId = group.organization_id;
          console.log(`✅ Found organization_id from group for conversation ${conversation.id}: ${organizationId}`);
        }
      }

      // If no group organization_id, try to get it from messages in this conversation
      if (!organizationId) {
        const { data: messages } = await supabase
          .from('sms_messages')
          .select('member_id, members!inner(user_id), organization_users!inner(organization_id)')
          .eq('conversation_id', conversation.id)
          .not('member_id', 'is', null)
          .limit(1);

        if (messages && messages.length > 0) {
          const message = messages[0];
          if (message.organization_users && message.organization_users.length > 0) {
            organizationId = message.organization_users[0].organization_id;
            console.log(`✅ Found organization_id from member for conversation ${conversation.id}: ${organizationId}`);
          }
        }
      }

      // Update conversation with organization_id if found
      if (organizationId) {
        const { error: updateError } = await supabase
          .from('sms_conversations')
          .update({ organization_id: organizationId })
          .eq('id', conversation.id);

        if (updateError) {
          console.error(`❌ Error updating conversation ${conversation.id}:`, updateError);
        } else {
          console.log(`✅ Updated conversation ${conversation.id} with organization_id: ${organizationId}`);
        }
      } else {
        console.log(`⚠️ Could not determine organization_id for conversation ${conversation.id}`);
      }
    }

    // Get all messages without organization_id
    const { data: messages, error: msgError } = await supabase
      .from('sms_messages')
      .select('id, conversation_id, member_id, from_number, to_number')
      .is('organization_id', null);

    if (msgError) {
      console.error('❌ Error fetching messages:', msgError);
      return;
    }

    console.log(`📱 Found ${messages?.length || 0} messages without organization_id`);

    // Process each message
    for (const message of messages || []) {
      let organizationId = null;

      // Try to get organization_id from conversation first
      if (message.conversation_id) {
        const { data: conversation } = await supabase
          .from('sms_conversations')
          .select('organization_id')
          .eq('id', message.conversation_id)
          .single();

        if (conversation?.organization_id) {
          organizationId = conversation.organization_id;
          console.log(`✅ Found organization_id from conversation for message ${message.id}: ${organizationId}`);
        }
      }

      // If no conversation organization_id, try to get it from member
      if (!organizationId && message.member_id) {
        const { data: member } = await supabase
          .from('members')
          .select('user_id, organization_users!inner(organization_id)')
          .eq('id', message.member_id)
          .single();

        if (member?.organization_users && member.organization_users.length > 0) {
          organizationId = member.organization_users[0].organization_id;
          console.log(`✅ Found organization_id from member for message ${message.id}: ${organizationId}`);
        }
      }

      // Update message with organization_id if found
      if (organizationId) {
        const { error: updateError } = await supabase
          .from('sms_messages')
          .update({ organization_id: organizationId })
          .eq('id', message.id);

        if (updateError) {
          console.error(`❌ Error updating message ${message.id}:`, updateError);
        } else {
          console.log(`✅ Updated message ${message.id} with organization_id: ${organizationId}`);
        }
      } else {
        console.log(`⚠️ Could not determine organization_id for message ${message.id}`);
      }
    }

    console.log('✅ SMS organization_id backfill completed!');

  } catch (error) {
    console.error('❌ Backfill error:', error);
  }
}

// Run the backfill
backfillSMSOrganizationId();
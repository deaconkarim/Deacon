const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSMSFixes() {

  try {
    // Test 1: Check if organization_id columns exist

    const { data: conversations, error: convError } = await supabase
      .from('sms_conversations')
      .select('*')
      .limit(1);
    
    if (convError) {
      console.error('❌ Error checking conversations table:', convError);
    } else {

      if (conversations && conversations.length > 0) {
        const hasOrgId = 'organization_id' in conversations[0];

      }
    }

    const { data: messages, error: msgError } = await supabase
      .from('sms_messages')
      .select('*')
      .limit(1);
    
    if (msgError) {
      console.error('❌ Error checking messages table:', msgError);
    } else {

      if (messages && messages.length > 0) {
        const hasOrgId = 'organization_id' in messages[0];

      }
    }

    // Test 2: Test conversation creation and finding logic

    // Get a test member
    const { data: testMember } = await supabase
      .from('members')
      .select('id, firstname, lastname, phone, user_id')
      .not('phone', 'is', null)
      .limit(1)
      .single();

    if (testMember) {

      // Get organization_id for this member
      const { data: orgUser } = await supabase
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', testMember.user_id)
        .eq('status', 'approved')
        .single();

      if (orgUser) {

        // Test creating a conversation
        const { data: newConversation, error: createError } = await supabase
          .from('sms_conversations')
          .insert({
            title: `Test conversation for ${testMember.firstname}`,
            conversation_type: 'general',
            status: 'active',
            organization_id: orgUser.organization_id
          })
          .select()
          .single();

        if (createError) {
          console.error('❌ Error creating test conversation:', createError);
        } else {

          // Test finding existing conversation
          const { data: existingConversations } = await supabase
            .from('sms_conversations')
            .select(`
              id,
              title,
              conversation_type,
              created_at,
              sms_messages!inner(member_id)
            `)
            .eq('sms_messages.member_id', testMember.id)
            .eq('status', 'active')
            .eq('organization_id', orgUser.organization_id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (existingConversations && existingConversations.length > 0) {

          } else {

          }
        }
      } else {

      }
    } else {

    }

    // Test 3: Test phone number matching logic

    if (testMember && testMember.phone) {
      // Test phone number normalization
      const normalizePhone = (phone) => {
        const clean = phone.replace(/\D/g, '');
        if (clean.length === 10) {
          return `${clean.substring(0, 3)}-${clean.substring(3, 6)}-${clean.substring(6)}`;
        } else if (clean.length === 11 && clean.startsWith('1')) {
          return `${clean.substring(1, 4)}-${clean.substring(4, 7)}-${clean.substring(7)}`;
        }
        return clean;
      };

      const normalizedPhone = normalizePhone(testMember.phone);

      // Test finding conversations by phone number
      const { data: phoneConversations } = await supabase
        .from('sms_conversations')
        .select(`
          id,
          title,
          conversation_type,
          created_at,
          sms_messages!inner(to_number)
        `)
        .or(`sms_messages.to_number.eq.${testMember.phone},sms_messages.to_number.eq.${normalizedPhone}`)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (phoneConversations && phoneConversations.length > 0) {

      } else {

      }
    }

    // Test 4: Test response routing logic

    // Simulate the logic from receive-sms function
    if (testMember) {
      // Strategy 1: Find by member
      const { data: memberConversations } = await supabase
        .from('sms_conversations')
        .select(`
          id,
          title,
          conversation_type,
          created_at,
          updated_at,
          sms_messages!inner(
            id,
            member_id,
            sent_at
          )
        `)
        .eq('sms_messages.member_id', testMember.id)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(5);

      if (memberConversations && memberConversations.length > 0) {

        // Find most recent conversation
        let mostRecentConversation = null;
        let mostRecentMessageTime = null;
        
        for (const conversation of memberConversations) {
          const memberMessages = conversation.sms_messages.filter(msg => msg.member_id === testMember.id);
          if (memberMessages.length > 0) {
            const latestMessage = memberMessages.reduce((latest, current) => 
              new Date(current.sent_at) > new Date(latest.sent_at) ? current : latest
            );
            
            if (!mostRecentMessageTime || new Date(latestMessage.sent_at) > mostRecentMessageTime) {
              mostRecentMessageTime = new Date(latestMessage.sent_at);
              mostRecentConversation = conversation;
            }
          }
        }
        
        if (mostRecentConversation) {

        }
      } else {

      }
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run the test
testSMSFixes();
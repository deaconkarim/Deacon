import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('📱 SMS webhook received:', req.method, req.url)
    
    // Parse form data from Twilio webhook
    const formData = await req.formData()
    const from = formData.get('From') as string
    const to = formData.get('To') as string
    const body = formData.get('Body') as string
    const messageSid = formData.get('MessageSid') as string

    console.log('📨 SMS data:', { from, to, body, messageSid })

    // Normalize phone number by removing + prefix and converting to database format
    const removePlus = (phone) => phone.startsWith('+') ? phone.substring(1) : phone
    const cleanDigits = (phone) => removePlus(phone).replace(/\D/g, '') // Remove all non-digits
    
    const formatForDB = (phone) => {
      const clean = cleanDigits(phone)
      if (clean.length === 10) {
        return `${clean.substring(0, 3)}-${clean.substring(3, 6)}-${clean.substring(6)}`
      } else if (clean.length === 11 && clean.startsWith('1')) {
        return `${clean.substring(1, 4)}-${clean.substring(4, 7)}-${clean.substring(7)}`
      }
      return clean // Return as-is if it doesn't match expected formats
    }
    
    // Create a version without country code for database matching
    const getLocalDigits = (phone) => {
      const clean = cleanDigits(phone)
      if (clean.length === 11 && clean.startsWith('1')) {
        return clean.substring(1) // Remove country code for US numbers
      }
      return clean
    }
    
    const normalizedFrom = formatForDB(from)
    const normalizedTo = formatForDB(to)
    const cleanFromDigits = cleanDigits(from) // Just the digits for flexible matching
    const localFromDigits = getLocalDigits(from) // Digits without country code

    console.log('📱 Normalized phone numbers:', { 
      original: from, 
      normalized: normalizedFrom,
      cleanDigits: cleanFromDigits,
      localDigits: localFromDigits,
      originalTo: to,
      normalizedTo: normalizedTo 
    })

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    // Find member by phone number using flexible matching
    // First try exact match with normalized format
    // Try to find member by phone number - try multiple formats
    let member = null
    console.log('🔍 Looking for member with phone:', from, 'normalized:', normalizedFrom, 'clean digits:', cleanFromDigits)
    
    // First try the normalized format
    let { data: memberData, error: memberError } = await supabaseClient
      .from('members')
      .select('id, firstname, lastname, phone')
      .eq('phone', normalizedFrom)
      .maybeSingle()
    
    // If not found, try the original format
    if (!memberData) {
      console.log('🔍 Trying original phone format...')
      const { data: originalMemberData } = await supabaseClient
        .from('members')
        .select('id, firstname, lastname, phone')
        .eq('phone', from)
        .maybeSingle()
      
      if (originalMemberData) {
        memberData = originalMemberData
        console.log('✅ Found member with original format:', memberData.firstname, memberData.lastname)
      }
    }
    
    // If not found, try the clean digits format (no formatting)
    if (!memberData) {
      console.log('🔍 Trying clean digits format...')
      const { data: cleanDigitsMemberData } = await supabaseClient
        .from('members')
        .select('id, firstname, lastname, phone')
        .eq('phone', cleanFromDigits)
        .maybeSingle()
      
      if (cleanDigitsMemberData) {
        memberData = cleanDigitsMemberData
        console.log('✅ Found member with clean digits format:', memberData.firstname, memberData.lastname)
      }
    }
    
    // If not found, try the local digits format (without country code)
    if (!memberData) {
      console.log('🔍 Trying local digits format (no country code)...')
      const { data: localDigitsMemberData } = await supabaseClient
        .from('members')
        .select('id, firstname, lastname, phone')
        .eq('phone', localFromDigits)
        .maybeSingle()
      
      if (localDigitsMemberData) {
        memberData = localDigitsMemberData
        console.log('✅ Found member with local digits format:', memberData.firstname, memberData.lastname)
      }
    }
    
    // If still not found, try to find by matching just the digits
    if (!memberData) {
      console.log('🔍 Trying digit matching...')
      const { data: members } = await supabaseClient
        .from('members')
        .select('id, firstname, lastname, phone')
        .not('phone', 'is', null)
      
      if (members) {
        console.log('🔍 Checking', members.length, 'members for digit match')
        memberData = members.find(m => {
          if (!m.phone) return false
          const memberDigits = m.phone.replace(/\D/g, '')
          const matches = memberDigits === cleanFromDigits
          if (matches) {
            console.log('🔍 Found matching member:', m.firstname, m.lastname, 'phone:', m.phone, 'digits:', memberDigits)
          }
          return matches
        })
      }
    }
    
    member = memberData

    if (memberError) {
      console.error('❌ Member lookup error:', memberError)
    } else if (member) {
      console.log('✅ Found member:', member.firstname, member.lastname)
    } else {
      console.log('ℹ️ No member found for phone number:', from)
    }

    // Create or find conversation
    let conversationId = null
    let allPossibleConversations = []
    
    // First, check if this member is part of any active group conversations
    if (member) {
      console.log('🔍 Checking group conversations for member:', member.id, member.firstname, member.lastname)
      
      const { data: groupConversations } = await supabaseClient
        .from('sms_conversations')
        .select('id, title, group_id, created_at')
        .not('group_id', 'is', null)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
      
      console.log('🔍 Found group conversations:', groupConversations?.length || 0)
      
      if (groupConversations && groupConversations.length > 0) {
        // Check if this member is in any of these groups
        for (const conversation of groupConversations) {
          console.log('🔍 Checking group:', conversation.group_id, 'for member:', member.id)
          
          const { data: groupMembers } = await supabaseClient
            .from('group_members')
            .select('member_id')
            .eq('group_id', conversation.group_id)
            .eq('member_id', member.id)
          
          console.log('🔍 Group members found:', groupMembers?.length || 0)
          
          if (groupMembers && groupMembers.length > 0) {
            // This member is part of this group conversation
            allPossibleConversations.push({
              id: conversation.id,
              title: conversation.title,
              created_at: conversation.created_at,
              type: 'group'
            })
            console.log('✅ Found group conversation for member:', conversation.id, conversation.title)
          }
        }
      }
    } else {
      console.log('⚠️ No member found, skipping group conversation check')
    }
    
    // Check if this member is part of any multi-recipient conversations
    if (member) {
      console.log('🔍 Checking multi-recipient conversations for member:', member.id)
      const { data: multiRecipientConversations } = await supabaseClient
        .from('sms_conversations')
        .select('id, title, created_at')
        .like('title', 'Multiple Recipients%')
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
      
      console.log('🔍 Found multi-recipient conversations:', multiRecipientConversations?.length || 0)
      
      if (multiRecipientConversations && multiRecipientConversations.length > 0) {
        // Check if this member has any messages in these conversations
        for (const conversation of multiRecipientConversations) {
          console.log('🔍 Checking multi-recipient conversation:', conversation.id, conversation.title)
          const { data: memberMessages } = await supabaseClient
            .from('sms_messages')
            .select('id')
            .eq('conversation_id', conversation.id)
            .eq('member_id', member.id)
            .limit(1)
          
          console.log('🔍 Member messages in conversation:', memberMessages?.length || 0)
          
          if (memberMessages && memberMessages.length > 0) {
            // This member has messages in this multi-recipient conversation
            allPossibleConversations.push({
              id: conversation.id,
              title: conversation.title,
              created_at: conversation.created_at,
              type: 'multi-recipient'
            })
            console.log('✅ Found multi-recipient conversation for member:', conversation.id, conversation.title)
          }
        }
      }
    }
    
    // Now find the most recently created conversation for this member/phone number
    if (allPossibleConversations.length > 0) {
      console.log('🔍 Found', allPossibleConversations.length, 'possible conversations for member')
      
      // Sort by creation date (most recent first) - this is what we want
      allPossibleConversations.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      
      const mostRecentConversation = allPossibleConversations[0]
      conversationId = mostRecentConversation.id
      console.log('✅ Selected most recently created conversation:', conversationId, 'type:', mostRecentConversation.type, 'created at:', mostRecentConversation.created_at, 'title:', mostRecentConversation.title)
    }
    
    // If no member-based conversation found, find the most recently created conversation for this phone number
    if (!conversationId) {
      console.log('🔍 Looking for most recently created conversation for phone number:', from)
      
      // Find all conversations that have messages from/to this phone number
      // Try multiple phone number formats to ensure we find the right conversation
      const { data: allPhoneMessages } = await supabaseClient
        .from('sms_messages')
        .select(`
          conversation_id,
          conversation:sms_conversations!inner(
            id,
            title,
            created_at,
            status
          )
        `)
        .or(`from_number.eq.${from},to_number.eq.${from},from_number.eq.${normalizedFrom},to_number.eq.${normalizedFrom},from_number.eq.${cleanFromDigits},to_number.eq.${cleanFromDigits}`)
        .eq('conversation.status', 'active')
      
      if (allPhoneMessages && allPhoneMessages.length > 0) {
        // Get unique conversations and sort by creation date (most recent first)
        const uniqueConversations = allPhoneMessages
          .filter((msg, index, self) => 
            index === self.findIndex(m => m.conversation_id === msg.conversation_id)
          )
          .map(msg => msg.conversation)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        
        if (uniqueConversations.length > 0) {
          const mostRecentConversation = uniqueConversations[0]
          conversationId = mostRecentConversation.id
          console.log('✅ Found most recently created conversation:', conversationId, 'created at:', mostRecentConversation.created_at, 'title:', mostRecentConversation.title)
        }
      } else {
        // If no exact match, try flexible digit matching
        console.log('🔍 Trying flexible digit matching for most recently created conversation...')
        const { data: allMessages } = await supabaseClient
          .from('sms_messages')
          .select(`
            conversation_id,
            from_number,
            to_number,
            conversation:sms_conversations!inner(
              id,
              title,
              created_at,
              status
            )
          `)
          .eq('conversation.status', 'active')
        
        if (allMessages) {
          // Find messages where the phone number matches (using digit comparison)
          const matchingMessages = allMessages.filter(msg => {
            const fromDigits = msg.from_number?.replace(/\D/g, '') || ''
            const toDigits = msg.to_number?.replace(/\D/g, '') || ''
            const matches = fromDigits === cleanFromDigits || toDigits === cleanFromDigits || 
                           fromDigits === localFromDigits || toDigits === localFromDigits
            if (matches) {
              console.log('🔍 Found matching message:', msg.from_number, '->', msg.to_number, 'conversation:', msg.conversation_id, 'at:', msg.created_at)
            }
            return matches
          })
          
          if (matchingMessages.length > 0) {
            // Get unique conversations and sort by creation date (most recent first)
            const uniqueMatchingConversations = matchingMessages
              .filter((msg, index, self) => 
                index === self.findIndex(m => m.conversation_id === msg.conversation_id)
              )
              .map(msg => msg.conversation)
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            
            if (uniqueMatchingConversations.length > 0) {
              const mostRecentMatchingConversation = uniqueMatchingConversations[0]
              conversationId = mostRecentMatchingConversation.id
              console.log('✅ Found most recently created conversation via digit matching:', conversationId, 'created at:', mostRecentMatchingConversation.created_at, 'title:', mostRecentMatchingConversation.title)
            }
          }
        }
      }
      
      if (conversationId) {
        console.log('✅ Found existing conversation:', conversationId)
      } else {
        console.log('❌ No existing conversation found for phone number')
      }
    }

    // If still no conversation found, create a new one
    if (!conversationId) {
      // Create new conversation with first message as title
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
      
      const memberName = member ? `${member.firstname} ${member.lastname}` : null
      const conversationTitle = createTitle(body, memberName, normalizedFrom)
        
        const { data: newConversation, error: convError } = await supabaseClient
          .from('sms_conversations')
          .insert({
          title: conversationTitle,
            conversation_type: 'general',
          status: 'active',
          organization_id: organizationId
          })
          .select('id')
          .single()

        if (convError) {
          console.error('❌ Conversation creation error:', convError)
        } else {
          conversationId = newConversation?.id
          console.log('✅ Created new conversation:', conversationId)
        }
      }

    // Get organization_id from member or conversation
    let organizationId = null
    
    if (member) {
      // Get organization_id from member's organization_users relationship
      const { data: orgUser } = await supabaseClient
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', member.user_id)
        .eq('status', 'approved')
        .maybeSingle()
      
      if (orgUser) {
        organizationId = orgUser.organization_id
        console.log('✅ Found organization_id from member:', organizationId)
      }
    }
    
    // If no organization_id from member, try to get it from the conversation
    if (!organizationId && conversationId) {
      const { data: conversation } = await supabaseClient
        .from('sms_conversations')
        .select('organization_id')
        .eq('id', conversationId)
        .maybeSingle()
      
      if (conversation?.organization_id) {
        organizationId = conversation.organization_id
        console.log('✅ Found organization_id from conversation:', organizationId)
      }
    }
    
    // If still no organization_id, try to get it from the group if this is a group conversation
    if (!organizationId && conversationId) {
      const { data: groupConversation } = await supabaseClient
        .from('sms_conversations')
        .select('group_id')
        .eq('id', conversationId)
        .maybeSingle()
      
      if (groupConversation?.group_id) {
        const { data: group } = await supabaseClient
          .from('groups')
          .select('organization_id')
          .eq('id', groupConversation.group_id)
          .maybeSingle()
        
        if (group?.organization_id) {
          organizationId = group.organization_id
          console.log('✅ Found organization_id from group:', organizationId)
        }
      }
    }
    
    console.log('📝 Using organization_id for message:', organizationId)

    // Store incoming message
    const { data: message, error: messageError } = await supabaseClient
      .from('sms_messages')
      .insert({
        twilio_sid: messageSid,
        direction: 'inbound',
        from_number: from,
        to_number: to,
        body: body,
        status: 'delivered',
        member_id: member?.id || null,
        conversation_id: conversationId,
        organization_id: organizationId,
        delivered_at: new Date().toISOString()
      })
      .select()
      .single()

    if (messageError) {
      console.error('❌ Message storage error:', messageError)
      throw messageError
    }

    console.log('✅ Message stored successfully:', message.id)

    // Update conversation's updated_at timestamp
    if (conversationId) {
      await supabaseClient
        .from('sms_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)
      
      console.log('✅ Conversation updated timestamp')
    }

    // Return empty TwiML response (no auto-reply)
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
</Response>`

    console.log('📤 Sending empty TwiML response (no auto-reply)')
    return new Response(twimlResponse, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/xml' 
      }
    })

  } catch (error) {
    console.error('❌ SMS receiving error:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 
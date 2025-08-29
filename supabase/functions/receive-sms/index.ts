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

    // Parse form data from Twilio webhook
    const formData = await req.formData()
    const from = formData.get('From') as string
    const to = formData.get('To') as string
    const body = formData.get('Body') as string
    const messageSid = formData.get('MessageSid') as string

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

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    // Find member by phone number using flexible matching
    // First try exact match with normalized format
    // Try to find member by phone number - try multiple formats
    let member = null

    // First try the normalized format
    let { data: memberData, error: memberError } = await supabaseClient
      .from('members')
      .select('id, firstname, lastname, phone')
      .eq('phone', normalizedFrom)
      .maybeSingle()
    
    // If not found, try the original format
    if (!memberData) {

      const { data: originalMemberData } = await supabaseClient
        .from('members')
        .select('id, firstname, lastname, phone')
        .eq('phone', from)
        .maybeSingle()
      
      if (originalMemberData) {
        memberData = originalMemberData

      }
    }
    
    // If not found, try the clean digits format (no formatting)
    if (!memberData) {

      const { data: cleanDigitsMemberData } = await supabaseClient
        .from('members')
        .select('id, firstname, lastname, phone')
        .eq('phone', cleanFromDigits)
        .maybeSingle()
      
      if (cleanDigitsMemberData) {
        memberData = cleanDigitsMemberData

      }
    }
    
    // If not found, try the local digits format (without country code)
    if (!memberData) {

      const { data: localDigitsMemberData } = await supabaseClient
        .from('members')
        .select('id, firstname, lastname, phone')
        .eq('phone', localFromDigits)
        .maybeSingle()
      
      if (localDigitsMemberData) {
        memberData = localDigitsMemberData

      }
    }
    
    // If still not found, try to find by matching just the digits
    if (!memberData) {

      const { data: members } = await supabaseClient
        .from('members')
        .select('id, firstname, lastname, phone')
        .not('phone', 'is', null)
      
      if (members) {

        memberData = members.find(m => {
          if (!m.phone) return false
          const memberDigits = m.phone.replace(/\D/g, '')
          const matches = memberDigits === cleanFromDigits
          if (matches) {

          }
          return matches
        })
      }
    }
    
    member = memberData

    if (memberError) {
      console.error('❌ Member lookup error:', memberError)
    } else if (member) {

    } else {

    }

    // Find the most recent conversation for this person/phone number
    let conversationId = null
    
    // Strategy 1: If we have a member, find their most recent conversation
    if (member) {

      // Find conversations where this member has messages, ordered by most recent activity
      const { data: memberConversations } = await supabaseClient
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
        .eq('sms_messages.member_id', member.id)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(5) // Get top 5 most recent conversations
      
      if (memberConversations && memberConversations.length > 0) {
        // Find the conversation with the most recent message from this member
        let mostRecentConversation = null
        let mostRecentMessageTime = null
        
        for (const conversation of memberConversations) {
          const memberMessages = conversation.sms_messages.filter(msg => msg.member_id === member.id)
          if (memberMessages.length > 0) {
            const latestMessage = memberMessages.reduce((latest, current) => 
              new Date(current.sent_at) > new Date(latest.sent_at) ? current : latest
            )
            
            if (!mostRecentMessageTime || new Date(latestMessage.sent_at) > mostRecentMessageTime) {
              mostRecentMessageTime = new Date(latestMessage.sent_at)
              mostRecentConversation = conversation
            }
          }
        }
        
        if (mostRecentConversation) {
          conversationId = mostRecentConversation.id

        }
      }
    }
    
    // Strategy 2: If no member-based conversation found, find by phone number
    if (!conversationId) {

      // Find conversations with messages to/from this phone number, ordered by most recent activity
      const { data: phoneConversations } = await supabaseClient
        .from('sms_conversations')
        .select(`
          id,
          title,
          conversation_type,
          created_at,
          updated_at,
          sms_messages!inner(
            id,
            from_number,
            to_number,
            sent_at
          )
        `)
        .or(`sms_messages.from_number.eq.${from},sms_messages.to_number.eq.${from},sms_messages.from_number.eq.${normalizedFrom},sms_messages.to_number.eq.${normalizedFrom}`)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(5) // Get top 5 most recent conversations
      
      if (phoneConversations && phoneConversations.length > 0) {
        // Find the conversation with the most recent message involving this phone number
        let mostRecentConversation = null
        let mostRecentMessageTime = null
        
        for (const conversation of phoneConversations) {
          const phoneMessages = conversation.sms_messages.filter(msg => 
            msg.from_number === from || msg.to_number === from ||
            msg.from_number === normalizedFrom || msg.to_number === normalizedFrom
          )
          
          if (phoneMessages.length > 0) {
            const latestMessage = phoneMessages.reduce((latest, current) => 
              new Date(current.sent_at) > new Date(latest.sent_at) ? current : latest
            )
            
            if (!mostRecentMessageTime || new Date(latestMessage.sent_at) > mostRecentMessageTime) {
              mostRecentMessageTime = new Date(latestMessage.sent_at)
              mostRecentConversation = conversation
            }
          }
        }
        
        if (mostRecentConversation) {
          conversationId = mostRecentConversation.id

        }
      }
    }
    
    // Strategy 3: If still no conversation found, try flexible digit matching
    if (!conversationId) {

      const { data: allConversations } = await supabaseClient
        .from('sms_conversations')
        .select(`
          id,
          title,
          conversation_type,
          created_at,
          updated_at,
          sms_messages(
            id,
            from_number,
            to_number,
            sent_at
          )
        `)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(10) // Get top 10 most recent conversations
      
      if (allConversations) {
        let mostRecentConversation = null
        let mostRecentMessageTime = null
        
        for (const conversation of allConversations) {
          if (conversation.sms_messages && conversation.sms_messages.length > 0) {
            const matchingMessages = conversation.sms_messages.filter(msg => {
              const fromDigits = msg.from_number?.replace(/\D/g, '') || ''
              const toDigits = msg.to_number?.replace(/\D/g, '') || ''
              return fromDigits === cleanFromDigits || toDigits === cleanFromDigits ||
                     fromDigits === localFromDigits || toDigits === localFromDigits
            })
            
            if (matchingMessages.length > 0) {
              const latestMessage = matchingMessages.reduce((latest, current) => 
                new Date(current.sent_at) > new Date(latest.sent_at) ? current : latest
              )
              
              if (!mostRecentMessageTime || new Date(latestMessage.sent_at) > mostRecentMessageTime) {
                mostRecentMessageTime = new Date(latestMessage.sent_at)
                mostRecentConversation = conversation
              }
            }
          }
        }
        
        if (mostRecentConversation) {
          conversationId = mostRecentConversation.id

        }
      }
    }
    
    if (conversationId) {

    } else {

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

        }
      }
    }
    
    // If still no organization_id, try to get it from any recent conversation
    if (!organizationId) {
      const { data: recentConversation } = await supabaseClient
        .from('sms_conversations')
        .select('organization_id')
        .not('organization_id', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      if (recentConversation?.organization_id) {
        organizationId = recentConversation.organization_id

      }
    }

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

    // Update conversation's updated_at timestamp
    if (conversationId) {
      await supabaseClient
        .from('sms_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)

    }

    // Return empty TwiML response (no auto-reply)
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
</Response>`

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
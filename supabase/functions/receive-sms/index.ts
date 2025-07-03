import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    
    const normalizedFrom = formatForDB(from)
    const normalizedTo = formatForDB(to)
    const cleanFromDigits = cleanDigits(from) // Just the digits for flexible matching

    console.log('📱 Normalized phone numbers:', { 
      original: from, 
      normalized: normalizedFrom,
      cleanDigits: cleanFromDigits,
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
    let { data: member, error: memberError } = await supabaseClient
      .from('members')
      .select('id, firstname, lastname')
      .eq('phone', normalizedFrom)
      .maybeSingle()
    
    // If not found, try to find by matching just the digits
    if (!member) {
      const { data: members } = await supabaseClient
        .from('members')
        .select('id, firstname, lastname, phone')
        .not('phone', 'is', null)
      
      if (members) {
        member = members.find(m => {
          if (!m.phone) return false
          const memberDigits = m.phone.replace(/\D/g, '')
          return memberDigits === cleanFromDigits
        })
      }
    }

    if (memberError) {
      console.error('❌ Member lookup error:', memberError)
    } else if (member) {
      console.log('✅ Found member:', member.firstname, member.lastname)
    } else {
      console.log('ℹ️ No member found for phone number:', from)
    }

    // Create or find conversation
    let conversationId = null
    
    // First, try to find existing conversation by looking for any messages with this phone number
    // Try both original and normalized formats
    let { data: existingMessages } = await supabaseClient
      .from('sms_messages')
      .select('conversation_id')
      .or(`from_number.eq.${from},to_number.eq.${from},from_number.eq.${normalizedFrom},to_number.eq.${normalizedFrom}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    // If not found, try flexible digit matching
    if (!existingMessages) {
      const { data: allMessages } = await supabaseClient
        .from('sms_messages')
        .select('conversation_id, from_number, to_number')
        .order('created_at', { ascending: false })
      
      if (allMessages) {
        const matchingMessage = allMessages.find(msg => {
          const fromDigits = msg.from_number?.replace(/\D/g, '') || ''
          const toDigits = msg.to_number?.replace(/\D/g, '') || ''
          return fromDigits === cleanFromDigits || toDigits === cleanFromDigits
        })
        
        if (matchingMessage) {
          existingMessages = { conversation_id: matchingMessage.conversation_id }
        }
      }
    }

    if (existingMessages?.conversation_id) {
      conversationId = existingMessages.conversation_id
      console.log('✅ Found existing conversation:', conversationId)
    } else {
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
          status: 'active'
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
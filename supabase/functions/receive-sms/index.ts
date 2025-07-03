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

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    // Find member by phone number
    const { data: member, error: memberError } = await supabaseClient
      .from('members')
      .select('id, firstname, lastname')
      .eq('phone', from)
      .maybeSingle()

    if (memberError) {
      console.error('❌ Member lookup error:', memberError)
    } else if (member) {
      console.log('✅ Found member:', member.firstname, member.lastname)
    } else {
      console.log('ℹ️ No member found for phone number:', from)
    }

    // Create or find conversation
    let conversationId = null
    if (member) {
      // Look for existing conversation with this member by checking messages
      const { data: existingMessages } = await supabaseClient
        .from('sms_messages')
        .select('conversation_id')
        .eq('member_id', member.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existingMessages?.conversation_id) {
        conversationId = existingMessages.conversation_id
        console.log('✅ Using existing conversation:', conversationId)
      } else {
        // Create new conversation
        const { data: newConversation, error: convError } = await supabaseClient
          .from('sms_conversations')
          .insert({
            title: `SMS with ${member.firstname} ${member.lastname}`,
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
    } else {
      // For non-members, try to find conversation by phone number
      const { data: existingMessages } = await supabaseClient
        .from('sms_messages')
        .select('conversation_id')
        .eq('from_number', from)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existingMessages?.conversation_id) {
        conversationId = existingMessages.conversation_id
        console.log('✅ Using existing conversation for non-member:', conversationId)
      } else {
        // Create new conversation for non-member
        const { data: newConversation, error: convError } = await supabaseClient
          .from('sms_conversations')
          .insert({
            title: `SMS with ${from}`,
            conversation_type: 'general',
            status: 'active'
          })
          .select('id')
          .single()

        if (convError) {
          console.error('❌ Conversation creation error:', convError)
        } else {
          conversationId = newConversation?.id
          console.log('✅ Created new conversation for non-member:', conversationId)
        }
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

    // Return TwiML response (optional auto-reply)
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Thank you for your message. We'll get back to you soon.</Message>
</Response>`

    console.log('📤 Sending TwiML response')
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
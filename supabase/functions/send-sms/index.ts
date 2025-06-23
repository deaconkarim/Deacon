import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
}

serve(async (req) => {
  console.log('Function called with method:', req.method)
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request')
    return new Response('ok', {
      headers: corsHeaders,
      status: 200
    })
  }

  try {
    const { to, body, messageId } = await req.json()
    console.log('Received request:', {
      to,
      body,
      messageId
    })

    // Check environment variables
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const phoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')
    
    console.log('Environment check:')
    console.log('- TWILIO_ACCOUNT_SID:', accountSid ? '✅ Set' : '❌ Missing')
    console.log('- TWILIO_AUTH_TOKEN:', authToken ? '✅ Set' : '❌ Missing')
    console.log('- TWILIO_PHONE_NUMBER:', phoneNumber ? '✅ Set' : '❌ Missing')

    if (!accountSid || !authToken || !phoneNumber) {
      throw new Error('Missing Twilio environment variables. Please configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    // Send SMS via Twilio REST API directly
    console.log('Sending SMS via Twilio REST API to:', to)
    
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
    const formData = new URLSearchParams()
    formData.append('To', to)
    formData.append('From', phoneNumber)
    formData.append('Body', body)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Twilio API error:', response.status, errorText)
      throw new Error(`Twilio API error: ${response.status} - ${errorText}`)
    }

    const twilioResponse = await response.json()
    console.log('Twilio message sent successfully:', twilioResponse.sid)

    // Update message status in database
    if (messageId) {
      await supabaseClient
        .from('sms_messages')
        .update({
          status: 'sent',
          twilio_sid: twilioResponse.sid
        })
        .eq('id', messageId)
      
      console.log('Database updated with Twilio SID:', twilioResponse.sid)
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'SMS sent successfully via Twilio!',
      messageSid: twilioResponse.sid,
      status: twilioResponse.status,
      receivedData: {
        to,
        body,
        messageId
      }
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    })

  } catch (error) {
    console.error('Function error:', error)
    
    // Try to update message status to failed if we have a messageId
    try {
      const { messageId } = await req.json()
      if (messageId) {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') || '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
        )
        
        await supabaseClient
          .from('sms_messages')
          .update({
            status: 'failed',
            error_message: error.message
          })
          .eq('id', messageId)
      }
    } catch (dbError) {
      console.error('Failed to update message status:', dbError)
    }

    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
  }
}) 
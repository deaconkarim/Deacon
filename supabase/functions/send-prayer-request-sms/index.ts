import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Twilio } from 'https://esm.sh/twilio@4.19.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone, request, name } = await req.json()

    // Initialize Twilio client
    const twilio = new Twilio(
      Deno.env.get('TWILIO_ACCOUNT_SID') || '',
      Deno.env.get('TWILIO_AUTH_TOKEN') || ''
    )

    // Get prayer team phone numbers from Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    const { data: prayerTeam, error } = await supabaseClient
      .from('members')
      .select('phone')
      .eq('group_id', 'prayer-team')
      .eq('status', 'active')

    if (error) throw error

    // Send SMS to each prayer team member
    const messagePromises = prayerTeam.map(member => 
      twilio.messages.create({
        body: `New Prayer Request from ${name}:\n\n${request}\n\nPhone: ${phone}`,
        to: member.phone,
        from: Deno.env.get('TWILIO_PHONE_NUMBER') || ''
      })
    )

    await Promise.all(messagePromises)

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 
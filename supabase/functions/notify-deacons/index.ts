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
    const { requestId } = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    // Get prayer request details
    const { data: request, error: requestError } = await supabaseClient
      .from('prayer_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (requestError) throw requestError

    // Get deacon emails
    const { data: deacons, error: deaconsError } = await supabaseClient
      .from('members')
      .select('email')
      .eq('group_id', 'deacons')
      .eq('status', 'active')

    if (deaconsError) throw deaconsError

    // Get Resend API key
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set')
    }

    // Create email content
    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:3000'
    const prayerUrl = `${appUrl}/prayer/${requestId}`
    
    const emailContent = `
      <h2>New Prayer Request</h2>
      <p><strong>From:</strong> ${request.name}</p>
      <p><strong>Request:</strong> ${request.request}</p>
      <p><strong>Contact:</strong> ${request.phone}</p>
      <p><a href="${prayerUrl}">Click here to view and send to members</a></p>
    `

    // Send email to each deacon using Resend
    const emailPromises = deacons.map(deacon => 
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: Deno.env.get('ADMIN_EMAIL') || 'noreply@yourdomain.com',
          to: deacon.email,
          subject: 'New Prayer Request',
          html: emailContent,
        }),
      })
    )

    await Promise.all(emailPromises)

    // Update prayer request status
    const { error: updateError } = await supabaseClient
      .from('prayer_requests')
      .update({
        deacon_notified: true,
        deacon_notified_at: new Date().toISOString()
      })
      .eq('id', requestId)

    if (updateError) throw updateError

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
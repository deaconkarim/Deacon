import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SmtpClient } from 'https://deno.land/x/smtp@v0.7.0/mod.ts'

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

    // Initialize SMTP client
    const client = new SmtpClient()
    await client.connectTLS({
      hostname: Deno.env.get('SMTP_HOSTNAME') || '',
      port: parseInt(Deno.env.get('SMTP_PORT') || '587'),
      username: Deno.env.get('SMTP_USERNAME') || '',
      password: Deno.env.get('SMTP_PASSWORD') || '',
    })

    // Create email content
    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:3000'
    const prayerUrl = `${appUrl}/prayer/${requestId}`
    
    const emailContent = `
      New Prayer Request from ${request.name}
      
      Request: ${request.request}
      Contact: ${request.phone}
      
      Click here to view and send to members: ${prayerUrl}
    `

    // Send email to each deacon
    for (const deacon of deacons) {
      await client.send({
        from: Deno.env.get('SMTP_FROM_EMAIL') || '',
        to: deacon.email,
        subject: 'New Prayer Request',
        content: emailContent,
      })
    }

    // Update prayer request status
    const { error: updateError } = await supabaseClient
      .from('prayer_requests')
      .update({
        deacon_notified: true,
        deacon_notified_at: new Date().toISOString()
      })
      .eq('id', requestId)

    if (updateError) throw updateError

    await client.close()

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
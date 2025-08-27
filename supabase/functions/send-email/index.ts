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
    const { to, subject, body, member_id, conversation_type } = await req.json()

    if (!to || !subject || !body) {
      throw new Error('Missing required fields: to, subject, body')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    // Get Resend API key
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set')
    }

    // Create or get conversation
    let conversationId = null
    if (conversation_type && conversation_type !== 'general') {
      const { data: existingConversation } = await supabaseClient
        .from('email_conversations')
        .select('id')
        .eq('conversation_type', conversation_type)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (existingConversation) {
        conversationId = existingConversation.id
      } else {
        const { data: newConversation, error: convError } = await supabaseClient
          .from('email_conversations')
          .insert([{
            title: `Email: ${subject}`,
            conversation_type,
            status: 'active'
          }])
          .select('id')
          .single()

        if (convError) throw convError
        conversationId = newConversation.id
      }
    }

    // Check if body is already complete HTML
    let emailContent;
    if (body && body.includes('<!DOCTYPE html>')) {
      // Body is already complete HTML, use as-is
      emailContent = body;
    } else {
      // Body is plain text, wrap with template
      emailContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; line-height: 1.6;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px; text-align: center;">
            <div style="margin-bottom: 16px;">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Deacon</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0; font-size: 14px; font-weight: 400;">Church Command Center</p>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px;">
            <div style="color: #4a5568; font-size: 16px; line-height: 1.7;">
                ${body}
            </div>
        </div>

        <!-- Footer -->
        <div style="background: #2d3748; padding: 30px; text-align: center;">
            <div style="margin-bottom: 16px;">
                <h3 style="color: white; margin: 0 0 6px; font-size: 16px; font-weight: 600;">Deacon</h3>
                <p style="color: #a0aec0; margin: 0; font-size: 12px;">Church Command Center</p>
            </div>
            <div style="border-top: 1px solid #4a5568; padding-top: 16px;">
                <p style="color: #a0aec0; margin: 0 0 6px; font-size: 11px;">
                    This email was sent from your church's communication system.
                </p>
                <p style="color: #a0aec0; margin: 0; font-size: 11px;">
                    Questions? Contact your church administrator for assistance.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
      `;
    }

    // Send email using Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: Deno.env.get('ADMIN_EMAIL') || 'noreply@getdeacon.com',
        to: to,
        subject: subject,
        html: emailContent,
      }),
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json()
      throw new Error(`Failed to send email: ${errorData.message}`)
    }

    const emailData = await emailResponse.json()

    // Store email message in database
    const { error: messageError } = await supabaseClient
      .from('email_messages')
      .insert([{
        conversation_id: conversationId,
        subject: subject,
        body: body,
        direction: 'outbound',
        status: 'sent',
        sent_at: new Date().toISOString(),
        from_email: Deno.env.get('ADMIN_EMAIL') || 'noreply@getdeacon.com',
        to_email: to,
        member_id: member_id,
        resend_id: emailData.id
      }])

    if (messageError) {
      console.error('Error storing email message:', messageError)
    }

    // Update conversation if it exists
    if (conversationId) {
      await supabaseClient
        .from('email_conversations')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        email_id: emailData.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error sending email:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 
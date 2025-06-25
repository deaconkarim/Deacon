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
    const { invitationId } = await req.json()

    if (!invitationId) {
      throw new Error('Missing invitationId parameter')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    // Get invitation details
    const { data: invitation, error: invitationError } = await supabaseClient
      .from('organization_invitations')
      .select(`
        *,
        organizations!inner (
          name,
          website
        )
      `)
      .eq('id', invitationId)
      .single()

    if (invitationError) throw invitationError

    // Get Resend API key
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set')
    }

    // Create invitation URL
    const appUrl = Deno.env.get('APP_URL') || 'https://your-app-domain.com'
    const invitationUrl = `${appUrl}/invite/${invitationId}`
    
    // Create beautiful email content
    const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You're Invited to Join ${invitation.organizations.name}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; line-height: 1.6;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 60px 40px; text-align: center;">
            <div style="width: 80px; height: 80px; background: rgba(255, 255, 255, 0.15); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
                <span style="font-size: 36px; color: white;">⛪</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">You're Invited!</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 12px 0 0; font-size: 18px; font-weight: 400;">Join ${invitation.organizations.name}</p>
        </div>

        <!-- Main Content -->
        <div style="padding: 60px 40px;">
            <h2 style="color: #1a202c; margin: 0 0 24px; font-size: 28px; font-weight: 600; letter-spacing: -0.3px;">
                Welcome to ${invitation.organizations.name}
            </h2>
            
            <p style="color: #4a5568; margin: 0 0 32px; font-size: 16px; line-height: 1.7;">
                Hello ${invitation.first_name},<br><br>
                You've been invited to join <strong style="color: #2d3748;">${invitation.organizations.name}</strong>! We're excited to welcome you to our church community and help you stay connected with everything happening at our church.
            </p>

            <!-- CTA Section -->
            <div style="text-align: center; margin: 48px 0; padding: 40px; background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border-radius: 16px;">
                <h3 style="color: #2d3748; margin: 0 0 16px; font-size: 20px; font-weight: 600;">Ready to get started?</h3>
                <p style="color: #718096; margin: 0 0 32px; font-size: 16px;">Click the button below to accept your invitation and create your account.</p>
                
                <a href="${invitationUrl}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 18px 36px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3); transition: all 0.3s ease;">
                    Accept Invitation & Join ${invitation.organizations.name}
                </a>
            </div>

            <!-- Manual Link -->
            <div style="background: #f7fafc; padding: 24px; border-radius: 12px; margin: 32px 0; border: 1px solid #e2e8f0;">
                <p style="color: #4a5568; margin: 0 0 12px; font-size: 14px; font-weight: 500;">
                    If the button doesn't work, copy and paste this link into your browser:
                </p>
                <a href="${invitationUrl}" style="color: #667eea; word-break: break-all; font-size: 14px; text-decoration: underline;">
                    ${invitationUrl}
                </a>
            </div>

            <!-- Important Notice -->
            <div style="background: #fff5f5; padding: 24px; border-radius: 12px; margin: 32px 0; border-left: 4px solid #f56565;">
                <div style="display: flex; align-items: center; margin-bottom: 12px;">
                    <span style="font-size: 20px; margin-right: 12px;">⏰</span>
                    <h4 style="color: #c53030; margin: 0; font-size: 16px; font-weight: 600;">Important</h4>
                </div>
                <p style="color: #c53030; margin: 0; line-height: 1.6; font-size: 14px;">
                    This invitation link will expire in 7 days for security reasons. If you need a new invitation, please contact your church administrator.
                </p>
            </div>
        </div>

        <!-- Footer -->
        <div style="background: #2d3748; padding: 40px; text-align: center;">
            <div style="margin-bottom: 24px;">
                <h3 style="color: white; margin: 0 0 8px; font-size: 18px; font-weight: 600;">Deacon</h3>
                <p style="color: #a0aec0; margin: 0; font-size: 14px;">Church Command Center</p>
            </div>
            <div style="border-top: 1px solid #4a5568; padding-top: 24px;">
                <p style="color: #a0aec0; margin: 0 0 8px; font-size: 12px;">
                    If you received this invitation by mistake, you can safely ignore this email.
                </p>
                <p style="color: #a0aec0; margin: 0; font-size: 12px;">
                    Questions? Contact your church administrator for assistance.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
    `

    // Send email using Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: Deno.env.get('ADMIN_EMAIL') || 'noreply@getdeacon.com',
        to: invitation.email,
        subject: `You're Invited to Join ${invitation.organizations.name}`,
        html: emailContent,
      }),
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json()
      throw new Error(`Failed to send email: ${errorData.message}`)
    }

    // Update invitation status to sent
    const { error: updateError } = await supabaseClient
      .from('organization_invitations')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', invitationId)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitation email sent successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error sending invitation:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 
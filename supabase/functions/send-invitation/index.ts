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
    
    // Create beautiful email content using the same design as invite.html
    const emailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You're Invited to Join ${invitation.organizations.name}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
          }
          .container {
            background-color: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
          }
          .title {
            font-size: 28px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 20px;
          }
          .subtitle {
            font-size: 18px;
            color: #6b7280;
            margin-bottom: 30px;
          }
          .content {
            margin-bottom: 30px;
          }
          .button {
            display: inline-block;
            background-color: #10b981;
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            font-size: 16px;
            margin: 20px 0;
            transition: background-color 0.2s;
          }
          .button:hover {
            background-color: #059669;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
          .highlight {
            background-color: #eff6ff;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #2563eb;
            margin: 25px 0;
          }
          .features {
            background-color: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
          }
          .feature-item {
            display: flex;
            align-items: center;
            margin: 12px 0;
          }
          .feature-icon {
            width: 20px;
            height: 20px;
            background-color: #10b981;
            border-radius: 50%;
            margin-right: 12px;
            display: inline-block;
          }
          .welcome-message {
            background-color: #ecfdf5;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #d1fae5;
            margin: 25px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">${invitation.organizations.name}</div>
            <h1 class="title">You're Invited!</h1>
            <p class="subtitle">Join our church community and stay connected</p>
          </div>
          
          <div class="content">
            <p>Hello ${invitation.first_name},</p>
            
            <p>You've been invited to join <strong>${invitation.organizations.name}</strong>! We're excited to welcome you to our church community and help you stay connected with everything happening at our church.</p>
            
            <div class="welcome-message">
              <strong>🎉 Welcome to ${invitation.organizations.name}!</strong>
              <p>We're thrilled to have you join our church family. This invitation gives you access to our church management system where you can:</p>
            </div>
            
            <div class="features">
              <div class="feature-item">
                <span class="feature-icon"></span>
                <span>View and RSVP to upcoming events</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon"></span>
                <span>Stay updated with church announcements</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon"></span>
                <span>Connect with other church members</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon"></span>
                <span>Access your family information</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon"></span>
                <span>Receive important church communications</span>
              </div>
            </div>
            
            <div class="highlight">
              <strong>Ready to get started?</strong>
              <p>Click the button below to accept your invitation and create your account. This will only take a few minutes!</p>
            </div>
            
            <div style="text-align: center;">
              <a href="${invitationUrl}" class="button">Accept Invitation & Join ${invitation.organizations.name}</a>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #6b7280; background-color: #f3f4f6; padding: 10px; border-radius: 4px;">${invitationUrl}</p>
            
            <p><strong>Important:</strong> This invitation link will expire in 7 days for security reasons. If you need a new invitation, please contact your church administrator.</p>
          </div>
          
          <div class="footer">
            <p>If you received this invitation by mistake, you can safely ignore this email.</p>
            <p>Questions? Contact your church administrator for assistance.</p>
            <p>&copy; ${invitation.organizations.name}. All rights reserved.</p>
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
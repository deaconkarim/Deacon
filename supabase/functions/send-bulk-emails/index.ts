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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { recipients, subject, body, conversation_type = 'general', selectedGroups = [] } = await req.json()

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      throw new Error('Recipients array is required')
    }

    if (!subject || !body) {
      throw new Error('Subject and body are required')
    }

    // Create email conversation
    const { data: conversation, error: conversationError } = await supabaseClient
      .from('email_conversations')
      .insert({
        title: subject,
        conversation_type,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (conversationError) {
      throw new Error(`Failed to create conversation: ${conversationError.message}`)
    }

    // Create email campaign to track recipients
    const { data: campaign, error: campaignError } = await supabaseClient
      .from('email_campaigns')
      .insert({
        conversation_id: conversation.id,
        subject,
        body,
        conversation_type
      })
      .select()
      .single()

    if (campaignError) {
      throw new Error(`Failed to create campaign: ${campaignError.message}`)
    }

    // Create campaign recipients records
    const campaignRecipients = []

    // Add individual member recipients
    for (const recipient of recipients) {
      campaignRecipients.push({
        campaign_id: campaign.id,
        member_id: recipient.member_id,
        email_sent: false
      })
    }

    // Add group recipients
    for (const groupId of selectedGroups) {
      campaignRecipients.push({
        campaign_id: campaign.id,
        group_id: groupId,
        email_sent: false
      })
    }

    if (campaignRecipients.length > 0) {
      const { error: recipientsError } = await supabaseClient
        .from('email_campaign_recipients')
        .insert(campaignRecipients)

      if (recipientsError) {
        throw new Error(`Failed to create campaign recipients: ${recipientsError.message}`)
      }
    }

    // Create a single email message record for the bulk campaign
    const { data: message, error: messageError } = await supabaseClient
      .from('email_messages')
      .insert({
        conversation_id: conversation.id,
        subject,
        body,
        direction: 'outbound',
        status: 'sent',
        sent_at: new Date().toISOString(),
        from_email: Deno.env.get('ADMIN_EMAIL') || 'noreply@getdeacon.com',
        to_email: `Bulk email to ${recipients.length} recipient(s)`,
        member_id: null
      })
      .select()
      .single()

    if (messageError) {
      throw new Error(`Failed to create message record: ${messageError.message}`)
    }

    // Send emails to individual recipients
    const emailPromises = recipients.map(async (recipient) => {
      try {
        // Use the body directly since it's already processed by the frontend
        const emailContent = body;

        // Send email via Resend
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: Deno.env.get('ADMIN_EMAIL') || 'noreply@getdeacon.com',
            to: recipient.email,
            subject: subject,
            html: emailContent,
          }),
        });

        if (!resendResponse.ok) {
          const errorData = await resendResponse.json();
          throw new Error(`Resend API error: ${errorData.message || resendResponse.statusText}`);
        }

        // Update campaign recipient status
        await supabaseClient
          .from('email_campaign_recipients')
          .update({
            email_sent: true,
            sent_at: new Date().toISOString()
          })
          .eq('campaign_id', campaign.id)
          .eq('member_id', recipient.member_id)

        return {
          success: true,
          recipient: recipient.email
        }
      } catch (error) {
        // Update campaign recipient with error
        await supabaseClient
          .from('email_campaign_recipients')
          .update({
            email_sent: false,
            error_message: error.message
          })
          .eq('campaign_id', campaign.id)
          .eq('member_id', recipient.member_id)

        return {
          success: false,
          recipient: recipient.email,
          error: error.message
        }
      }
    })

    // Send emails to group members
    for (const groupId of selectedGroups) {
      try {
        // Get group members
        const { data: groupMembers, error: groupError } = await supabaseClient
          .from('group_members')
          .select(`
            members (
              id,
              email,
              firstname,
              lastname
            )
          `)
          .eq('group_id', groupId)

        if (groupError) {
          throw new Error(`Failed to get group members: ${groupError.message}`)
        }

        // Send emails to group members
        for (const groupMember of groupMembers || []) {
          const member = groupMember.members
          if (member && member.email) {
            try {
              // Use the body directly since it's already processed by the frontend
              const emailContent = body;

              // Send email via Resend
              const resendResponse = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  from: Deno.env.get('ADMIN_EMAIL') || 'noreply@getdeacon.com',
                  to: member.email,
                  subject: subject,
                  html: emailContent,
                }),
              });

              if (!resendResponse.ok) {
                const errorData = await resendResponse.json();
                throw new Error(`Resend API error: ${errorData.message || resendResponse.statusText}`);
              }

              // Create email message record for group member
              const { data: message, error: messageError } = await supabaseClient
                .from('email_messages')
                .insert({
                  conversation_id: conversation.id,
                  subject,
                  body,
                  direction: 'outbound',
                  status: 'sent',
                  sent_at: new Date().toISOString(),
                  from_email: Deno.env.get('ADMIN_EMAIL') || 'noreply@getdeacon.com',
                  to_email: member.email,
                  member_id: member.id,
                  group_id: groupId
                })
                .select()
                .single()

              if (messageError) {
                throw new Error(`Failed to create message record: ${messageError.message}`)
              }

              // Update campaign recipient status for group member
              await supabaseClient
                .from('email_campaign_recipients')
                .update({
                  email_sent: true,
                  sent_at: new Date().toISOString()
                })
                .eq('campaign_id', campaign.id)
                .eq('member_id', member.id)

              emailPromises.push(Promise.resolve({
                success: true,
                recipient: member.email,
                message_id: message.id,
                group: groupId
              }))
            } catch (error) {
              // Update campaign recipient with error
              await supabaseClient
                .from('email_campaign_recipients')
                .update({
                  email_sent: false,
                  error_message: error.message
                })
                .eq('campaign_id', campaign.id)
                .eq('member_id', member.id)

              emailPromises.push(Promise.resolve({
                success: false,
                recipient: member.email,
                error: error.message,
                group: groupId
              }))
            }
          }
        }
      } catch (error) {
        console.error(`Error processing group ${groupId}:`, error)
      }
    }

    const results = await Promise.all(emailPromises)

    // Update conversation with last message
    await supabaseClient
      .from('email_conversations')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('id', conversation.id)

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return new Response(
      JSON.stringify({
        success: true,
        conversation_id: conversation.id,
        campaign_id: campaign.id,
        results: {
          total: results.length,
          successful: successCount,
          failed: failureCount,
          details: results
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 
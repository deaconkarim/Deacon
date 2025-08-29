import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
}

serve(async (req) => {

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {

    return new Response('ok', {
      headers: corsHeaders,
      status: 200
    })
  }

  try {
    const { campaignId } = await req.json()

    // Check environment variables
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const phoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')

    if (!accountSid || !authToken || !phoneNumber) {
      throw new Error('Missing Twilio environment variables. Please configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabaseClient
      .from('sms_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (campaignError) {
      console.error('Campaign lookup error:', campaignError)
      throw new Error(`Campaign not found: ${campaignError.message}`)
    }

    // Get recipients based on campaign targeting
    let recipients = []
    
    if (campaign.targetType === 'all') {
      // Get all opted-in members for the organization
      const { data: members, error: membersError } = await supabaseClient
        .from('members')
        .select('id, firstname, lastname, phone')
        .eq('organization_id', campaign.organization_id)
        .eq('status', 'active')
        .eq('sms_opt_in', true)
        .not('phone', 'is', null)

      if (membersError) {
        console.error('Members lookup error:', membersError)
        throw new Error(`Failed to get recipients: ${membersError.message}`)
      }

      recipients = members || []
    } else if (campaign.targetType === 'groups' && campaign.selectedGroups) {
      // Get members from selected groups
      for (const groupId of campaign.selectedGroups) {
        const { data: groupMembers, error: groupError } = await supabaseClient
          .from('group_members')
          .select(`
            member:members(id, firstname, lastname, phone, sms_opt_in)
          `)
          .eq('group_id', groupId)
          .eq('organization_id', campaign.organization_id)

        if (groupError) {
          console.error('Group members lookup error:', groupError)
          continue
        }

        if (groupMembers) {
          const validMembers = groupMembers
            .map(gm => gm.member)
            .filter(m => m && m.sms_opt_in && m.phone)
          recipients.push(...validMembers)
        }
      }
    } else if (campaign.targetType === 'members' && campaign.selectedMembers) {
      // Get selected individual members
      const { data: members, error: membersError } = await supabaseClient
        .from('members')
        .select('id, firstname, lastname, phone')
        .eq('organization_id', campaign.organization_id)
        .eq('status', 'active')
        .eq('sms_opt_in', true)
        .in('id', campaign.selectedMembers)
        .not('phone', 'is', null)

      if (membersError) {
        console.error('Members lookup error:', membersError)
        throw new Error(`Failed to get recipients: ${membersError.message}`)
      }

      recipients = members || []
    } else if (campaign.recipients && Array.isArray(campaign.recipients)) {
      // Fallback to direct recipients list
      recipients = campaign.recipients
    }

    // Send SMS via Twilio REST API
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
    let sentCount = 0
    let deliveredCount = 0
    let failedCount = 0

    for (const recipient of recipients) {
      try {
        const formData = new URLSearchParams()
        formData.append('To', recipient.phone)
        formData.append('From', phoneNumber)
        formData.append('Body', campaign.message)

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData
        })

        if (response.ok) {
          const twilioResponse = await response.json()

          sentCount++
          
          // Log the message in database
          await supabaseClient
            .from('sms_messages')
            .insert({
              conversation_id: null, // Campaign messages don't have conversations
              member_id: recipient.id,
              direction: 'outbound',
              from_number: phoneNumber,
              to_number: recipient.phone,
              body: campaign.message,
              status: 'sent',
              twilio_sid: twilioResponse.sid,
              organization_id: campaign.organization_id
            })
        } else {
          const errorText = await response.text()
          console.error('Twilio API error:', response.status, errorText)
          failedCount++
        }
      } catch (error) {
        console.error('Error sending to recipient:', recipient.phone, error)
        failedCount++
      }
    }

    // Update campaign stats
    await supabaseClient
      .from('sms_campaigns')
      .update({
        status: 'completed',
        sent_count: sentCount,
        delivered_count: deliveredCount,
        failed_count: failedCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)

    return new Response(JSON.stringify({
      success: true,
      message: 'Campaign sent successfully!',
      campaign: campaign.name,
      stats: {
        sent: sentCount,
        delivered: deliveredCount,
        failed: failedCount,
        total: recipients.length
      }
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    })

  } catch (error) {
    console.error('Campaign function error:', error)
    
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
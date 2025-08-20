import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
}

serve(async (req) => {
  console.log('Event Reminders Function called with method:', req.method)
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request')
    return new Response('ok', {
      headers: corsHeaders,
      status: 200
    })
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    // Get all active reminder configs that need to be sent
    const { data: reminderConfigs, error: configError } = await supabaseClient
      .from('event_reminder_configs')
      .select(`
        *,
        event:events (
          id,
          title,
          start_date,
          end_date,
          location,
          description,
          organization_id
        )
      `)
      .eq('is_active', true)
      .not('event', 'is', null);

    if (configError) {
      console.error('Error fetching reminder configs:', configError);
      throw configError;
    }

    console.log(`Found ${reminderConfigs?.length || 0} active reminder configurations`);

    const results = [];
    const now = new Date();

    for (const config of reminderConfigs || []) {
      const event = config.event;
      if (!event) continue;

      const eventStartDate = new Date(event.start_date);
      const reminderTime = new Date(eventStartDate.getTime() - (config.timing_hours * 60 * 60 * 1000));
      
      // Check if it's time to send this reminder (within the last hour)
      const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
      const oneHourFromNow = new Date(now.getTime() + (60 * 60 * 1000));
      
      if (reminderTime >= oneHourAgo && reminderTime <= oneHourFromNow) {
        console.log(`Processing reminder for event: ${event.title} (${config.timing_hours}h before)`);
        
        try {
          // Get recipients based on target type
          let recipients = [];
          
          switch (config.target_type) {
            case 'all':
              const { data: allMembers } = await supabaseClient
                .from('members')
                .select('id, firstname, lastname, phone')
                .eq('organization_id', event.organization_id)
                .eq('status', 'active')
                .not('phone', 'is', null);
              recipients = allMembers || [];
              break;
              
            case 'groups':
              if (config.target_groups && config.target_groups.length > 0) {
                const { data: groupMembers } = await supabaseClient
                  .from('group_members')
                  .select(`
                    member:members (
                      id,
                      firstname,
                      lastname,
                      phone
                    )
                  `)
                  .in('group_id', config.target_groups)
                  .eq('member.status', 'active')
                  .not('member.phone', 'is', null);
                recipients = groupMembers?.map(gm => gm.member).filter(Boolean) || [];
              }
              break;
              
            case 'members':
              if (config.target_members && config.target_members.length > 0) {
                const { data: selectedMembers } = await supabaseClient
                  .from('members')
                  .select('id, firstname, lastname, phone')
                  .in('id', config.target_members)
                  .eq('status', 'active')
                  .not('phone', 'is', null);
                recipients = selectedMembers || [];
              }
              break;
              
            case 'rsvp_attendees':
              const { data: attendees } = await supabaseClient
                .from('event_attendance')
                .select(`
                  member:members (
                    id,
                    firstname,
                    lastname,
                    phone
                  )
                `)
                .eq('event_id', event.id)
                .eq('status', 'attending')
                .eq('member.status', 'active')
                .not('member.phone', 'is', null);
              recipients = attendees?.map(a => a.member).filter(Boolean) || [];
              break;
              
            case 'rsvp_declined':
              const { data: declined } = await supabaseClient
                .from('event_attendance')
                .select(`
                  member:members (
                    id,
                    firstname,
                    lastname,
                    phone
                  )
                `)
                .eq('event_id', event.id)
                .eq('status', 'declined')
                .eq('member.status', 'active')
                .not('member.phone', 'is', null);
              recipients = declined?.map(a => a.member).filter(Boolean) || [];
              break;
          }

          console.log(`Found ${recipients.length} recipients for event ${event.title}`);

          // Send reminders to each recipient
          const sentCount = 0;
          const failedCount = 0;

          for (const recipient of recipients) {
            try {
              // Render message template
              let messageText = config.message_template;
              const hoursUntilEvent = Math.ceil((eventStartDate.getTime() - now.getTime()) / (1000 * 60 * 60));
              
              messageText = messageText
                .replace(/{event_title}/g, event.title || 'Event')
                .replace(/{event_time}/g, eventStartDate.toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true 
                }))
                .replace(/{event_date}/g, eventStartDate.toLocaleDateString())
                .replace(/{event_location}/g, event.location || 'TBD')
                .replace(/{hours_until_event}/g, hoursUntilEvent.toString())
                .replace(/{member_name}/g, `${recipient.firstname} ${recipient.lastname}`);

              // Create SMS message record
              const { data: message, error: messageError } = await supabaseClient
                .from('sms_messages')
                .insert({
                  conversation_id: null, // Will be created by SMS service
                  member_id: recipient.id,
                  to_number: recipient.phone,
                  body: messageText,
                  direction: 'outbound',
                  status: 'queued',
                  organization_id: event.organization_id
                })
                .select()
                .single();

              if (messageError) {
                console.error('Error creating message record:', messageError);
                failedCount++;
                continue;
              }

              // Send SMS via the existing SMS function
              const smsResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-sms`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  to: recipient.phone,
                  body: messageText,
                  messageId: message.id
                })
              });

              if (smsResponse.ok) {
                sentCount++;
                
                // Log the reminder
                await supabaseClient
                  .from('event_reminder_logs')
                  .insert({
                    reminder_config_id: config.id,
                    event_id: event.id,
                    organization_id: event.organization_id,
                    member_id: recipient.id,
                    phone_number: recipient.phone,
                    message_sent: messageText,
                    status: 'sent'
                  });
              } else {
                failedCount++;
                console.error('Failed to send SMS:', await smsResponse.text());
              }

            } catch (recipientError) {
              console.error('Error processing recipient:', recipientError);
              failedCount++;
            }
          }

          // Update last_sent timestamp
          await supabaseClient
            .from('event_reminder_configs')
            .update({ last_sent: now.toISOString() })
            .eq('id', config.id);

          results.push({
            eventId: event.id,
            eventTitle: event.title,
            configId: config.id,
            configName: config.name,
            recipients: recipients.length,
            sent: sentCount,
            failed: failedCount
          });

        } catch (configError) {
          console.error(`Error processing config ${config.id}:`, configError);
          results.push({
            eventId: event.id,
            eventTitle: event.title,
            configId: config.id,
            configName: config.name,
            error: configError.message
          });
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Event reminders processed successfully',
      results,
      processedAt: now.toISOString()
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });

  } catch (error) {
    console.error('Function error:', error);
    
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
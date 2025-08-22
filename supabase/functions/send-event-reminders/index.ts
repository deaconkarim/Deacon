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

    // Get Twilio phone number for SMS messages
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');
    if (!twilioPhoneNumber) {
      throw new Error('TWILIO_PHONE_NUMBER environment variable is not set');
    }

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
      
      // Calculate reminder time based on new timing system
      let reminderTime: Date;
      if (config.timing_unit && config.timing_value) {
        // Use new timing system
        const multiplier = config.timing_unit === 'minutes' ? 60 * 1000 :
                          config.timing_unit === 'hours' ? 60 * 60 * 1000 :
                          config.timing_unit === 'days' ? 24 * 60 * 60 * 1000 :
                          config.timing_unit === 'weeks' ? 7 * 24 * 60 * 60 * 1000 :
                          60 * 60 * 1000; // Default to hours
        reminderTime = new Date(eventStartDate.getTime() - (config.timing_value * multiplier));
      } else {
        // Fallback to old timing system
        reminderTime = new Date(eventStartDate.getTime() - (config.timing_hours * 60 * 60 * 1000));
      }
      
      // Calculate timing window - use a fixed 2-hour window to prevent excessive resending
      // This ensures reminders are sent within a reasonable time frame of their intended time
      const timingWindowMs = 2 * 60 * 60 * 1000; // 2 hours
      
      const windowStart = new Date(now.getTime() - timingWindowMs);
      const windowEnd = new Date(now.getTime() + (5 * 60 * 1000)); // 5 minutes grace period
      
      // Check if reminder should be sent now OR if it was missed
      const shouldSendNow = reminderTime >= windowStart && reminderTime <= windowEnd;
      const wasMissed = reminderTime < windowStart && eventStartDate > now; // Event hasn't happened yet but reminder time passed
      
      if (shouldSendNow || wasMissed) {
        // Create a human-readable timing description
        let timingDescription = '';
        if (config.timing_unit && config.timing_value) {
          timingDescription = `${config.timing_value} ${config.timing_unit} before`;
        } else {
          timingDescription = `${config.timing_hours}h before`;
        }
        console.log(`Processing reminder for event: ${event.title} (${timingDescription}) - ${wasMissed ? 'MISSED' : 'ON TIME'}`);
        
        // Check if reminder was already sent recently (within last 2 hours) to avoid duplicates
        const twoHoursAgo = new Date(now.getTime() - (2 * 60 * 60 * 1000));
        const { data: recentLogs } = await supabaseClient
          .from('event_reminder_logs')
          .select('id')
          .eq('reminder_config_id', config.id)
          .gte('sent_at', twoHoursAgo.toISOString())
          .limit(1);
        
        if (recentLogs && recentLogs.length > 0) {
          console.log(`Skipping ${event.title} - reminder already sent recently`);
          continue;
        }
        
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
                      phone,
                      status,
                      organization_id
                    )
                  `)
                  .in('group_id', config.target_groups);
                
                // Extract member data and filter for active members with phones in the correct organization
                recipients = groupMembers
                  ?.map(gm => gm.member)
                  .filter(member => 
                    member && 
                    member.status === 'active' && 
                    member.phone &&
                    member.organization_id === event.organization_id
                  ) || [];
              }
              break;
              
            case 'members':
              if (config.target_members && config.target_members.length > 0) {
                const { data: selectedMembers } = await supabaseClient
                  .from('members')
                  .select('id, firstname, lastname, phone')
                  .in('id', config.target_members)
                  .eq('organization_id', event.organization_id)
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
                .eq('organization_id', event.organization_id)
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
                .eq('organization_id', event.organization_id)
                .eq('member.status', 'active')
                .not('member.phone', 'is', null);
              recipients = declined?.map(a => a.member).filter(Boolean) || [];
              break;
          }

          console.log(`Found ${recipients.length} recipients for event ${event.title}`);

          // Send reminders to each recipient
          let sentCount = 0;
          let failedCount = 0;

          for (const recipient of recipients) {
            try {
              // Render message template
              let messageText = config.message_template;
              const hoursUntilEvent = Math.ceil((eventStartDate.getTime() - now.getTime()) / (1000 * 60 * 60));
              
              // Format date and time to match the form preview
              // Parse the event start_date and ensure UTC interpretation
              const eventDate = new Date(event.start_date);
              
              // Format date as MM/DD/YYYY (using UTC)
              const formattedDate = eventDate.toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric',
                timeZone: 'UTC'
              });
              
              // Format time as HH:MM in 12-hour format with AM/PM (using UTC)
              const formattedTime = eventDate.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
                timeZone: 'UTC'
              });
              
              messageText = messageText
                .replace(/{event_title}/g, event.title || 'Event')
                .replace(/{event_time}/g, formattedTime)
                .replace(/{event_date}/g, formattedDate)
                .replace(/{event_location}/g, event.location || 'TBD')
                .replace(/{hours_until_event}/g, hoursUntilEvent.toString())
                .replace(/{member_name}/g, `${recipient.firstname} ${recipient.lastname}`);

              // Add "LATE REMINDER" prefix for missed reminders
              if (wasMissed) {
                messageText = `[LATE REMINDER] ${messageText}`;
              }

              // Create SMS message record first
              const { data: smsMessage, error: smsError } = await supabaseClient
                .from('sms_messages')
                .insert({
                  conversation_id: null, // Will be created by SMS service
                  member_id: recipient.id,
                  from_number: twilioPhoneNumber,
                  to_number: recipient.phone,
                  body: messageText,
                  direction: 'outbound',
                  status: 'queued',
                  organization_id: event.organization_id,
                  message_type: 'event_reminder',
                  metadata: {
                    event_id: event.id,
                    reminder_config_id: config.id,
                    was_missed: wasMissed
                  }
                })
                .select()
                .single();

              if (smsError) {
                console.error('Error creating SMS message record:', smsError);
                failedCount++;
                continue;
              }

              // Send SMS using Twilio
              const twilioResponse = await sendSMS(recipient.phone, messageText);
              
              if (twilioResponse.success) {
                // Update SMS message status to sent
                await supabaseClient
                  .from('sms_messages')
                  .update({
                    status: 'sent',
                    twilio_sid: twilioResponse.sid,
                    sent_at: new Date().toISOString()
                  })
                  .eq('id', smsMessage.id);

                // Log successful reminder
                await supabaseClient
                  .from('event_reminder_logs')
                  .insert({
                    reminder_config_id: config.id,
                    event_id: event.id,
                    organization_id: event.organization_id,
                    member_id: recipient.id,
                    phone_number: recipient.phone,
                    message_sent: messageText,
                    status: 'sent',
                    twilio_sid: twilioResponse.sid,
                    sent_at: new Date().toISOString()
                  });
                
                sentCount++;
                console.log(`Sent ${wasMissed ? 'LATE ' : ''}reminder to ${recipient.firstname} ${recipient.lastname} at ${recipient.phone}`);
              } else {
                // Update SMS message status to failed
                await supabaseClient
                  .from('sms_messages')
                  .update({
                    status: 'failed',
                    error_message: twilioResponse.error
                  })
                  .eq('id', smsMessage.id);

                // Log failed reminder
                await supabaseClient
                  .from('event_reminder_logs')
                  .insert({
                    reminder_config_id: config.id,
                    event_id: event.id,
                    organization_id: event.organization_id,
                    member_id: recipient.id,
                    phone_number: recipient.phone,
                    message_sent: messageText,
                    status: 'failed',
                    error_message: twilioResponse.error,
                    sent_at: new Date().toISOString()
                  });
                
                failedCount++;
                console.error(`Failed to send reminder to ${recipient.firstname} ${recipient.lastname}: ${twilioResponse.error}`);
              }
            } catch (recipientError) {
              console.error(`Error processing recipient ${recipient.firstname} ${recipient.lastname}:`, recipientError);
              failedCount++;
            }
          }

          // Update last_sent timestamp
          await supabaseClient
            .from('event_reminder_configs')
            .update({ last_sent: new Date().toISOString() })
            .eq('id', config.id);

          results.push({
            event: event.title,
            config: config.name,
            recipients: recipients.length,
            sent: sentCount,
            failed: failedCount,
            wasMissed: wasMissed
          });

          console.log(`Completed reminder for ${event.title}: ${sentCount} sent, ${failedCount} failed (${wasMissed ? 'MISSED' : 'ON TIME'})`);

        } catch (configError) {
          console.error(`Error processing reminder config ${config.id}:`, configError);
          results.push({
            event: event.title,
            config: config.name,
            error: configError.message
          });
        }
      } else {
        // Create a human-readable timing description for the skip message
        let timingDescription = '';
        if (config.timing_unit && config.timing_value) {
          timingDescription = `${config.timing_value} ${config.timing_unit} before`;
        } else {
          timingDescription = `${config.timing_hours}h before`;
        }
        console.log(`Skipping reminder for ${event.title} - not time yet (${timingDescription})`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.length} reminder configurations`,
        results: results,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in event reminders function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

// Function to send SMS using Twilio
async function sendSMS(to: string, message: string) {
  try {
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error('Missing Twilio environment variables');
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    const formData = new FormData();
    formData.append('To', to);
    formData.append('From', fromNumber);
    formData.append('Body', message);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`
      },
      body: formData
    });

    const result = await response.json();

    if (response.ok && result.sid) {
      return {
        success: true,
        sid: result.sid
      };
    } else {
      return {
        success: false,
        error: result.message || 'Unknown Twilio error'
      };
    }
  } catch (error) {
    console.error('Error sending SMS:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
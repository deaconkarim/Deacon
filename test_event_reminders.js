const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testEventReminders() {

  try {
    // 1. Test creating a reminder configuration

    // First, get an organization
    const { data: organizations } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);
    
    if (!organizations || organizations.length === 0) {

      return;
    }
    
    const organizationId = organizations[0].id;

    // Get an event
    const { data: events } = await supabase
      .from('events')
      .select('id, title, start_date')
      .eq('organization_id', organizationId)
      .gte('start_date', new Date().toISOString())
      .limit(1);

    if (!events || events.length === 0) {

      return;
    }

    const event = events[0];

    // Create a reminder configuration
    const { data: reminderConfig, error: createError } = await supabase
      .from('event_reminder_configs')
      .insert({
        event_id: event.id,
        organization_id: organizationId,
        name: 'Test Reminder - 24 Hours',
        description: 'Test reminder configuration',
        reminder_type: 'sms',
        timing_hours: 24,
        message_template: 'Reminder: {event_title} is tomorrow at {event_time}. We hope to see you there! {event_location}',
        target_type: 'all',
        is_active: true
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating reminder config:', createError);
      return;
    }

    // 2. Test getting reminder configurations

    const { data: configs, error: getError } = await supabase
      .from('event_reminder_configs')
      .select(`
        *,
        event:events (
          id,
          title,
          start_date
        )
      `)
      .eq('event_id', event.id);

    if (getError) {
      console.error('❌ Error getting reminder configs:', getError);
      return;
    }

    // 3. Test getting recipients

    const { data: recipients, error: recipientsError } = await supabase.rpc('get_event_reminder_recipients', {
      p_event_id: event.id,
      p_target_type: 'all',
      p_target_groups: '[]',
      p_target_members: '[]'
    });

    if (recipientsError) {
      console.error('❌ Error getting recipients:', recipientsError);
      return;
    }

    // 4. Test message preview

    const template = 'Reminder: {event_title} is tomorrow at {event_time}. We hope to see you there! {event_location}';
    const eventDate = new Date(event.start_date);
    const hoursUntilEvent = Math.ceil((eventDate.getTime() - new Date().getTime()) / (1000 * 60 * 60));
    
    const previewMessage = template
      .replace(/{event_title}/g, event.title || 'Event')
      .replace(/{event_time}/g, eventDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }))
      .replace(/{event_date}/g, eventDate.toLocaleDateString())
      .replace(/{event_location}/g, 'Main Sanctuary')
      .replace(/{hours_until_event}/g, hoursUntilEvent.toString())
      .replace(/{member_name}/g, 'John Doe');

    // 5. Test reminder logs

    const { data: logs, error: logsError } = await supabase
      .from('event_reminder_logs')
      .select(`
        *,
        member:members (
          firstname,
          lastname
        )
      `)
      .eq('event_id', event.id)
      .limit(5);

    if (logsError) {
      console.error('❌ Error getting reminder logs:', logsError);
      return;
    }

    // 6. Test reminder statistics

    const { count: totalSent } = await supabase
      .from('event_reminder_logs')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', event.id);

    const { count: delivered } = await supabase
      .from('event_reminder_logs')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .eq('status', 'delivered');

    // 7. Test the edge function (if available)

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/send-event-reminders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const result = await response.json();

      } else {

      }
    } catch (edgeError) {

    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testEventReminders();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testEventReminders() {
  console.log('🧪 Testing Event Reminders System...\n');

  try {
    // 1. Test creating a reminder configuration
    console.log('1. Creating test reminder configuration...');
    
    // First, get an organization
    const { data: organizations } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);
    
    if (!organizations || organizations.length === 0) {
      console.log('❌ No organizations found. Please create an organization first.');
      return;
    }
    
    const organizationId = organizations[0].id;
    console.log(`✅ Using organization: ${organizationId}`);

    // Get an event
    const { data: events } = await supabase
      .from('events')
      .select('id, title, start_date')
      .eq('organization_id', organizationId)
      .gte('start_date', new Date().toISOString())
      .limit(1);

    if (!events || events.length === 0) {
      console.log('❌ No future events found. Please create an event first.');
      return;
    }

    const event = events[0];
    console.log(`✅ Using event: ${event.title} (${event.start_date})`);

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

    console.log(`✅ Created reminder config: ${reminderConfig.name}`);

    // 2. Test getting reminder configurations
    console.log('\n2. Testing reminder configuration retrieval...');
    
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

    console.log(`✅ Found ${configs.length} reminder configurations for event`);

    // 3. Test getting recipients
    console.log('\n3. Testing recipient retrieval...');
    
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

    console.log(`✅ Found ${recipients.length} recipients for event`);

    // 4. Test message preview
    console.log('\n4. Testing message preview...');
    
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

    console.log('✅ Message preview:');
    console.log(previewMessage);

    // 5. Test reminder logs
    console.log('\n5. Testing reminder logs...');
    
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

    console.log(`✅ Found ${logs.length} reminder logs`);

    // 6. Test reminder statistics
    console.log('\n6. Testing reminder statistics...');
    
    const { count: totalSent } = await supabase
      .from('event_reminder_logs')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', event.id);

    const { count: delivered } = await supabase
      .from('event_reminder_logs')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .eq('status', 'delivered');

    console.log(`✅ Reminder stats: ${totalSent || 0} total sent, ${delivered || 0} delivered`);

    // 7. Test the edge function (if available)
    console.log('\n7. Testing edge function...');
    
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
        console.log('✅ Edge function executed successfully');
        console.log('Results:', JSON.stringify(result, null, 2));
      } else {
        console.log('⚠️ Edge function not available or failed');
      }
    } catch (edgeError) {
      console.log('⚠️ Edge function not available:', edgeError.message);
    }

    console.log('\n🎉 Event reminders system test completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`- Created reminder config: ${reminderConfig.name}`);
    console.log(`- Found ${configs.length} configs for event`);
    console.log(`- Found ${recipients.length} potential recipients`);
    console.log(`- Found ${logs.length} reminder logs`);
    console.log(`- Reminder stats: ${totalSent || 0} sent, ${delivered || 0} delivered`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testEventReminders();
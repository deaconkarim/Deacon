const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testTimeFormatting() {
  console.log('🕐 Testing Time Formatting for Event Reminders...\n');

  try {
    // Get a test event
    const { data: events, error } = await supabase
      .from('events')
      .select('id, title, start_date, end_date, location')
      .gte('start_date', new Date().toISOString())
      .limit(5);

    if (error) {
      console.error('❌ Error fetching events:', error);
      return;
    }

    if (!events || events.length === 0) {
      console.log('❌ No future events found');
      return;
    }

    console.log(`📅 Found ${events.length} future events:\n`);

    events.forEach((event, index) => {
      console.log(`${index + 1}. ${event.title}`);
      console.log(`   Start: ${event.start_date}`);
      console.log(`   End: ${event.end_date}`);
      console.log(`   Location: ${event.location || 'TBD'}`);
      
      // Test the time formatting logic
      const eventDate = new Date(event.start_date); // Parse as UTC
      
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

      // Format time as HH:MM in 24-hour format (using UTC)
      const formattedTime24 = eventDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'UTC'
      });

      console.log(`   📅 Formatted Date: ${formattedDate}`);
      console.log(`   🕐 Formatted Time (12h): ${formattedTime}`);
      console.log(`   🕐 Formatted Time (24h): ${formattedTime24}`);
      
      // Test message template rendering
      const template = 'Reminder: {event_title} on {event_date} at {event_time}. {event_location}';
      const messageText = template
        .replace(/{event_title}/g, event.title || 'Event')
        .replace(/{event_time}/g, formattedTime)
        .replace(/{event_date}/g, formattedDate)
        .replace(/{event_location}/g, event.location || 'TBD');
      
      console.log(`   📱 Message Preview: ${messageText}`);
      console.log('');
    });

    // Test with a specific time (3:30 PM)
    console.log('🧪 Testing with specific time (3:30 PM):');
    const testDate = new Date('2025-08-22T15:30:00.000Z');
    console.log(`   Original: ${testDate.toISOString()}`);
    
    const testFormattedDate = testDate.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      timeZone: 'UTC'
    });
    
    const testFormattedTime = testDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC'
    });
    
    console.log(`   Formatted: ${testFormattedDate} at ${testFormattedTime}`);
    
    // Test different timezone handling
    console.log('\n🌍 Testing timezone handling:');
    const utcDate = new Date('2025-08-22T15:30:00.000Z');
    const localDate = new Date('2025-08-22T15:30:00');
    
    console.log(`   UTC: ${utcDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`);
    console.log(`   Local: ${localDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`);
    
    console.log('\n✅ Time formatting test completed');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
testTimeFormatting();
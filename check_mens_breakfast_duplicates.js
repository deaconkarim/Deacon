const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MjU5MDksImV4cCI6MjA2MzAwMTkwOX0.W4AhQt8-ZGkQa7i7rfsdJ5L1ZEn8Yx3crcrWCOGR9pA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMensBreakfastDuplicates() {
  console.log('🔍 Checking Men\'s Ministry Breakfast duplicates...');
  
  try {
    // Find all Men's Ministry Breakfast events
    const { data: mensEvents, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .ilike('title', '%Men%Ministry%Breakfast%')
      .order('start_date', { ascending: false });

    if (eventsError) throw eventsError;

    console.log(`📊 Found ${mensEvents?.length || 0} Men's Ministry Breakfast events`);

    if (mensEvents && mensEvents.length > 0) {
      console.log('\n📋 All Men\'s Ministry Breakfast events:');
      mensEvents.forEach((event, index) => {
        console.log(`${index + 1}. ${event.title}`);
        console.log(`   ID: ${event.id}`);
        console.log(`   Date: ${event.start_date}`);
        console.log(`   Type: ${event.event_type}`);
        console.log(`   Organization: ${event.organization_id}`);
        console.log('   ---');
      });
    }

    // Check attendance for each event
    if (mensEvents && mensEvents.length > 0) {
      console.log('\n📊 Attendance for each event:');
      
      for (const event of mensEvents) {
        const { data: attendance, error: attendanceError } = await supabase
          .from('event_attendance')
          .select('*')
          .eq('event_id', event.id);

        if (attendanceError) {
          console.log(`❌ Error getting attendance for ${event.id}:`, attendanceError);
        } else {
          const attendingCount = attendance?.filter(a => 
            a.status === 'attending' || a.status === 'checked-in'
          ).length || 0;
          
          console.log(`   ${event.title} (${event.start_date}): ${attendingCount} attendees`);
        }
      }
    }

    // Check for events with similar titles
    const { data: similarEvents, error: similarError } = await supabase
      .from('events')
      .select('*')
      .or('title.ilike.%breakfast%,title.ilike.%men%,title.ilike.%ministry%')
      .order('start_date', { ascending: false });

    if (similarError) throw similarError;

    console.log(`\n📊 Found ${similarEvents?.length || 0} events with similar titles (breakfast/men/ministry)`);

    if (similarEvents && similarEvents.length > 0) {
      console.log('\n📋 Similar events:');
      similarEvents.forEach((event, index) => {
        console.log(`${index + 1}. ${event.title} (${event.start_date})`);
      });
    }

    // Check if there are any events from yesterday specifically
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const { data: yesterdayEvents, error: yesterdayError } = await supabase
      .from('events')
      .select('*')
      .gte('start_date', yesterdayStr + 'T00:00:00')
      .lt('start_date', yesterdayStr + 'T23:59:59')
      .order('start_date', { ascending: false });

    if (yesterdayError) throw yesterdayError;

    console.log(`\n📅 Events from yesterday (${yesterdayStr}): ${yesterdayEvents?.length || 0}`);

    if (yesterdayEvents && yesterdayEvents.length > 0) {
      console.log('\n📋 Yesterday\'s events:');
      yesterdayEvents.forEach((event, index) => {
        console.log(`${index + 1}. ${event.title} (${event.start_date})`);
      });
    }

    return {
      mensEvents: mensEvents?.length || 0,
      similarEvents: similarEvents?.length || 0,
      yesterdayEvents: yesterdayEvents?.length || 0
    };

  } catch (error) {
    console.error('❌ Error checking Men\'s Ministry Breakfast duplicates:', error);
    throw error;
  }
}

// Run the check
checkMensBreakfastDuplicates()
  .then((result) => {
    console.log('\n✅ Men\'s Ministry Breakfast check completed!');
    console.log('📈 Summary:', result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to check Men\'s Ministry Breakfast duplicates:', error);
    process.exit(1);
  });
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzQyNTkwOSwiZXhwIjoyMDYzMDAxOTA5fQ.ZqdOIKGTito-5PbMz00IGud9nm0o1EA5rj04qBVIJDw';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkEventsWithServiceRole() {
  console.log('🔍 Checking events with service role key...');
  
  try {
    // Check all events in the database with service role
    const { data: allEvents, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .order('start_date', { ascending: false });

    if (eventsError) throw eventsError;

    console.log(`📊 Total events in database (service role): ${allEvents?.length || 0}`);

    // Check for Men's Ministry Breakfast specifically
    const mensEvents = allEvents?.filter(event => 
      event.title && event.title.toLowerCase().includes('men') && 
      event.title.toLowerCase().includes('ministry') && 
      event.title.toLowerCase().includes('breakfast')
    ) || [];

    console.log(`📋 Men's Ministry Breakfast events found: ${mensEvents.length}`);

    if (mensEvents.length > 0) {
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

    // Check for events from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const recentEvents = allEvents?.filter(event => 
      event.start_date >= thirtyDaysAgoStr
    ) || [];

    console.log(`\n📊 Events from last 30 days: ${recentEvents.length}`);

    if (recentEvents.length > 0) {
      console.log('\n📋 Recent events:');
      recentEvents.forEach((event, index) => {
        console.log(`${index + 1}. ${event.title} (${event.start_date})`);
      });
    }

    // Check attendance for all events
    const { data: allAttendance, error: attendanceError } = await supabase
      .from('event_attendance')
      .select('*');

    if (attendanceError) throw attendanceError;

    console.log(`\n📊 Total attendance records: ${allAttendance?.length || 0}`);

    // Check which events have attendance
    const eventIdsWithAttendance = [...new Set(allAttendance.map(a => a.event_id))];
    const eventsWithAttendance = allEvents?.filter(event => 
      eventIdsWithAttendance.includes(event.id)
    ) || [];

    console.log(`📊 Events with attendance: ${eventsWithAttendance.length}`);

    if (eventsWithAttendance.length > 0) {
      console.log('\n📋 Events with attendance:');
      eventsWithAttendance.forEach((event, index) => {
        const eventAttendance = allAttendance.filter(a => a.event_id === event.id);
        const attendingCount = eventAttendance.filter(a => 
          a.status === 'attending' || a.status === 'checked-in'
        ).length;
        console.log(`${index + 1}. ${event.title} (${event.start_date}): ${attendingCount} attendees`);
      });
    }

    // Check for duplicate event titles
    const eventTitles = allEvents?.map(e => e.title) || [];
    const duplicateTitles = eventTitles.filter((title, index) => 
      eventTitles.indexOf(title) !== index
    );

    if (duplicateTitles.length > 0) {
      console.log(`\n⚠️  Duplicate event titles found: ${duplicateTitles.length}`);
      console.log('📋 Duplicate titles:');
      [...new Set(duplicateTitles)].forEach(title => {
        const duplicates = allEvents?.filter(e => e.title === title) || [];
        console.log(`   "${title}": ${duplicates.length} instances`);
        duplicates.forEach((event, index) => {
          console.log(`     ${index + 1}. ${event.start_date} (ID: ${event.id})`);
        });
      });
    }

    return {
      totalEvents: allEvents?.length || 0,
      mensEvents: mensEvents.length,
      recentEvents: recentEvents.length,
      eventsWithAttendance: eventsWithAttendance.length,
      duplicateTitles: duplicateTitles.length
    };

  } catch (error) {
    console.error('❌ Error checking events with service role:', error);
    throw error;
  }
}

// Run the check
checkEventsWithServiceRole()
  .then((result) => {
    console.log('\n✅ Events check with service role completed!');
    console.log('📈 Summary:', result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to check events with service role:', error);
    process.exit(1);
  });
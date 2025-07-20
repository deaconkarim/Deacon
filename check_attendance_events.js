const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MjU5MDksImV4cCI6MjA2MzAwMTkwOX0.W4AhQt8-ZGkQa7i7rfsdJ5L1ZEn8Yx3crcrWCOGR9pA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAttendanceEvents() {
  console.log('🔍 Checking attendance records and their referenced events...');
  
  try {
    // Get all attendance records
    const { data: attendance, error: attendanceError } = await supabase
      .from('event_attendance')
      .select('*');

    if (attendanceError) throw attendanceError;
    
    console.log(`📊 Total attendance records: ${attendance?.length || 0}`);

    // Get unique event IDs from attendance
    const uniqueEventIds = [...new Set(attendance.map(a => a.event_id))];
    console.log(`📅 Unique event IDs referenced: ${uniqueEventIds.length}`);

    // Check which events exist
    const { data: existingEvents, error: eventsError } = await supabase
      .from('events')
      .select('id, title, start_date')
      .in('id', uniqueEventIds);

    if (eventsError) throw eventsError;

    console.log(`✅ Events that exist: ${existingEvents?.length || 0}`);
    console.log(`❌ Events that don't exist: ${uniqueEventIds.length - (existingEvents?.length || 0)}`);

    // Show missing events
    const existingEventIds = existingEvents?.map(e => e.id) || [];
    const missingEventIds = uniqueEventIds.filter(id => !existingEventIds.includes(id));

    console.log('\n📋 Missing events:');
    missingEventIds.forEach(id => {
      const attendanceForEvent = attendance.filter(a => a.event_id === id);
      console.log(`   ${id}: ${attendanceForEvent.length} attendance records`);
    });

    // Show existing events
    if (existingEvents && existingEvents.length > 0) {
      console.log('\n📋 Existing events:');
      existingEvents.forEach(event => {
        const attendanceForEvent = attendance.filter(a => a.event_id === event.id);
        console.log(`   ${event.title} (${event.start_date}): ${attendanceForEvent.length} attendance records`);
      });
    }

    // Check if there are any events in the database at all
    const { data: allEvents, error: allEventsError } = await supabase
      .from('events')
      .select('id, title, start_date')
      .order('start_date', { ascending: false })
      .limit(10);

    if (allEventsError) throw allEventsError;

    console.log(`\n📅 Total events in database: ${allEvents?.length || 0}`);
    if (allEvents && allEvents.length > 0) {
      console.log('\n📋 Recent events in database:');
      allEvents.forEach(event => {
        console.log(`   ${event.title} (${event.start_date})`);
      });
    }

    return {
      totalAttendance: attendance?.length || 0,
      uniqueEventIds: uniqueEventIds.length,
      existingEvents: existingEvents?.length || 0,
      missingEvents: missingEventIds.length,
      totalEventsInDB: allEvents?.length || 0
    };

  } catch (error) {
    console.error('❌ Error checking attendance events:', error);
    throw error;
  }
}

// Run the check
checkAttendanceEvents()
  .then((result) => {
    console.log('\n✅ Attendance events check completed!');
    console.log('📈 Summary:', result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to check attendance events:', error);
    process.exit(1);
  });
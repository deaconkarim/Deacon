const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MjU5MDksImV4cCI6MjA2MzAwMTkwOX0.W4AhQt8-ZGkQa7i7rfsdJ5L1ZEn8Yx3crcrWCOGR9pA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAttendanceData() {
  console.log('🔍 Checking attendance data...');
  
  try {
    // Check total attendance records
    const { data: allAttendance, error: attendanceError } = await supabase
      .from('event_attendance')
      .select('*');

    if (attendanceError) throw attendanceError;
    
    console.log(`📊 Total attendance records: ${allAttendance?.length || 0}`);

    // Check events with attendance
    const { data: eventsWithAttendance, error: eventsError } = await supabase
      .from('events')
      .select(`
        *,
        event_attendance (
          id,
          member_id,
          status
        )
      `)
      .not('event_attendance', 'is', null);

    if (eventsError) throw eventsError;

    console.log(`📅 Events with attendance: ${eventsWithAttendance?.length || 0}`);

    // Show some sample data
    if (eventsWithAttendance && eventsWithAttendance.length > 0) {
      console.log('\n📋 Sample events with attendance:');
      eventsWithAttendance.slice(0, 5).forEach(event => {
        const attendingCount = event.event_attendance?.filter(a => 
          a.status === 'attending' || a.status === 'checked-in'
        ).length || 0;
        console.log(`   ${event.title} (${event.start_date}): ${attendingCount} attendees`);
      });
    }

    // Check for recent events (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const { data: recentEvents, error: recentError } = await supabase
      .from('events')
      .select(`
        *,
        event_attendance (
          id,
          member_id,
          status
        )
      `)
      .gte('start_date', thirtyDaysAgoStr)
      .order('start_date', { ascending: false });

    if (recentError) throw recentError;

    console.log(`\n📅 Recent events (last 30 days): ${recentEvents?.length || 0}`);

    if (recentEvents && recentEvents.length > 0) {
      console.log('\n📋 Recent events with attendance:');
      recentEvents.forEach(event => {
        const attendingCount = event.event_attendance?.filter(a => 
          a.status === 'attending' || a.status === 'checked-in'
        ).length || 0;
        console.log(`   ${event.title} (${event.start_date}): ${attendingCount} attendees`);
      });
    }

    return {
      totalAttendance: allAttendance?.length || 0,
      eventsWithAttendance: eventsWithAttendance?.length || 0,
      recentEvents: recentEvents?.length || 0
    };

  } catch (error) {
    console.error('❌ Error checking attendance data:', error);
    throw error;
  }
}

// Run the check
checkAttendanceData()
  .then((result) => {
    console.log('\n✅ Attendance data check completed!');
    console.log('📈 Summary:', result);
    console.log('\n🔄 Next steps:');
    console.log('   1. Hard refresh your browser (Ctrl+F5 or Cmd+Shift+R)');
    console.log('   2. Clear browser cache if needed');
    console.log('   3. Check the dashboard again');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to check attendance data:', error);
    process.exit(1);
  });
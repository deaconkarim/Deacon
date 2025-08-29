const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MjU5MDksImV4cCI6MjA2MzAwMTkwOX0.W4AhQt8-ZGkQa7i7rfsdJ5L1ZEn8Yx3crcrWCOGR9pA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkEventsWithAnonKey() {

  try {
    // Check all events in the database with anon key
    const { data: allEvents, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .order('start_date', { ascending: false });

    if (eventsError) throw eventsError;

    // Check for Men's Ministry Breakfast specifically
    const mensEvents = allEvents?.filter(event => 
      event.title && event.title.toLowerCase().includes('men') && 
      event.title.toLowerCase().includes('ministry') && 
      event.title.toLowerCase().includes('breakfast')
    ) || [];

    if (mensEvents.length > 0) {

      mensEvents.forEach((event, index) => {

      });
    }

    // Check for events from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const recentEvents = allEvents?.filter(event => 
      event.start_date >= thirtyDaysAgoStr
    ) || [];

    if (recentEvents.length > 0) {

      recentEvents.slice(0, 10).forEach((event, index) => {

      });
    }

    // Check attendance for all events
    const { data: allAttendance, error: attendanceError } = await supabase
      .from('event_attendance')
      .select('*');

    if (attendanceError) throw attendanceError;

    // Check which events have attendance
    const eventIdsWithAttendance = [...new Set(allAttendance.map(a => a.event_id))];
    const eventsWithAttendance = allEvents?.filter(event => 
      eventIdsWithAttendance.includes(event.id)
    ) || [];

    if (eventsWithAttendance.length > 0) {

      eventsWithAttendance.forEach((event, index) => {
        const eventAttendance = allAttendance.filter(a => a.event_id === event.id);
        const attendingCount = eventAttendance.filter(a => 
          a.status === 'attending' || a.status === 'checked-in'
        ).length;

      });
    }

    // Check if the specific events we restored are visible
    const restoredEventIds = [
      'wednesday-bible-study-1749088800000-2025-07-17t02-00-00-000z',
      'tuesday-bible-study-1748980800000-2025-07-15t20-00-00-000z',
      'sunday-morning-worship-service-1746381600000-2025-07-13t18-00-00-000z',
      'men-s-ministry-breakfast-1747497600000'
    ];

    const restoredEvents = allEvents?.filter(event => 
      restoredEventIds.includes(event.id)
    ) || [];

    if (restoredEvents.length > 0) {

      restoredEvents.forEach((event, index) => {

      });
    }

    return {
      totalEvents: allEvents?.length || 0,
      mensEvents: mensEvents.length,
      recentEvents: recentEvents.length,
      eventsWithAttendance: eventsWithAttendance.length,
      restoredEvents: restoredEvents.length
    };

  } catch (error) {
    console.error('❌ Error checking events with anon key:', error);
    throw error;
  }
}

// Run the check
checkEventsWithAnonKey()
  .then((result) => {

    if (result.totalEvents === 0) {

    } else if (result.eventsWithAttendance === 0) {

    } else {

    }
    
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to check events with anon key:', error);
    process.exit(1);
  });
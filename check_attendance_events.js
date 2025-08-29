const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MjU5MDksImV4cCI6MjA2MzAwMTkwOX0.W4AhQt8-ZGkQa7i7rfsdJ5L1ZEn8Yx3crcrWCOGR9pA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAttendanceEvents() {

  try {
    // Get all attendance records
    const { data: attendance, error: attendanceError } = await supabase
      .from('event_attendance')
      .select('*');

    if (attendanceError) throw attendanceError;

    // Get unique event IDs from attendance
    const uniqueEventIds = [...new Set(attendance.map(a => a.event_id))];

    // Check which events exist
    const { data: existingEvents, error: eventsError } = await supabase
      .from('events')
      .select('id, title, start_date')
      .in('id', uniqueEventIds);

    if (eventsError) throw eventsError;

    // Show missing events
    const existingEventIds = existingEvents?.map(e => e.id) || [];
    const missingEventIds = uniqueEventIds.filter(id => !existingEventIds.includes(id));

    missingEventIds.forEach(id => {
      const attendanceForEvent = attendance.filter(a => a.event_id === id);

    });

    // Show existing events
    if (existingEvents && existingEvents.length > 0) {

      existingEvents.forEach(event => {
        const attendanceForEvent = attendance.filter(a => a.event_id === event.id);

      });
    }

    // Check if there are any events in the database at all
    const { data: allEvents, error: allEventsError } = await supabase
      .from('events')
      .select('id, title, start_date')
      .order('start_date', { ascending: false })
      .limit(10);

    if (allEventsError) throw allEventsError;

    if (allEvents && allEvents.length > 0) {

      allEvents.forEach(event => {

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

    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to check attendance events:', error);
    process.exit(1);
  });
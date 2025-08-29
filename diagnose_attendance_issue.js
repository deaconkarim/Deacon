const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MjU5MDksImV4cCI6MjA2MzAwMTkwOX0.W4AhQt8-ZGkQa7i7rfsdJ5L1ZEn8Yx3crcrWCOGR9pA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseAttendanceIssue() {

  try {
    // Check attendance records
    const { data: attendance, error: attendanceError } = await supabase
      .from('event_attendance')
      .select('*');

    if (attendanceError) throw attendanceError;

    // Check events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*');

    if (eventsError) throw eventsError;

    // Get unique event IDs from attendance
    const uniqueEventIds = [...new Set(attendance.map(a => a.event_id))];

    // Check which events exist
    const { data: existingEvents, error: existingError } = await supabase
      .from('events')
      .select('id, title, start_date')
      .in('id', uniqueEventIds);

    if (existingError) throw existingError;

    const existingIds = existingEvents?.map(e => e.id) || [];
    const missingIds = uniqueEventIds.filter(id => !existingIds.includes(id));

    // Show missing events
    if (missingIds.length > 0) {

      missingIds.forEach(id => {
        const attendanceForEvent = attendance.filter(a => a.event_id === id);

      });
    }

    // Show existing events with attendance
    if (existingEvents && existingEvents.length > 0) {

      existingEvents.forEach(event => {
        const attendanceForEvent = attendance.filter(a => a.event_id === event.id);

      });
    }

    if (attendance.length > 0 && events.length === 0) {

    } else if (attendance.length > 0 && missingIds.length > 0) {

    } else if (attendance.length === 0) {

    } else {

    }

    return {
      attendanceCount: attendance.length,
      eventsCount: events.length,
      missingEvents: missingIds.length,
      orphanedRecords: attendance.length - (existingEvents?.length || 0)
    };

  } catch (error) {
    console.error('❌ Error diagnosing attendance issue:', error);
    throw error;
  }
}

// Run the diagnosis
diagnoseAttendanceIssue()
  .then((result) => {

    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to diagnose attendance issue:', error);
    process.exit(1);
  });
// Script to clear attendance caches and test the fixes
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MjU5MDksImV4cCI6MjA2MzAwMTkwOX0.W4AhQt8-ZGkQa7i7rfsdJ5L1ZEn8Yx3crcrWCOGR9pA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearAttendanceCache() {

  try {
    // Check if there are any event_attendance records
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('event_attendance')
      .select('*')
      .limit(5);

    if (attendanceError) throw attendanceError;

    if (attendanceRecords && attendanceRecords.length > 0) {

      attendanceRecords.forEach((record, index) => {

      });
    }

    // Check if there are any events that might be causing the issue
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .limit(10);

    if (eventsError) throw eventsError;

    if (events && events.length > 0) {

      events.forEach((event, index) => {

      });
    }

    // Check if there are any test or demo events
    const { data: testEvents, error: testError } = await supabase
      .from('events')
      .select('*')
      .or('title.ilike.%test%,title.ilike.%demo%,title.ilike.%sample%');

    if (testError) throw testError;

    if (testEvents && testEvents.length > 0) {

      testEvents.forEach((event, index) => {

      });
    }

    return {
      attendanceRecords: attendanceRecords?.length || 0,
      events: events?.length || 0,
      testEvents: testEvents?.length || 0
    };

  } catch (error) {
    console.error('❌ Error checking cache:', error);
    throw error;
  }
}

// Run the check
clearAttendanceCache()
  .then((result) => {

    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to check cache:', error);
    process.exit(1);
  }); 
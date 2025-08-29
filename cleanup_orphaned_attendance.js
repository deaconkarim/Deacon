const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MjU5MDksImV4cCI6MjA2MzAwMTkwOX0.W4AhQt8-ZGkQa7i7rfsdJ5L1ZEn8Yx3crcrWCOGR9pA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupOrphanedAttendance() {

  try {
    // Step 1: Get all attendance records
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('event_attendance')
      .select('*');

    if (attendanceError) throw attendanceError;

    if (attendanceRecords && attendanceRecords.length > 0) {

      attendanceRecords.slice(0, 5).forEach((record, index) => {

      });
    }

    // Step 2: Get all events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id');

    if (eventsError) throw eventsError;

    // Step 3: Find orphaned attendance records
    const eventIds = events?.map(e => e.id) || [];
    const orphanedRecords = attendanceRecords?.filter(record => !eventIds.includes(record.event_id)) || [];

    if (orphanedRecords.length > 0) {

      orphanedRecords.forEach((record, index) => {

      });

      // Step 4: Delete orphaned records

      const orphanedEventIds = [...new Set(orphanedRecords.map(r => r.event_id))];

      orphanedEventIds.forEach(eventId => {

      });

      const { error: deleteError } = await supabase
        .from('event_attendance')
        .delete()
        .in('event_id', orphanedEventIds);

      if (deleteError) {
        console.error('❌ Error deleting orphaned records:', deleteError);
        throw deleteError;
      }

    } else {

    }

    // Step 5: Verify cleanup
    const { data: remainingRecords, error: remainingError } = await supabase
      .from('event_attendance')
      .select('*');

    if (remainingError) throw remainingError;

    if (remainingRecords && remainingRecords.length > 0) {

      remainingRecords.forEach((record, index) => {

      });
    }

    return {
      originalCount: attendanceRecords?.length || 0,
      orphanedCount: orphanedRecords.length,
      remainingCount: remainingRecords?.length || 0
    };

  } catch (error) {
    console.error('❌ Error cleaning up orphaned attendance:', error);
    throw error;
  }
}

// Run the cleanup
cleanupOrphanedAttendance()
  .then((result) => {

    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to cleanup orphaned attendance:', error);
    process.exit(1);
  });
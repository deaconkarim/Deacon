const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MjU5MDksImV4cCI6MjA2MzAwMTkwOX0.W4AhQt8-ZGkQa7i7rfsdJ5L1ZEn8Yx3crcrWCOGR9pA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupOrphanedAttendance() {
  console.log('🧹 Cleaning up orphaned attendance records...');
  
  try {
    // Step 1: Get all attendance records
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('event_attendance')
      .select('*');

    if (attendanceError) throw attendanceError;

    console.log(`📊 Found ${attendanceRecords?.length || 0} attendance records`);

    if (attendanceRecords && attendanceRecords.length > 0) {
      console.log('\n📋 Sample attendance records:');
      attendanceRecords.slice(0, 5).forEach((record, index) => {
        console.log(`${index + 1}. Event ID: ${record.event_id}, Member ID: ${record.member_id}, Status: ${record.status}`);
      });
    }

    // Step 2: Get all events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id');

    if (eventsError) throw eventsError;

    console.log(`\n📅 Found ${events?.length || 0} events in database`);

    // Step 3: Find orphaned attendance records
    const eventIds = events?.map(e => e.id) || [];
    const orphanedRecords = attendanceRecords?.filter(record => !eventIds.includes(record.event_id)) || [];

    console.log(`\n❌ Found ${orphanedRecords.length} orphaned attendance records`);

    if (orphanedRecords.length > 0) {
      console.log('\n📋 Orphaned attendance records:');
      orphanedRecords.forEach((record, index) => {
        console.log(`${index + 1}. Event ID: ${record.event_id}, Member ID: ${record.member_id}, Status: ${record.status}`);
      });

      // Step 4: Delete orphaned records
      console.log('\n🗑️ Deleting orphaned attendance records...');
      
      const orphanedEventIds = [...new Set(orphanedRecords.map(r => r.event_id))];
      console.log(`\n📋 Unique orphaned event IDs: ${orphanedEventIds.length}`);
      orphanedEventIds.forEach(eventId => {
        console.log(`   - ${eventId}`);
      });

      const { error: deleteError } = await supabase
        .from('event_attendance')
        .delete()
        .in('event_id', orphanedEventIds);

      if (deleteError) {
        console.error('❌ Error deleting orphaned records:', deleteError);
        throw deleteError;
      }

      console.log('✅ Successfully deleted orphaned attendance records');
    } else {
      console.log('✅ No orphaned attendance records found');
    }

    // Step 5: Verify cleanup
    const { data: remainingRecords, error: remainingError } = await supabase
      .from('event_attendance')
      .select('*');

    if (remainingError) throw remainingError;

    console.log(`\n📊 Remaining attendance records: ${remainingRecords?.length || 0}`);

    if (remainingRecords && remainingRecords.length > 0) {
      console.log('\n📋 Remaining attendance records:');
      remainingRecords.forEach((record, index) => {
        console.log(`${index + 1}. Event ID: ${record.event_id}, Member ID: ${record.member_id}, Status: ${record.status}`);
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
    console.log('\n🎉 Cleanup completed!');
    console.log('📈 Summary:', result);
    console.log('\n🔄 Next steps:');
    console.log('   1. Refresh the dashboard page');
    console.log('   2. The duplicate events should no longer appear');
    console.log('   3. Add new events and attendance records as needed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to cleanup orphaned attendance:', error);
    process.exit(1);
  });
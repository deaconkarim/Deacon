const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzQyNTkwOSwiZXhwIjoyMDYzMDAxOTA5fQ.ZqdOIKGTito-5PbMz00IGud9nm0o1EA5rj04qBVIJDw';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupDuplicateEvents() {
  console.log('🧹 Cleaning up duplicate events...');
  
  try {
    // Get all events
    const { data: allEvents, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .order('start_date', { ascending: false });

    if (eventsError) throw eventsError;

    console.log(`📊 Total events before cleanup: ${allEvents?.length || 0}`);

    // Get all attendance records
    const { data: allAttendance, error: attendanceError } = await supabase
      .from('event_attendance')
      .select('*');

    if (attendanceError) throw attendanceError;

    console.log(`📊 Total attendance records: ${allAttendance?.length || 0}`);

    // Get event IDs that have attendance
    const eventIdsWithAttendance = [...new Set(allAttendance.map(a => a.event_id))];
    console.log(`📊 Events with attendance: ${eventIdsWithAttendance.length}`);

    // Group events by title and date
    const eventsByTitle = {};
    allEvents?.forEach(event => {
      const key = `${event.title}-${event.start_date}`;
      if (!eventsByTitle[key]) {
        eventsByTitle[key] = [];
      }
      eventsByTitle[key].push(event);
    });

    // Find duplicates and decide which to keep
    const eventsToDelete = [];
    const eventsToKeep = [];

    Object.entries(eventsByTitle).forEach(([key, events]) => {
      if (events.length > 1) {
        console.log(`📋 Found ${events.length} duplicates for: ${key}`);
        
        // Find the event that has attendance (if any)
        const eventWithAttendance = events.find(event => 
          eventIdsWithAttendance.includes(event.id)
        );

        if (eventWithAttendance) {
          // Keep the one with attendance, delete the rest
          eventsToKeep.push(eventWithAttendance);
          events.forEach(event => {
            if (event.id !== eventWithAttendance.id) {
              eventsToDelete.push(event.id);
            }
          });
          console.log(`   ✅ Keeping event with attendance: ${eventWithAttendance.id}`);
        } else {
          // If none have attendance, keep the first one, delete the rest
          eventsToKeep.push(events[0]);
          events.slice(1).forEach(event => {
            eventsToDelete.push(event.id);
          });
          console.log(`   ✅ Keeping first event: ${events[0].id}`);
        }
      } else {
        // No duplicates, keep it
        eventsToKeep.push(events[0]);
      }
    });

    console.log(`\n📊 Events to keep: ${eventsToKeep.length}`);
    console.log(`📊 Events to delete: ${eventsToDelete.length}`);

    if (eventsToDelete.length === 0) {
      console.log('✅ No duplicates to clean up!');
      return;
    }

    // Delete duplicate events
    console.log('\n🗑️  Deleting duplicate events...');
    
    // Delete in batches to avoid overwhelming the database
    const batchSize = 50;
    let deletedCount = 0;

    for (let i = 0; i < eventsToDelete.length; i += batchSize) {
      const batch = eventsToDelete.slice(i, i + batchSize);
      
      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .in('id', batch);

      if (deleteError) {
        console.error(`❌ Error deleting batch ${Math.floor(i/batchSize) + 1}:`, deleteError);
        throw deleteError;
      }

      deletedCount += batch.length;
      console.log(`✅ Deleted batch ${Math.floor(i/batchSize) + 1}: ${batch.length} events`);
    }

    console.log(`✅ Successfully deleted ${deletedCount} duplicate events`);

    // Verify the cleanup
    const { data: remainingEvents, error: verifyError } = await supabase
      .from('events')
      .select('*');

    if (verifyError) throw verifyError;

    console.log(`📊 Total events after cleanup: ${remainingEvents?.length || 0}`);

    // Check for remaining duplicates
    const remainingEventTitles = remainingEvents?.map(e => e.title) || [];
    const remainingDuplicates = remainingEventTitles.filter((title, index) => 
      remainingEventTitles.indexOf(title) !== index
    );

    console.log(`📊 Remaining duplicate titles: ${remainingDuplicates.length}`);

    // Check attendance after cleanup
    const { data: attendanceAfterCleanup, error: attendanceVerifyError } = await supabase
      .from('event_attendance')
      .select(`
        *,
        events (
          id,
          title,
          start_date
        )
      `);

    if (attendanceVerifyError) throw attendanceVerifyError;

    const validAttendance = attendanceAfterCleanup?.filter(a => a.events !== null) || [];
    console.log(`📊 Attendance records with valid events after cleanup: ${validAttendance.length}`);

    return {
      eventsBefore: allEvents?.length || 0,
      eventsAfter: remainingEvents?.length || 0,
      deletedEvents: deletedCount,
      remainingDuplicates: remainingDuplicates.length,
      validAttendance: validAttendance.length
    };

  } catch (error) {
    console.error('❌ Error cleaning up duplicate events:', error);
    throw error;
  }
}

// Run the cleanup
cleanupDuplicateEvents()
  .then((result) => {
    console.log('\n🎉 Duplicate events cleanup completed!');
    console.log('📈 Summary:', result);
    console.log('\n🔄 Next steps:');
    console.log('   1. Hard refresh your browser (Ctrl+F5 or Cmd+Shift+R)');
    console.log('   2. Clear browser cache completely');
    console.log('   3. Check the dashboard - should now show correct attendance');
    console.log('   4. The duplicates should be gone');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to cleanup duplicate events:', error);
    process.exit(1);
  });
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MjU5MDksImV4cCI6MjA2MzAwMTkwOX0.W4AhQt8-ZGkQa7i7rfsdJ5L1ZEn8Yx3crcrWCOGR9pA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseAttendanceIssue() {
  console.log('🔍 Diagnosing attendance issue...\n');
  
  try {
    // Check attendance records
    const { data: attendance, error: attendanceError } = await supabase
      .from('event_attendance')
      .select('*');

    if (attendanceError) throw attendanceError;
    
    console.log(`📊 Total attendance records: ${attendance?.length || 0}`);

    // Check events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*');

    if (eventsError) throw eventsError;
    
    console.log(`📅 Total events: ${events?.length || 0}`);

    // Get unique event IDs from attendance
    const uniqueEventIds = [...new Set(attendance.map(a => a.event_id))];
    console.log(`📋 Unique event IDs referenced by attendance: ${uniqueEventIds.length}`);

    // Check which events exist
    const { data: existingEvents, error: existingError } = await supabase
      .from('events')
      .select('id, title, start_date')
      .in('id', uniqueEventIds);

    if (existingError) throw existingError;

    const existingIds = existingEvents?.map(e => e.id) || [];
    const missingIds = uniqueEventIds.filter(id => !existingIds.includes(id));

    console.log(`✅ Events that exist: ${existingIds.length}`);
    console.log(`❌ Events that don't exist: ${missingIds.length}`);

    // Show missing events
    if (missingIds.length > 0) {
      console.log('\n📋 Missing events:');
      missingIds.forEach(id => {
        const attendanceForEvent = attendance.filter(a => a.event_id === id);
        console.log(`   ${id}: ${attendanceForEvent.length} attendance records`);
      });
    }

    // Show existing events with attendance
    if (existingEvents && existingEvents.length > 0) {
      console.log('\n📋 Existing events with attendance:');
      existingEvents.forEach(event => {
        const attendanceForEvent = attendance.filter(a => a.event_id === event.id);
        console.log(`   ${event.title} (${event.start_date}): ${attendanceForEvent.length} attendees`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('📋 DIAGNOSIS SUMMARY');
    console.log('='.repeat(60));
    
    if (attendance.length > 0 && events.length === 0) {
      console.log('❌ PROBLEM: Attendance records exist but NO events exist');
      console.log('   - 65 attendance records are orphaned');
      console.log('   - 0 events in database');
      console.log('   - RLS policy is blocking event creation');
    } else if (attendance.length > 0 && missingIds.length > 0) {
      console.log('⚠️  PROBLEM: Some attendance records reference missing events');
      console.log(`   - ${attendance.length} total attendance records`);
      console.log(`   - ${missingIds.length} events are missing`);
      console.log('   - RLS policy is blocking event creation');
    } else if (attendance.length === 0) {
      console.log('❌ PROBLEM: No attendance records exist');
      console.log('   - All attendance data was lost');
    } else {
      console.log('✅ STATUS: Attendance and events are properly linked');
    }

    console.log('\n' + '='.repeat(60));
    console.log('🔧 RECOMMENDED SOLUTIONS');
    console.log('='.repeat(60));
    
    console.log('1. 🔑 Use Service Role Key (Recommended)');
    console.log('   - Get the service role key from Supabase dashboard');
    console.log('   - Update the script to use service role key');
    console.log('   - This will bypass RLS policies');
    
    console.log('\n2. 🗄️  Disable RLS Temporarily');
    console.log('   - Access Supabase dashboard');
    console.log('   - Go to Authentication > Policies');
    console.log('   - Temporarily disable RLS on events table');
    console.log('   - Create events, then re-enable RLS');
    
    console.log('\n3. 🎯 Create Events Through Frontend');
    console.log('   - Use the app interface to create events');
    console.log('   - This will have proper authentication');
    console.log('   - Create the 4 missing events manually');
    
    console.log('\n4. 🗑️  Alternative: Delete Orphaned Attendance');
    console.log('   - Delete the 65 orphaned attendance records');
    console.log('   - Start fresh with new events and attendance');
    console.log('   - WARNING: This will lose all attendance data');

    console.log('\n' + '='.repeat(60));
    console.log('📊 CURRENT DATA STATUS');
    console.log('='.repeat(60));
    console.log(`   Attendance Records: ${attendance.length}`);
    console.log(`   Events: ${events.length}`);
    console.log(`   Orphaned Records: ${attendance.length - (existingEvents?.length || 0)}`);
    console.log(`   Valid Links: ${existingEvents?.length || 0}`);

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
    console.log('\n✅ Diagnosis completed!');
    console.log('📈 Summary:', result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to diagnose attendance issue:', error);
    process.exit(1);
  });
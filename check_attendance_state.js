const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MjU5MDksImV4cCI6MjA2MzAwMTkwOX0.W4AhQt8-ZGkQa7i7rfsdJ5L1ZEn8Yx3crcrWCOGR9pA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAttendanceState() {
  console.log('🔍 Checking attendance state...');
  
  try {
    // Check total attendance records
    const { data: totalAttendance, error: totalError } = await supabase
      .from('event_attendance')
      .select('id', { count: 'exact' });
    
    if (totalError) throw totalError;
    console.log(`📊 Total attendance records: ${totalAttendance.length}`);
    
    // Check for duplicate records
    const { data: duplicates, error: dupError } = await supabase
      .from('event_attendance')
      .select('event_id, anonymous_name, created_at')
      .not('anonymous_name', 'is', null);
    
    if (dupError) throw dupError;
    
    // Find duplicates
    const duplicateMap = new Map();
    duplicates.forEach(record => {
      const key = `${record.event_id}-${record.anonymous_name}`;
      if (!duplicateMap.has(key)) {
        duplicateMap.set(key, []);
      }
      duplicateMap.get(key).push(record);
    });
    
    const actualDuplicates = Array.from(duplicateMap.entries())
      .filter(([key, records]) => records.length > 1);
    
    console.log(`⚠️  Duplicate records found: ${actualDuplicates.length}`);
    
    if (actualDuplicates.length > 0) {
      console.log('\n📋 Duplicate details:');
      actualDuplicates.forEach(([key, records]) => {
        console.log(`  - ${key}: ${records.length} records`);
      });
    }
    
    // Check events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, event_type, start_date')
      .order('start_date');
    
    if (eventsError) throw eventsError;
    console.log(`📅 Events found: ${events.length}`);
    
    // Show event details
    events.forEach(event => {
      console.log(`  - ${event.title} (${event.event_type})`);
    });
    
    // Check unique constraint
    console.log('\n🔧 Unique constraint issue:');
    console.log('The error indicates a unique constraint "event_attendance_event_anonymous_unique"');
    console.log('This prevents the same anonymous person from being checked in multiple times for the same event');
    console.log('This is actually correct behavior - the issue is duplicate records were created');
    
    console.log('\n💡 Solution:');
    console.log('1. Run the fix_duplicate_attendance.sql script in Supabase SQL Editor');
    console.log('2. This will remove duplicate records and keep only the first one');
    console.log('3. The frontend should then work correctly');
    
    return {
      success: true,
      totalRecords: totalAttendance.length,
      duplicateCount: actualDuplicates.length,
      eventCount: events.length
    };
    
  } catch (error) {
    console.error('❌ Error checking attendance state:', error);
    throw error;
  }
}

// Run the check
checkAttendanceState()
  .then((result) => {
    console.log('\n🎉 Attendance state check completed!');
    console.log('📈 Summary:', result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to check attendance state:', error);
    process.exit(1);
  }); 
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MjU5MDksImV4cCI6MjA2MzAwMTkwOX0.W4AhQt8-ZGkQa7i7rfsdJ5L1ZEn8Yx3crcrWCOGR9pA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAttendanceState() {
  console.log('🔍 Checking attendance state...');
  
  try {
    // Check total attendance records
    const { data: totalAttendance, error: totalError } = await supabase
      .from('event_attendance')
      .select('id', { count: 'exact' });
    
    if (totalError) throw totalError;
    console.log(`📊 Total attendance records: ${totalAttendance.length}`);
    
    // Check for duplicate records
    const { data: duplicates, error: dupError } = await supabase
      .from('event_attendance')
      .select('event_id, anonymous_name, created_at')
      .not('anonymous_name', 'is', null);
    
    if (dupError) throw dupError;
    
    // Find duplicates
    const duplicateMap = new Map();
    duplicates.forEach(record => {
      const key = `${record.event_id}-${record.anonymous_name}`;
      if (!duplicateMap.has(key)) {
        duplicateMap.set(key, []);
      }
      duplicateMap.get(key).push(record);
    });
    
    const actualDuplicates = Array.from(duplicateMap.entries())
      .filter(([key, records]) => records.length > 1);
    
    console.log(`⚠️  Duplicate records found: ${actualDuplicates.length}`);
    
    if (actualDuplicates.length > 0) {
      console.log('\n📋 Duplicate details:');
      actualDuplicates.forEach(([key, records]) => {
        console.log(`  - ${key}: ${records.length} records`);
      });
    }
    
    // Check events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, event_type, start_date')
      .order('start_date');
    
    if (eventsError) throw eventsError;
    console.log(`📅 Events found: ${events.length}`);
    
    // Show event details
    events.forEach(event => {
      console.log(`  - ${event.title} (${event.event_type})`);
    });
    
    // Check unique constraint
    console.log('\n🔧 Unique constraint issue:');
    console.log('The error indicates a unique constraint "event_attendance_event_anonymous_unique"');
    console.log('This prevents the same anonymous person from being checked in multiple times for the same event');
    console.log('This is actually correct behavior - the issue is duplicate records were created');
    
    console.log('\n💡 Solution:');
    console.log('1. Run the fix_duplicate_attendance.sql script in Supabase SQL Editor');
    console.log('2. This will remove duplicate records and keep only the first one');
    console.log('3. The frontend should then work correctly');
    
    return {
      success: true,
      totalRecords: totalAttendance.length,
      duplicateCount: actualDuplicates.length,
      eventCount: events.length
    };
    
  } catch (error) {
    console.error('❌ Error checking attendance state:', error);
    throw error;
  }
}

// Run the check
checkAttendanceState()
  .then((result) => {
    console.log('\n🎉 Attendance state check completed!');
    console.log('📈 Summary:', result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to check attendance state:', error);
    process.exit(1);
  }); 
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MjU5MDksImV4cCI6MjA2MzAwMTkwOX0.W4AhQt8-ZGkQa7i7rfsdJ5L1ZEn8Yx3crcrWCOGR9pA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAttendanceState() {
  console.log('🔍 Checking attendance state...');
  
  try {
    // Check total attendance records
    const { data: totalAttendance, error: totalError } = await supabase
      .from('event_attendance')
      .select('id', { count: 'exact' });
    
    if (totalError) throw totalError;
    console.log(`📊 Total attendance records: ${totalAttendance.length}`);
    
    // Check for duplicate records
    const { data: duplicates, error: dupError } = await supabase
      .from('event_attendance')
      .select('event_id, anonymous_name, created_at')
      .not('anonymous_name', 'is', null);
    
    if (dupError) throw dupError;
    
    // Find duplicates
    const duplicateMap = new Map();
    duplicates.forEach(record => {
      const key = `${record.event_id}-${record.anonymous_name}`;
      if (!duplicateMap.has(key)) {
        duplicateMap.set(key, []);
      }
      duplicateMap.get(key).push(record);
    });
    
    const actualDuplicates = Array.from(duplicateMap.entries())
      .filter(([key, records]) => records.length > 1);
    
    console.log(`⚠️  Duplicate records found: ${actualDuplicates.length}`);
    
    if (actualDuplicates.length > 0) {
      console.log('\n📋 Duplicate details:');
      actualDuplicates.forEach(([key, records]) => {
        console.log(`  - ${key}: ${records.length} records`);
      });
    }
    
    // Check events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, event_type, start_date')
      .order('start_date');
    
    if (eventsError) throw eventsError;
    console.log(`📅 Events found: ${events.length}`);
    
    // Show event details
    events.forEach(event => {
      console.log(`  - ${event.title} (${event.event_type})`);
    });
    
    // Check unique constraint
    console.log('\n🔧 Unique constraint issue:');
    console.log('The error indicates a unique constraint "event_attendance_event_anonymous_unique"');
    console.log('This prevents the same anonymous person from being checked in multiple times for the same event');
    console.log('This is actually correct behavior - the issue is duplicate records were created');
    
    console.log('\n💡 Solution:');
    console.log('1. Run the fix_duplicate_attendance.sql script in Supabase SQL Editor');
    console.log('2. This will remove duplicate records and keep only the first one');
    console.log('3. The frontend should then work correctly');
    
    return {
      success: true,
      totalRecords: totalAttendance.length,
      duplicateCount: actualDuplicates.length,
      eventCount: events.length
    };
    
  } catch (error) {
    console.error('❌ Error checking attendance state:', error);
    throw error;
  }
}

// Run the check
checkAttendanceState()
  .then((result) => {
    console.log('\n🎉 Attendance state check completed!');
    console.log('📈 Summary:', result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to check attendance state:', error);
    process.exit(1);
  }); 
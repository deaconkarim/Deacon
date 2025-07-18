const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MjU5MDksImV4cCI6MjA2MzAwMTkwOX0.W4AhQt8-ZGkQa7i7rfsdJ5L1ZEn8Yx3crcrWCOGR9pA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyAttendanceFix() {
  console.log('🔍 Verifying attendance fix...');
  
  try {
    // Check events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, event_type, start_date')
      .order('start_date');
    
    if (eventsError) throw eventsError;
    console.log(`📅 Events found: ${events.length}`);
    
    // Check attendance
    const { data: attendance, error: attendanceError } = await supabase
      .from('event_attendance')
      .select('id, event_id, anonymous_name, status')
      .order('created_at');
    
    if (attendanceError) throw attendanceError;
    console.log(`👥 Attendance records found: ${attendance.length}`);
    
    // Check for duplicates
    const duplicateMap = new Map();
    attendance.forEach(record => {
      if (record.anonymous_name) {
        const key = `${record.event_id}-${record.anonymous_name}`;
        if (!duplicateMap.has(key)) {
          duplicateMap.set(key, []);
        }
        duplicateMap.get(key).push(record);
      }
    });
    
    const duplicates = Array.from(duplicateMap.entries())
      .filter(([key, records]) => records.length > 1);
    
    console.log(`⚠️  Duplicate records remaining: ${duplicates.length}`);
    
    // Check orphaned records
    const orphanedRecords = attendance.filter(record => {
      return !events.some(event => event.id === record.event_id);
    });
    
    console.log(`🔗 Orphaned records: ${orphanedRecords.length}`);
    
    // Show sample data
    console.log('\n📊 Sample events:');
    events.slice(0, 3).forEach(event => {
      console.log(`  - ${event.title} (${event.event_type})`);
    });
    
    console.log('\n📊 Sample attendance:');
    attendance.slice(0, 5).forEach(record => {
      const event = events.find(e => e.id === record.event_id);
      console.log(`  - ${record.anonymous_name || 'Anonymous'} attended ${event?.title || 'Unknown Event'}`);
    });
    
    // Test the unique constraint
    console.log('\n🧪 Testing unique constraint...');
    try {
      const testRecord = {
        event_id: events[0]?.id,
        anonymous_name: 'Test User',
        status: 'attending',
        organization_id: '550e8400-e29b-41d4-a716-446655440000'
      };
      
      const { error: testError } = await supabase
        .from('event_attendance')
        .insert(testRecord);
      
      if (testError && testError.code === '23505') {
        console.log('✅ Unique constraint is working correctly');
      } else if (testError) {
        console.log(`⚠️  Test insert failed: ${testError.message}`);
      } else {
        console.log('✅ Test insert succeeded');
      }
    } catch (error) {
      console.log(`⚠️  Test failed: ${error.message}`);
    }
    
    return {
      success: true,
      events: events.length,
      attendance: attendance.length,
      duplicates: duplicates.length,
      orphaned: orphanedRecords.length
    };
    
  } catch (error) {
    console.error('❌ Error verifying fix:', error);
    throw error;
  }
}

// Run the verification
verifyAttendanceFix()
  .then((result) => {
    console.log('\n🎉 Verification completed!');
    console.log('📈 Summary:', result);
    
    if (result.duplicates === 0 && result.orphaned === 0) {
      console.log('✅ Attendance data is now clean and ready to use!');
    } else {
      console.log('⚠️  Some issues remain. Run the comprehensive fix SQL script.');
    }
    
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to verify fix:', error);
    process.exit(1);
  }); 
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MjU5MDksImV4cCI6MjA2MzAwMTkwOX0.W4AhQt8-ZGkQa7i7rfsdJ5L1ZEn8Yx3crcrWCOGR9pA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyAttendanceFix() {
  console.log('🔍 Verifying attendance fix...');
  
  try {
    // Check events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, event_type, start_date')
      .order('start_date');
    
    if (eventsError) throw eventsError;
    console.log(`📅 Events found: ${events.length}`);
    
    // Check attendance
    const { data: attendance, error: attendanceError } = await supabase
      .from('event_attendance')
      .select('id, event_id, anonymous_name, status')
      .order('created_at');
    
    if (attendanceError) throw attendanceError;
    console.log(`👥 Attendance records found: ${attendance.length}`);
    
    // Check for duplicates
    const duplicateMap = new Map();
    attendance.forEach(record => {
      if (record.anonymous_name) {
        const key = `${record.event_id}-${record.anonymous_name}`;
        if (!duplicateMap.has(key)) {
          duplicateMap.set(key, []);
        }
        duplicateMap.get(key).push(record);
      }
    });
    
    const duplicates = Array.from(duplicateMap.entries())
      .filter(([key, records]) => records.length > 1);
    
    console.log(`⚠️  Duplicate records remaining: ${duplicates.length}`);
    
    // Check orphaned records
    const orphanedRecords = attendance.filter(record => {
      return !events.some(event => event.id === record.event_id);
    });
    
    console.log(`🔗 Orphaned records: ${orphanedRecords.length}`);
    
    // Show sample data
    console.log('\n📊 Sample events:');
    events.slice(0, 3).forEach(event => {
      console.log(`  - ${event.title} (${event.event_type})`);
    });
    
    console.log('\n📊 Sample attendance:');
    attendance.slice(0, 5).forEach(record => {
      const event = events.find(e => e.id === record.event_id);
      console.log(`  - ${record.anonymous_name || 'Anonymous'} attended ${event?.title || 'Unknown Event'}`);
    });
    
    // Test the unique constraint
    console.log('\n🧪 Testing unique constraint...');
    try {
      const testRecord = {
        event_id: events[0]?.id,
        anonymous_name: 'Test User',
        status: 'attending',
        organization_id: '550e8400-e29b-41d4-a716-446655440000'
      };
      
      const { error: testError } = await supabase
        .from('event_attendance')
        .insert(testRecord);
      
      if (testError && testError.code === '23505') {
        console.log('✅ Unique constraint is working correctly');
      } else if (testError) {
        console.log(`⚠️  Test insert failed: ${testError.message}`);
      } else {
        console.log('✅ Test insert succeeded');
      }
    } catch (error) {
      console.log(`⚠️  Test failed: ${error.message}`);
    }
    
    return {
      success: true,
      events: events.length,
      attendance: attendance.length,
      duplicates: duplicates.length,
      orphaned: orphanedRecords.length
    };
    
  } catch (error) {
    console.error('❌ Error verifying fix:', error);
    throw error;
  }
}

// Run the verification
verifyAttendanceFix()
  .then((result) => {
    console.log('\n🎉 Verification completed!');
    console.log('📈 Summary:', result);
    
    if (result.duplicates === 0 && result.orphaned === 0) {
      console.log('✅ Attendance data is now clean and ready to use!');
    } else {
      console.log('⚠️  Some issues remain. Run the comprehensive fix SQL script.');
    }
    
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to verify fix:', error);
    process.exit(1);
  }); 
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MjU5MDksImV4cCI6MjA2MzAwMTkwOX0.W4AhQt8-ZGkQa7i7rfsdJ5L1ZEn8Yx3crcrWCOGR9pA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyAttendanceFix() {
  console.log('🔍 Verifying attendance fix...');
  
  try {
    // Check events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, event_type, start_date')
      .order('start_date');
    
    if (eventsError) throw eventsError;
    console.log(`📅 Events found: ${events.length}`);
    
    // Check attendance
    const { data: attendance, error: attendanceError } = await supabase
      .from('event_attendance')
      .select('id, event_id, anonymous_name, status')
      .order('created_at');
    
    if (attendanceError) throw attendanceError;
    console.log(`👥 Attendance records found: ${attendance.length}`);
    
    // Check for duplicates
    const duplicateMap = new Map();
    attendance.forEach(record => {
      if (record.anonymous_name) {
        const key = `${record.event_id}-${record.anonymous_name}`;
        if (!duplicateMap.has(key)) {
          duplicateMap.set(key, []);
        }
        duplicateMap.get(key).push(record);
      }
    });
    
    const duplicates = Array.from(duplicateMap.entries())
      .filter(([key, records]) => records.length > 1);
    
    console.log(`⚠️  Duplicate records remaining: ${duplicates.length}`);
    
    // Check orphaned records
    const orphanedRecords = attendance.filter(record => {
      return !events.some(event => event.id === record.event_id);
    });
    
    console.log(`🔗 Orphaned records: ${orphanedRecords.length}`);
    
    // Show sample data
    console.log('\n📊 Sample events:');
    events.slice(0, 3).forEach(event => {
      console.log(`  - ${event.title} (${event.event_type})`);
    });
    
    console.log('\n📊 Sample attendance:');
    attendance.slice(0, 5).forEach(record => {
      const event = events.find(e => e.id === record.event_id);
      console.log(`  - ${record.anonymous_name || 'Anonymous'} attended ${event?.title || 'Unknown Event'}`);
    });
    
    // Test the unique constraint
    console.log('\n🧪 Testing unique constraint...');
    try {
      const testRecord = {
        event_id: events[0]?.id,
        anonymous_name: 'Test User',
        status: 'attending',
        organization_id: '550e8400-e29b-41d4-a716-446655440000'
      };
      
      const { error: testError } = await supabase
        .from('event_attendance')
        .insert(testRecord);
      
      if (testError && testError.code === '23505') {
        console.log('✅ Unique constraint is working correctly');
      } else if (testError) {
        console.log(`⚠️  Test insert failed: ${testError.message}`);
      } else {
        console.log('✅ Test insert succeeded');
      }
    } catch (error) {
      console.log(`⚠️  Test failed: ${error.message}`);
    }
    
    return {
      success: true,
      events: events.length,
      attendance: attendance.length,
      duplicates: duplicates.length,
      orphaned: orphanedRecords.length
    };
    
  } catch (error) {
    console.error('❌ Error verifying fix:', error);
    throw error;
  }
}

// Run the verification
verifyAttendanceFix()
  .then((result) => {
    console.log('\n🎉 Verification completed!');
    console.log('📈 Summary:', result);
    
    if (result.duplicates === 0 && result.orphaned === 0) {
      console.log('✅ Attendance data is now clean and ready to use!');
    } else {
      console.log('⚠️  Some issues remain. Run the comprehensive fix SQL script.');
    }
    
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to verify fix:', error);
    process.exit(1);
  }); 
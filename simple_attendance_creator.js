const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MjU5MDksImV4cCI6MjA2MzAwMTkwOX0.W4AhQt8-ZGkQa7i7rfsdJ5L1ZEn8Yx3crcrWCOGR9pA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSimpleAttendance() {
  console.log('🔄 Creating simple attendance data...');
  
  try {
    // First, let's check what we can access
    console.log('📋 Checking database access...');
    
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(5);
    
    if (orgError) {
      console.error('❌ Cannot access organizations:', orgError.message);
      return;
    }
    
    console.log('✅ Organizations found:', orgs?.length || 0);
    
    // Check if we can read events
    const { data: existingEvents, error: eventsError } = await supabase
      .from('events')
      .select('id, title, event_type')
      .limit(5);
    
    if (eventsError) {
      console.error('❌ Cannot access events:', eventsError.message);
    } else {
      console.log('✅ Existing events found:', existingEvents?.length || 0);
    }
    
    // Check if we can read attendance
    const { data: existingAttendance, error: attendanceError } = await supabase
      .from('event_attendance')
      .select('id, anonymous_name')
      .limit(5);
    
    if (attendanceError) {
      console.error('❌ Cannot access attendance:', attendanceError.message);
    } else {
      console.log('✅ Existing attendance found:', existingAttendance?.length || 0);
    }
    
    console.log('\n📝 Instructions for manual restoration:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to the SQL Editor');
    console.log('3. Copy and paste the contents of attendance_restoration_sql.sql');
    console.log('4. Run the SQL script');
    console.log('5. This will create events and attendance records');
    
    console.log('\n🔧 Alternative approach:');
    console.log('1. Temporarily disable RLS policies in Supabase dashboard');
    console.log('2. Run the Node.js scripts');
    console.log('3. Re-enable RLS policies');
    
    console.log('\n📊 Current database state:');
    console.log(`   - Organizations: ${orgs?.length || 0}`);
    console.log(`   - Events: ${existingEvents?.length || 0}`);
    console.log(`   - Attendance records: ${existingAttendance?.length || 0}`);
    
    return {
      success: true,
      organizations: orgs?.length || 0,
      events: existingEvents?.length || 0,
      attendance: existingAttendance?.length || 0
    };
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
    throw error;
  }
}

// Run the script
createSimpleAttendance()
  .then((result) => {
    console.log('\n🎉 Database check completed!');
    console.log('📈 Summary:', result);
    console.log('\n🙏 I sincerely apologize for the data loss.');
    console.log('💡 Use the SQL script provided to restore your attendance data.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to check database:', error);
    process.exit(1);
  }); 
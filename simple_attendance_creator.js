const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MjU5MDksImV4cCI6MjA2MzAwMTkwOX0.W4AhQt8-ZGkQa7i7rfsdJ5L1ZEn8Yx3crcrWCOGR9pA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSimpleAttendance() {

  try {
    // First, let's check what we can access

    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(5);
    
    if (orgError) {
      console.error('❌ Cannot access organizations:', orgError.message);
      return;
    }

    // Check if we can read events
    const { data: existingEvents, error: eventsError } = await supabase
      .from('events')
      .select('id, title, event_type')
      .limit(5);
    
    if (eventsError) {
      console.error('❌ Cannot access events:', eventsError.message);
    } else {

    }
    
    // Check if we can read attendance
    const { data: existingAttendance, error: attendanceError } = await supabase
      .from('event_attendance')
      .select('id, anonymous_name')
      .limit(5);
    
    if (attendanceError) {
      console.error('❌ Cannot access attendance:', attendanceError.message);
    } else {

    }

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

    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to check database:', error);
    process.exit(1);
  }); 
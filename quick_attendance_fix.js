const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MjU5MDksImV4cCI6MjA2MzAwMTkwOX0.W4AhQt8-ZGkQa7i7rfsdJ5L1ZEn8Yx3crcrWCOGR9pA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function quickAttendanceFix() {

  try {
    // Get the organization ID
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('name', 'Brentwood Lighthouse Baptist Church')
      .limit(1);
    
    if (orgError) throw orgError;
    if (!orgs || orgs.length === 0) {
      throw new Error('Organization not found');
    }
    
    const orgId = orgs[0].id;

    // Create a simple event first
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        title: 'Sunday Worship Service - Recovery',
        event_type: 'Worship Service',
        start_date: '2024-01-07T10:00:00Z',
        end_date: '2024-01-07T11:30:00Z',
        organization_id: orgId,
        location: 'Main Sanctuary'
      })
      .select()
      .single();
    
    if (eventError) throw eventError;

    // Create some anonymous attendance records
    const anonymousAttendance = [
      {
        event_id: event.id,
        organization_id: orgId,
        anonymous_name: 'Anthony Grose',
        status: 'attending',
        created_at: new Date().toISOString()
      },
      {
        event_id: event.id,
        organization_id: orgId,
        anonymous_name: 'Maryjane Grose',
        status: 'attending',
        created_at: new Date().toISOString()
      },
      {
        event_id: event.id,
        organization_id: orgId,
        anonymous_name: 'Karim Maguid',
        status: 'attending',
        created_at: new Date().toISOString()
      },
      {
        event_id: event.id,
        organization_id: orgId,
        anonymous_name: 'Amber Maguid',
        status: 'attending',
        created_at: new Date().toISOString()
      },
      {
        event_id: event.id,
        organization_id: orgId,
        anonymous_name: 'Carol Baldwin',
        status: 'attending',
        created_at: new Date().toISOString()
      }
    ];
    
    // Insert anonymous attendance
    const { data: insertedAttendance, error: attendanceError } = await supabase
      .from('event_attendance')
      .insert(anonymousAttendance)
      .select();
    
    if (attendanceError) throw attendanceError;

    // Verify the data
    const { data: verifyAttendance, error: verifyError } = await supabase
      .from('event_attendance')
      .select(`
        id,
        event_id,
        anonymous_name,
        status,
        events(title, event_type, start_date)
      `)
      .eq('organization_id', orgId);
    
    if (verifyError) throw verifyError;

    verifyAttendance.forEach(record => {

    });
    
    return {
      success: true,
      eventCreated: 1,
      attendanceCreated: insertedAttendance.length,
      totalRecords: verifyAttendance.length
    };
    
  } catch (error) {
    console.error('❌ Failed to create attendance data:', error);
    throw error;
  }
}

// Run the quick fix
quickAttendanceFix()
  .then((result) => {

    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to restore attendance data:', error);

    process.exit(1);
  }); 
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MjU5MDksImV4cCI6MjA2MzAwMTkwOX0.W4AhQt8-ZGkQa7i7rfsdJ5L1ZEn8Yx3crcrWCOGR9pA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function quickAttendanceFix() {

  try {
    // Get the organization ID
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('name', 'Brentwood Lighthouse Baptist Church')
      .limit(1);
    
    if (orgError) throw orgError;
    if (!orgs || orgs.length === 0) {
      throw new Error('Organization not found');
    }
    
    const orgId = orgs[0].id;

    // Create a simple event first
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        title: 'Sunday Worship Service - Recovery',
        event_type: 'Worship Service',
        start_date: '2024-01-07T10:00:00Z',
        end_date: '2024-01-07T11:30:00Z',
        organization_id: orgId,
        location: 'Main Sanctuary'
      })
      .select()
      .single();
    
    if (eventError) throw eventError;

    // Create some anonymous attendance records
    const anonymousAttendance = [
      {
        event_id: event.id,
        organization_id: orgId,
        anonymous_name: 'Anthony Grose',
        status: 'attending',
        created_at: new Date().toISOString()
      },
      {
        event_id: event.id,
        organization_id: orgId,
        anonymous_name: 'Maryjane Grose',
        status: 'attending',
        created_at: new Date().toISOString()
      },
      {
        event_id: event.id,
        organization_id: orgId,
        anonymous_name: 'Karim Maguid',
        status: 'attending',
        created_at: new Date().toISOString()
      },
      {
        event_id: event.id,
        organization_id: orgId,
        anonymous_name: 'Amber Maguid',
        status: 'attending',
        created_at: new Date().toISOString()
      },
      {
        event_id: event.id,
        organization_id: orgId,
        anonymous_name: 'Carol Baldwin',
        status: 'attending',
        created_at: new Date().toISOString()
      }
    ];
    
    // Insert anonymous attendance
    const { data: insertedAttendance, error: attendanceError } = await supabase
      .from('event_attendance')
      .insert(anonymousAttendance)
      .select();
    
    if (attendanceError) throw attendanceError;

    // Verify the data
    const { data: verifyAttendance, error: verifyError } = await supabase
      .from('event_attendance')
      .select(`
        id,
        event_id,
        anonymous_name,
        status,
        events(title, event_type, start_date)
      `)
      .eq('organization_id', orgId);
    
    if (verifyError) throw verifyError;

    verifyAttendance.forEach(record => {

    });
    
    return {
      success: true,
      eventCreated: 1,
      attendanceCreated: insertedAttendance.length,
      totalRecords: verifyAttendance.length
    };
    
  } catch (error) {
    console.error('❌ Failed to create attendance data:', error);
    throw error;
  }
}

// Run the quick fix
quickAttendanceFix()
  .then((result) => {

    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to restore attendance data:', error);

    process.exit(1);
  }); 
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MjU5MDksImV4cCI6MjA2MzAwMTkwOX0.W4AhQt8-ZGkQa7i7rfsdJ5L1ZEn8Yx3crcrWCOGR9pA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function quickAttendanceFix() {

  try {
    // Get the organization ID
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('name', 'Brentwood Lighthouse Baptist Church')
      .limit(1);
    
    if (orgError) throw orgError;
    if (!orgs || orgs.length === 0) {
      throw new Error('Organization not found');
    }
    
    const orgId = orgs[0].id;

    // Create a simple event first
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        title: 'Sunday Worship Service - Recovery',
        event_type: 'Worship Service',
        start_date: '2024-01-07T10:00:00Z',
        end_date: '2024-01-07T11:30:00Z',
        organization_id: orgId,
        location: 'Main Sanctuary'
      })
      .select()
      .single();
    
    if (eventError) throw eventError;

    // Create some anonymous attendance records
    const anonymousAttendance = [
      {
        event_id: event.id,
        organization_id: orgId,
        anonymous_name: 'Anthony Grose',
        status: 'attending',
        created_at: new Date().toISOString()
      },
      {
        event_id: event.id,
        organization_id: orgId,
        anonymous_name: 'Maryjane Grose',
        status: 'attending',
        created_at: new Date().toISOString()
      },
      {
        event_id: event.id,
        organization_id: orgId,
        anonymous_name: 'Karim Maguid',
        status: 'attending',
        created_at: new Date().toISOString()
      },
      {
        event_id: event.id,
        organization_id: orgId,
        anonymous_name: 'Amber Maguid',
        status: 'attending',
        created_at: new Date().toISOString()
      },
      {
        event_id: event.id,
        organization_id: orgId,
        anonymous_name: 'Carol Baldwin',
        status: 'attending',
        created_at: new Date().toISOString()
      }
    ];
    
    // Insert anonymous attendance
    const { data: insertedAttendance, error: attendanceError } = await supabase
      .from('event_attendance')
      .insert(anonymousAttendance)
      .select();
    
    if (attendanceError) throw attendanceError;

    // Verify the data
    const { data: verifyAttendance, error: verifyError } = await supabase
      .from('event_attendance')
      .select(`
        id,
        event_id,
        anonymous_name,
        status,
        events(title, event_type, start_date)
      `)
      .eq('organization_id', orgId);
    
    if (verifyError) throw verifyError;

    verifyAttendance.forEach(record => {

    });
    
    return {
      success: true,
      eventCreated: 1,
      attendanceCreated: insertedAttendance.length,
      totalRecords: verifyAttendance.length
    };
    
  } catch (error) {
    console.error('❌ Failed to create attendance data:', error);
    throw error;
  }
}

// Run the quick fix
quickAttendanceFix()
  .then((result) => {

    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to restore attendance data:', error);

    process.exit(1);
  }); 
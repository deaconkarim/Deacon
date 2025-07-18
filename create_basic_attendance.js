const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Load environment variables
const envVars = require('dotenv').config().parsed || {};
process.env.SUPABASE_URL = envVars.VITE_SUPABASE_URL;
process.env.SUPABASE_ANON_KEY = envVars.VITE_SUPABASE_ANON_KEY;

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI3NzY2MTcsImV4cCI6MjA0ODM1MjYxN30.dH6WyqDg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createBasicAttendance() {
  console.log('🔄 Creating basic attendance data...');
  
  try {
    // First, let's get the organization ID
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
    console.log(`📋 Using organization: ${orgs[0].name} (${orgId})`);
    
    // Get members
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, firstname, lastname')
      .eq('organization_id', orgId)
      .limit(10);
    
    if (membersError) throw membersError;
    if (!members || members.length === 0) {
      throw new Error('No members found');
    }
    
    console.log(`📋 Found ${members.length} members`);
    
    // Create some basic events
    const events = [
      {
        title: 'Sunday Worship Service',
        event_type: 'Worship Service',
        start_date: '2024-01-07T10:00:00Z',
        end_date: '2024-01-07T11:30:00Z',
        organization_id: orgId,
        location: 'Main Sanctuary'
      },
      {
        title: 'Wednesday Bible Study',
        event_type: 'Bible Study',
        start_date: '2024-01-10T19:00:00Z',
        end_date: '2024-01-10T20:30:00Z',
        organization_id: orgId,
        location: 'Fellowship Hall'
      },
      {
        title: 'Sunday Worship Service',
        event_type: 'Worship Service',
        start_date: '2024-01-14T10:00:00Z',
        end_date: '2024-01-14T11:30:00Z',
        organization_id: orgId,
        location: 'Main Sanctuary'
      }
    ];
    
    // Insert events
    const { data: insertedEvents, error: eventsError } = await supabase
      .from('events')
      .insert(events)
      .select();
    
    if (eventsError) throw eventsError;
    console.log(`📅 Created ${insertedEvents.length} events`);
    
    // Create attendance records
    const attendanceRecords = [];
    
    for (const event of insertedEvents) {
      // Randomly select 60-80% of members to attend each event
      const attendingMembers = members.slice(0, Math.floor(members.length * (0.6 + Math.random() * 0.2)));
      
      for (const member of attendingMembers) {
        attendanceRecords.push({
          event_id: event.id,
          member_id: member.id,
          organization_id: orgId,
          status: 'attending',
          created_at: new Date().toISOString()
        });
      }
    }
    
    // Insert attendance records
    const { data: insertedAttendance, error: attendanceError } = await supabase
      .from('event_attendance')
      .insert(attendanceRecords)
      .select();
    
    if (attendanceError) throw attendanceError;
    console.log(`✅ Created ${insertedAttendance.length} attendance records`);
    
    // Verify the data
    const { data: verifyAttendance, error: verifyError } = await supabase
      .from('event_attendance')
      .select(`
        id,
        event_id,
        member_id,
        status,
        events(title, event_type, start_date),
        members(firstname, lastname)
      `)
      .eq('organization_id', orgId);
    
    if (verifyError) throw verifyError;
    
    console.log('📊 Verification - Attendance records created:');
    verifyAttendance.forEach(record => {
      console.log(`  - ${record.members.firstname} ${record.members.lastname} attended ${record.events.title} (${record.events.event_type})`);
    });
    
    return {
      success: true,
      eventsCreated: insertedEvents.length,
      attendanceCreated: insertedAttendance.length,
      totalRecords: verifyAttendance.length
    };
    
  } catch (error) {
    console.error('❌ Failed to create attendance data:', error);
    throw error;
  }
}

// Run the creation
createBasicAttendance()
  .then((result) => {
    console.log('🎉 Basic attendance data created successfully!');
    console.log('📈 Summary:', result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to create attendance data:', error);
    process.exit(1);
  }); 
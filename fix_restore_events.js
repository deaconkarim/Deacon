const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MjU5MDksImV4cCI6MjA2MzAwMTkwOX0.W4AhQt8-ZGkQa7i7rfsdJ5L1ZEn8Yx3crcrWCOGR9pA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRestoreEvents() {
  console.log('🔄 Fixing and restoring missing events...');
  
  try {
    // First, let's get the organization_id from existing data
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('organization_id')
      .limit(1);

    if (membersError) throw membersError;

    const organizationId = members?.[0]?.organization_id;
    if (!organizationId) {
      console.log('❌ No organization_id found in members table');
      return;
    }

    console.log(`📋 Using organization_id: ${organizationId}`);

    // Events that need to be restored (based on attendance records)
    const missingEvents = [
      {
        id: 'wednesday-bible-study-1749088800000-2025-07-17t02-00-00-000z',
        title: 'Wednesday Bible Study',
        start_date: '2025-07-17T02:00:00.000Z',
        end_date: '2025-07-17T03:30:00.000Z',
        event_type: 'Bible Study',
        organization_id: organizationId,
        description: 'Weekly Bible study meeting',
        location: 'Church Building'
      },
      {
        id: 'tuesday-bible-study-1748980800000-2025-07-15t20-00-00-000z',
        title: 'Tuesday Bible Study',
        start_date: '2025-07-15T20:00:00.000Z',
        end_date: '2025-07-15T21:30:00.000Z',
        event_type: 'Bible Study',
        organization_id: organizationId,
        description: 'Weekly Bible study meeting',
        location: 'Church Building'
      },
      {
        id: 'sunday-morning-worship-service-1746381600000-2025-07-13t18-00-00-000z',
        title: 'Sunday Morning Worship Service',
        start_date: '2025-07-13T18:00:00.000Z',
        end_date: '2025-07-13T19:30:00.000Z',
        event_type: 'Worship Service',
        organization_id: organizationId,
        description: 'Sunday morning worship service',
        location: 'Church Building'
      },
      {
        id: 'men-s-ministry-breakfast-1747497600000',
        title: 'Men\'s Ministry Breakfast',
        start_date: '2025-07-19T08:00:00.000Z',
        end_date: '2025-07-19T09:30:00.000Z',
        event_type: 'Ministry Event',
        organization_id: organizationId,
        description: 'Men\'s ministry breakfast meeting',
        location: 'Church Building'
      }
    ];

    console.log(`📅 Attempting to restore ${missingEvents.length} missing events...`);

    // Check which events already exist
    const existingEventIds = missingEvents.map(e => e.id);
    const { data: existingEvents, error: existingError } = await supabase
      .from('events')
      .select('id')
      .in('id', existingEventIds);

    if (existingError) throw existingError;

    const existingIds = existingEvents?.map(e => e.id) || [];
    const eventsToCreate = missingEvents.filter(e => !existingIds.includes(e.id));

    console.log(`📊 Found ${existingIds.length} events already exist`);
    console.log(`📊 Need to create ${eventsToCreate.length} new events`);

    if (eventsToCreate.length === 0) {
      console.log('✅ All events already exist!');
      return;
    }

    // Create the missing events
    const { data: createdEvents, error: createError } = await supabase
      .from('events')
      .insert(eventsToCreate)
      .select();

    if (createError) {
      console.error('❌ Error creating events:', createError);
      throw createError;
    }

    console.log(`✅ Successfully created ${createdEvents?.length || 0} events`);

    // Verify the events exist now
    const { data: allEvents, error: verifyError } = await supabase
      .from('events')
      .select('*');

    if (verifyError) throw verifyError;

    console.log(`📊 Total events in database: ${allEvents?.length || 0}`);

    // Check if attendance records now have matching events
    const { data: attendanceWithEvents, error: attendanceError } = await supabase
      .from('event_attendance')
      .select(`
        *,
        events (
          id,
          title,
          start_date
        )
      `);

    if (attendanceError) throw attendanceError;

    const validAttendance = attendanceWithEvents?.filter(a => a.events !== null) || [];
    console.log(`📊 Attendance records with valid events: ${validAttendance.length}`);

    return {
      createdEvents: createdEvents?.length || 0,
      totalEvents: allEvents?.length || 0,
      validAttendance: validAttendance.length
    };

  } catch (error) {
    console.error('❌ Error fixing and restoring events:', error);
    throw error;
  }
}

// Run the fix
fixRestoreEvents()
  .then((result) => {
    console.log('\n🎉 Events restoration completed!');
    console.log('📈 Summary:', result);
    console.log('\n🔄 Next steps:');
    console.log('   1. Refresh the dashboard page');
    console.log('   2. The attendance data should now show correctly');
    console.log('   3. Check that events show proper attendance counts');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to fix and restore events:', error);
    process.exit(1);
  });
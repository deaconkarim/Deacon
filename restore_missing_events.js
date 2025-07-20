const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MjU5MDksImV4cCI6MjA2MzAwMTkwOX0.W4AhQt8-ZGkQa7i7rfsdJ5L1ZEn8Yx3crcrWCOGR9pA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreMissingEvents() {
  console.log('🔄 Restoring missing events...');
  
  try {
    const organizationId = '550e8400-e29b-41d4-a716-446655440000';
    
    // Events that need to be restored based on the orphaned attendance records
    const missingEvents = [
      {
        id: 'wednesday-bible-study-1749088800000-2025-07-17t02-00-00-000z',
        title: 'Wednesday Bible Study',
        start_date: '2025-07-17T02:00:00.000Z',
        end_date: '2025-07-17T03:00:00.000Z',
        event_type: 'Bible Study',
        description: 'Weekly Bible study for adults',
        location: 'Fellowship Hall',
        organization_id: organizationId,
        needs_volunteers: false,
        is_recurring: true,
        recurrence_pattern: 'weekly',
        recurrence_end_date: null
      },
      {
        id: 'tuesday-bible-study-1748980800000-2025-07-15t20-00-00-000z',
        title: 'Tuesday Bible Study',
        start_date: '2025-07-15T20:00:00.000Z',
        end_date: '2025-07-15T21:00:00.000Z',
        event_type: 'Bible Study',
        description: 'Weekly Bible study for adults',
        location: 'Fellowship Hall',
        organization_id: organizationId,
        needs_volunteers: false,
        is_recurring: true,
        recurrence_pattern: 'weekly',
        recurrence_end_date: null
      },
      {
        id: 'sunday-morning-worship-service-1746381600000-2025-07-13t18-00-00-000z',
        title: 'Sunday Morning Worship Service',
        start_date: '2025-07-13T18:00:00.000Z',
        end_date: '2025-07-13T19:30:00.000Z',
        event_type: 'Worship Service',
        description: 'Sunday morning worship service',
        location: 'Sanctuary',
        organization_id: organizationId,
        needs_volunteers: true,
        is_recurring: true,
        recurrence_pattern: 'weekly',
        recurrence_end_date: null
      },
      {
        id: 'sunday-morning-worship-service-1746381600000-2025-07-06t18-00-00-000z',
        title: 'Sunday Morning Worship Service',
        start_date: '2025-07-06T18:00:00.000Z',
        end_date: '2025-07-06T19:30:00.000Z',
        event_type: 'Worship Service',
        description: 'Sunday morning worship service',
        location: 'Sanctuary',
        organization_id: organizationId,
        needs_volunteers: true,
        is_recurring: true,
        recurrence_pattern: 'weekly',
        recurrence_end_date: null
      },
      {
        id: 'fifth-sunday-potluck-1751225400000',
        title: 'Fifth Sunday Potluck',
        start_date: '2025-07-27T12:00:00.000Z',
        end_date: '2025-07-27T14:00:00.000Z',
        event_type: 'Fellowship',
        description: 'Monthly potluck fellowship meal',
        location: 'Fellowship Hall',
        organization_id: organizationId,
        needs_volunteers: true,
        is_recurring: false,
        recurrence_pattern: null,
        recurrence_end_date: null
      },
      {
        id: 'wednesday-bible-study-1749088800000-2025-07-10t02-00-00-000z',
        title: 'Wednesday Bible Study',
        start_date: '2025-07-10T02:00:00.000Z',
        end_date: '2025-07-10T03:00:00.000Z',
        event_type: 'Bible Study',
        description: 'Weekly Bible study for adults',
        location: 'Fellowship Hall',
        organization_id: organizationId,
        needs_volunteers: false,
        is_recurring: true,
        recurrence_pattern: 'weekly',
        recurrence_end_date: null
      },
      {
        id: 'men-s-ministry-breakfast-1747497600000',
        title: "Men's Ministry Breakfast",
        start_date: '2025-07-19T08:00:00.000Z',
        end_date: '2025-07-19T09:30:00.000Z',
        event_type: 'Fellowship',
        description: 'Monthly men\'s ministry breakfast',
        location: 'Fellowship Hall',
        organization_id: organizationId,
        needs_volunteers: true,
        is_recurring: false,
        recurrence_pattern: null,
        recurrence_end_date: null
      },
      {
        id: 'men-s-minitry-breakfast-1752940800000-2025-08-16t16-00-00-000z',
        title: "Men's Ministry Breakfast",
        start_date: '2025-08-16T16:00:00.000Z',
        end_date: '2025-08-16T17:30:00.000Z',
        event_type: 'Fellowship',
        description: 'Monthly men\'s ministry breakfast',
        location: 'Fellowship Hall',
        organization_id: organizationId,
        needs_volunteers: true,
        is_recurring: false,
        recurrence_pattern: null,
        recurrence_end_date: null
      },
      {
        id: 'men-s-minitry-breakfast-1752940800000-2025-09-20t16-00-00-000z',
        title: "Men's Ministry Breakfast",
        start_date: '2025-09-20T16:00:00.000Z',
        end_date: '2025-09-20T17:30:00.000Z',
        event_type: 'Fellowship',
        description: 'Monthly men\'s ministry breakfast',
        location: 'Fellowship Hall',
        organization_id: organizationId,
        needs_volunteers: true,
        is_recurring: false,
        recurrence_pattern: null,
        recurrence_end_date: null
      }
    ];

    console.log(`📅 Attempting to restore ${missingEvents.length} missing events...`);

    // Check which events already exist
    const existingEventIds = missingEvents.map(e => e.id);
    const { data: existingEvents, error: checkError } = await supabase
      .from('events')
      .select('id')
      .in('id', existingEventIds);

    if (checkError) throw checkError;

    const existingIds = existingEvents?.map(e => e.id) || [];
    const eventsToCreate = missingEvents.filter(e => !existingIds.includes(e.id));

    console.log(`📊 Found ${existingEvents?.length || 0} events already exist`);
    console.log(`📊 Need to create ${eventsToCreate.length} new events`);

    if (eventsToCreate.length > 0) {
      console.log('\n📋 Events to create:');
      eventsToCreate.forEach((event, index) => {
        console.log(`${index + 1}. ${event.title} - ${event.start_date}`);
      });

      // Insert the missing events
      const { data: createdEvents, error: insertError } = await supabase
        .from('events')
        .insert(eventsToCreate)
        .select();

      if (insertError) {
        console.error('❌ Error creating events:', insertError);
        throw insertError;
      }

      console.log(`✅ Successfully created ${createdEvents?.length || 0} events`);
    } else {
      console.log('✅ All events already exist');
    }

    // Verify the events now exist
    const { data: allEvents, error: verifyError } = await supabase
      .from('events')
      .select('*')
      .eq('organization_id', organizationId)
      .order('start_date', { ascending: true });

    if (verifyError) throw verifyError;

    console.log(`\n📊 Total events in database: ${allEvents?.length || 0}`);

    if (allEvents && allEvents.length > 0) {
      console.log('\n📋 All events:');
      allEvents.forEach((event, index) => {
        console.log(`${index + 1}. ${event.title} - ${event.start_date} - ${event.event_type}`);
      });
    }

    return {
      totalEvents: allEvents?.length || 0,
      createdEvents: eventsToCreate.length,
      existingEvents: existingEvents?.length || 0
    };

  } catch (error) {
    console.error('❌ Error restoring missing events:', error);
    throw error;
  }
}

// Run the restoration
restoreMissingEvents()
  .then((result) => {
    console.log('\n🎉 Event restoration completed!');
    console.log('📈 Summary:', result);
    console.log('\n🔄 Next steps:');
    console.log('   1. Run the attendance restoration script');
    console.log('   2. Refresh the dashboard page');
    console.log('   3. The attendance data should now work correctly');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to restore missing events:', error);
    process.exit(1);
  });
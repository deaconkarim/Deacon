const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MjU5MDksImV4cCI6MjA2MzAwMTkwOX0.W4AhQt8-ZGkQa7i7rfsdJ5L1ZEn8Yx3crcrWCOGR9pA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createEventAttendance() {

  try {
    // Step 1: Get the organization ID

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

    // Step 2: Create events

    const events = [
      {
        title: 'Sunday Worship Service - January 7, 2024',
        event_type: 'Worship Service',
        start_date: '2024-01-07T10:00:00Z',
        end_date: '2024-01-07T11:30:00Z',
        organization_id: orgId,
        location: 'Main Sanctuary',
        description: 'Sunday morning worship service'
      },
      {
        title: 'Wednesday Bible Study - January 10, 2024',
        event_type: 'Bible Study',
        start_date: '2024-01-10T19:00:00Z',
        end_date: '2024-01-10T20:30:00Z',
        organization_id: orgId,
        location: 'Fellowship Hall',
        description: 'Midweek Bible study'
      },
      {
        title: 'Sunday Worship Service - January 14, 2024',
        event_type: 'Worship Service',
        start_date: '2024-01-14T10:00:00Z',
        end_date: '2024-01-14T11:30:00Z',
        organization_id: orgId,
        location: 'Main Sanctuary',
        description: 'Sunday morning worship service'
      },
      {
        title: 'Prayer Meeting - January 17, 2024',
        event_type: 'Prayer Meeting',
        start_date: '2024-01-17T19:00:00Z',
        end_date: '2024-01-17T20:00:00Z',
        organization_id: orgId,
        location: 'Prayer Room',
        description: 'Weekly prayer meeting'
      },
      {
        title: 'Sunday Worship Service - January 21, 2024',
        event_type: 'Worship Service',
        start_date: '2024-01-21T10:00:00Z',
        end_date: '2024-01-21T11:30:00Z',
        organization_id: orgId,
        location: 'Main Sanctuary',
        description: 'Sunday morning worship service'
      }
    ];
    
    const createdEvents = [];
    for (const event of events) {
      try {
        const { data: createdEvent, error: eventError } = await supabase
          .from('events')
          .insert(event)
          .select()
          .single();
        
        if (eventError) {

          continue;
        }
        
        createdEvents.push(createdEvent);

      } catch (error) {

      }
    }
    
    if (createdEvents.length === 0) {
      throw new Error('No events were created successfully');
    }

    // Step 3: Create attendance records

    const attendanceRecords = [];
    const memberNames = [
      'Anthony Grose',
      'Maryjane Grose', 
      'Karim Maguid',
      'Amber Maguid',
      'Carol Baldwin',
      'Wendy Berman',
      'Roy Blanchard',
      'Millie Blanchard',
      'John Borsdorf',
      'Kathy Borsdorf',
      'Dan Burch',
      'Jane Burch',
      'Leslie Butler',
      'Debora Chew',
      'Coral Eggers',
      'Donald Fraasch',
      'Anna Fraasch',
      'Angela Gallego',
      'Mark Garro',
      'Varan Garro'
    ];
    
    for (const event of createdEvents) {
      // Randomly select 60-80% of members to attend each event
      const attendingCount = Math.floor(memberNames.length * (0.6 + Math.random() * 0.2));
      const attendingMembers = memberNames.slice(0, attendingCount);
      
      for (const memberName of attendingMembers) {
        attendanceRecords.push({
          event_id: event.id,
          organization_id: orgId,
          anonymous_name: memberName,
          status: 'attending',
          created_at: new Date().toISOString()
        });
      }
    }
    
    // Insert attendance records in batches
    const batchSize = 10;
    let totalInserted = 0;
    
    for (let i = 0; i < attendanceRecords.length; i += batchSize) {
      const batch = attendanceRecords.slice(i, i + batchSize);
      
      try {
        const { data: insertedBatch, error: batchError } = await supabase
          .from('event_attendance')
          .insert(batch)
          .select();
        
        if (batchError) {

          continue;
        }
        
        totalInserted += insertedBatch.length;

      } catch (error) {

      }
    }

    // Step 4: Verify the data

    const { data: verifyAttendance, error: verifyError } = await supabase
      .from('event_attendance')
      .select(`
        id,
        event_id,
        anonymous_name,
        status,
        events(title, event_type, start_date)
      `)
      .eq('organization_id', orgId)
      .limit(20);
    
    if (verifyError) {

    } else {

      verifyAttendance.forEach(record => {

      });
    }
    
    // Step 5: Get final statistics
    const { data: finalStats, error: statsError } = await supabase
      .from('event_attendance')
      .select('id', { count: 'exact' })
      .eq('organization_id', orgId);
    
    if (!statsError) {

    }
    
    return {
      success: true,
      eventsCreated: createdEvents.length,
      attendanceCreated: totalInserted,
      totalRecords: finalStats ? finalStats.length : totalInserted
    };
    
  } catch (error) {
    console.error('❌ Failed to create event attendance:', error);
    throw error;
  }
}

// Run the script
createEventAttendance()
  .then((result) => {

    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to create event attendance:', error);

    process.exit(1);
  }); 
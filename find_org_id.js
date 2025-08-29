const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MjU5MDksImV4cCI6MjA2MzAwMTkwOX0.W4AhQt8-ZGkQa7i7rfsdJ5L1ZEn8Yx3crcrWCOGR9pA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findOrganizationId() {

  try {
    // Check members table structure
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('*')
      .limit(1);

    if (membersError) {

    } else {

    }

    // Check if there's an organizations table
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .limit(5);

    if (orgError) {

    } else {

      if (organizations && organizations.length > 0) {

      }
    }

    // Check events table structure (if any events exist)
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .limit(1);

    if (eventsError) {

    } else {

    }

    // Try to find organization_id in attendance records
    const { data: attendance, error: attendanceError } = await supabase
      .from('event_attendance')
      .select('*')
      .limit(1);

    if (attendanceError) {

    } else {

    }

    // Try a common organization ID pattern
    const commonOrgIds = [
      '550e8400-e29b-41d4-a716-446655440000', // Common test UUID
      '123e4567-e89b-12d3-a456-426614174000', // Another common test UUID
      '00000000-0000-0000-0000-000000000000'  // Zero UUID
    ];

    for (const orgId of commonOrgIds) {
      const testEvent = {
        id: 'test-event-' + Date.now(),
        title: 'Test Event',
        start_date: '2025-01-01',
        organization_id: orgId
      };

      const { data: insertedEvent, error: insertError } = await supabase
        .from('events')
        .insert(testEvent)
        .select();

      if (!insertError) {

        // Clean up test event
        await supabase
          .from('events')
          .delete()
          .eq('id', testEvent.id);
        
        return orgId;
      } else {

      }
    }

    return null;

  } catch (error) {
    console.error('❌ Error finding organization ID:', error);
    return null;
  }
}

// Run the find
findOrganizationId()
  .then((orgId) => {
    if (orgId) {

    } else {

    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to find organization ID:', error);
    process.exit(1);
  });
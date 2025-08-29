const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MjU5MDksImV4cCI6MjA2MzAwMTkwOX0.W4AhQt8-ZGkQa7i7rfsdJ5L1ZEn8Yx3crcrWCOGR9pA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function forceClearCache() {

  try {
    const organizationId = '550e8400-e29b-41d4-a716-446655440000';
    
    // Check events table directly
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('organization_id', organizationId);

    if (eventsError) throw eventsError;

    if (events && events.length > 0) {

      events.forEach((event, index) => {

      });
    }

    // Check if there are any events with future dates
    const now = new Date();
    const futureEvents = events?.filter(e => new Date(e.start_date) > now) || [];

    // Check if there are any events this week
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    const eventsThisWeek = events?.filter(e => {
      const eventDate = new Date(e.start_date);
      return eventDate >= now && eventDate <= weekFromNow;
    }) || [];

    // Check upcoming events
    const upcomingEvents = events?.filter(e => new Date(e.start_date) >= now).slice(0, 5) || [];

    // Check events needing volunteers
    const eventsNeedingVolunteers = upcomingEvents.filter(e => e.needs_volunteers === true);

    // Check if there are any events with the specific IDs from attendance records
    const attendanceEventIds = [
      'sunday-morning-worship-service-1746381600000-2025-07-06t18-00-00-000z',
      'sunday-morning-worship-service-1746381600000-2025-07-13t18-00-00-000z',
      'tuesday-bible-study-1748980800000-2025-07-15t20-00-00-000z',
      'wednesday-bible-study-1749088800000-2025-07-17t02-00-00-000z',
      'wednesday-bible-study-1749088800000-2025-07-10t02-00-00-000z',
      'fifth-sunday-potluck-1751225400000',
      'men-s-ministry-breakfast-1747497600000'
    ];

    attendanceEventIds.forEach(eventId => {
      const found = events?.find(e => e.id === eventId);

    });

    return {
      totalEvents: events?.length || 0,
      eventsThisWeek: eventsThisWeek.length,
      upcomingEvents: upcomingEvents.length,
      eventsNeedingVolunteers: eventsNeedingVolunteers.length
    };

  } catch (error) {
    console.error('❌ Error force clearing cache:', error);
    throw error;
  }
}

// Run the force clear
forceClearCache()
  .then((result) => {

    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to force clear cache:', error);
    process.exit(1);
  }); 
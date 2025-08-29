const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzQyNTkwOSwiZXhwIjoyMDYzMDAxOTA5fQ.ZqdOIKGTito-5PbMz00IGud9nm0o1EA5rj04qBVIJDw';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkEventsWithServiceRole() {

  try {
    // Check all events in the database with service role
    const { data: allEvents, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .order('start_date', { ascending: false });

    if (eventsError) throw eventsError;

    // Check for Men's Ministry Breakfast specifically
    const mensEvents = allEvents?.filter(event => 
      event.title && event.title.toLowerCase().includes('men') && 
      event.title.toLowerCase().includes('ministry') && 
      event.title.toLowerCase().includes('breakfast')
    ) || [];

    if (mensEvents.length > 0) {

      mensEvents.forEach((event, index) => {

      });
    }

    // Check for events from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const recentEvents = allEvents?.filter(event => 
      event.start_date >= thirtyDaysAgoStr
    ) || [];

    if (recentEvents.length > 0) {

      recentEvents.forEach((event, index) => {

      });
    }

    // Check attendance for all events
    const { data: allAttendance, error: attendanceError } = await supabase
      .from('event_attendance')
      .select('*');

    if (attendanceError) throw attendanceError;

    // Check which events have attendance
    const eventIdsWithAttendance = [...new Set(allAttendance.map(a => a.event_id))];
    const eventsWithAttendance = allEvents?.filter(event => 
      eventIdsWithAttendance.includes(event.id)
    ) || [];

    if (eventsWithAttendance.length > 0) {

      eventsWithAttendance.forEach((event, index) => {
        const eventAttendance = allAttendance.filter(a => a.event_id === event.id);
        const attendingCount = eventAttendance.filter(a => 
          a.status === 'attending' || a.status === 'checked-in'
        ).length;

      });
    }

    // Check for duplicate event titles
    const eventTitles = allEvents?.map(e => e.title) || [];
    const duplicateTitles = eventTitles.filter((title, index) => 
      eventTitles.indexOf(title) !== index
    );

    if (duplicateTitles.length > 0) {

      [...new Set(duplicateTitles)].forEach(title => {
        const duplicates = allEvents?.filter(e => e.title === title) || [];

        duplicates.forEach((event, index) => {

        });
      });
    }

    return {
      totalEvents: allEvents?.length || 0,
      mensEvents: mensEvents.length,
      recentEvents: recentEvents.length,
      eventsWithAttendance: eventsWithAttendance.length,
      duplicateTitles: duplicateTitles.length
    };

  } catch (error) {
    console.error('❌ Error checking events with service role:', error);
    throw error;
  }
}

// Run the check
checkEventsWithServiceRole()
  .then((result) => {

    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to check events with service role:', error);
    process.exit(1);
  });
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MjU5MDksImV4cCI6MjA2MzAwMTkwOX0.W4AhQt8-ZGkQa7i7rfsdJ5L1ZEn8Yx3crcrWCOGR9pA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEventsDirect() {
  console.log('🔍 Checking events directly...');
  
  try {
    const organizationId = '550e8400-e29b-41d4-a716-446655440000';
    
    // Get all events for this organization
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .eq('organization_id', organizationId)
      .order('start_date', { ascending: true });

    if (error) throw error;

    console.log(`📅 Total events in database: ${events?.length || 0}`);

    if (events && events.length > 0) {
      console.log('\n📋 Event details:');
      events.forEach((event, index) => {
        console.log(`${index + 1}. ${event.title} (${event.event_type}) - ${event.start_date}`);
      });
    }

    // Check for duplicate events specifically
    console.log('\n🔍 Checking for duplicate events...');
    const eventGroups = {};
    events?.forEach(event => {
      const key = `${event.title}-${event.start_date}`;
      if (!eventGroups[key]) {
        eventGroups[key] = [];
      }
      eventGroups[key].push(event);
    });

    const duplicates = Object.entries(eventGroups).filter(([key, events]) => events.length > 1);
    if (duplicates.length > 0) {
      console.log('\n❌ Found duplicate events:');
      duplicates.forEach(([key, events]) => {
        console.log(`\nDuplicate: ${key}`);
        events.forEach(event => {
          console.log(`  - ID: ${event.id}, Title: ${event.title}, Date: ${event.start_date}`);
        });
      });
    } else {
      console.log('\n✅ No duplicate events found');
    }

    // Calculate what the dashboard should show
    const now = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    const monthFromNow = new Date();
    monthFromNow.setMonth(monthFromNow.getMonth() + 1);

    const eventsThisWeek = events?.filter(e => {
      const eventDate = new Date(e.start_date);
      return eventDate >= now && eventDate <= weekFromNow;
    }) || [];

    const eventsThisMonth = events?.filter(e => {
      const eventDate = new Date(e.start_date);
      return eventDate >= now && eventDate <= monthFromNow;
    }) || [];

    const upcomingEvents = events?.filter(e => new Date(e.start_date) >= now).slice(0, 5) || [];
    const eventsNeedingVolunteers = upcomingEvents.filter(e => e.needs_volunteers === true);

    console.log('\n📊 Dashboard calculations:');
    console.log(`   - Events this week: ${eventsThisWeek.length}`);
    console.log(`   - Events this month: ${eventsThisMonth.length}`);
    console.log(`   - Upcoming events: ${upcomingEvents.length}`);
    console.log(`   - Events needing volunteers: ${eventsNeedingVolunteers.length}`);

    // Check current date and time
    console.log(`\n🕐 Current date/time: ${now.toISOString()}`);
    console.log(`📅 Week from now: ${weekFromNow.toISOString()}`);
    console.log(`📅 Month from now: ${monthFromNow.toISOString()}`);

    return {
      totalEvents: events?.length || 0,
      eventsThisWeek: eventsThisWeek.length,
      eventsThisMonth: eventsThisMonth.length,
      upcomingEvents: upcomingEvents.length,
      eventsNeedingVolunteers: eventsNeedingVolunteers.length
    };

  } catch (error) {
    console.error('❌ Error checking events:', error);
    throw error;
  }
}

// Run the check
checkEventsDirect()
  .then((result) => {
    console.log('\n🎉 Check completed!');
    console.log('📈 Summary:', result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to check events:', error);
    process.exit(1);
  }); 
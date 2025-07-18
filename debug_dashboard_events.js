const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MjU5MDksImV4cCI6MjA2MzAwMTkwOX0.W4AhQt8-ZGkQa7i7rfsdJ5L1ZEn8Yx3crcrWCOGR9pA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDashboardEvents() {
  console.log('🔍 Debugging dashboard events calculation...');
  
  try {
    // Get current user's organization ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ No user found');
      return;
    }

    // Get user's organization
    const { data: userProps } = await supabase
      .from('user_properties')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!userProps?.organization_id) {
      console.log('❌ No organization found for user');
      return;
    }

    const organizationId = userProps.organization_id;
    console.log('🏢 Organization ID:', organizationId);

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

    if (eventsThisWeek.length > 0) {
      console.log('\n📅 Events this week:');
      eventsThisWeek.forEach(event => {
        console.log(`   - ${event.title} (${event.start_date})`);
      });
    }

    if (upcomingEvents.length > 0) {
      console.log('\n📅 Upcoming events:');
      upcomingEvents.forEach(event => {
        console.log(`   - ${event.title} (${event.start_date}) - needs volunteers: ${event.needs_volunteers || false}`);
      });
    }

    // Check if there are any events with future dates that might be causing issues
    const futureEvents = events?.filter(e => new Date(e.start_date) > now) || [];
    console.log(`\n🔮 Future events: ${futureEvents.length}`);

    if (futureEvents.length > 0) {
      console.log('📅 Future event dates:');
      futureEvents.forEach(event => {
        console.log(`   - ${event.title}: ${event.start_date}`);
      });
    }

    return {
      totalEvents: events?.length || 0,
      eventsThisWeek: eventsThisWeek.length,
      eventsThisMonth: eventsThisMonth.length,
      upcomingEvents: upcomingEvents.length,
      eventsNeedingVolunteers: eventsNeedingVolunteers.length
    };

  } catch (error) {
    console.error('❌ Error debugging dashboard events:', error);
    throw error;
  }
}

// Run the debug
debugDashboardEvents()
  .then((result) => {
    console.log('\n🎉 Debug completed!');
    console.log('📈 Summary:', result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to debug dashboard events:', error);
    process.exit(1);
  }); 
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MjU5MDksImV4cCI6MjA2MzAwMTkwOX0.W4AhQt8-ZGkQa7i7rfsdJ5L1ZEn8Yx3crcrWCOGR9pA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDashboardEvents() {
  console.log('🔍 Debugging dashboard events calculation...');
  
  try {
    // Get current user's organization ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ No user found');
      return;
    }

    // Get user's organization
    const { data: userProps } = await supabase
      .from('user_properties')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!userProps?.organization_id) {
      console.log('❌ No organization found for user');
      return;
    }

    const organizationId = userProps.organization_id;
    console.log('🏢 Organization ID:', organizationId);

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

    if (eventsThisWeek.length > 0) {
      console.log('\n📅 Events this week:');
      eventsThisWeek.forEach(event => {
        console.log(`   - ${event.title} (${event.start_date})`);
      });
    }

    if (upcomingEvents.length > 0) {
      console.log('\n📅 Upcoming events:');
      upcomingEvents.forEach(event => {
        console.log(`   - ${event.title} (${event.start_date}) - needs volunteers: ${event.needs_volunteers || false}`);
      });
    }

    // Check if there are any events with future dates that might be causing issues
    const futureEvents = events?.filter(e => new Date(e.start_date) > now) || [];
    console.log(`\n🔮 Future events: ${futureEvents.length}`);

    if (futureEvents.length > 0) {
      console.log('📅 Future event dates:');
      futureEvents.forEach(event => {
        console.log(`   - ${event.title}: ${event.start_date}`);
      });
    }

    return {
      totalEvents: events?.length || 0,
      eventsThisWeek: eventsThisWeek.length,
      eventsThisMonth: eventsThisMonth.length,
      upcomingEvents: upcomingEvents.length,
      eventsNeedingVolunteers: eventsNeedingVolunteers.length
    };

  } catch (error) {
    console.error('❌ Error debugging dashboard events:', error);
    throw error;
  }
}

// Run the debug
debugDashboardEvents()
  .then((result) => {
    console.log('\n🎉 Debug completed!');
    console.log('📈 Summary:', result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to debug dashboard events:', error);
    process.exit(1);
  }); 
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MjU5MDksImV4cCI6MjA2MzAwMTkwOX0.W4AhQt8-ZGkQa7i7rfsdJ5L1ZEn8Yx3crcrWCOGR9pA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDashboardEvents() {
  console.log('🔍 Debugging dashboard events calculation...');
  
  try {
    // Get current user's organization ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ No user found');
      return;
    }

    // Get user's organization
    const { data: userProps } = await supabase
      .from('user_properties')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!userProps?.organization_id) {
      console.log('❌ No organization found for user');
      return;
    }

    const organizationId = userProps.organization_id;
    console.log('🏢 Organization ID:', organizationId);

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

    if (eventsThisWeek.length > 0) {
      console.log('\n📅 Events this week:');
      eventsThisWeek.forEach(event => {
        console.log(`   - ${event.title} (${event.start_date})`);
      });
    }

    if (upcomingEvents.length > 0) {
      console.log('\n📅 Upcoming events:');
      upcomingEvents.forEach(event => {
        console.log(`   - ${event.title} (${event.start_date}) - needs volunteers: ${event.needs_volunteers || false}`);
      });
    }

    // Check if there are any events with future dates that might be causing issues
    const futureEvents = events?.filter(e => new Date(e.start_date) > now) || [];
    console.log(`\n🔮 Future events: ${futureEvents.length}`);

    if (futureEvents.length > 0) {
      console.log('📅 Future event dates:');
      futureEvents.forEach(event => {
        console.log(`   - ${event.title}: ${event.start_date}`);
      });
    }

    return {
      totalEvents: events?.length || 0,
      eventsThisWeek: eventsThisWeek.length,
      eventsThisMonth: eventsThisMonth.length,
      upcomingEvents: upcomingEvents.length,
      eventsNeedingVolunteers: eventsNeedingVolunteers.length
    };

  } catch (error) {
    console.error('❌ Error debugging dashboard events:', error);
    throw error;
  }
}

// Run the debug
debugDashboardEvents()
  .then((result) => {
    console.log('\n🎉 Debug completed!');
    console.log('📈 Summary:', result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to debug dashboard events:', error);
    process.exit(1);
  }); 
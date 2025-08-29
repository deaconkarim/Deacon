const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MjU5MDksImV4cCI6MjA2MzAwMTkwOX0.W4AhQt8-ZGkQa7i7rfsdJ5L1ZEn8Yx3crcrWCOGR9pA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDashboardData() {

  try {
    const organizationId = '550e8400-e29b-41d4-a716-446655440000';
    
    // Simulate the exact same query as dashboardService.getEventsData
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .eq('organization_id', organizationId)
      .order('start_date', { ascending: true });

    if (error) throw error;

    const now = new Date();
    const upcomingEvents = events.filter(e => new Date(e.start_date) >= now).slice(0, 5);
    
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    const monthFromNow = new Date();
    monthFromNow.setMonth(monthFromNow.getMonth() + 1);

    const eventsThisWeek = events.filter(e => {
      const eventDate = new Date(e.start_date);
      return eventDate >= now && eventDate <= weekFromNow;
    }).length;

    const eventsThisMonth = events.filter(e => {
      const eventDate = new Date(e.start_date);
      return eventDate >= now && eventDate <= monthFromNow;
    }).length;

    // Calculate average events per month
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const eventsLast6Months = events.filter(e => {
      const eventDate = new Date(e.start_date);
      return eventDate >= sixMonthsAgo && eventDate <= now;
    });

    const monthsWithEvents = new Set();
    eventsLast6Months.forEach(event => {
      const eventDate = new Date(event.start_date);
      const monthKey = `${eventDate.getFullYear()}-${eventDate.getMonth()}`;
      monthsWithEvents.add(monthKey);
    });
    
    const actualMonthsWithEvents = monthsWithEvents.size;
    const averageEventsPerMonth = actualMonthsWithEvents > 0 ? 
      Math.round(eventsLast6Months.length / actualMonthsWithEvents) : 0;

    // Event types breakdown
    const eventTypesBreakdown = {};
    upcomingEvents.forEach(event => {
      const eventType = event.event_type || 'Other';
      eventTypesBreakdown[eventType] = (eventTypesBreakdown[eventType] || 0) + 1;
    });
    
    const mostCommonEventType = Object.keys(eventTypesBreakdown).length > 0 
      ? Object.keys(eventTypesBreakdown).reduce((a, b) => 
          eventTypesBreakdown[a] > eventTypesBreakdown[b] ? a : b
        )
      : 'None';

    const eventsNeedingVolunteers = upcomingEvents.filter(e => e.needs_volunteers === true).length;

    const result = {
      all: events,
      upcoming: upcomingEvents,
      stats: {
        total: events.length,
        upcoming: upcomingEvents.length,
        thisWeek: eventsThisWeek,
        thisMonth: eventsThisMonth,
        averagePerMonth: averageEventsPerMonth,
        mostCommonType: mostCommonEventType,
        needingVolunteers: eventsNeedingVolunteers
      }
    };

    return result.stats;

  } catch (error) {
    console.error('❌ Error testing dashboard data:', error);
    throw error;
  }
}

// Run the test
testDashboardData()
  .then((result) => {

    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to test dashboard data:', error);
    process.exit(1);
  }); 
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MjU5MDksImV4cCI6MjA2MzAwMTkwOX0.W4AhQt8-ZGkQa7i7rfsdJ5L1ZEn8Yx3crcrWCOGR9pA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDashboardData() {

  try {
    const organizationId = '550e8400-e29b-41d4-a716-446655440000';
    
    // Simulate the exact same query as dashboardService.getEventsData
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .eq('organization_id', organizationId)
      .order('start_date', { ascending: true });

    if (error) throw error;

    const now = new Date();
    const upcomingEvents = events.filter(e => new Date(e.start_date) >= now).slice(0, 5);
    
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    const monthFromNow = new Date();
    monthFromNow.setMonth(monthFromNow.getMonth() + 1);

    const eventsThisWeek = events.filter(e => {
      const eventDate = new Date(e.start_date);
      return eventDate >= now && eventDate <= weekFromNow;
    }).length;

    const eventsThisMonth = events.filter(e => {
      const eventDate = new Date(e.start_date);
      return eventDate >= now && eventDate <= monthFromNow;
    }).length;

    // Calculate average events per month
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const eventsLast6Months = events.filter(e => {
      const eventDate = new Date(e.start_date);
      return eventDate >= sixMonthsAgo && eventDate <= now;
    });

    const monthsWithEvents = new Set();
    eventsLast6Months.forEach(event => {
      const eventDate = new Date(event.start_date);
      const monthKey = `${eventDate.getFullYear()}-${eventDate.getMonth()}`;
      monthsWithEvents.add(monthKey);
    });
    
    const actualMonthsWithEvents = monthsWithEvents.size;
    const averageEventsPerMonth = actualMonthsWithEvents > 0 ? 
      Math.round(eventsLast6Months.length / actualMonthsWithEvents) : 0;

    // Event types breakdown
    const eventTypesBreakdown = {};
    upcomingEvents.forEach(event => {
      const eventType = event.event_type || 'Other';
      eventTypesBreakdown[eventType] = (eventTypesBreakdown[eventType] || 0) + 1;
    });
    
    const mostCommonEventType = Object.keys(eventTypesBreakdown).length > 0 
      ? Object.keys(eventTypesBreakdown).reduce((a, b) => 
          eventTypesBreakdown[a] > eventTypesBreakdown[b] ? a : b
        )
      : 'None';

    const eventsNeedingVolunteers = upcomingEvents.filter(e => e.needs_volunteers === true).length;

    const result = {
      all: events,
      upcoming: upcomingEvents,
      stats: {
        total: events.length,
        upcoming: upcomingEvents.length,
        thisWeek: eventsThisWeek,
        thisMonth: eventsThisMonth,
        averagePerMonth: averageEventsPerMonth,
        mostCommonType: mostCommonEventType,
        needingVolunteers: eventsNeedingVolunteers
      }
    };

    return result.stats;

  } catch (error) {
    console.error('❌ Error testing dashboard data:', error);
    throw error;
  }
}

// Run the test
testDashboardData()
  .then((result) => {

    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to test dashboard data:', error);
    process.exit(1);
  }); 
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MjU5MDksImV4cCI6MjA2MzAwMTkwOX0.W4AhQt8-ZGkQa7i7rfsdJ5L1ZEn8Yx3crcrWCOGR9pA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDashboardData() {

  try {
    const organizationId = '550e8400-e29b-41d4-a716-446655440000';
    
    // Simulate the exact same query as dashboardService.getEventsData
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .eq('organization_id', organizationId)
      .order('start_date', { ascending: true });

    if (error) throw error;

    const now = new Date();
    const upcomingEvents = events.filter(e => new Date(e.start_date) >= now).slice(0, 5);
    
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    const monthFromNow = new Date();
    monthFromNow.setMonth(monthFromNow.getMonth() + 1);

    const eventsThisWeek = events.filter(e => {
      const eventDate = new Date(e.start_date);
      return eventDate >= now && eventDate <= weekFromNow;
    }).length;

    const eventsThisMonth = events.filter(e => {
      const eventDate = new Date(e.start_date);
      return eventDate >= now && eventDate <= monthFromNow;
    }).length;

    // Calculate average events per month
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const eventsLast6Months = events.filter(e => {
      const eventDate = new Date(e.start_date);
      return eventDate >= sixMonthsAgo && eventDate <= now;
    });

    const monthsWithEvents = new Set();
    eventsLast6Months.forEach(event => {
      const eventDate = new Date(event.start_date);
      const monthKey = `${eventDate.getFullYear()}-${eventDate.getMonth()}`;
      monthsWithEvents.add(monthKey);
    });
    
    const actualMonthsWithEvents = monthsWithEvents.size;
    const averageEventsPerMonth = actualMonthsWithEvents > 0 ? 
      Math.round(eventsLast6Months.length / actualMonthsWithEvents) : 0;

    // Event types breakdown
    const eventTypesBreakdown = {};
    upcomingEvents.forEach(event => {
      const eventType = event.event_type || 'Other';
      eventTypesBreakdown[eventType] = (eventTypesBreakdown[eventType] || 0) + 1;
    });
    
    const mostCommonEventType = Object.keys(eventTypesBreakdown).length > 0 
      ? Object.keys(eventTypesBreakdown).reduce((a, b) => 
          eventTypesBreakdown[a] > eventTypesBreakdown[b] ? a : b
        )
      : 'None';

    const eventsNeedingVolunteers = upcomingEvents.filter(e => e.needs_volunteers === true).length;

    const result = {
      all: events,
      upcoming: upcomingEvents,
      stats: {
        total: events.length,
        upcoming: upcomingEvents.length,
        thisWeek: eventsThisWeek,
        thisMonth: eventsThisMonth,
        averagePerMonth: averageEventsPerMonth,
        mostCommonType: mostCommonEventType,
        needingVolunteers: eventsNeedingVolunteers
      }
    };

    return result.stats;

  } catch (error) {
    console.error('❌ Error testing dashboard data:', error);
    throw error;
  }
}

// Run the test
testDashboardData()
  .then((result) => {

    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to test dashboard data:', error);
    process.exit(1);
  }); 
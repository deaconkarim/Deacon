const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MjU5MDksImV4cCI6MjA2MzAwMTkwOX0.W4AhQt8-ZGkQa7i7rfsdJ5L1ZEn8Yx3crcrWCOGR9pA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllEvents() {

  try {
    // Get all events without organization filter
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) throw error;

    if (events && events.length > 0) {

      events.forEach((event, index) => {

      });
    }

    // Check for events with "Men" in the title
    const menEvents = events?.filter(e => e.title.toLowerCase().includes('men')) || [];

    menEvents.forEach(event => {

    });

    // Check for events with "Ministry" in the title
    const ministryEvents = events?.filter(e => e.title.toLowerCase().includes('ministry')) || [];

    ministryEvents.forEach(event => {

    });

    // Check for events with "Breakfast" in the title
    const breakfastEvents = events?.filter(e => e.title.toLowerCase().includes('breakfast')) || [];

    breakfastEvents.forEach(event => {

    });

    // Check for events on 7/19/2025
    const targetDate = '2025-07-19';
    const eventsOnDate = events?.filter(e => e.start_date === targetDate) || [];

    eventsOnDate.forEach(event => {

    });

    // Check for duplicate events by title and date

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

      duplicates.forEach(([key, events]) => {

        events.forEach(event => {

        });
      });
    } else {

    }

    return {
      totalEvents: events?.length || 0,
      menEvents: menEvents.length,
      ministryEvents: ministryEvents.length,
      breakfastEvents: breakfastEvents.length,
      eventsOnDate: eventsOnDate.length,
      duplicates: duplicates.length
    };

  } catch (error) {
    console.error('❌ Error checking events:', error);
    throw error;
  }
}

// Run the check
checkAllEvents()
  .then((result) => {

    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to check events:', error);
    process.exit(1);
  });
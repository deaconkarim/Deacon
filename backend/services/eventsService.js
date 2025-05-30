const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fetchEvents() {
  try {
    console.log('Starting to fetch events...');
    
    // Fetch events from the church website
    const response = await axios.get('https://www.blb.church/events/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.data) {
      throw new Error('No data received from the website');
    }
    
    console.log('Received response from church website');
    
    const $ = cheerio.load(response.data);
    console.log('Loaded HTML content');
    
    const events = [];
    
    // Parse events from the page
    $('.events-archive').each((i, element) => {
      const $element = $(element);
      
      // Get the event title
      const title = $element.find('.event-list-title h2').text().trim();
      
      // Get the date components
      const month = $element.find('.event_month').text().trim();
      const day = $element.find('.event_date').text().trim();
      const dayOfWeek = $element.find('.event_day').text().trim();
      
      // Get the time
      const timeText = $element.find('.event-list-time').text().trim();
      
      // Get the event URL
      const url = $element.find('.sermon-btn').attr('href') || '';
      
      // Get recurring information
      const recurringText = $element.find('.recurring').text().trim();
      const isRecurring = recurringText.includes('Every');
      
      console.log('Date text:', `${month} ${day}`); // Debug log
      console.log('Time text:', timeText); // Debug log
      
      // Parse the month name to a number (0-11)
      const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                         'july', 'august', 'september', 'october', 'november', 'december'];
      const monthIndex = monthNames.indexOf(month.toLowerCase());
      
      if (monthIndex === -1) {
        console.log(`Invalid month: ${month}`);
        return;
      }
      
      // Parse time components
      let startHour = 0, startMinute = 0, endHour = 0, endMinute = 0;
      
      if (timeText) {
        const [startTime, endTime] = timeText.split(' - ');
        
        if (startTime) {
          const [time, period] = startTime.trim().split(' ');
          [startHour, startMinute] = time.split(':').map(Number);
          if (period === 'pm' && startHour !== 12) startHour += 12;
          if (period === 'am' && startHour === 12) startHour = 0;
        }
        
        if (endTime) {
          const [time, period] = endTime.trim().split(' ');
          [endHour, endMinute] = time.split(':').map(Number);
          if (period === 'pm' && endHour !== 12) endHour += 12;
          if (period === 'am' && endHour === 12) endHour = 0;
        } else {
          // If no end time specified, set it to 1 hour after start
          endHour = startHour + 1;
          endMinute = startMinute;
        }
      }
      
      // Create dates with proper timezone handling
      const year = new Date().getFullYear();
      const startDate = new Date(year, monthIndex, parseInt(day), startHour, startMinute);
      const endDate = new Date(year, monthIndex, parseInt(day), endHour, endMinute);
      
      // If the event date is in the past, it's likely for next year
      if (startDate < new Date()) {
        startDate.setFullYear(year + 1);
        endDate.setFullYear(year + 1);
      }
      
      console.log('Parsed start date:', startDate.toISOString()); // Debug log
      console.log('Parsed end date:', endDate.toISOString()); // Debug log
      
      if (title && !isNaN(startDate.getTime())) {
        // Create a unique identifier for the event
        const eventId = `${title}-${startDate.toISOString()}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
        
        events.push({
          id: eventId,
          title,
          description: isRecurring ? `Recurring event: ${recurringText}` : '',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          location: 'Brentwood Lighthouse Baptist Church',
          url: url || 'https://www.blb.church/events/',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_recurring: isRecurring,
          recurrence_pattern: isRecurring ? recurringText : null
        });
      }
    });
    
    console.log(`Found ${events.length} events to process`);
    
    // Store events in Supabase
    if (events.length > 0) {
      const { data, error } = await supabase
        .from('events')
        .upsert(events, {
          onConflict: 'id',
          ignoreDuplicates: false
        });
      
      if (error) {
        console.error('Error storing events in Supabase:', error);
        throw error;
      }
      
      console.log('Successfully processed', events.length, 'events');
    } else {
      console.log('No events found on the website');
    }
    
    return events;
  } catch (error) {
    console.error('Error in fetchEvents:', error);
    throw error;
  }
}

module.exports = {
  fetchEvents
}; 
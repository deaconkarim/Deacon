const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');

// Log environment variables (without exposing sensitive data)
console.log('Environment variables loaded:', {
  hasSupabaseUrl: !!process.env.SUPABASE_URL,
  hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
});

// Initialize Supabase client
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Fetch events from website and store in Supabase
router.post('/api/events/fetch', async (req, res) => {
  try {
    console.log('Fetching events from church website...');
    const response = await axios.get('https://www.blb.church/events', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': 'https://www.blb.church/'
      }
    });

    console.log('Received response from church website');
    const html = response.data;
    const $ = cheerio.load(html);
    
    const events = [];
    let currentMonth = '';
    let currentEvent = null;
    
    // Get all text nodes
    $('*').each((i, elem) => {
      const text = $(elem).text().trim();
      
      // Skip empty text
      if (!text) return;
      
      // Check if this is a month header
      if (text.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)$/)) {
        currentMonth = text;
        console.log('Found month:', currentMonth);
        return;
      }
      
      // Check if this is a day of the week
      if (text.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/)) {
        return;
      }
      
      // Check if this is a day number
      const dayMatch = text.match(/^(\d+)$/);
      if (dayMatch) {
        const day = parseInt(dayMatch[1]);
        const year = new Date().getFullYear();
        const monthIndex = new Date(`${currentMonth} 1`).getMonth();
        
        currentEvent = {
          id: `${currentMonth}-${day}-${year}`,
          title: '',
          start_date: new Date(year, monthIndex, day).toISOString(),
          end_date: null,
          location: 'BLB Church'
        };
        console.log('Found day:', day);
        return;
      }
      
      // If we have a current event, process this text
      if (currentEvent) {
        // If this looks like a title (no time pattern), set it as the title
        if (!text.match(/\d+:\d+\s*(am|pm)/i)) {
          if (!currentEvent.title) {
            // Remove recurring event information from the title
            const cleanTitle = text.replace(/\s*(Every|First|Second|Third|Fourth|Fifth)\s+(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|week|month).*$/, '');
            currentEvent.title = cleanTitle;
            currentEvent.id = `${currentEvent.id}-${cleanTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;
            // Add the event to our list once we have the title
            events.push(currentEvent);
            console.log('Added event:', currentEvent.title);
            currentEvent = null;
          }
        } else {
          // This is a time, parse it
          const timeMatch = text.match(/(\d+):(\d+)\s*(am|pm)(?:\s*-\s*(\d+):(\d+)\s*(am|pm))?/i);
          if (timeMatch) {
            const [_, startHour, startMin, startAmPm, endHour, endMin, endAmPm] = timeMatch;
            const startDate = new Date(currentEvent.start_date);
            
            // Set start time
            const hour = parseInt(startHour) + (startAmPm.toLowerCase() === 'pm' ? 12 : 0);
            const minute = parseInt(startMin);
            startDate.setHours(hour, minute);
            currentEvent.start_date = startDate.toISOString();
            
            // Set end time if present
            if (endHour && endMin) {
              const endDate = new Date(startDate);
              const endHourNum = parseInt(endHour) + (endAmPm.toLowerCase() === 'pm' ? 12 : 0);
              const endMinNum = parseInt(endMin);
              endDate.setHours(endHourNum, endMinNum);
              currentEvent.end_date = endDate.toISOString();
            }
            console.log('Added time to event:', currentEvent.title);
          }
        }
      }
    });
    
    console.log('Total events found:', events.length);

    // Store events in Supabase
    const { data, error } = await supabase
      .from('events')
      .upsert(events, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('Error storing events in Supabase:', error);
      throw error;
    }

    console.log('Events stored in Supabase:', data.length);
    res.json({ message: 'Events updated successfully', count: data.length });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get events from Supabase
router.get('/api/events', async (req, res) => {
  try {
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .order('start_date', { ascending: true });

    if (error) throw error;

    res.json(events);
  } catch (error) {
    console.error('Error fetching events from Supabase:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

module.exports = router; 
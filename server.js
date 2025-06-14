const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const port = 3000;

// Enable CORS for your frontend
app.use(cors({
  origin: 'http://localhost:5173'
}));

// Function to get next occurrence of a recurring event
function getNextOccurrence(schedule) {
  const today = new Date();
  const nextDate = new Date(today);
  
  if (schedule.includes('Every Wednesday')) {
    nextDate.setDate(today.getDate() + ((3 + 7 - today.getDay()) % 7));
    return { start_date: nextDate, end_date: nextDate };
  }
  if (schedule.includes('Every Thursday')) {
    nextDate.setDate(today.getDate() + ((4 + 7 - today.getDay()) % 7));
    return { start_date: nextDate, end_date: nextDate };
  }
  if (schedule.includes('Every Sunday')) {
    nextDate.setDate(today.getDate() + ((7 - today.getDay()) % 7));
    return { start_date: nextDate, end_date: nextDate };
  }
  if (schedule.includes('Every Tuesday')) {
    nextDate.setDate(today.getDate() + ((2 + 7 - today.getDay()) % 7));
    return { start_date: nextDate, end_date: nextDate };
  }
  if (schedule.includes('First Saturday')) {
    nextDate.setDate(1);
    nextDate.setMonth(today.getMonth());
    while (nextDate.getDay() !== 6) {
      nextDate.setDate(nextDate.getDate() + 1);
    }
    if (nextDate < today) {
      nextDate.setMonth(nextDate.getMonth() + 1);
      nextDate.setDate(1);
      while (nextDate.getDay() !== 6) {
        nextDate.setDate(nextDate.getDate() + 1);
      }
    }
    return { start_date: nextDate, end_date: nextDate };
  }
  if (schedule.includes('Third Saturday')) {
    nextDate.setDate(1);
    nextDate.setMonth(today.getMonth());
    let saturdayCount = 0;
    while (saturdayCount < 3) {
      if (nextDate.getDay() === 6) saturdayCount++;
      if (saturdayCount < 3) nextDate.setDate(nextDate.getDate() + 1);
    }
    if (nextDate < today) {
      nextDate.setMonth(nextDate.getMonth() + 1);
      nextDate.setDate(1);
      saturdayCount = 0;
      while (saturdayCount < 3) {
        if (nextDate.getDay() === 6) saturdayCount++;
        if (saturdayCount < 3) nextDate.setDate(nextDate.getDate() + 1);
      }
    }
    return { start_date: nextDate, end_date: nextDate };
  }
  if (schedule.includes('Fifth Sunday')) {
    // Start from the first day of the current month
    nextDate.setDate(1);
    
    // Function to check if a month has a fifth Sunday
    const hasFifthSunday = (date) => {
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      const lastDayOfWeek = lastDay.getDay();
      const lastDayOfMonth = lastDay.getDate();
      
      // If the last day of the month is a Sunday, or if the last Sunday is the 29th or later,
      // then the month has a fifth Sunday
      return lastDayOfWeek === 0 || (lastDayOfMonth - lastDayOfWeek) >= 29;
    };

    // If current month doesn't have a fifth Sunday, move to next month
    if (!hasFifthSunday(nextDate)) {
      nextDate.setMonth(nextDate.getMonth() + 1);
      nextDate.setDate(1);
    }

    // Find the fifth Sunday
    let sundayCount = 0;
    while (sundayCount < 5) {
      if (nextDate.getDay() === 0) sundayCount++;
      if (sundayCount < 5) nextDate.setDate(nextDate.getDate() + 1);
    }

    // If the found date is in the past, move to the next month that has a fifth Sunday
    if (nextDate < today) {
      nextDate.setMonth(nextDate.getMonth() + 1);
      nextDate.setDate(1);
      
      // Keep moving forward until we find a month with a fifth Sunday
      while (!hasFifthSunday(nextDate)) {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }
      
      // Find the fifth Sunday in this month
      sundayCount = 0;
      while (sundayCount < 5) {
        if (nextDate.getDay() === 0) sundayCount++;
        if (sundayCount < 5) nextDate.setDate(nextDate.getDate() + 1);
      }
    }

    return { start_date: nextDate, end_date: nextDate };
  }
  
  return null;
}

// Endpoint to fetch events
app.get('/api/events', async (req, res) => {
  try {
    console.log('Fetching events from BLB Church website...');
    const response = await axios.get('https://www.blb.church/events/');
    console.log('Response received, status:', response.status);
    
    const html = response.data;
    console.log('HTML content length:', html.length);
    
    const $ = cheerio.load(html);
    console.log('HTML parsed with cheerio');
    
    const events = [];
    
    // Find all event sections (they're in h2 tags)
    const eventSections = $('h2');
    console.log('Found event sections:', eventSections.length);
    
    eventSections.each((i, section) => {
      const title = $(section).text().trim();
      console.log('Processing event:', title);
      
      // Skip non-event sections
      if (title.includes('Download Our Church App') || title.includes('Watch and Listen')) {
        return;
      }
      
      // Get the next sibling which contains the schedule
      const detailsElement = $(section).next();
      if (detailsElement.length) {
        const schedule = detailsElement.text().trim();
        console.log('Event schedule:', schedule);
        
        const nextOccurrence = getNextOccurrence(schedule);
        if (nextOccurrence) {
          // Set default times based on event type
          let startTime = '10:00 AM';
          let endTime = '11:30 AM';
          
          if (title.includes('Bible Study')) {
            startTime = '7:00 PM';
            endTime = '8:30 PM';
          } else if (title.includes('Men\'s Breakfast')) {
            startTime = '8:00 AM';
            endTime = '9:30 AM';
          }
          
          const startDate = new Date(nextOccurrence.start_date);
          startDate.setHours(parseInt(startTime.split(':')[0]), parseInt(startTime.split(':')[1].split(' ')[0]));
          if (startTime.includes('PM') && startDate.getHours() < 12) {
            startDate.setHours(startDate.getHours() + 12);
          }
          
          const endDate = new Date(nextOccurrence.end_date);
          endDate.setHours(parseInt(endTime.split(':')[0]), parseInt(endTime.split(':')[1].split(' ')[0]));
          if (endTime.includes('PM') && endDate.getHours() < 12) {
            endDate.setHours(endDate.getHours() + 12);
          }
          
          events.push({
            id: `${title}-${startDate.toISOString()}`,
            title,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            recurrence: schedule
          });
          
          console.log('Added event:', events[events.length - 1]);
        }
      }
    });
    
    console.log('Total events found:', events.length);
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 
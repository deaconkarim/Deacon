import { XMLParser } from 'fast-xml-parser';

const EVENTS_RSS_URL = 'https://www.blb.church/events/feed/';
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

// Helper function to decode HTML entities
const decodeHtmlEntities = (text) => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseAttributeValue: true,
  parseTagValue: true,
  trimValues: true,
  isArray: (name) => name === 'item',
  textNodeName: '_text',
  cdataTagName: '__cdata',
  cdataPositionChar: '\\c',
});

export const parseRSSFeed = async (xmlText) => {
  try {
    const result = parser.parse(xmlText);
    
    const items = result.rss?.channel?.item || [];
    
    if (!Array.isArray(items)) {
      console.error('Invalid RSS feed format: items is not an array');
      return [];
    }

    return items.map(item => {
      // Extract content from CDATA if present
      const getContent = (field) => {
        if (item[field]?._text) return item[field]._text;
        if (item[field]?.__cdata) return item[field].__cdata;
        return item[field] || '';
      };

      // Extract event-specific fields
      const eventData = {
        title: decodeHtmlEntities(getContent('title')),
        description: decodeHtmlEntities(getContent('description')),
        link: getContent('link'),
        pubDate: getContent('pubDate'),
        // Try to extract dates from the content
        startDate: getContent('ev:startdate') || getContent('ev:start') || getContent('pubDate'),
        endDate: getContent('ev:enddate') || getContent('ev:end') || getContent('pubDate'),
        location: decodeHtmlEntities(getContent('ev:location')),
        organizer: decodeHtmlEntities(getContent('ev:organizer')),
        type: getContent('ev:type') || 'event'
      };

      // Try to extract dates from the content if they're not in the standard fields
      const content = getContent('content:encoded') || getContent('description');
      if (content) {
        // Look for dates in various formats
        const datePatterns = [
          /(\d{1,2}\/\d{1,2}\/\d{4})/g,  // MM/DD/YYYY
          /(\d{4}-\d{2}-\d{2})/g,        // YYYY-MM-DD
          /(\w+ \d{1,2},? \d{4})/g,      // Month DD, YYYY
          /(\d{1,2} \w+ \d{4})/g         // DD Month YYYY
        ];

        for (const pattern of datePatterns) {
          const matches = content.match(pattern);
          if (matches && matches.length >= 1) {
            // Try to parse the first date found
            const parsedDate = new Date(matches[0]);
            if (!isNaN(parsedDate.getTime())) {
              eventData.startDate = parsedDate.toISOString();
              // If we found a second date, use it as end date
              if (matches.length >= 2) {
                const endDate = new Date(matches[1]);
                if (!isNaN(endDate.getTime())) {
                  eventData.endDate = endDate.toISOString();
                }
              }
              break;
            }
          }
        }
      }

      return eventData;
    });
  } catch (error) {
    console.error('Error parsing RSS feed:', error);
    return [];
  }
};

export function transformRssEventToAppEvent(rssEvent) {
  
  // Parse dates with better error handling
  let startDate = new Date();
  let endDate = null;
  
  try {
    if (rssEvent.startDate) {
      startDate = new Date(rssEvent.startDate);
      if (isNaN(startDate.getTime())) {

        startDate = new Date();
      }
    }
    
    if (rssEvent.endDate) {
      endDate = new Date(rssEvent.endDate);
      if (isNaN(endDate.getTime())) {

        endDate = null;
      }
    }
  } catch (error) {
    console.error('Error parsing dates:', error);
  }

    endDate: endDate ? endDate.toISOString() : null,
    originalStartDate: rssEvent.startDate,
    originalEndDate: rssEvent.endDate
  });

  return {
    id: rssEvent.guid || rssEvent.link,
    title: rssEvent.title,
    description: rssEvent.contentSnippet || rssEvent.content,
    startDate: startDate.toISOString(),
    endDate: endDate ? endDate.toISOString() : null,
    location: rssEvent.location,
    organizer: rssEvent.organizer,
    type: rssEvent.type || 'other',
    url: rssEvent.link,
    isExternal: true
  };
}

export async function fetchEventsFromWebsite() {
  try {
    const response = await fetch(`${CORS_PROXY}${encodeURIComponent('https://www.blb.church/events/')}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Create a temporary div to parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Parse h2 and h3 elements
    
    // Find all month sections (they are in h2 elements)
    const monthSections = doc.querySelectorAll('h2');
    
    const events = [];
    
    // Process each month section
    monthSections.forEach(monthSection => {
      const month = monthSection.textContent.trim();
      
      // Get all events until the next h2
      let currentElement = monthSection.nextElementSibling;
      while (currentElement && currentElement.tagName !== 'H2') {
        if (currentElement.tagName === 'H3') {
          const title = currentElement.textContent.trim();
          
          // Get the next element which should be the date/time
          const timeElement = currentElement.nextElementSibling;
          if (timeElement) {
            const timeText = timeElement.textContent.trim();
            
            // Parse the date and time
            const dateMatch = timeText.match(/(\w+)\s+(\d+)(?:\s*-\s*(\d+))?/);
            const timeMatch = timeText.match(/(\d+):(\d+)\s*(am|pm)(?:\s*-\s*(\d+):(\d+)\s*(am|pm))?/i);
            
            if (dateMatch) {
              const [_, month, day] = dateMatch;
              const year = new Date().getFullYear();
              const monthIndex = new Date(`${month} 1`).getMonth();
              
              let startDate = null;
              let endDate = null;
              
              if (timeMatch) {
                const [__, startHour, startMin, startAmPm, endHour, endMin, endAmPm] = timeMatch;
                
                // Set start date
                startDate = new Date(year, monthIndex, parseInt(day),
                  parseInt(startHour) + (startAmPm.toLowerCase() === 'pm' && startHour !== '12' ? 12 : 0),
                  parseInt(startMin));
                
                // Set end date if available
                if (endHour && endMin && endAmPm) {
                  endDate = new Date(year, monthIndex, parseInt(day),
                    parseInt(endHour) + (endAmPm.toLowerCase() === 'pm' && endHour !== '12' ? 12 : 0),
                    parseInt(endMin));
                }
              } else {
                // If no time specified, set to start of day
                startDate = new Date(year, monthIndex, parseInt(day));
              }
              
              // Get description from the next paragraph if it exists
              let description = '';
              const descElement = timeElement.nextElementSibling;
              if (descElement && descElement.tagName === 'P') {
                description = descElement.textContent.trim();
              }
              
              // Determine event type based on title
              let type = 'other';
              const titleLower = title.toLowerCase();
              if (titleLower.includes('bible study')) type = 'bible-study';
              else if (titleLower.includes('worship')) type = 'worship';
              else if (titleLower.includes('breakfast')) type = 'fellowship';
              else if (titleLower.includes('potluck')) type = 'fellowship';
              else if (titleLower.includes('work day')) type = 'service';
              
              // Generate a unique ID using title and date
              const uniqueId = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${startDate.toISOString().split('T')[0]}`;
              
              events.push({
                id: uniqueId,
                title,
                description,
                startDate: startDate.toISOString(),
                endDate: endDate ? endDate.toISOString() : null,
                location: 'Brentwood Lighthouse Baptist Church',
                organizer: 'BLBC',
                type,
                url: currentElement.querySelector('a')?.href || '',
                isExternal: true
              });
            }
          }
        }
        currentElement = currentElement.nextElementSibling;
      }
    });

    return events;
    
  } catch (error) {
    console.error('Error fetching events from website:', error);
    return [];
  }
}
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupDuplicateEvents() {
  try {

    // Get all events
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching events:', error);
      return;
    }

    // Group events by key characteristics to identify duplicates
    const eventGroups = {};
    const duplicates = [];
    
    events.forEach(event => {
      // Create a unique key based on title, description, start_date, and organization_id
      const key = `${event.title}|${event.description}|${event.start_date}|${event.organization_id}`;
      
      if (!eventGroups[key]) {
        eventGroups[key] = [];
      }
      eventGroups[key].push(event);
    });
    
    // Find groups with duplicates
    Object.entries(eventGroups).forEach(([key, group]) => {
      if (group.length > 1) {

        group.forEach(event => {

        });
        
        // Keep the first one (oldest), mark others for deletion
        const [keep, ...toDelete] = group;
        duplicates.push(...toDelete);
      }
    });

    if (duplicates.length === 0) {

      return;
    }
    
    // Delete duplicate events
    const duplicateIds = duplicates.map(e => e.id);

    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .in('id', duplicateIds);
    
    if (deleteError) {
      console.error('Error deleting duplicates:', deleteError);
      return;
    }

    // Verify cleanup
    const { data: remainingEvents, error: verifyError } = await supabase
      .from('events')
      .select('id, title, start_date')
      .order('created_at', { ascending: true });
    
    if (verifyError) {
      console.error('Error verifying cleanup:', verifyError);
      return;
    }

    // Show remaining events

    remainingEvents.forEach(event => {

    });
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

// Run the cleanup
cleanupDuplicateEvents();
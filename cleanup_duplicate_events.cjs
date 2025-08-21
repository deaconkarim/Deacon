const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './frontend/.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupDuplicateEvents() {
  try {
    console.log('🔍 Starting duplicate event cleanup...');
    
    // Get all events
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching events:', error);
      return;
    }
    
    console.log(`📊 Found ${events.length} total events`);
    
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
        console.log(`\n🔴 Found ${group.length} duplicates for: ${key}`);
        group.forEach(event => {
          console.log(`  - ID: ${event.id}, Created: ${event.created_at}, Is Master: ${event.is_master}`);
        });
        
        // Keep the first one (oldest), mark others for deletion
        const [keep, ...toDelete] = group;
        duplicates.push(...toDelete);
      }
    });
    
    console.log(`\n📋 Found ${duplicates.length} duplicate events to remove`);
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicates found!');
      return;
    }
    
    // Delete duplicate events
    const duplicateIds = duplicates.map(e => e.id);
    
    console.log('\n🗑️  Deleting duplicate events...');
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .in('id', duplicateIds);
    
    if (deleteError) {
      console.error('Error deleting duplicates:', deleteError);
      return;
    }
    
    console.log(`✅ Successfully deleted ${duplicates.length} duplicate events`);
    
    // Verify cleanup
    const { data: remainingEvents, error: verifyError } = await supabase
      .from('events')
      .select('id, title, start_date')
      .order('created_at', { ascending: true });
    
    if (verifyError) {
      console.error('Error verifying cleanup:', verifyError);
      return;
    }
    
    console.log(`\n📊 After cleanup: ${remainingEvents.length} events remaining`);
    
    // Show remaining events
    console.log('\n📅 Remaining events:');
    remainingEvents.forEach(event => {
      console.log(`  - ${event.title} (${event.start_date})`);
    });
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

// Run the cleanup
cleanupDuplicateEvents();
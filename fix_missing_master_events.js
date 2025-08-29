const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function fixMissingMasterEvents() {

  try {
    // Get all recurring events that don't have a master event
    const { data: recurringEvents, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('is_recurring', true)
      .eq('is_master', false)
      .order('start_date', { ascending: true });

    if (fetchError) {
      console.error('❌ Error fetching recurring events:', fetchError);
      return;
    }

    if (recurringEvents.length === 0) {

      return;
    }

    // Group events by their parent_event_id to identify which ones need master events
    const eventsByParent = {};
    const orphanedEvents = [];

    recurringEvents.forEach(event => {
      if (event.parent_event_id) {
        if (!eventsByParent[event.parent_event_id]) {
          eventsByParent[event.parent_event_id] = [];
        }
        eventsByParent[event.parent_event_id].push(event);
      } else {
        orphanedEvents.push(event);
      }
    });

    // Create master events for each group
    for (const [parentId, instances] of Object.entries(eventsByParent)) {
      if (instances.length === 0) continue;

      const firstInstance = instances[0];
      
      // Check if master event already exists
      const { data: existingMaster, error: masterCheckError } = await supabase
        .from('events')
        .select('*')
        .eq('id', parentId)
        .eq('is_master', true)
        .single();

      if (masterCheckError && masterCheckError.code !== 'PGRST116') {
        console.error(`❌ Error checking for existing master event ${parentId}:`, masterCheckError);
        continue;
      }

      if (existingMaster) {

        continue;
      }

      // Create master event
      const masterEvent = {
        id: parentId,
        title: firstInstance.title,
        description: firstInstance.description,
        start_date: firstInstance.start_date,
        end_date: firstInstance.end_date,
        location: firstInstance.location,
        url: firstInstance.url,
        is_recurring: true,
        is_master: true,
        recurrence_pattern: firstInstance.recurrence_pattern,
        monthly_week: firstInstance.monthly_week,
        monthly_weekday: firstInstance.monthly_weekday,
        allow_rsvp: firstInstance.allow_rsvp,
        attendance_type: firstInstance.attendance_type,
        event_type: firstInstance.event_type,
        needs_volunteers: firstInstance.needs_volunteers,
        volunteer_roles: firstInstance.volunteer_roles,
        parent_event_id: null,
        organization_id: firstInstance.organization_id,
        created_at: firstInstance.created_at,
        updated_at: new Date().toISOString()
      };

      const { data: createdMaster, error: createError } = await supabase
        .from('events')
        .insert([masterEvent])
        .select()
        .single();

      if (createError) {
        console.error(`❌ Error creating master event for ${parentId}:`, createError);
        continue;
      }

    }

    // Handle orphaned events (events without parent_event_id)
    if (orphanedEvents.length > 0) {

      // Group orphaned events by title and recurrence pattern
      const orphanedGroups = {};
      
      orphanedEvents.forEach(event => {
        const key = `${event.title}-${event.recurrence_pattern}-${event.organization_id}`;
        if (!orphanedGroups[key]) {
          orphanedGroups[key] = [];
        }
        orphanedGroups[key].push(event);
      });

      for (const [key, events] of Object.entries(orphanedGroups)) {
        if (events.length === 0) continue;

        const firstEvent = events[0];
        
        // Create a master event ID based on the first event
        const masterId = `${firstEvent.title}-${new Date(firstEvent.start_date).getTime()}`
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
          .substring(0, 255);

        // Check if this master event already exists
        const { data: existingMaster, error: masterCheckError } = await supabase
          .from('events')
          .select('*')
          .eq('id', masterId)
          .eq('is_master', true)
          .single();

        if (masterCheckError && masterCheckError.code !== 'PGRST116') {
          console.error(`❌ Error checking for existing master event ${masterId}:`, masterCheckError);
          continue;
        }

        if (existingMaster) {

          // Update all instances to point to this master
          for (const event of events) {
            const { error: updateError } = await supabase
              .from('events')
              .update({ parent_event_id: masterId })
              .eq('id', event.id);
            
            if (updateError) {
              console.error(`❌ Error updating parent_event_id for ${event.id}:`, updateError);
            }
          }
          continue;
        }

        // Create master event
        const masterEvent = {
          id: masterId,
          title: firstEvent.title,
          description: firstEvent.description,
          start_date: firstEvent.start_date,
          end_date: firstEvent.end_date,
          location: firstEvent.location,
          url: firstEvent.url,
          is_recurring: true,
          is_master: true,
          recurrence_pattern: firstEvent.recurrence_pattern,
          monthly_week: firstEvent.monthly_week,
          monthly_weekday: firstEvent.monthly_weekday,
          allow_rsvp: firstEvent.allow_rsvp,
          attendance_type: firstEvent.attendance_type,
          event_type: firstEvent.event_type,
          needs_volunteers: firstEvent.needs_volunteers,
          volunteer_roles: firstEvent.volunteer_roles,
          parent_event_id: null,
          organization_id: firstEvent.organization_id,
          created_at: firstEvent.created_at,
          updated_at: new Date().toISOString()
        };

        const { data: createdMaster, error: createError } = await supabase
          .from('events')
          .insert([masterEvent])
          .select()
          .single();

        if (createError) {
          console.error(`❌ Error creating master event for ${masterId}:`, createError);
          continue;
        }

        // Update all instances to point to this master
        for (const event of events) {
          const { error: updateError } = await supabase
            .from('events')
            .update({ parent_event_id: masterId })
            .eq('id', event.id);
          
          if (updateError) {
            console.error(`❌ Error updating parent_event_id for ${event.id}:`, updateError);
          } else {

          }
        }
      }
    }

    // Verify the fix
    const { data: remainingOrphans, error: verifyError } = await supabase
      .from('events')
      .select('*')
      .eq('is_recurring', true)
      .eq('is_master', false)
      .is('parent_event_id', null);

    if (verifyError) {
      console.error('❌ Error verifying fix:', verifyError);
    } else {

      if (remainingOrphans.length === 0) {

      }
    }

  } catch (error) {
    console.error('❌ Error in fixMissingMasterEvents:', error);
  }
}

// Function to ensure event creation always creates master events
async function ensureEventCreationCreatesMasterEvents() {

  try {
    // Get all non-recurring events that might need to be converted
    const { data: nonRecurringEvents, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('is_recurring', false)
      .is('parent_event_id', null)
      .order('start_date', { ascending: true });

    if (fetchError) {
      console.error('❌ Error fetching non-recurring events:', fetchError);
      return;
    }

    // Check if any of these should actually be recurring events
    // This is a heuristic - events with similar titles and patterns
    const eventGroups = {};
    
    nonRecurringEvents.forEach(event => {
      const key = `${event.title}-${event.organization_id}`;
      if (!eventGroups[key]) {
        eventGroups[key] = [];
      }
      eventGroups[key].push(event);
    });

    let convertedCount = 0;
    
    for (const [key, events] of Object.entries(eventGroups)) {
      if (events.length < 2) continue; // Need at least 2 events to consider it recurring
      
      // Check if these events follow a pattern (weekly, monthly, etc.)
      const sortedEvents = events.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
      
      // Simple pattern detection
      let isWeekly = true;
      let isMonthly = true;
      
      for (let i = 1; i < sortedEvents.length; i++) {
        const prevDate = new Date(sortedEvents[i-1].start_date);
        const currDate = new Date(sortedEvents[i].start_date);
        const diffDays = Math.abs((currDate - prevDate) / (1000 * 60 * 60 * 24));
        
        if (Math.abs(diffDays - 7) > 1) isWeekly = false;
        if (Math.abs(diffDays - 30) > 5) isMonthly = false;
      }
      
      if (!isWeekly && !isMonthly) continue; // No clear pattern
      
      const recurrencePattern = isWeekly ? 'weekly' : 'monthly';
      const firstEvent = sortedEvents[0];
      
      // Create master event
      const masterId = `${firstEvent.title}-${new Date(firstEvent.start_date).getTime()}`
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 255);

      const masterEvent = {
        id: masterId,
        title: firstEvent.title,
        description: firstEvent.description,
        start_date: firstEvent.start_date,
        end_date: firstEvent.end_date,
        location: firstEvent.location,
        url: firstEvent.url,
        is_recurring: true,
        is_master: true,
        recurrence_pattern: recurrencePattern,
        monthly_week: null,
        monthly_weekday: null,
        allow_rsvp: firstEvent.allow_rsvp,
        attendance_type: firstEvent.attendance_type,
        event_type: firstEvent.event_type,
        needs_volunteers: firstEvent.needs_volunteers,
        volunteer_roles: firstEvent.volunteer_roles,
        parent_event_id: null,
        organization_id: firstEvent.organization_id,
        created_at: firstEvent.created_at,
        updated_at: new Date().toISOString()
      };

      const { data: createdMaster, error: createError } = await supabase
        .from('events')
        .insert([masterEvent])
        .select()
        .single();

      if (createError) {
        console.error(`❌ Error creating master event for ${masterId}:`, createError);
        continue;
      }

      // Update all events to point to this master
      for (const event of events) {
        const { error: updateError } = await supabase
          .from('events')
          .update({ 
            parent_event_id: masterId,
            is_recurring: true,
            is_master: false
          })
          .eq('id', event.id);
        
        if (updateError) {
          console.error(`❌ Error updating event ${event.id}:`, updateError);
        } else {

        }
      }
      
      convertedCount++;
    }

  } catch (error) {
    console.error('❌ Error in ensureEventCreationCreatesMasterEvents:', error);
  }
}

// Main execution
async function main() {

  await fixMissingMasterEvents();

  await ensureEventCreationCreatesMasterEvents();

}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  fixMissingMasterEvents,
  ensureEventCreationCreatesMasterEvents
}; 
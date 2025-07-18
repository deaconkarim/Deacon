// Test script for recurring event logic
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client (you'll need to add your credentials)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}


// Test data for recurring events
const testEvents = [
  {
    title: 'Weekly Bible Study',
    description: 'Weekly Bible study group',
    startDate: '2025-01-06T19:00:00Z', // Monday 7 PM
    endDate: '2025-01-06T20:00:00Z',
    location: 'Church Hall',
    is_recurring: true,
    recurrence_pattern: 'weekly',
    event_type: 'Bible Study'
  },
  {
    title: 'Monthly Board Meeting',
    description: 'Monthly board meeting',
    startDate: '2025-01-15T18:00:00Z', // Third Wednesday 6 PM
    endDate: '2025-01-15T19:30:00Z',
    location: 'Conference Room',
    is_recurring: true,
    recurrence_pattern: 'monthly_weekday',
    monthly_week: 3, // Third week
    monthly_weekday: 3, // Wednesday (0=Sunday, 3=Wednesday)
    event_type: 'Meeting'
  },
  {
    title: 'Bi-weekly Prayer Group',
    description: 'Prayer group meeting every other week',
    startDate: '2025-01-08T20:00:00Z', // Wednesday 8 PM
    endDate: '2025-01-08T21:00:00Z',
    location: 'Prayer Room',
    is_recurring: true,
    recurrence_pattern: 'biweekly',
    event_type: 'Prayer'
  }
];

async function testRecurringEvents() {
  console.log('🧪 Testing recurring event creation...\n');

  try {
    // Test each event type
    for (const event of testEvents) {
      console.log(`📅 Testing: ${event.title}`);
      console.log(`   Pattern: ${event.recurrence_pattern}`);
      
      // Create the event
      const { data: createdEvent, error } = await supabase
        .from('events')
        .insert([{
          id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: event.title,
          description: event.description,
          start_date: event.startDate,
          end_date: event.endDate,
          location: event.location,
          is_recurring: event.is_recurring,
          recurrence_pattern: event.recurrence_pattern,
          monthly_week: event.monthly_week || null,
          monthly_weekday: event.monthly_weekday || null,
          allow_rsvp: true,
          attendance_type: 'rsvp',
          event_type: event.event_type,
          needs_volunteers: false,
          volunteer_roles: null,
          is_master: true,
          parent_event_id: null,
          organization_id: 'test-org' // You'll need to use a real org ID
        }])
        .select()
        .single();

      if (error) {
        console.error(`   ❌ Error creating event:`, error);
        continue;
      }

      console.log(`   ✅ Created master event: ${createdEvent.id}`);

      // Check if instances were created
      const { data: instances, error: instancesError } = await supabase
        .from('events')
        .select('*')
        .eq('parent_event_id', createdEvent.id)
        .order('start_date', { ascending: true });

      if (instancesError) {
        console.error(`   ❌ Error fetching instances:`, instancesError);
      } else {
        console.log(`   📋 Created ${instances.length} instances`);
        
        // Show first few instances
        instances.slice(0, 3).forEach((instance, index) => {
          const date = new Date(instance.start_date);
          console.log(`      ${index + 1}. ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`);
        });
        
        if (instances.length > 3) {
          console.log(`      ... and ${instances.length - 3} more`);
        }
      }

      console.log('');
    }

    console.log('✅ Recurring event tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testRecurringEvents(); 
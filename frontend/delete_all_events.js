const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://cccxexvoahyeookqmxpl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMxNzQ1MDMsImV4cCI6MjA0ODc1MDUwM30.CD1jPRRjT_F5nGq4UgNpvJzI2I8z4K2X4KN_KZClVd8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function deleteAllEvents() {
  try {
    console.log('Starting to delete all events...')
    
    // First delete all event attendance records
    console.log('Deleting event attendance records...')
    const { error: attendanceError } = await supabase
      .from('event_attendance')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
    
    if (attendanceError && attendanceError.code !== '42P01') {
      console.error('Error deleting event attendance:', attendanceError)
    } else {
      console.log('✅ Event attendance records deleted')
    }
    
    // Then delete all events
    console.log('Deleting all events...')
    const { error: eventsError } = await supabase
      .from('events')
      .delete()
      .neq('id', 'non-existent-id') // Delete all records
    
    if (eventsError) {
      console.error('Error deleting events:', eventsError)
      throw eventsError
    }
    
    console.log('✅ All events deleted successfully!')
    console.log('🎉 Database cleanup complete!')
    
  } catch (error) {
    console.error('❌ Failed to delete events:', error)
  }
}

// Run the script
deleteAllEvents() 
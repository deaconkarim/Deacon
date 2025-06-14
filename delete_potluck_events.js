const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://cccxexvoahyeookqmxpl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMxNzQ1MDMsImV4cCI6MjA0ODc1MDUwM30.CD1jPRRjT_F5nGq4UgNpvJzI2I8z4K2X4KN_KZClVd8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function deleteIncorrectPotluckEvents() {
  try {
    console.log('Starting to delete incorrect potluck events...')
    
    // First, get all potluck events
    const { data: potluckEvents, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .ilike('title', '%potluck%')
    
    if (fetchError) {
      throw fetchError
    }
    
    console.log(`Found ${potluckEvents.length} potluck events`)
    
    // Find the master recurring event
    const masterEvent = potluckEvents.find(event => 
      event.is_recurring && 
      event.recurrence_pattern === 'fifth_sunday' && 
      event.is_master
    )
    
    if (!masterEvent) {
      console.log('No master recurring potluck event found')
      return
    }
    
    // Delete all potluck events except the master recurring event
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .ilike('title', '%potluck%')
      .neq('id', masterEvent.id)
    
    if (deleteError) {
      throw deleteError
    }
    
    console.log('✅ Successfully deleted incorrect potluck events')
    console.log('✅ Preserved master recurring potluck event')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

deleteIncorrectPotluckEvents() 
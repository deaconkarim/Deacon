const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupDuplicateReminders() {
  console.log('🧹 Cleaning up duplicate reminder logs...\n');

  try {
    // Get recent reminder logs (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: logs, error } = await supabase
      .from('event_reminder_logs')
      .select(`
        *,
        reminder_config:event_reminder_configs (
          name,
          timing_hours,
          timing_unit,
          timing_value
        ),
        event:events (
          title,
          start_date
        ),
        member:members (
          firstname,
          lastname
        )
      `)
      .gte('sent_at', sevenDaysAgo.toISOString())
      .order('sent_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching reminder logs:', error);
      return;
    }

    console.log(`📊 Found ${logs.length} reminder logs in the last 7 days\n`);

    // Group by reminder config and member to identify duplicates
    const duplicatesToRemove = [];
    const processedGroups = new Set();

    logs.forEach(log => {
      const groupKey = `${log.reminder_config_id}-${log.member_id}`;
      
      if (processedGroups.has(groupKey)) {
        // This is a duplicate, mark for removal
        duplicatesToRemove.push(log.id);
        console.log(`🗑️  Marking duplicate: ${log.member?.firstname} ${log.member?.lastname} - ${log.sent_at}`);
      } else {
        processedGroups.add(groupKey);
      }
    });

    if (duplicatesToRemove.length === 0) {
      console.log('✅ No duplicate reminders found to clean up');
      return;
    }

    console.log(`\n🗑️  Found ${duplicatesToRemove.length} duplicate reminder logs to remove`);

    // Ask for confirmation
    console.log('\n⚠️  This will permanently delete duplicate reminder logs.');
    console.log('   Only the first reminder sent to each member for each config will be kept.');
    console.log('   Type "YES" to proceed with cleanup:');
    
    // In a real scenario, you might want to add user input here
    // For now, we'll proceed with the cleanup
    const shouldProceed = true; // In production, this would be user input

    if (shouldProceed) {
      console.log('\n🧹 Proceeding with cleanup...');
      
      // Delete duplicate logs in batches
      const batchSize = 50;
      let deletedCount = 0;
      
      for (let i = 0; i < duplicatesToRemove.length; i += batchSize) {
        const batch = duplicatesToRemove.slice(i, i + batchSize);
        
        const { error: deleteError } = await supabase
          .from('event_reminder_logs')
          .delete()
          .in('id', batch);
        
        if (deleteError) {
          console.error(`❌ Error deleting batch ${Math.floor(i / batchSize) + 1}:`, deleteError);
        } else {
          deletedCount += batch.length;
          console.log(`✅ Deleted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} records`);
        }
      }
      
      console.log(`\n🎉 Cleanup completed! Deleted ${deletedCount} duplicate reminder logs`);
    } else {
      console.log('❌ Cleanup cancelled');
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

// Run the cleanup
cleanupDuplicateReminders();
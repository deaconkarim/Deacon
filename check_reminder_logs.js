const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkReminderLogs() {
  console.log('🔍 Checking Event Reminder Logs...\n');

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
      .order('sent_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching reminder logs:', error);
      return;
    }

    console.log(`📊 Found ${logs.length} reminder logs in the last 7 days\n`);

    // Group by reminder config to identify duplicates
    const configGroups = {};
    logs.forEach(log => {
      const configId = log.reminder_config_id;
      if (!configGroups[configId]) {
        configGroups[configId] = [];
      }
      configGroups[configId].push(log);
    });

    // Analyze each config group
    Object.entries(configGroups).forEach(([configId, configLogs]) => {
      const config = configLogs[0].reminder_config;
      const event = configLogs[0].event;
      
      console.log(`📋 Config: ${config?.name || 'Unknown'} (ID: ${configId})`);
      console.log(`   Event: ${event?.title || 'Unknown'} (${event?.start_date})`);
      console.log(`   Timing: ${config?.timing_value || config?.timing_hours} ${config?.timing_unit || 'hours'} before`);
      console.log(`   Total sends: ${configLogs.length}`);
      
      // Check for duplicates within 2 hours
      const duplicates = [];
      for (let i = 0; i < configLogs.length; i++) {
        for (let j = i + 1; j < configLogs.length; j++) {
          const timeDiff = Math.abs(new Date(configLogs[i].sent_at) - new Date(configLogs[j].sent_at));
          const hoursDiff = timeDiff / (1000 * 60 * 60);
          
          if (hoursDiff < 2 && configLogs[i].member_id === configLogs[j].member_id) {
            duplicates.push({
              member: configLogs[i].member,
              firstSend: configLogs[i].sent_at,
              secondSend: configLogs[j].sent_at,
              hoursDiff: hoursDiff.toFixed(2)
            });
          }
        }
      }
      
      if (duplicates.length > 0) {
        console.log(`   ⚠️  Found ${duplicates.length} duplicate sends within 2 hours:`);
        duplicates.forEach(dup => {
          console.log(`      ${dup.member?.firstname} ${dup.member?.lastname}: ${dup.hoursDiff}h apart`);
        });
      } else {
        console.log(`   ✅ No duplicate sends detected`);
      }
      
      console.log('');
    });

    // Check for any failed sends
    const failedLogs = logs.filter(log => log.status === 'failed');
    if (failedLogs.length > 0) {
      console.log(`❌ Found ${failedLogs.length} failed sends:`);
      failedLogs.forEach(log => {
        console.log(`   ${log.member?.firstname} ${log.member?.lastname}: ${log.error_message}`);
      });
    }

    console.log('✅ Reminder log analysis completed');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the check
checkReminderLogs();
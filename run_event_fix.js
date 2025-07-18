#!/usr/bin/env node

const { fixMissingMasterEvents, ensureEventCreationCreatesMasterEvents } = require('./fix_missing_master_events');

console.log('🚀 Running event database fix...\n');

async function run() {
  try {
    await fixMissingMasterEvents();
    console.log('\n' + '='.repeat(50) + '\n');
    await ensureEventCreationCreatesMasterEvents();
    console.log('\n🎉 Event fix completed successfully!');
  } catch (error) {
    console.error('❌ Error running event fix:', error);
    process.exit(1);
  }
}

run(); 
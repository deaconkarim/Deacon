#!/usr/bin/env node

const { fixMissingMasterEvents, ensureEventCreationCreatesMasterEvents } = require('./fix_missing_master_events');

async function run() {
  try {
    await fixMissingMasterEvents();

    await ensureEventCreationCreatesMasterEvents();

  } catch (error) {
    console.error('❌ Error running event fix:', error);
    process.exit(1);
  }
}

run(); 
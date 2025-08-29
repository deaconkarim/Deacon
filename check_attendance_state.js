const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MjU5MDksImV4cCI6MjA2MzAwMTkwOX0.W4AhQt8-ZGkQa7i7rfsdJ5L1ZEn8Yx3crcrWCOGR9pA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAttendanceState() {

  try {
    // Check total attendance records
    const { data: totalAttendance, error: totalError } = await supabase
      .from('event_attendance')
      .select('id', { count: 'exact' });
    
    if (totalError) throw totalError;

    // Check for duplicate records
    const { data: duplicates, error: dupError } = await supabase
      .from('event_attendance')
      .select('event_id, anonymous_name, created_at')
      .not('anonymous_name', 'is', null);
    
    if (dupError) throw dupError;
    
    // Find duplicates
    const duplicateMap = new Map();
    duplicates.forEach(record => {
      const key = `${record.event_id}-${record.anonymous_name}`;
      if (!duplicateMap.has(key)) {
        duplicateMap.set(key, []);
      }
      duplicateMap.get(key).push(record);
    });
    
    const actualDuplicates = Array.from(duplicateMap.entries())
      .filter(([key, records]) => records.length > 1);

    if (actualDuplicates.length > 0) {

      actualDuplicates.forEach(([key, records]) => {

      });
    }
    
    // Check events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, event_type, start_date')
      .order('start_date');
    
    if (eventsError) throw eventsError;

    // Show event details
    events.forEach(event => {

    });
    
    // Check unique constraint

    return {
      success: true,
      totalRecords: totalAttendance.length,
      duplicateCount: actualDuplicates.length,
      eventCount: events.length
    };
    
  } catch (error) {
    console.error('❌ Error checking attendance state:', error);
    throw error;
  }
}

// Run the check
checkAttendanceState()
  .then((result) => {

    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to check attendance state:', error);
    process.exit(1);
  }); 
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MjU5MDksImV4cCI6MjA2MzAwMTkwOX0.W4AhQt8-ZGkQa7i7rfsdJ5L1ZEn8Yx3crcrWCOGR9pA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAttendanceState() {

  try {
    // Check total attendance records
    const { data: totalAttendance, error: totalError } = await supabase
      .from('event_attendance')
      .select('id', { count: 'exact' });
    
    if (totalError) throw totalError;

    // Check for duplicate records
    const { data: duplicates, error: dupError } = await supabase
      .from('event_attendance')
      .select('event_id, anonymous_name, created_at')
      .not('anonymous_name', 'is', null);
    
    if (dupError) throw dupError;
    
    // Find duplicates
    const duplicateMap = new Map();
    duplicates.forEach(record => {
      const key = `${record.event_id}-${record.anonymous_name}`;
      if (!duplicateMap.has(key)) {
        duplicateMap.set(key, []);
      }
      duplicateMap.get(key).push(record);
    });
    
    const actualDuplicates = Array.from(duplicateMap.entries())
      .filter(([key, records]) => records.length > 1);

    if (actualDuplicates.length > 0) {

      actualDuplicates.forEach(([key, records]) => {

      });
    }
    
    // Check events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, event_type, start_date')
      .order('start_date');
    
    if (eventsError) throw eventsError;

    // Show event details
    events.forEach(event => {

    });
    
    // Check unique constraint

    return {
      success: true,
      totalRecords: totalAttendance.length,
      duplicateCount: actualDuplicates.length,
      eventCount: events.length
    };
    
  } catch (error) {
    console.error('❌ Error checking attendance state:', error);
    throw error;
  }
}

// Run the check
checkAttendanceState()
  .then((result) => {

    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to check attendance state:', error);
    process.exit(1);
  }); 
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MjU5MDksImV4cCI6MjA2MzAwMTkwOX0.W4AhQt8-ZGkQa7i7rfsdJ5L1ZEn8Yx3crcrWCOGR9pA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAttendanceState() {

  try {
    // Check total attendance records
    const { data: totalAttendance, error: totalError } = await supabase
      .from('event_attendance')
      .select('id', { count: 'exact' });
    
    if (totalError) throw totalError;

    // Check for duplicate records
    const { data: duplicates, error: dupError } = await supabase
      .from('event_attendance')
      .select('event_id, anonymous_name, created_at')
      .not('anonymous_name', 'is', null);
    
    if (dupError) throw dupError;
    
    // Find duplicates
    const duplicateMap = new Map();
    duplicates.forEach(record => {
      const key = `${record.event_id}-${record.anonymous_name}`;
      if (!duplicateMap.has(key)) {
        duplicateMap.set(key, []);
      }
      duplicateMap.get(key).push(record);
    });
    
    const actualDuplicates = Array.from(duplicateMap.entries())
      .filter(([key, records]) => records.length > 1);

    if (actualDuplicates.length > 0) {

      actualDuplicates.forEach(([key, records]) => {

      });
    }
    
    // Check events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, event_type, start_date')
      .order('start_date');
    
    if (eventsError) throw eventsError;

    // Show event details
    events.forEach(event => {

    });
    
    // Check unique constraint

    return {
      success: true,
      totalRecords: totalAttendance.length,
      duplicateCount: actualDuplicates.length,
      eventCount: events.length
    };
    
  } catch (error) {
    console.error('❌ Error checking attendance state:', error);
    throw error;
  }
}

// Run the check
checkAttendanceState()
  .then((result) => {

    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to check attendance state:', error);
    process.exit(1);
  }); 
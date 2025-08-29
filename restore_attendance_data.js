const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Load environment variables
const envVars = require('dotenv').config().parsed || {};
process.env.SUPABASE_URL = envVars.VITE_SUPABASE_URL;
process.env.SUPABASE_ANON_KEY = envVars.VITE_SUPABASE_ANON_KEY;

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI3NzY2MTcsImV4cCI6MjA0ODM1MjYxN30.dH6WyqDg';

async function restoreAttendanceData() {

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/generate-demo-data`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
        memberCount: 50,
        weeksToGenerate: 12,
        startDate: '2024-01-01'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    return result;
  } catch (error) {
    console.error('❌ Failed to restore attendance data:', error);
    throw error;
  }
}

// Run the restoration
restoreAttendanceData()
  .then(() => {

    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Data restoration failed:', error);
    process.exit(1);
  }); 
require('dotenv').config();

// Load environment variables
const envVars = require('dotenv').config().parsed || {};
process.env.SUPABASE_URL = envVars.VITE_SUPABASE_URL;
process.env.SUPABASE_ANON_KEY = envVars.VITE_SUPABASE_ANON_KEY;

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI3NzY2MTcsImV4cCI6MjA0ODM1MjYxN30.dH6WyqDg';

async function restoreAttendanceData() {

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/generate-demo-data`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
        memberCount: 50,
        weeksToGenerate: 12,
        startDate: '2024-01-01'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    return result;
  } catch (error) {
    console.error('❌ Failed to restore attendance data:', error);
    throw error;
  }
}

// Run the restoration
restoreAttendanceData()
  .then(() => {

    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Data restoration failed:', error);
    process.exit(1);
  }); 
require('dotenv').config();

// Load environment variables
const envVars = require('dotenv').config().parsed || {};
process.env.SUPABASE_URL = envVars.VITE_SUPABASE_URL;
process.env.SUPABASE_ANON_KEY = envVars.VITE_SUPABASE_ANON_KEY;

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI3NzY2MTcsImV4cCI6MjA0ODM1MjYxN30.dH6WyqDg';

async function restoreAttendanceData() {

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/generate-demo-data`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
        memberCount: 50,
        weeksToGenerate: 12,
        startDate: '2024-01-01'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    return result;
  } catch (error) {
    console.error('❌ Failed to restore attendance data:', error);
    throw error;
  }
}

// Run the restoration
restoreAttendanceData()
  .then(() => {

    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Data restoration failed:', error);
    process.exit(1);
  }); 
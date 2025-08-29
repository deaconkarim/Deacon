const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI3NzY2MTcsImV4cCI6MjA0ODM1MjYxN30.dH6WyqDgqVOJmQJFgWcKJ4LVrOL5FjOKYgLQj8dOLcw'
);

async function checkMembers() {
  const orgId = '8e4c7ce0-c805-41ca-8201-0c11ab9ac74c';

  // Check all members for this organization
  const { data: members, error: membersError } = await supabase
    .from('members')
    .select('id, firstname, lastname, organization_id, created_at')
    .eq('organization_id', orgId);
  
  if (membersError) {
    console.error('❌ Error fetching members:', membersError);
    return;
  }

  if (members.length > 0) {

    members.slice(0, 5).forEach(member => {

    });
  }
  
  // Check members with NULL organization_id
  const { data: nullOrgMembers, error: nullError } = await supabase
    .from('members')
    .select('id, firstname, lastname, organization_id, created_at')
    .is('organization_id', null);
  
  if (nullError) {
    console.error('❌ Error fetching NULL org members:', nullError);
  } else {

    if (nullOrgMembers.length > 0) {

      nullOrgMembers.slice(0, 5).forEach(member => {

      });
    }
  }
  
  // Check attendance records
  const { data: attendance, error: attendanceError } = await supabase
    .from('event_attendance')
    .select('id, member_id, organization_id')
    .eq('organization_id', orgId)
    .limit(5);
  
  if (attendanceError) {
    console.error('❌ Error fetching attendance:', attendanceError);
  } else {

    attendance.forEach(record => {

    });
  }
  
  // Check donations
  const { data: donations, error: donationsError } = await supabase
    .from('donations')
    .select('id, donor_id, organization_id, amount')
    .eq('organization_id', orgId)
    .limit(5);
  
  if (donationsError) {
    console.error('❌ Error fetching donations:', donationsError);
  } else {

    donations.forEach(record => {

    });
  }
}

checkMembers().catch(console.error); 
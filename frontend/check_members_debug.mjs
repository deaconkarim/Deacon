import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://cccxexvoahyeookqmxpl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMxNzQ1MDMsImV4cCI6MjA0ODc1MDUwM30.CD1jPRRjT_F5nGq4UgNpvJzI2I8z4K2X4KN_KZClVd8'
);

async function checkMembers() {
  const orgId = '8e4c7ce0-c805-41ca-8201-0c11ab9ac74c';
  
  console.log('🔍 Checking members for organization:', orgId);
  
  // Check all members for this organization
  const { data: members, error: membersError } = await supabase
    .from('members')
    .select('id, firstname, lastname, organization_id, created_at')
    .eq('organization_id', orgId);
  
  if (membersError) {
    console.error('❌ Error fetching members:', membersError);
    return;
  }
  
  console.log('✅ Found', members.length, 'members');
  if (members.length > 0) {
    console.log('First few members:');
    members.slice(0, 5).forEach(member => {
      console.log(`  - ${member.firstname} ${member.lastname} (${member.organization_id})`);
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
    console.log('🔍 Found', nullOrgMembers.length, 'members with NULL organization_id');
    if (nullOrgMembers.length > 0) {
      console.log('First few NULL org members:');
      nullOrgMembers.slice(0, 5).forEach(member => {
        console.log(`  - ${member.firstname} ${member.lastname} (${member.organization_id})`);
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
    console.log('✅ Found', attendance.length, 'attendance records (showing first 5)');
    attendance.forEach(record => {
      console.log(`  - Attendance ${record.id}: member_id=${record.member_id}, org_id=${record.organization_id}`);
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
    console.log('✅ Found', donations.length, 'donations (showing first 5)');
    donations.forEach(record => {
      console.log(`  - Donation ${record.id}: donor_id=${record.donor_id}, org_id=${record.organization_id}, amount=$${record.amount}`);
    });
  }
}

checkMembers().catch(console.error); 
// Test script for default groups functionality
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MjU5MDksImV4cCI6MjA2MzAwMTkwOX0.W4AhQt8-ZGkQa7i7rfsdJ5L1ZEn8Yx3crcrWCOGR9pA';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testDefaultGroups() {
  try {
    console.log('🚀 Testing default groups functionality...\n');

    // Get all organizations
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(1);

    if (orgError) {
      console.error('Error fetching organizations:', orgError);
      return;
    }

    if (!organizations || organizations.length === 0) {
      console.log('No organizations found, cannot test');
      return;
    }

    const org = organizations[0];
    console.log(`📋 Testing with organization: ${org.name} (${org.id})\n`);

    // Check if default groups exist
    console.log('1. Checking if default groups exist...');
    const { data: defaultGroups, error: groupsError } = await supabase
      .from('groups')
      .select('id, name, description, is_default, organization_id')
      .eq('organization_id', org.id)
      .eq('is_default', true)
      .order('name');

    if (groupsError) {
      console.error('Error fetching default groups:', groupsError);
      return;
    }

    console.log('Default groups found:', defaultGroups?.length || 0);
    defaultGroups?.forEach(group => {
      console.log(`  - ${group.name}: ${group.description}`);
    });

    if (!defaultGroups || defaultGroups.length === 0) {
      console.log('\n❌ No default groups found. Running migration function...');
      
      // Try to create default groups for this organization
      const { data: migrationResult, error: migrationError } = await supabase
        .rpc('create_default_groups_for_org', { org_id: org.id });

      if (migrationError) {
        console.error('Error creating default groups:', migrationError);
        return;
      }

      console.log('✅ Migration function executed successfully');

      // Re-check for default groups
      const { data: newDefaultGroups } = await supabase
        .from('groups')
        .select('id, name, description, is_default, organization_id')
        .eq('organization_id', org.id)
        .eq('is_default', true)
        .order('name');

      console.log('Default groups after migration:', newDefaultGroups?.length || 0);
      newDefaultGroups?.forEach(group => {
        console.log(`  - ${group.name}: ${group.description}`);
      });
    }

    // Get the "Everyone" and "Active Members" groups
    const everyoneGroup = defaultGroups?.find(g => g.name === 'Everyone');
    const activeMembersGroup = defaultGroups?.find(g => g.name === 'Active Members');

    if (!everyoneGroup || !activeMembersGroup) {
      console.log('\n❌ Required default groups not found');
      return;
    }

    console.log(`\n2. Testing member creation and auto-assignment...`);

    // Get existing members count in default groups
    const { data: everyoneMembers, error: everyoneError } = await supabase
      .from('group_members')
      .select('member_id')
      .eq('group_id', everyoneGroup.id);

    const { data: activeMembers, error: activeError } = await supabase
      .from('group_members')
      .select('member_id')
      .eq('group_id', activeMembersGroup.id);

    if (everyoneError || activeError) {
      console.error('Error fetching group memberships:', everyoneError || activeError);
      return;
    }

    console.log(`Before test - Everyone group: ${everyoneMembers?.length || 0} members`);
    console.log(`Before test - Active Members group: ${activeMembers?.length || 0} members`);

    // Create a test member
    const testMember = {
      firstname: 'Test',
      lastname: 'Member',
      email: `test.member.${Date.now()}@example.com`,
      phone: `555-0${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      status: 'active',
      organization_id: org.id
    };

    console.log(`\nCreating test member: ${testMember.firstname} ${testMember.lastname}`);

    const { data: newMember, error: memberError } = await supabase
      .from('members')
      .insert([testMember])
      .select()
      .single();

    if (memberError) {
      console.error('Error creating test member:', memberError);
      return;
    }

    console.log(`✅ Created member with ID: ${newMember.id}`);

    // Wait a moment for triggers to process
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if member was automatically added to default groups
    console.log('\n3. Checking automatic group membership...');

    const { data: memberGroups, error: memberGroupsError } = await supabase
      .from('group_members')
      .select(`
        group_id,
        groups(name, is_default)
      `)
      .eq('member_id', newMember.id);

    if (memberGroupsError) {
      console.error('Error fetching member groups:', memberGroupsError);
      return;
    }

    console.log(`Member is in ${memberGroups?.length || 0} groups:`);
    memberGroups?.forEach(mg => {
      console.log(`  - ${mg.groups.name} ${mg.groups.is_default ? '(default)' : ''}`);
    });

    const isInEveryone = memberGroups?.some(mg => mg.groups.name === 'Everyone');
    const isInActiveMembers = memberGroups?.some(mg => mg.groups.name === 'Active Members');

    if (isInEveryone && isInActiveMembers) {
      console.log('\n✅ SUCCESS: Member was automatically added to both default groups!');
    } else {
      console.log('\n❌ FAILURE: Member was not added to all default groups');
      console.log(`  - Everyone: ${isInEveryone ? '✅' : '❌'}`);
      console.log(`  - Active Members: ${isInActiveMembers ? '✅' : '❌'}`);
    }

    // Test status change from active to inactive
    console.log('\n4. Testing status change from active to inactive...');

    const { error: updateError } = await supabase
      .from('members')
      .update({ status: 'inactive' })
      .eq('id', newMember.id);

    if (updateError) {
      console.error('Error updating member status:', updateError);
      return;
    }

    // Wait for trigger to process
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check group membership after status change
    const { data: updatedMemberGroups } = await supabase
      .from('group_members')
      .select(`
        group_id,
        groups(name, is_default)
      `)
      .eq('member_id', newMember.id);

    console.log(`After status change, member is in ${updatedMemberGroups?.length || 0} groups:`);
    updatedMemberGroups?.forEach(mg => {
      console.log(`  - ${mg.groups.name} ${mg.groups.is_default ? '(default)' : ''}`);
    });

    const stillInEveryone = updatedMemberGroups?.some(mg => mg.groups.name === 'Everyone');
    const stillInActiveMembers = updatedMemberGroups?.some(mg => mg.groups.name === 'Active Members');

    if (stillInEveryone && !stillInActiveMembers) {
      console.log('✅ SUCCESS: Member removed from Active Members but kept in Everyone!');
    } else {
      console.log('❌ FAILURE: Unexpected group membership after status change');
      console.log(`  - Everyone: ${stillInEveryone ? '✅' : '❌'}`);
      console.log(`  - Active Members: ${stillInActiveMembers ? '❌ (should be removed)' : '✅'}`);
    }

    // Clean up test member
    console.log('\n5. Cleaning up test data...');
    
    // Delete group memberships first
    await supabase
      .from('group_members')
      .delete()
      .eq('member_id', newMember.id);

    // Delete test member
    await supabase
      .from('members')
      .delete()
      .eq('id', newMember.id);

    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Default groups test completed!');

  } catch (error) {
    console.error('Unexpected error during test:', error);
  }
}

// Run the test
testDefaultGroups();

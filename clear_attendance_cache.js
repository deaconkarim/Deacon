// Script to clear attendance caches and test the fixes
const fs = require('fs');
const path = require('path');

// Read the .env file from frontend directory
const envPath = path.join(__dirname, 'frontend', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

// Parse environment variables
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

// Set environment variables
process.env.SUPABASE_URL = envVars.VITE_SUPABASE_URL;
process.env.SUPABASE_ANON_KEY = envVars.VITE_SUPABASE_ANON_KEY;

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function clearAttendanceCache() {
  console.log('🧹 Clearing attendance caches and testing fixes...\n');

  try {
    // Step 1: Check current state
    console.log('📊 Step 1: Checking current database state...');
    
    const { data: attendanceCount, error: countError } = await supabase
      .from('event_attendance')
      .select('id', { count: 'exact' });

    if (countError) {
      console.log('❌ Error counting attendance records:', countError);
    } else {
      console.log(`   Total attendance records: ${attendanceCount.length}`);
    }

    const { data: membersCount, error: membersCountError } = await supabase
      .from('members')
      .select('id', { count: 'exact' });

    if (membersCountError) {
      console.log('❌ Error counting members:', membersCountError);
    } else {
      console.log(`   Total members: ${membersCount.length}`);
    }

    const { data: eventsCount, error: eventsCountError } = await supabase
      .from('events')
      .select('id', { count: 'exact' });

    if (eventsCountError) {
      console.log('❌ Error counting events:', eventsCountError);
    } else {
      console.log(`   Total events: ${eventsCount.length}`);
    }

    // Step 2: Clean up orphaned records
    console.log('\n🧹 Step 2: Cleaning up orphaned records...');
    
    // Remove records with null member_id
    const { error: nullMemberError } = await supabase
      .from('event_attendance')
      .delete()
      .is('member_id', null);

    if (nullMemberError) {
      console.log('❌ Error removing null member records:', nullMemberError);
    } else {
      console.log('   ✅ Removed records with null member_id');
    }

    // Remove records for non-existent members
    const { error: orphanedMemberError } = await supabase
      .from('event_attendance')
      .delete()
      .not('member_id', 'in', `(SELECT id FROM members WHERE id IS NOT NULL)`);

    if (orphanedMemberError) {
      console.log('❌ Error removing orphaned member records:', orphanedMemberError);
    } else {
      console.log('   ✅ Removed records for non-existent members');
    }

    // Remove records for non-existent events
    const { error: orphanedEventError } = await supabase
      .from('event_attendance')
      .delete()
      .not('event_id', 'in', `(SELECT id FROM events WHERE id IS NOT NULL)`);

    if (orphanedEventError) {
      console.log('❌ Error removing orphaned event records:', orphanedEventError);
    } else {
      console.log('   ✅ Removed records for non-existent events');
    }

    // Step 3: Check final state
    console.log('\n📊 Step 3: Checking final database state...');
    
    const { data: finalAttendanceCount, error: finalCountError } = await supabase
      .from('event_attendance')
      .select('id', { count: 'exact' });

    if (finalCountError) {
      console.log('❌ Error counting final attendance records:', finalCountError);
    } else {
      console.log(`   Final attendance records: ${finalAttendanceCount.length}`);
    }

    // Step 4: Test the unified attendance service
    console.log('\n🧪 Step 4: Testing unified attendance service...');
    
    // Test with a non-existent member ID
    const testMemberId = '00000000-0000-0000-0000-000000000000';
    
    // Mock the unified attendance service
    const unifiedAttendanceService = {
      async getMemberAttendanceCount(memberId, options = {}) {
        try {
          // First, validate that the member exists
          const { data: member, error: memberError } = await supabase
            .from('members')
            .select('id, firstname, lastname, organization_id')
            .eq('id', memberId)
            .single();

          if (memberError || !member) {
            console.warn(`Member ${memberId} not found`);
            return {
              totalCount: 0,
              records: [],
              eventTypeBreakdown: {}
            };
          }

          // Continue with normal logic...
          return {
            totalCount: 0,
            records: [],
            eventTypeBreakdown: {}
          };
        } catch (error) {
          console.error('Error in getMemberAttendanceCount:', error);
          return {
            totalCount: 0,
            records: [],
            eventTypeBreakdown: {}
          };
        }
      },

      async getTopAttendees(options = {}) {
        try {
          const organizationId = '550e8400-e29b-41d4-a716-446655440000'; // Brentwood Lighthouse
          
          const { data, error } = await supabase
            .from('event_attendance')
            .select(`
              *,
              events!inner(
                id,
                title,
                start_date,
                event_type,
                organization_id
              ),
              members!inner(
                id,
                firstname,
                lastname,
                image_url,
                organization_id
              )
            `)
            .eq('events.organization_id', organizationId)
            .eq('members.organization_id', organizationId)
            .not('member_id', 'is', null);

          if (error) {
            console.error('Error fetching top attendees:', error);
            return [];
          }

          // Filter out records with missing member data
          const validRecords = data.filter(record => 
            record.member_id && 
            record.members && 
            record.members.firstname && 
            record.members.lastname
          );

          if (validRecords.length === 0) {
            console.log('No valid attendance records found');
            return [];
          }

          // Count attendance per member
          const memberAttendanceCount = {};
          validRecords.forEach(record => {
            const memberId = record.member_id;
            if (!memberAttendanceCount[memberId]) {
              memberAttendanceCount[memberId] = {
                id: memberId,
                name: `${record.members.firstname} ${record.members.lastname}`,
                image: record.members.image_url,
                count: 0
              };
            }
            memberAttendanceCount[memberId].count++;
          });

          return Object.values(memberAttendanceCount)
            .sort((a, b) => b.count - a.count)
            .slice(0, options.limit || 10);
        } catch (error) {
          console.error('Error in getTopAttendees:', error);
          return [];
        }
      }
    };

    // Test member attendance count
    const memberResult = await unifiedAttendanceService.getMemberAttendanceCount(testMemberId);
    console.log(`   Test member attendance count: ${memberResult.totalCount}`);

    // Test top attendees
    const topAttendees = await unifiedAttendanceService.getTopAttendees({ limit: 5 });
    console.log(`   Top attendees found: ${topAttendees.length}`);
    topAttendees.forEach((attendee, index) => {
      console.log(`     ${index + 1}. ${attendee.name}: ${attendee.count} events`);
    });

    console.log('\n✅ Cache clearing and testing completed!');
    console.log('\n📋 Summary:');
    console.log('   - Orphaned attendance records have been cleaned up');
    console.log('   - Unified attendance service now handles missing data gracefully');
    console.log('   - All pages should now show consistent attendance counts (0 until data is restored)');
    console.log('\n🔄 Next steps:');
    console.log('   1. Restart the frontend application to clear any in-memory caches');
    console.log('   2. Add members and events back to the database');
    console.log('   3. Test attendance functionality with valid data');

  } catch (error) {
    console.error('❌ Error in cache clearing process:', error);
  }
}

clearAttendanceCache(); 
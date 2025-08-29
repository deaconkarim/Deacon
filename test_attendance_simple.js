// Simple test to check attendance counts using the existing frontend code
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

async function testAttendanceCounts() {

  try {
    // Check organizations
    const { data: organizations, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(5);

    if (orgsError) {

    } else {

      if (organizations && organizations.length > 0) {
        organizations.forEach(org => {

        });
      } else {

      }
    }

    // Check members with different approaches

    // Approach 1: Basic select
    const { data: allMembers, error: allMembersError } = await supabase
      .from('members')
      .select('id, firstname, lastname, organization_id')
      .limit(20);

    if (allMembersError) {

    } else if (allMembers && allMembers.length > 0) {
      allMembers.forEach(member => {

      });
    } else {

    }

    // Approach 2: Check specific organization
    if (organizations && organizations.length > 0) {
      const orgId = organizations[0].id;
      const { data: orgMembers, error: orgMembersError } = await supabase
        .from('members')
        .select('id, firstname, lastname, organization_id')
        .eq('organization_id', orgId)
        .limit(10);

      if (orgMembersError) {

      } else if (orgMembers && orgMembers.length > 0) {
        orgMembers.forEach(member => {

        });
      } else {

      }
    }

    // Approach 3: Check for specific member IDs from attendance
    const { data: attendance, error: attendanceError } = await supabase
      .from('event_attendance')
      .select('id, event_id, member_id, status')
      .limit(20);

    if (attendanceError) {

    } else {

      if (attendance && attendance.length > 0) {
        // Get unique member IDs from attendance records
        const memberIds = [...new Set(attendance.map(record => record.member_id).filter(Boolean))];

        if (memberIds.length > 0) {
          // Try to find these specific members
          const { data: attendanceMembers, error: attendanceMembersError } = await supabase
            .from('members')
            .select('id, firstname, lastname, organization_id')
            .in('id', memberIds);

          if (attendanceMembersError) {

          } else if (attendanceMembers && attendanceMembers.length > 0) {
            attendanceMembers.forEach(member => {

            });

            // Test attendance for the first member
            const testMember = attendanceMembers[0];

            // Test 30-day attendance count
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { data: memberAttendance, error: memberAttendanceError } = await supabase
              .from('event_attendance')
              .select(`
                *,
                events!inner(
                  id,
                  title,
                  start_date,
                  end_date,
                  event_type,
                  organization_id
                )
              `)
              .eq('member_id', testMember.id)
              .eq('events.organization_id', testMember.organization_id)
              .in('status', ['attending', 'checked-in'])
              .gte('events.start_date', thirtyDaysAgo.toISOString())
              .lt('events.start_date', today.toISOString())
              .order('created_at', { ascending: false });

            if (memberAttendanceError) {

            } else {

              memberAttendance.forEach((record, index) => {

              });

              // Check for duplicates
              const eventIds = memberAttendance.map(record => record.event_id);
              const uniqueEventIds = [...new Set(eventIds)];

            }
          } else {

          }
        }
      } else {

      }
    }

    // Check events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, start_date, organization_id')
      .limit(10);

    if (eventsError) {

    } else {

      if (events && events.length > 0) {
        events.forEach(event => {

        });
      } else {

      }
    }

  } catch (error) {
    console.error('❌ Error in test:', error);
  }
}

testAttendanceCounts(); 
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

async function testAttendanceCounts() {

  try {
    // Check organizations
    const { data: organizations, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(5);

    if (orgsError) {

    } else {

      if (organizations && organizations.length > 0) {
        organizations.forEach(org => {

        });
      } else {

      }
    }

    // Check members with different approaches

    // Approach 1: Basic select
    const { data: allMembers, error: allMembersError } = await supabase
      .from('members')
      .select('id, firstname, lastname, organization_id')
      .limit(20);

    if (allMembersError) {

    } else if (allMembers && allMembers.length > 0) {
      allMembers.forEach(member => {

      });
    } else {

    }

    // Approach 2: Check specific organization
    if (organizations && organizations.length > 0) {
      const orgId = organizations[0].id;
      const { data: orgMembers, error: orgMembersError } = await supabase
        .from('members')
        .select('id, firstname, lastname, organization_id')
        .eq('organization_id', orgId)
        .limit(10);

      if (orgMembersError) {

      } else if (orgMembers && orgMembers.length > 0) {
        orgMembers.forEach(member => {

        });
      } else {

      }
    }

    // Approach 3: Check for specific member IDs from attendance
    const { data: attendance, error: attendanceError } = await supabase
      .from('event_attendance')
      .select('id, event_id, member_id, status')
      .limit(20);

    if (attendanceError) {

    } else {

      if (attendance && attendance.length > 0) {
        // Get unique member IDs from attendance records
        const memberIds = [...new Set(attendance.map(record => record.member_id).filter(Boolean))];

        if (memberIds.length > 0) {
          // Try to find these specific members
          const { data: attendanceMembers, error: attendanceMembersError } = await supabase
            .from('members')
            .select('id, firstname, lastname, organization_id')
            .in('id', memberIds);

          if (attendanceMembersError) {

          } else if (attendanceMembers && attendanceMembers.length > 0) {
            attendanceMembers.forEach(member => {

            });

            // Test attendance for the first member
            const testMember = attendanceMembers[0];

            // Test 30-day attendance count
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { data: memberAttendance, error: memberAttendanceError } = await supabase
              .from('event_attendance')
              .select(`
                *,
                events!inner(
                  id,
                  title,
                  start_date,
                  end_date,
                  event_type,
                  organization_id
                )
              `)
              .eq('member_id', testMember.id)
              .eq('events.organization_id', testMember.organization_id)
              .in('status', ['attending', 'checked-in'])
              .gte('events.start_date', thirtyDaysAgo.toISOString())
              .lt('events.start_date', today.toISOString())
              .order('created_at', { ascending: false });

            if (memberAttendanceError) {

            } else {

              memberAttendance.forEach((record, index) => {

              });

              // Check for duplicates
              const eventIds = memberAttendance.map(record => record.event_id);
              const uniqueEventIds = [...new Set(eventIds)];

            }
          } else {

          }
        }
      } else {

      }
    }

    // Check events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, start_date, organization_id')
      .limit(10);

    if (eventsError) {

    } else {

      if (events && events.length > 0) {
        events.forEach(event => {

        });
      } else {

      }
    }

  } catch (error) {
    console.error('❌ Error in test:', error);
  }
}

testAttendanceCounts(); 
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

async function testAttendanceCounts() {

  try {
    // Check organizations
    const { data: organizations, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(5);

    if (orgsError) {

    } else {

      if (organizations && organizations.length > 0) {
        organizations.forEach(org => {

        });
      } else {

      }
    }

    // Check members with different approaches

    // Approach 1: Basic select
    const { data: allMembers, error: allMembersError } = await supabase
      .from('members')
      .select('id, firstname, lastname, organization_id')
      .limit(20);

    if (allMembersError) {

    } else if (allMembers && allMembers.length > 0) {
      allMembers.forEach(member => {

      });
    } else {

    }

    // Approach 2: Check specific organization
    if (organizations && organizations.length > 0) {
      const orgId = organizations[0].id;
      const { data: orgMembers, error: orgMembersError } = await supabase
        .from('members')
        .select('id, firstname, lastname, organization_id')
        .eq('organization_id', orgId)
        .limit(10);

      if (orgMembersError) {

      } else if (orgMembers && orgMembers.length > 0) {
        orgMembers.forEach(member => {

        });
      } else {

      }
    }

    // Approach 3: Check for specific member IDs from attendance
    const { data: attendance, error: attendanceError } = await supabase
      .from('event_attendance')
      .select('id, event_id, member_id, status')
      .limit(20);

    if (attendanceError) {

    } else {

      if (attendance && attendance.length > 0) {
        // Get unique member IDs from attendance records
        const memberIds = [...new Set(attendance.map(record => record.member_id).filter(Boolean))];

        if (memberIds.length > 0) {
          // Try to find these specific members
          const { data: attendanceMembers, error: attendanceMembersError } = await supabase
            .from('members')
            .select('id, firstname, lastname, organization_id')
            .in('id', memberIds);

          if (attendanceMembersError) {

          } else if (attendanceMembers && attendanceMembers.length > 0) {
            attendanceMembers.forEach(member => {

            });

            // Test attendance for the first member
            const testMember = attendanceMembers[0];

            // Test 30-day attendance count
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { data: memberAttendance, error: memberAttendanceError } = await supabase
              .from('event_attendance')
              .select(`
                *,
                events!inner(
                  id,
                  title,
                  start_date,
                  end_date,
                  event_type,
                  organization_id
                )
              `)
              .eq('member_id', testMember.id)
              .eq('events.organization_id', testMember.organization_id)
              .in('status', ['attending', 'checked-in'])
              .gte('events.start_date', thirtyDaysAgo.toISOString())
              .lt('events.start_date', today.toISOString())
              .order('created_at', { ascending: false });

            if (memberAttendanceError) {

            } else {

              memberAttendance.forEach((record, index) => {

              });

              // Check for duplicates
              const eventIds = memberAttendance.map(record => record.event_id);
              const uniqueEventIds = [...new Set(eventIds)];

            }
          } else {

          }
        }
      } else {

      }
    }

    // Check events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, start_date, organization_id')
      .limit(10);

    if (eventsError) {

    } else {

      if (events && events.length > 0) {
        events.forEach(event => {

        });
      } else {

      }
    }

  } catch (error) {
    console.error('❌ Error in test:', error);
  }
}

testAttendanceCounts(); 
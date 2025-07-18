// Test script to debug attendance count discrepancy for Anthony Grose
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client (you'll need to add your credentials)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAttendanceDiscrepancy() {
  console.log('🔍 Testing attendance count discrepancy for Anthony Grose...\n');

  try {
    // First, find Anthony Grose
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, firstname, lastname, organization_id')
      .ilike('firstname', '%anthony%')
      .ilike('lastname', '%grose%');

    if (membersError || !members || members.length === 0) {
      console.log('❌ Anthony Grose not found');
      return;
    }

    const anthony = members[0];
    console.log(`👤 Found: ${anthony.firstname} ${anthony.lastname} (${anthony.id})`);
    console.log(`🏢 Organization ID: ${anthony.organization_id}\n`);

    // Test 1: Member Profile Count (30-day window)
    console.log('📊 Test 1: Member Profile Count (30-day window)');
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: memberProfileAttendance, error: memberProfileError } = await supabase
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
      .eq('member_id', anthony.id)
      .eq('events.organization_id', anthony.organization_id)
      .in('status', ['attending', 'checked-in'])
      .gte('events.start_date', thirtyDaysAgo.toISOString())
      .lt('events.start_date', today.toISOString())
      .order('created_at', { ascending: false });

    if (memberProfileError) {
      console.log('❌ Error fetching member profile attendance:', memberProfileError);
    } else {
      console.log(`✅ Member Profile Count: ${memberProfileAttendance.length} events`);
      console.log('   Events attended:');
      memberProfileAttendance.forEach(record => {
        console.log(`   - ${record.events.title} (${record.events.start_date}) - ${record.status}`);
      });
    }

    // Test 2: Dashboard Count (30-day window)
    console.log('\n📊 Test 2: Dashboard Count (30-day window)');
    const { data: dashboardAttendance, error: dashboardError } = await supabase
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
      .eq('member_id', anthony.id)
      .eq('events.organization_id', anthony.organization_id)
      .in('status', ['attending', 'checked-in'])
      .gte('events.start_date', thirtyDaysAgo.toISOString())
      .lt('events.start_date', today.toISOString())
      .order('created_at', { ascending: false });

    if (dashboardError) {
      console.log('❌ Error fetching dashboard attendance:', dashboardError);
    } else {
      console.log(`✅ Dashboard Count: ${dashboardAttendance.length} events`);
    }

    // Test 3: Events Page Count (30-day window)
    console.log('\n📊 Test 3: Events Page Count (30-day window)');
    const { data: eventsPageAttendance, error: eventsPageError } = await supabase
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
      .eq('member_id', anthony.id)
      .eq('events.organization_id', anthony.organization_id)
      .in('status', ['attending', 'checked-in'])
      .gte('events.start_date', thirtyDaysAgo.toISOString())
      .lt('events.start_date', today.toISOString())
      .order('created_at', { ascending: false });

    if (eventsPageError) {
      console.log('❌ Error fetching events page attendance:', eventsPageError);
    } else {
      console.log(`✅ Events Page Count: ${eventsPageAttendance.length} events`);
    }

    // Test 4: All-time attendance for comparison
    console.log('\n📊 Test 4: All-time attendance for comparison');
    const { data: allTimeAttendance, error: allTimeError } = await supabase
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
      .eq('member_id', anthony.id)
      .eq('events.organization_id', anthony.organization_id)
      .in('status', ['attending', 'checked-in'])
      .lt('events.start_date', today.toISOString())
      .order('created_at', { ascending: false });

    if (allTimeError) {
      console.log('❌ Error fetching all-time attendance:', allTimeError);
    } else {
      console.log(`✅ All-time Count: ${allTimeAttendance.length} events`);
    }

    // Test 5: Check for duplicate records
    console.log('\n📊 Test 5: Checking for duplicate records');
    const eventIds = memberProfileAttendance.map(record => record.event_id);
    const uniqueEventIds = [...new Set(eventIds)];
    console.log(`   Total attendance records: ${memberProfileAttendance.length}`);
    console.log(`   Unique events: ${uniqueEventIds.length}`);
    console.log(`   Duplicate records: ${memberProfileAttendance.length - uniqueEventIds.length}`);

    // Test 6: Check event types
    console.log('\n📊 Test 6: Event type breakdown');
    const eventTypeBreakdown = {};
    memberProfileAttendance.forEach(record => {
      let eventType = record.events?.event_type;
      
      // If event_type is null, empty, or 'Other', try to categorize based on title
      if (!eventType || eventType === '' || eventType === 'Other' || eventType === 'other') {
        const title = record.events?.title || '';
        const titleLower = title.toLowerCase();
        
        if (titleLower.includes('worship') || titleLower.includes('service')) {
          eventType = 'Worship Service';
        } else if (titleLower.includes('bible') || titleLower.includes('study') || titleLower.includes('class')) {
          eventType = 'Bible Study or Class';
        } else if (titleLower.includes('fellowship') || titleLower.includes('potluck') || 
                   titleLower.includes('breakfast') || titleLower.includes('lunch') ||
                   titleLower.includes('dinner') || titleLower.includes('gathering')) {
          eventType = 'Fellowship Gathering';
        } else if (titleLower.includes('prayer')) {
          eventType = 'Prayer Meeting';
        } else if (titleLower.includes('ministry') || titleLower.includes('group')) {
          eventType = 'Ministry Meeting';
        } else {
          eventType = 'Other';
        }
      }
      
      if (!eventTypeBreakdown[eventType]) {
        eventTypeBreakdown[eventType] = 0;
      }
      eventTypeBreakdown[eventType]++;
    });

    console.log('   Event type breakdown:');
    Object.entries(eventTypeBreakdown).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count} events`);
    });

    // Summary
    console.log('\n📋 Summary:');
    console.log(`   Member Profile (30-day): ${memberProfileAttendance.length}`);
    console.log(`   Dashboard (30-day): ${dashboardAttendance.length}`);
    console.log(`   Events Page (30-day): ${eventsPageAttendance.length}`);
    console.log(`   All-time: ${allTimeAttendance.length}`);

    if (memberProfileAttendance.length === dashboardAttendance.length && 
        dashboardAttendance.length === eventsPageAttendance.length) {
      console.log('\n✅ All counts match! The issue might be in the UI display or caching.');
    } else {
      console.log('\n❌ Counts don\'t match! There\'s a discrepancy in the data or queries.');
    }

  } catch (error) {
    console.error('❌ Error in test:', error);
  }
}

testAttendanceDiscrepancy(); 
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client (you'll need to add your credentials)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAttendanceDiscrepancy() {
  console.log('🔍 Testing attendance count discrepancy for Anthony Grose...\n');

  try {
    // First, find Anthony Grose
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, firstname, lastname, organization_id')
      .ilike('firstname', '%anthony%')
      .ilike('lastname', '%grose%');

    if (membersError || !members || members.length === 0) {
      console.log('❌ Anthony Grose not found');
      return;
    }

    const anthony = members[0];
    console.log(`👤 Found: ${anthony.firstname} ${anthony.lastname} (${anthony.id})`);
    console.log(`🏢 Organization ID: ${anthony.organization_id}\n`);

    // Test 1: Member Profile Count (30-day window)
    console.log('📊 Test 1: Member Profile Count (30-day window)');
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: memberProfileAttendance, error: memberProfileError } = await supabase
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
      .eq('member_id', anthony.id)
      .eq('events.organization_id', anthony.organization_id)
      .in('status', ['attending', 'checked-in'])
      .gte('events.start_date', thirtyDaysAgo.toISOString())
      .lt('events.start_date', today.toISOString())
      .order('created_at', { ascending: false });

    if (memberProfileError) {
      console.log('❌ Error fetching member profile attendance:', memberProfileError);
    } else {
      console.log(`✅ Member Profile Count: ${memberProfileAttendance.length} events`);
      console.log('   Events attended:');
      memberProfileAttendance.forEach(record => {
        console.log(`   - ${record.events.title} (${record.events.start_date}) - ${record.status}`);
      });
    }

    // Test 2: Dashboard Count (30-day window)
    console.log('\n📊 Test 2: Dashboard Count (30-day window)');
    const { data: dashboardAttendance, error: dashboardError } = await supabase
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
      .eq('member_id', anthony.id)
      .eq('events.organization_id', anthony.organization_id)
      .in('status', ['attending', 'checked-in'])
      .gte('events.start_date', thirtyDaysAgo.toISOString())
      .lt('events.start_date', today.toISOString())
      .order('created_at', { ascending: false });

    if (dashboardError) {
      console.log('❌ Error fetching dashboard attendance:', dashboardError);
    } else {
      console.log(`✅ Dashboard Count: ${dashboardAttendance.length} events`);
    }

    // Test 3: Events Page Count (30-day window)
    console.log('\n📊 Test 3: Events Page Count (30-day window)');
    const { data: eventsPageAttendance, error: eventsPageError } = await supabase
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
      .eq('member_id', anthony.id)
      .eq('events.organization_id', anthony.organization_id)
      .in('status', ['attending', 'checked-in'])
      .gte('events.start_date', thirtyDaysAgo.toISOString())
      .lt('events.start_date', today.toISOString())
      .order('created_at', { ascending: false });

    if (eventsPageError) {
      console.log('❌ Error fetching events page attendance:', eventsPageError);
    } else {
      console.log(`✅ Events Page Count: ${eventsPageAttendance.length} events`);
    }

    // Test 4: All-time attendance for comparison
    console.log('\n📊 Test 4: All-time attendance for comparison');
    const { data: allTimeAttendance, error: allTimeError } = await supabase
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
      .eq('member_id', anthony.id)
      .eq('events.organization_id', anthony.organization_id)
      .in('status', ['attending', 'checked-in'])
      .lt('events.start_date', today.toISOString())
      .order('created_at', { ascending: false });

    if (allTimeError) {
      console.log('❌ Error fetching all-time attendance:', allTimeError);
    } else {
      console.log(`✅ All-time Count: ${allTimeAttendance.length} events`);
    }

    // Test 5: Check for duplicate records
    console.log('\n📊 Test 5: Checking for duplicate records');
    const eventIds = memberProfileAttendance.map(record => record.event_id);
    const uniqueEventIds = [...new Set(eventIds)];
    console.log(`   Total attendance records: ${memberProfileAttendance.length}`);
    console.log(`   Unique events: ${uniqueEventIds.length}`);
    console.log(`   Duplicate records: ${memberProfileAttendance.length - uniqueEventIds.length}`);

    // Test 6: Check event types
    console.log('\n📊 Test 6: Event type breakdown');
    const eventTypeBreakdown = {};
    memberProfileAttendance.forEach(record => {
      let eventType = record.events?.event_type;
      
      // If event_type is null, empty, or 'Other', try to categorize based on title
      if (!eventType || eventType === '' || eventType === 'Other' || eventType === 'other') {
        const title = record.events?.title || '';
        const titleLower = title.toLowerCase();
        
        if (titleLower.includes('worship') || titleLower.includes('service')) {
          eventType = 'Worship Service';
        } else if (titleLower.includes('bible') || titleLower.includes('study') || titleLower.includes('class')) {
          eventType = 'Bible Study or Class';
        } else if (titleLower.includes('fellowship') || titleLower.includes('potluck') || 
                   titleLower.includes('breakfast') || titleLower.includes('lunch') ||
                   titleLower.includes('dinner') || titleLower.includes('gathering')) {
          eventType = 'Fellowship Gathering';
        } else if (titleLower.includes('prayer')) {
          eventType = 'Prayer Meeting';
        } else if (titleLower.includes('ministry') || titleLower.includes('group')) {
          eventType = 'Ministry Meeting';
        } else {
          eventType = 'Other';
        }
      }
      
      if (!eventTypeBreakdown[eventType]) {
        eventTypeBreakdown[eventType] = 0;
      }
      eventTypeBreakdown[eventType]++;
    });

    console.log('   Event type breakdown:');
    Object.entries(eventTypeBreakdown).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count} events`);
    });

    // Summary
    console.log('\n📋 Summary:');
    console.log(`   Member Profile (30-day): ${memberProfileAttendance.length}`);
    console.log(`   Dashboard (30-day): ${dashboardAttendance.length}`);
    console.log(`   Events Page (30-day): ${eventsPageAttendance.length}`);
    console.log(`   All-time: ${allTimeAttendance.length}`);

    if (memberProfileAttendance.length === dashboardAttendance.length && 
        dashboardAttendance.length === eventsPageAttendance.length) {
      console.log('\n✅ All counts match! The issue might be in the UI display or caching.');
    } else {
      console.log('\n❌ Counts don\'t match! There\'s a discrepancy in the data or queries.');
    }

  } catch (error) {
    console.error('❌ Error in test:', error);
  }
}

testAttendanceDiscrepancy(); 
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client (you'll need to add your credentials)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAttendanceDiscrepancy() {
  console.log('🔍 Testing attendance count discrepancy for Anthony Grose...\n');

  try {
    // First, find Anthony Grose
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, firstname, lastname, organization_id')
      .ilike('firstname', '%anthony%')
      .ilike('lastname', '%grose%');

    if (membersError || !members || members.length === 0) {
      console.log('❌ Anthony Grose not found');
      return;
    }

    const anthony = members[0];
    console.log(`👤 Found: ${anthony.firstname} ${anthony.lastname} (${anthony.id})`);
    console.log(`🏢 Organization ID: ${anthony.organization_id}\n`);

    // Test 1: Member Profile Count (30-day window)
    console.log('📊 Test 1: Member Profile Count (30-day window)');
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: memberProfileAttendance, error: memberProfileError } = await supabase
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
      .eq('member_id', anthony.id)
      .eq('events.organization_id', anthony.organization_id)
      .in('status', ['attending', 'checked-in'])
      .gte('events.start_date', thirtyDaysAgo.toISOString())
      .lt('events.start_date', today.toISOString())
      .order('created_at', { ascending: false });

    if (memberProfileError) {
      console.log('❌ Error fetching member profile attendance:', memberProfileError);
    } else {
      console.log(`✅ Member Profile Count: ${memberProfileAttendance.length} events`);
      console.log('   Events attended:');
      memberProfileAttendance.forEach(record => {
        console.log(`   - ${record.events.title} (${record.events.start_date}) - ${record.status}`);
      });
    }

    // Test 2: Dashboard Count (30-day window)
    console.log('\n📊 Test 2: Dashboard Count (30-day window)');
    const { data: dashboardAttendance, error: dashboardError } = await supabase
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
      .eq('member_id', anthony.id)
      .eq('events.organization_id', anthony.organization_id)
      .in('status', ['attending', 'checked-in'])
      .gte('events.start_date', thirtyDaysAgo.toISOString())
      .lt('events.start_date', today.toISOString())
      .order('created_at', { ascending: false });

    if (dashboardError) {
      console.log('❌ Error fetching dashboard attendance:', dashboardError);
    } else {
      console.log(`✅ Dashboard Count: ${dashboardAttendance.length} events`);
    }

    // Test 3: Events Page Count (30-day window)
    console.log('\n📊 Test 3: Events Page Count (30-day window)');
    const { data: eventsPageAttendance, error: eventsPageError } = await supabase
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
      .eq('member_id', anthony.id)
      .eq('events.organization_id', anthony.organization_id)
      .in('status', ['attending', 'checked-in'])
      .gte('events.start_date', thirtyDaysAgo.toISOString())
      .lt('events.start_date', today.toISOString())
      .order('created_at', { ascending: false });

    if (eventsPageError) {
      console.log('❌ Error fetching events page attendance:', eventsPageError);
    } else {
      console.log(`✅ Events Page Count: ${eventsPageAttendance.length} events`);
    }

    // Test 4: All-time attendance for comparison
    console.log('\n📊 Test 4: All-time attendance for comparison');
    const { data: allTimeAttendance, error: allTimeError } = await supabase
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
      .eq('member_id', anthony.id)
      .eq('events.organization_id', anthony.organization_id)
      .in('status', ['attending', 'checked-in'])
      .lt('events.start_date', today.toISOString())
      .order('created_at', { ascending: false });

    if (allTimeError) {
      console.log('❌ Error fetching all-time attendance:', allTimeError);
    } else {
      console.log(`✅ All-time Count: ${allTimeAttendance.length} events`);
    }

    // Test 5: Check for duplicate records
    console.log('\n📊 Test 5: Checking for duplicate records');
    const eventIds = memberProfileAttendance.map(record => record.event_id);
    const uniqueEventIds = [...new Set(eventIds)];
    console.log(`   Total attendance records: ${memberProfileAttendance.length}`);
    console.log(`   Unique events: ${uniqueEventIds.length}`);
    console.log(`   Duplicate records: ${memberProfileAttendance.length - uniqueEventIds.length}`);

    // Test 6: Check event types
    console.log('\n📊 Test 6: Event type breakdown');
    const eventTypeBreakdown = {};
    memberProfileAttendance.forEach(record => {
      let eventType = record.events?.event_type;
      
      // If event_type is null, empty, or 'Other', try to categorize based on title
      if (!eventType || eventType === '' || eventType === 'Other' || eventType === 'other') {
        const title = record.events?.title || '';
        const titleLower = title.toLowerCase();
        
        if (titleLower.includes('worship') || titleLower.includes('service')) {
          eventType = 'Worship Service';
        } else if (titleLower.includes('bible') || titleLower.includes('study') || titleLower.includes('class')) {
          eventType = 'Bible Study or Class';
        } else if (titleLower.includes('fellowship') || titleLower.includes('potluck') || 
                   titleLower.includes('breakfast') || titleLower.includes('lunch') ||
                   titleLower.includes('dinner') || titleLower.includes('gathering')) {
          eventType = 'Fellowship Gathering';
        } else if (titleLower.includes('prayer')) {
          eventType = 'Prayer Meeting';
        } else if (titleLower.includes('ministry') || titleLower.includes('group')) {
          eventType = 'Ministry Meeting';
        } else {
          eventType = 'Other';
        }
      }
      
      if (!eventTypeBreakdown[eventType]) {
        eventTypeBreakdown[eventType] = 0;
      }
      eventTypeBreakdown[eventType]++;
    });

    console.log('   Event type breakdown:');
    Object.entries(eventTypeBreakdown).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count} events`);
    });

    // Summary
    console.log('\n📋 Summary:');
    console.log(`   Member Profile (30-day): ${memberProfileAttendance.length}`);
    console.log(`   Dashboard (30-day): ${dashboardAttendance.length}`);
    console.log(`   Events Page (30-day): ${eventsPageAttendance.length}`);
    console.log(`   All-time: ${allTimeAttendance.length}`);

    if (memberProfileAttendance.length === dashboardAttendance.length && 
        dashboardAttendance.length === eventsPageAttendance.length) {
      console.log('\n✅ All counts match! The issue might be in the UI display or caching.');
    } else {
      console.log('\n❌ Counts don\'t match! There\'s a discrepancy in the data or queries.');
    }

  } catch (error) {
    console.error('❌ Error in test:', error);
  }
}

testAttendanceDiscrepancy(); 
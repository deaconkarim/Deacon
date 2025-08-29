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

  try {
    // First, find Anthony Grose
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, firstname, lastname, organization_id')
      .ilike('firstname', '%anthony%')
      .ilike('lastname', '%grose%');

    if (membersError || !members || members.length === 0) {

      return;
    }

    const anthony = members[0];

    // Test 1: Member Profile Count (30-day window)

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

    } else {

      memberProfileAttendance.forEach(record => {

      });
    }

    // Test 2: Dashboard Count (30-day window)

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

    } else {

    }

    // Test 3: Events Page Count (30-day window)

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

    } else {

    }

    // Test 4: All-time attendance for comparison

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

    } else {

    }

    // Test 5: Check for duplicate records

    const eventIds = memberProfileAttendance.map(record => record.event_id);
    const uniqueEventIds = [...new Set(eventIds)];

    // Test 6: Check event types

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

    Object.entries(eventTypeBreakdown).forEach(([type, count]) => {

    });

    // Summary

    if (memberProfileAttendance.length === dashboardAttendance.length && 
        dashboardAttendance.length === eventsPageAttendance.length) {

    } else {

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

  try {
    // First, find Anthony Grose
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, firstname, lastname, organization_id')
      .ilike('firstname', '%anthony%')
      .ilike('lastname', '%grose%');

    if (membersError || !members || members.length === 0) {

      return;
    }

    const anthony = members[0];

    // Test 1: Member Profile Count (30-day window)

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

    } else {

      memberProfileAttendance.forEach(record => {

      });
    }

    // Test 2: Dashboard Count (30-day window)

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

    } else {

    }

    // Test 3: Events Page Count (30-day window)

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

    } else {

    }

    // Test 4: All-time attendance for comparison

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

    } else {

    }

    // Test 5: Check for duplicate records

    const eventIds = memberProfileAttendance.map(record => record.event_id);
    const uniqueEventIds = [...new Set(eventIds)];

    // Test 6: Check event types

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

    Object.entries(eventTypeBreakdown).forEach(([type, count]) => {

    });

    // Summary

    if (memberProfileAttendance.length === dashboardAttendance.length && 
        dashboardAttendance.length === eventsPageAttendance.length) {

    } else {

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

  try {
    // First, find Anthony Grose
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, firstname, lastname, organization_id')
      .ilike('firstname', '%anthony%')
      .ilike('lastname', '%grose%');

    if (membersError || !members || members.length === 0) {

      return;
    }

    const anthony = members[0];

    // Test 1: Member Profile Count (30-day window)

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

    } else {

      memberProfileAttendance.forEach(record => {

      });
    }

    // Test 2: Dashboard Count (30-day window)

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

    } else {

    }

    // Test 3: Events Page Count (30-day window)

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

    } else {

    }

    // Test 4: All-time attendance for comparison

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

    } else {

    }

    // Test 5: Check for duplicate records

    const eventIds = memberProfileAttendance.map(record => record.event_id);
    const uniqueEventIds = [...new Set(eventIds)];

    // Test 6: Check event types

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

    Object.entries(eventTypeBreakdown).forEach(([type, count]) => {

    });

    // Summary

    if (memberProfileAttendance.length === dashboardAttendance.length && 
        dashboardAttendance.length === eventsPageAttendance.length) {

    } else {

    }

  } catch (error) {
    console.error('❌ Error in test:', error);
  }
}

testAttendanceDiscrepancy(); 
// Debug script to investigate attendance inconsistency and "Other" event type issue
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client (you'll need to add your credentials)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAttendanceIssue() {
  console.log('🔍 Debugging attendance inconsistency and "Other" event type issue...\n');

  try {
    // First, find Anthony Grose
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, firstname, lastname')
      .ilike('firstname', '%anthony%')
      .ilike('lastname', '%grose%');

    if (membersError || !members || members.length === 0) {
      console.log('❌ Anthony Grose not found');
      return;
    }

    const anthony = members[0];
    console.log(`👤 Found: ${anthony.firstname} ${anthony.lastname} (${anthony.id})`);

    // Get all attendance records for Anthony in the last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    today.setHours(0, 0, 0, 0);

    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('event_attendance')
      .select(`
        *,
        events (
          id,
          title,
          start_date,
          event_type,
          organization_id
        )
      `)
      .eq('member_id', anthony.id)
      .in('status', ['attending', 'checked-in'])
      .gte('events.start_date', thirtyDaysAgo.toISOString())
      .lt('events.start_date', today.toISOString())
      .order('created_at', { ascending: false });

    if (attendanceError) {
      console.log('❌ Error fetching attendance:', attendanceError);
      return;
    }

    console.log(`📊 Total attendance records (30 days): ${attendanceRecords.length}`);

    // Analyze each attendance record
    const eventTypeBreakdown = {};
    const eventDetails = [];

    attendanceRecords.forEach((record, index) => {
      const event = record.events;
      const eventType = event?.event_type || 'Other';
      
      if (!eventTypeBreakdown[eventType]) {
        eventTypeBreakdown[eventType] = 0;
      }
      eventTypeBreakdown[eventType]++;

      eventDetails.push({
        index: index + 1,
        eventId: event?.id,
        title: event?.title,
        eventType: eventType,
        originalEventType: event?.event_type,
        startDate: event?.start_date,
        status: record.status
      });
    });

    console.log('\n📋 Event Type Breakdown:');
    Object.entries(eventTypeBreakdown).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} events`);
    });

    console.log('\n📅 Detailed Event List:');
    eventDetails.forEach(detail => {
      console.log(`   ${detail.index}. "${detail.title}" (${detail.eventId})`);
      console.log(`      Type: "${detail.eventType}" (original: "${detail.originalEventType}")`);
      console.log(`      Date: ${detail.startDate}`);
      console.log(`      Status: ${detail.status}`);
      console.log('');
    });

    // Check for events with null/empty event_type
    const eventsWithNullType = eventDetails.filter(d => !d.originalEventType || d.originalEventType === '');
    if (eventsWithNullType.length > 0) {
      console.log('⚠️  Events with null/empty event_type:');
      eventsWithNullType.forEach(event => {
        console.log(`   - "${event.title}" (${event.eventId})`);
      });
    }

    // Check for events that should be categorized differently
    const eventsWithOtherType = eventDetails.filter(d => d.eventType === 'Other');
    if (eventsWithOtherType.length > 0) {
      console.log('\n🔍 Events categorized as "Other" that might need reclassification:');
      eventsWithOtherType.forEach(event => {
        const title = event.title.toLowerCase();
        let suggestedType = 'Other';
        
        if (title.includes('worship') || title.includes('service')) {
          suggestedType = 'Worship Service';
        } else if (title.includes('bible') || title.includes('study') || title.includes('class')) {
          suggestedType = 'Bible Study or Class';
        } else if (title.includes('fellowship') || title.includes('potluck') || 
                   title.includes('breakfast') || title.includes('lunch') ||
                   title.includes('dinner') || title.includes('gathering')) {
          suggestedType = 'Fellowship Gathering';
        } else if (title.includes('prayer')) {
          suggestedType = 'Prayer Meeting';
        } else if (title.includes('ministry') || title.includes('group')) {
          suggestedType = 'Ministry Meeting';
        }
        
        console.log(`   - "${event.title}"`);
        console.log(`     Current: "${event.eventType}" (original: "${event.originalEventType}")`);
        console.log(`     Suggested: "${suggestedType}"`);
        console.log('');
      });
    }

    // Test the unified service
    console.log('\n🧪 Testing Unified Attendance Service:');
    
    const unifiedAttendanceService = {
      async getMemberAttendanceCount(memberId, options = {}) {
        try {
          const {
            includeFutureEvents = false,
            includeDeclined = false,
            dateRange = null,
            useLast30Days = false
          } = options;

          let query = supabase
            .from('event_attendance')
            .select(`
              *,
              events (
                id,
                title,
                start_date,
                end_date,
                event_type,
                organization_id
              )
            `)
            .eq('member_id', memberId);

          // Filter by status
          if (!includeDeclined) {
            query = query.in('status', ['attending', 'checked-in']);
          }

          // Filter by date range if provided
          if (dateRange) {
            if (dateRange.startDate) {
              query = query.gte('events.start_date', dateRange.startDate);
            }
            if (dateRange.endDate) {
              query = query.lte('events.start_date', dateRange.endDate);
            }
          } else if (useLast30Days) {
            // Use last 30 days if specified
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
            query = query.gte('events.start_date', thirtyDaysAgo.toISOString());
          }

          // Filter by future/past events
          if (!includeFutureEvents) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            query = query.lt('events.start_date', today.toISOString());
          }

          const { data, error } = await query.order('created_at', { ascending: false });

          if (error) throw error;

          // Group by event type for breakdown
          const eventTypeBreakdown = {};
          data.forEach(record => {
            const eventType = record.events?.event_type || 'Other';
            if (!eventTypeBreakdown[eventType]) {
              eventTypeBreakdown[eventType] = 0;
            }
            eventTypeBreakdown[eventType]++;
          });

          return {
            totalCount: data.length,
            records: data,
            eventTypeBreakdown
          };
        } catch (error) {
          console.error('Error getting member attendance count:', error);
          throw error;
        }
      }
    };

    // Test with 30 days
    const unifiedResult30Days = await unifiedAttendanceService.getMemberAttendanceCount(anthony.id, {
      useLast30Days: true,
      includeFutureEvents: false,
      includeDeclined: false
    });

    console.log(`✅ Unified service (30 days): ${unifiedResult30Days.totalCount} events`);
    console.log('✅ Event type breakdown:', unifiedResult30Days.eventTypeBreakdown);

    // Test with all-time
    const unifiedResultAllTime = await unifiedAttendanceService.getMemberAttendanceCount(anthony.id, {
      useLast30Days: false,
      includeFutureEvents: false,
      includeDeclined: false
    });

    console.log(`✅ Unified service (all-time): ${unifiedResultAllTime.totalCount} events`);
    console.log('✅ Event type breakdown:', unifiedResultAllTime.eventTypeBreakdown);

    console.log('\n📊 Summary:');
    console.log(`   - Direct query (30 days): ${attendanceRecords.length} events`);
    console.log(`   - Unified service (30 days): ${unifiedResult30Days.totalCount} events`);
    console.log(`   - Unified service (all-time): ${unifiedResultAllTime.totalCount} events`);
    
    if (attendanceRecords.length === unifiedResult30Days.totalCount) {
      console.log('   ✅ 30-day counts match!');
    } else {
      console.log('   ❌ 30-day counts do not match!');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugAttendanceIssue(); 
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client (you'll need to add your credentials)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAttendanceIssue() {
  console.log('🔍 Debugging attendance inconsistency and "Other" event type issue...\n');

  try {
    // First, find Anthony Grose
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, firstname, lastname')
      .ilike('firstname', '%anthony%')
      .ilike('lastname', '%grose%');

    if (membersError || !members || members.length === 0) {
      console.log('❌ Anthony Grose not found');
      return;
    }

    const anthony = members[0];
    console.log(`👤 Found: ${anthony.firstname} ${anthony.lastname} (${anthony.id})`);

    // Get all attendance records for Anthony in the last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    today.setHours(0, 0, 0, 0);

    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('event_attendance')
      .select(`
        *,
        events (
          id,
          title,
          start_date,
          event_type,
          organization_id
        )
      `)
      .eq('member_id', anthony.id)
      .in('status', ['attending', 'checked-in'])
      .gte('events.start_date', thirtyDaysAgo.toISOString())
      .lt('events.start_date', today.toISOString())
      .order('created_at', { ascending: false });

    if (attendanceError) {
      console.log('❌ Error fetching attendance:', attendanceError);
      return;
    }

    console.log(`📊 Total attendance records (30 days): ${attendanceRecords.length}`);

    // Analyze each attendance record
    const eventTypeBreakdown = {};
    const eventDetails = [];

    attendanceRecords.forEach((record, index) => {
      const event = record.events;
      const eventType = event?.event_type || 'Other';
      
      if (!eventTypeBreakdown[eventType]) {
        eventTypeBreakdown[eventType] = 0;
      }
      eventTypeBreakdown[eventType]++;

      eventDetails.push({
        index: index + 1,
        eventId: event?.id,
        title: event?.title,
        eventType: eventType,
        originalEventType: event?.event_type,
        startDate: event?.start_date,
        status: record.status
      });
    });

    console.log('\n📋 Event Type Breakdown:');
    Object.entries(eventTypeBreakdown).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} events`);
    });

    console.log('\n📅 Detailed Event List:');
    eventDetails.forEach(detail => {
      console.log(`   ${detail.index}. "${detail.title}" (${detail.eventId})`);
      console.log(`      Type: "${detail.eventType}" (original: "${detail.originalEventType}")`);
      console.log(`      Date: ${detail.startDate}`);
      console.log(`      Status: ${detail.status}`);
      console.log('');
    });

    // Check for events with null/empty event_type
    const eventsWithNullType = eventDetails.filter(d => !d.originalEventType || d.originalEventType === '');
    if (eventsWithNullType.length > 0) {
      console.log('⚠️  Events with null/empty event_type:');
      eventsWithNullType.forEach(event => {
        console.log(`   - "${event.title}" (${event.eventId})`);
      });
    }

    // Check for events that should be categorized differently
    const eventsWithOtherType = eventDetails.filter(d => d.eventType === 'Other');
    if (eventsWithOtherType.length > 0) {
      console.log('\n🔍 Events categorized as "Other" that might need reclassification:');
      eventsWithOtherType.forEach(event => {
        const title = event.title.toLowerCase();
        let suggestedType = 'Other';
        
        if (title.includes('worship') || title.includes('service')) {
          suggestedType = 'Worship Service';
        } else if (title.includes('bible') || title.includes('study') || title.includes('class')) {
          suggestedType = 'Bible Study or Class';
        } else if (title.includes('fellowship') || title.includes('potluck') || 
                   title.includes('breakfast') || title.includes('lunch') ||
                   title.includes('dinner') || title.includes('gathering')) {
          suggestedType = 'Fellowship Gathering';
        } else if (title.includes('prayer')) {
          suggestedType = 'Prayer Meeting';
        } else if (title.includes('ministry') || title.includes('group')) {
          suggestedType = 'Ministry Meeting';
        }
        
        console.log(`   - "${event.title}"`);
        console.log(`     Current: "${event.eventType}" (original: "${event.originalEventType}")`);
        console.log(`     Suggested: "${suggestedType}"`);
        console.log('');
      });
    }

    // Test the unified service
    console.log('\n🧪 Testing Unified Attendance Service:');
    
    const unifiedAttendanceService = {
      async getMemberAttendanceCount(memberId, options = {}) {
        try {
          const {
            includeFutureEvents = false,
            includeDeclined = false,
            dateRange = null,
            useLast30Days = false
          } = options;

          let query = supabase
            .from('event_attendance')
            .select(`
              *,
              events (
                id,
                title,
                start_date,
                end_date,
                event_type,
                organization_id
              )
            `)
            .eq('member_id', memberId);

          // Filter by status
          if (!includeDeclined) {
            query = query.in('status', ['attending', 'checked-in']);
          }

          // Filter by date range if provided
          if (dateRange) {
            if (dateRange.startDate) {
              query = query.gte('events.start_date', dateRange.startDate);
            }
            if (dateRange.endDate) {
              query = query.lte('events.start_date', dateRange.endDate);
            }
          } else if (useLast30Days) {
            // Use last 30 days if specified
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
            query = query.gte('events.start_date', thirtyDaysAgo.toISOString());
          }

          // Filter by future/past events
          if (!includeFutureEvents) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            query = query.lt('events.start_date', today.toISOString());
          }

          const { data, error } = await query.order('created_at', { ascending: false });

          if (error) throw error;

          // Group by event type for breakdown
          const eventTypeBreakdown = {};
          data.forEach(record => {
            const eventType = record.events?.event_type || 'Other';
            if (!eventTypeBreakdown[eventType]) {
              eventTypeBreakdown[eventType] = 0;
            }
            eventTypeBreakdown[eventType]++;
          });

          return {
            totalCount: data.length,
            records: data,
            eventTypeBreakdown
          };
        } catch (error) {
          console.error('Error getting member attendance count:', error);
          throw error;
        }
      }
    };

    // Test with 30 days
    const unifiedResult30Days = await unifiedAttendanceService.getMemberAttendanceCount(anthony.id, {
      useLast30Days: true,
      includeFutureEvents: false,
      includeDeclined: false
    });

    console.log(`✅ Unified service (30 days): ${unifiedResult30Days.totalCount} events`);
    console.log('✅ Event type breakdown:', unifiedResult30Days.eventTypeBreakdown);

    // Test with all-time
    const unifiedResultAllTime = await unifiedAttendanceService.getMemberAttendanceCount(anthony.id, {
      useLast30Days: false,
      includeFutureEvents: false,
      includeDeclined: false
    });

    console.log(`✅ Unified service (all-time): ${unifiedResultAllTime.totalCount} events`);
    console.log('✅ Event type breakdown:', unifiedResultAllTime.eventTypeBreakdown);

    console.log('\n📊 Summary:');
    console.log(`   - Direct query (30 days): ${attendanceRecords.length} events`);
    console.log(`   - Unified service (30 days): ${unifiedResult30Days.totalCount} events`);
    console.log(`   - Unified service (all-time): ${unifiedResultAllTime.totalCount} events`);
    
    if (attendanceRecords.length === unifiedResult30Days.totalCount) {
      console.log('   ✅ 30-day counts match!');
    } else {
      console.log('   ❌ 30-day counts do not match!');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugAttendanceIssue(); 
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client (you'll need to add your credentials)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAttendanceIssue() {
  console.log('🔍 Debugging attendance inconsistency and "Other" event type issue...\n');

  try {
    // First, find Anthony Grose
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, firstname, lastname')
      .ilike('firstname', '%anthony%')
      .ilike('lastname', '%grose%');

    if (membersError || !members || members.length === 0) {
      console.log('❌ Anthony Grose not found');
      return;
    }

    const anthony = members[0];
    console.log(`👤 Found: ${anthony.firstname} ${anthony.lastname} (${anthony.id})`);

    // Get all attendance records for Anthony in the last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    today.setHours(0, 0, 0, 0);

    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('event_attendance')
      .select(`
        *,
        events (
          id,
          title,
          start_date,
          event_type,
          organization_id
        )
      `)
      .eq('member_id', anthony.id)
      .in('status', ['attending', 'checked-in'])
      .gte('events.start_date', thirtyDaysAgo.toISOString())
      .lt('events.start_date', today.toISOString())
      .order('created_at', { ascending: false });

    if (attendanceError) {
      console.log('❌ Error fetching attendance:', attendanceError);
      return;
    }

    console.log(`📊 Total attendance records (30 days): ${attendanceRecords.length}`);

    // Analyze each attendance record
    const eventTypeBreakdown = {};
    const eventDetails = [];

    attendanceRecords.forEach((record, index) => {
      const event = record.events;
      const eventType = event?.event_type || 'Other';
      
      if (!eventTypeBreakdown[eventType]) {
        eventTypeBreakdown[eventType] = 0;
      }
      eventTypeBreakdown[eventType]++;

      eventDetails.push({
        index: index + 1,
        eventId: event?.id,
        title: event?.title,
        eventType: eventType,
        originalEventType: event?.event_type,
        startDate: event?.start_date,
        status: record.status
      });
    });

    console.log('\n📋 Event Type Breakdown:');
    Object.entries(eventTypeBreakdown).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} events`);
    });

    console.log('\n📅 Detailed Event List:');
    eventDetails.forEach(detail => {
      console.log(`   ${detail.index}. "${detail.title}" (${detail.eventId})`);
      console.log(`      Type: "${detail.eventType}" (original: "${detail.originalEventType}")`);
      console.log(`      Date: ${detail.startDate}`);
      console.log(`      Status: ${detail.status}`);
      console.log('');
    });

    // Check for events with null/empty event_type
    const eventsWithNullType = eventDetails.filter(d => !d.originalEventType || d.originalEventType === '');
    if (eventsWithNullType.length > 0) {
      console.log('⚠️  Events with null/empty event_type:');
      eventsWithNullType.forEach(event => {
        console.log(`   - "${event.title}" (${event.eventId})`);
      });
    }

    // Check for events that should be categorized differently
    const eventsWithOtherType = eventDetails.filter(d => d.eventType === 'Other');
    if (eventsWithOtherType.length > 0) {
      console.log('\n🔍 Events categorized as "Other" that might need reclassification:');
      eventsWithOtherType.forEach(event => {
        const title = event.title.toLowerCase();
        let suggestedType = 'Other';
        
        if (title.includes('worship') || title.includes('service')) {
          suggestedType = 'Worship Service';
        } else if (title.includes('bible') || title.includes('study') || title.includes('class')) {
          suggestedType = 'Bible Study or Class';
        } else if (title.includes('fellowship') || title.includes('potluck') || 
                   title.includes('breakfast') || title.includes('lunch') ||
                   title.includes('dinner') || title.includes('gathering')) {
          suggestedType = 'Fellowship Gathering';
        } else if (title.includes('prayer')) {
          suggestedType = 'Prayer Meeting';
        } else if (title.includes('ministry') || title.includes('group')) {
          suggestedType = 'Ministry Meeting';
        }
        
        console.log(`   - "${event.title}"`);
        console.log(`     Current: "${event.eventType}" (original: "${event.originalEventType}")`);
        console.log(`     Suggested: "${suggestedType}"`);
        console.log('');
      });
    }

    // Test the unified service
    console.log('\n🧪 Testing Unified Attendance Service:');
    
    const unifiedAttendanceService = {
      async getMemberAttendanceCount(memberId, options = {}) {
        try {
          const {
            includeFutureEvents = false,
            includeDeclined = false,
            dateRange = null,
            useLast30Days = false
          } = options;

          let query = supabase
            .from('event_attendance')
            .select(`
              *,
              events (
                id,
                title,
                start_date,
                end_date,
                event_type,
                organization_id
              )
            `)
            .eq('member_id', memberId);

          // Filter by status
          if (!includeDeclined) {
            query = query.in('status', ['attending', 'checked-in']);
          }

          // Filter by date range if provided
          if (dateRange) {
            if (dateRange.startDate) {
              query = query.gte('events.start_date', dateRange.startDate);
            }
            if (dateRange.endDate) {
              query = query.lte('events.start_date', dateRange.endDate);
            }
          } else if (useLast30Days) {
            // Use last 30 days if specified
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
            query = query.gte('events.start_date', thirtyDaysAgo.toISOString());
          }

          // Filter by future/past events
          if (!includeFutureEvents) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            query = query.lt('events.start_date', today.toISOString());
          }

          const { data, error } = await query.order('created_at', { ascending: false });

          if (error) throw error;

          // Group by event type for breakdown
          const eventTypeBreakdown = {};
          data.forEach(record => {
            const eventType = record.events?.event_type || 'Other';
            if (!eventTypeBreakdown[eventType]) {
              eventTypeBreakdown[eventType] = 0;
            }
            eventTypeBreakdown[eventType]++;
          });

          return {
            totalCount: data.length,
            records: data,
            eventTypeBreakdown
          };
        } catch (error) {
          console.error('Error getting member attendance count:', error);
          throw error;
        }
      }
    };

    // Test with 30 days
    const unifiedResult30Days = await unifiedAttendanceService.getMemberAttendanceCount(anthony.id, {
      useLast30Days: true,
      includeFutureEvents: false,
      includeDeclined: false
    });

    console.log(`✅ Unified service (30 days): ${unifiedResult30Days.totalCount} events`);
    console.log('✅ Event type breakdown:', unifiedResult30Days.eventTypeBreakdown);

    // Test with all-time
    const unifiedResultAllTime = await unifiedAttendanceService.getMemberAttendanceCount(anthony.id, {
      useLast30Days: false,
      includeFutureEvents: false,
      includeDeclined: false
    });

    console.log(`✅ Unified service (all-time): ${unifiedResultAllTime.totalCount} events`);
    console.log('✅ Event type breakdown:', unifiedResultAllTime.eventTypeBreakdown);

    console.log('\n📊 Summary:');
    console.log(`   - Direct query (30 days): ${attendanceRecords.length} events`);
    console.log(`   - Unified service (30 days): ${unifiedResult30Days.totalCount} events`);
    console.log(`   - Unified service (all-time): ${unifiedResultAllTime.totalCount} events`);
    
    if (attendanceRecords.length === unifiedResult30Days.totalCount) {
      console.log('   ✅ 30-day counts match!');
    } else {
      console.log('   ❌ 30-day counts do not match!');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugAttendanceIssue(); 
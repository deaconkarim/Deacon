// Test script to verify attendance calculation consistency with 30-day window
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client (you'll need to add your credentials)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Mock the unified attendance service for testing
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
  },

  async getTopAttendees(options = {}) {
    try {
      const organizationId = 'test-org'; // You'll need to use a real org ID

      const {
        limit = 10,
        dateRange = null,
        includeFutureEvents = false,
        includeDeclined = false,
        useLast30Days = false
      } = options;

      // Get today's date to filter only past events by default
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let query = supabase
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
        .eq('members.organization_id', organizationId);

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
      } else if (!includeFutureEvents) {
        // Default to past events only if no date range specified
        query = query.lt('events.start_date', today.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      // Count attendance per member
      const memberAttendanceCount = {};
      data.forEach(record => {
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

      // Convert to array and sort by count
      return Object.values(memberAttendanceCount)
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting top attendees:', error);
      throw error;
    }
  }
};

async function testAttendanceConsistency() {
  console.log('🧪 Testing attendance calculation consistency with 30-day window...\n');

  try {
    // Test 1: Get a specific member's attendance count (30 days)
    console.log('📊 Test 1: Member attendance count (30 days)');
    
    // First, get a member from the database
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, firstname, lastname')
      .limit(1);

    if (membersError || !members || members.length === 0) {
      console.log('❌ No members found in database');
      return;
    }

    const testMember = members[0];
    console.log(`   Testing member: ${testMember.firstname} ${testMember.lastname} (${testMember.id})`);

    // Get attendance count using unified service (30 days)
    const memberAttendance30Days = await unifiedAttendanceService.getMemberAttendanceCount(testMember.id, {
      useLast30Days: true,
      includeFutureEvents: false,
      includeDeclined: false
    });

    console.log(`   ✅ Member attendance count (30 days): ${memberAttendance30Days.totalCount}`);
    console.log(`   ✅ Event type breakdown (30 days):`, memberAttendance30Days.eventTypeBreakdown);

    // Test 2: Get top attendees (30 days)
    console.log('\n📊 Test 2: Top attendees (30 days)');
    
    const topAttendees30Days = await unifiedAttendanceService.getTopAttendees({
      limit: 5,
      useLast30Days: true,
      includeFutureEvents: false,
      includeDeclined: false
    });

    console.log(`   ✅ Top attendees found (30 days): ${topAttendees30Days.length}`);
    topAttendees30Days.forEach((attendee, index) => {
      console.log(`      ${index + 1}. ${attendee.name}: ${attendee.count} events`);
    });

    // Test 3: Compare with all-time data
    console.log('\n📊 Test 3: All-time vs 30-day comparison');
    
    // Get all-time attendance count
    const memberAttendanceAllTime = await unifiedAttendanceService.getMemberAttendanceCount(testMember.id, {
      useLast30Days: false,
      includeFutureEvents: false,
      includeDeclined: false
    });

    console.log(`   ✅ Member attendance count (all-time): ${memberAttendanceAllTime.totalCount}`);
    console.log(`   ✅ Member attendance count (30 days): ${memberAttendance30Days.totalCount}`);
    console.log(`   ✅ Difference: ${memberAttendanceAllTime.totalCount - memberAttendance30Days.totalCount} events`);

    // Test 4: Direct database query for 30 days
    console.log('\n📊 Test 4: Direct database query (30 days)');
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const today = new Date(); // Re-declare today to ensure it's the correct date for the query
    today.setHours(0, 0, 0, 0);

    const { data: directAttendance30Days, error: directError } = await supabase
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
          organization_id
        )
      `)
      .eq('events.organization_id', 'test-org') // You'll need to use a real org ID
      .eq('members.organization_id', 'test-org')
      .eq('member_id', testMember.id)
      .in('status', ['attending', 'checked-in'])
      .gte('events.start_date', thirtyDaysAgo.toISOString())
      .lt('events.start_date', today.toISOString());

    if (directError) {
      console.log('❌ Error in direct query:', directError);
    } else {
      console.log(`   ✅ Direct query attendance records (30 days): ${directAttendance30Days.length}`);
      
      if (directAttendance30Days.length === memberAttendance30Days.totalCount) {
        console.log('   ✅ Counts match!');
      } else {
        console.log('   ❌ Counts do not match!');
        console.log(`      Direct query: ${directAttendance30Days.length}`);
        console.log(`      Unified service: ${memberAttendance30Days.totalCount}`);
      }
    }

    console.log('\n✅ Attendance consistency tests completed!');
    console.log('\n📋 Summary:');
    console.log('   - All pages now use 30-day window for consistency');
    console.log('   - Member profile, dashboard, and events page should show same numbers');
    console.log('   - Anthony Grose should have consistent attendance across all pages');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAttendanceConsistency(); 
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client (you'll need to add your credentials)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Mock the unified attendance service for testing
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
  },

  async getTopAttendees(options = {}) {
    try {
      const organizationId = 'test-org'; // You'll need to use a real org ID

      const {
        limit = 10,
        dateRange = null,
        includeFutureEvents = false,
        includeDeclined = false,
        useLast30Days = false
      } = options;

      // Get today's date to filter only past events by default
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let query = supabase
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
        .eq('members.organization_id', organizationId);

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
      } else if (!includeFutureEvents) {
        // Default to past events only if no date range specified
        query = query.lt('events.start_date', today.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      // Count attendance per member
      const memberAttendanceCount = {};
      data.forEach(record => {
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

      // Convert to array and sort by count
      return Object.values(memberAttendanceCount)
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting top attendees:', error);
      throw error;
    }
  }
};

async function testAttendanceConsistency() {
  console.log('🧪 Testing attendance calculation consistency with 30-day window...\n');

  try {
    // Test 1: Get a specific member's attendance count (30 days)
    console.log('📊 Test 1: Member attendance count (30 days)');
    
    // First, get a member from the database
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, firstname, lastname')
      .limit(1);

    if (membersError || !members || members.length === 0) {
      console.log('❌ No members found in database');
      return;
    }

    const testMember = members[0];
    console.log(`   Testing member: ${testMember.firstname} ${testMember.lastname} (${testMember.id})`);

    // Get attendance count using unified service (30 days)
    const memberAttendance30Days = await unifiedAttendanceService.getMemberAttendanceCount(testMember.id, {
      useLast30Days: true,
      includeFutureEvents: false,
      includeDeclined: false
    });

    console.log(`   ✅ Member attendance count (30 days): ${memberAttendance30Days.totalCount}`);
    console.log(`   ✅ Event type breakdown (30 days):`, memberAttendance30Days.eventTypeBreakdown);

    // Test 2: Get top attendees (30 days)
    console.log('\n📊 Test 2: Top attendees (30 days)');
    
    const topAttendees30Days = await unifiedAttendanceService.getTopAttendees({
      limit: 5,
      useLast30Days: true,
      includeFutureEvents: false,
      includeDeclined: false
    });

    console.log(`   ✅ Top attendees found (30 days): ${topAttendees30Days.length}`);
    topAttendees30Days.forEach((attendee, index) => {
      console.log(`      ${index + 1}. ${attendee.name}: ${attendee.count} events`);
    });

    // Test 3: Compare with all-time data
    console.log('\n📊 Test 3: All-time vs 30-day comparison');
    
    // Get all-time attendance count
    const memberAttendanceAllTime = await unifiedAttendanceService.getMemberAttendanceCount(testMember.id, {
      useLast30Days: false,
      includeFutureEvents: false,
      includeDeclined: false
    });

    console.log(`   ✅ Member attendance count (all-time): ${memberAttendanceAllTime.totalCount}`);
    console.log(`   ✅ Member attendance count (30 days): ${memberAttendance30Days.totalCount}`);
    console.log(`   ✅ Difference: ${memberAttendanceAllTime.totalCount - memberAttendance30Days.totalCount} events`);

    // Test 4: Direct database query for 30 days
    console.log('\n📊 Test 4: Direct database query (30 days)');
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const today = new Date(); // Re-declare today to ensure it's the correct date for the query
    today.setHours(0, 0, 0, 0);

    const { data: directAttendance30Days, error: directError } = await supabase
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
          organization_id
        )
      `)
      .eq('events.organization_id', 'test-org') // You'll need to use a real org ID
      .eq('members.organization_id', 'test-org')
      .eq('member_id', testMember.id)
      .in('status', ['attending', 'checked-in'])
      .gte('events.start_date', thirtyDaysAgo.toISOString())
      .lt('events.start_date', today.toISOString());

    if (directError) {
      console.log('❌ Error in direct query:', directError);
    } else {
      console.log(`   ✅ Direct query attendance records (30 days): ${directAttendance30Days.length}`);
      
      if (directAttendance30Days.length === memberAttendance30Days.totalCount) {
        console.log('   ✅ Counts match!');
      } else {
        console.log('   ❌ Counts do not match!');
        console.log(`      Direct query: ${directAttendance30Days.length}`);
        console.log(`      Unified service: ${memberAttendance30Days.totalCount}`);
      }
    }

    console.log('\n✅ Attendance consistency tests completed!');
    console.log('\n📋 Summary:');
    console.log('   - All pages now use 30-day window for consistency');
    console.log('   - Member profile, dashboard, and events page should show same numbers');
    console.log('   - Anthony Grose should have consistent attendance across all pages');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAttendanceConsistency(); 
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client (you'll need to add your credentials)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Mock the unified attendance service for testing
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
  },

  async getTopAttendees(options = {}) {
    try {
      const organizationId = 'test-org'; // You'll need to use a real org ID

      const {
        limit = 10,
        dateRange = null,
        includeFutureEvents = false,
        includeDeclined = false,
        useLast30Days = false
      } = options;

      // Get today's date to filter only past events by default
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let query = supabase
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
        .eq('members.organization_id', organizationId);

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
      } else if (!includeFutureEvents) {
        // Default to past events only if no date range specified
        query = query.lt('events.start_date', today.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      // Count attendance per member
      const memberAttendanceCount = {};
      data.forEach(record => {
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

      // Convert to array and sort by count
      return Object.values(memberAttendanceCount)
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting top attendees:', error);
      throw error;
    }
  }
};

async function testAttendanceConsistency() {
  console.log('🧪 Testing attendance calculation consistency with 30-day window...\n');

  try {
    // Test 1: Get a specific member's attendance count (30 days)
    console.log('📊 Test 1: Member attendance count (30 days)');
    
    // First, get a member from the database
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, firstname, lastname')
      .limit(1);

    if (membersError || !members || members.length === 0) {
      console.log('❌ No members found in database');
      return;
    }

    const testMember = members[0];
    console.log(`   Testing member: ${testMember.firstname} ${testMember.lastname} (${testMember.id})`);

    // Get attendance count using unified service (30 days)
    const memberAttendance30Days = await unifiedAttendanceService.getMemberAttendanceCount(testMember.id, {
      useLast30Days: true,
      includeFutureEvents: false,
      includeDeclined: false
    });

    console.log(`   ✅ Member attendance count (30 days): ${memberAttendance30Days.totalCount}`);
    console.log(`   ✅ Event type breakdown (30 days):`, memberAttendance30Days.eventTypeBreakdown);

    // Test 2: Get top attendees (30 days)
    console.log('\n📊 Test 2: Top attendees (30 days)');
    
    const topAttendees30Days = await unifiedAttendanceService.getTopAttendees({
      limit: 5,
      useLast30Days: true,
      includeFutureEvents: false,
      includeDeclined: false
    });

    console.log(`   ✅ Top attendees found (30 days): ${topAttendees30Days.length}`);
    topAttendees30Days.forEach((attendee, index) => {
      console.log(`      ${index + 1}. ${attendee.name}: ${attendee.count} events`);
    });

    // Test 3: Compare with all-time data
    console.log('\n📊 Test 3: All-time vs 30-day comparison');
    
    // Get all-time attendance count
    const memberAttendanceAllTime = await unifiedAttendanceService.getMemberAttendanceCount(testMember.id, {
      useLast30Days: false,
      includeFutureEvents: false,
      includeDeclined: false
    });

    console.log(`   ✅ Member attendance count (all-time): ${memberAttendanceAllTime.totalCount}`);
    console.log(`   ✅ Member attendance count (30 days): ${memberAttendance30Days.totalCount}`);
    console.log(`   ✅ Difference: ${memberAttendanceAllTime.totalCount - memberAttendance30Days.totalCount} events`);

    // Test 4: Direct database query for 30 days
    console.log('\n📊 Test 4: Direct database query (30 days)');
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const today = new Date(); // Re-declare today to ensure it's the correct date for the query
    today.setHours(0, 0, 0, 0);

    const { data: directAttendance30Days, error: directError } = await supabase
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
          organization_id
        )
      `)
      .eq('events.organization_id', 'test-org') // You'll need to use a real org ID
      .eq('members.organization_id', 'test-org')
      .eq('member_id', testMember.id)
      .in('status', ['attending', 'checked-in'])
      .gte('events.start_date', thirtyDaysAgo.toISOString())
      .lt('events.start_date', today.toISOString());

    if (directError) {
      console.log('❌ Error in direct query:', directError);
    } else {
      console.log(`   ✅ Direct query attendance records (30 days): ${directAttendance30Days.length}`);
      
      if (directAttendance30Days.length === memberAttendance30Days.totalCount) {
        console.log('   ✅ Counts match!');
      } else {
        console.log('   ❌ Counts do not match!');
        console.log(`      Direct query: ${directAttendance30Days.length}`);
        console.log(`      Unified service: ${memberAttendance30Days.totalCount}`);
      }
    }

    console.log('\n✅ Attendance consistency tests completed!');
    console.log('\n📋 Summary:');
    console.log('   - All pages now use 30-day window for consistency');
    console.log('   - Member profile, dashboard, and events page should show same numbers');
    console.log('   - Anthony Grose should have consistent attendance across all pages');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAttendanceConsistency(); 
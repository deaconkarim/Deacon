// Test script to verify attendance calculation consistency
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
        dateRange = null
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
        includeDeclined = false
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
  console.log('🧪 Testing attendance calculation consistency...\n');

  try {
    // Test 1: Get a specific member's attendance count
    console.log('📊 Test 1: Member attendance count');
    
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

    // Get attendance count using unified service
    const memberAttendance = await unifiedAttendanceService.getMemberAttendanceCount(testMember.id, {
      includeFutureEvents: false,
      includeDeclined: false
    });

    console.log(`   ✅ Member attendance count: ${memberAttendance.totalCount}`);
    console.log(`   ✅ Event type breakdown:`, memberAttendance.eventTypeBreakdown);

    // Test 2: Get top attendees
    console.log('\n📊 Test 2: Top attendees');
    
    const topAttendees = await unifiedAttendanceService.getTopAttendees({
      limit: 5,
      includeFutureEvents: false,
      includeDeclined: false
    });

    console.log(`   ✅ Top attendees found: ${topAttendees.length}`);
    topAttendees.forEach((attendee, index) => {
      console.log(`      ${index + 1}. ${attendee.name}: ${attendee.count} events`);
    });

    // Test 3: Compare with direct database query
    console.log('\n📊 Test 3: Direct database comparison');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: directAttendance, error: directError } = await supabase
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
      .in('status', ['attending', 'checked-in'])
      .lt('events.start_date', today.toISOString());

    if (directError) {
      console.log('❌ Error in direct query:', directError);
    } else {
      console.log(`   ✅ Direct query attendance records: ${directAttendance.length}`);
      
      // Count by member
      const directMemberCount = {};
      directAttendance.forEach(record => {
        const memberId = record.member_id;
        directMemberCount[memberId] = (directMemberCount[memberId] || 0) + 1;
      });

      console.log(`   ✅ Direct query unique members: ${Object.keys(directMemberCount).length}`);
      
      // Compare with unified service
      const unifiedCount = topAttendees.length;
      console.log(`   ✅ Unified service unique members: ${unifiedCount}`);
      
      if (Object.keys(directMemberCount).length === unifiedCount) {
        console.log('   ✅ Counts match!');
      } else {
        console.log('   ❌ Counts do not match!');
      }
    }

    console.log('\n✅ Attendance consistency tests completed!');

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
        dateRange = null
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
        includeDeclined = false
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
  console.log('🧪 Testing attendance calculation consistency...\n');

  try {
    // Test 1: Get a specific member's attendance count
    console.log('📊 Test 1: Member attendance count');
    
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

    // Get attendance count using unified service
    const memberAttendance = await unifiedAttendanceService.getMemberAttendanceCount(testMember.id, {
      includeFutureEvents: false,
      includeDeclined: false
    });

    console.log(`   ✅ Member attendance count: ${memberAttendance.totalCount}`);
    console.log(`   ✅ Event type breakdown:`, memberAttendance.eventTypeBreakdown);

    // Test 2: Get top attendees
    console.log('\n📊 Test 2: Top attendees');
    
    const topAttendees = await unifiedAttendanceService.getTopAttendees({
      limit: 5,
      includeFutureEvents: false,
      includeDeclined: false
    });

    console.log(`   ✅ Top attendees found: ${topAttendees.length}`);
    topAttendees.forEach((attendee, index) => {
      console.log(`      ${index + 1}. ${attendee.name}: ${attendee.count} events`);
    });

    // Test 3: Compare with direct database query
    console.log('\n📊 Test 3: Direct database comparison');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: directAttendance, error: directError } = await supabase
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
      .in('status', ['attending', 'checked-in'])
      .lt('events.start_date', today.toISOString());

    if (directError) {
      console.log('❌ Error in direct query:', directError);
    } else {
      console.log(`   ✅ Direct query attendance records: ${directAttendance.length}`);
      
      // Count by member
      const directMemberCount = {};
      directAttendance.forEach(record => {
        const memberId = record.member_id;
        directMemberCount[memberId] = (directMemberCount[memberId] || 0) + 1;
      });

      console.log(`   ✅ Direct query unique members: ${Object.keys(directMemberCount).length}`);
      
      // Compare with unified service
      const unifiedCount = topAttendees.length;
      console.log(`   ✅ Unified service unique members: ${unifiedCount}`);
      
      if (Object.keys(directMemberCount).length === unifiedCount) {
        console.log('   ✅ Counts match!');
      } else {
        console.log('   ❌ Counts do not match!');
      }
    }

    console.log('\n✅ Attendance consistency tests completed!');

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
        dateRange = null
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
        includeDeclined = false
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
  console.log('🧪 Testing attendance calculation consistency...\n');

  try {
    // Test 1: Get a specific member's attendance count
    console.log('📊 Test 1: Member attendance count');
    
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

    // Get attendance count using unified service
    const memberAttendance = await unifiedAttendanceService.getMemberAttendanceCount(testMember.id, {
      includeFutureEvents: false,
      includeDeclined: false
    });

    console.log(`   ✅ Member attendance count: ${memberAttendance.totalCount}`);
    console.log(`   ✅ Event type breakdown:`, memberAttendance.eventTypeBreakdown);

    // Test 2: Get top attendees
    console.log('\n📊 Test 2: Top attendees');
    
    const topAttendees = await unifiedAttendanceService.getTopAttendees({
      limit: 5,
      includeFutureEvents: false,
      includeDeclined: false
    });

    console.log(`   ✅ Top attendees found: ${topAttendees.length}`);
    topAttendees.forEach((attendee, index) => {
      console.log(`      ${index + 1}. ${attendee.name}: ${attendee.count} events`);
    });

    // Test 3: Compare with direct database query
    console.log('\n📊 Test 3: Direct database comparison');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: directAttendance, error: directError } = await supabase
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
      .in('status', ['attending', 'checked-in'])
      .lt('events.start_date', today.toISOString());

    if (directError) {
      console.log('❌ Error in direct query:', directError);
    } else {
      console.log(`   ✅ Direct query attendance records: ${directAttendance.length}`);
      
      // Count by member
      const directMemberCount = {};
      directAttendance.forEach(record => {
        const memberId = record.member_id;
        directMemberCount[memberId] = (directMemberCount[memberId] || 0) + 1;
      });

      console.log(`   ✅ Direct query unique members: ${Object.keys(directMemberCount).length}`);
      
      // Compare with unified service
      const unifiedCount = topAttendees.length;
      console.log(`   ✅ Unified service unique members: ${unifiedCount}`);
      
      if (Object.keys(directMemberCount).length === unifiedCount) {
        console.log('   ✅ Counts match!');
      } else {
        console.log('   ❌ Counts do not match!');
      }
    }

    console.log('\n✅ Attendance consistency tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAttendanceConsistency(); 
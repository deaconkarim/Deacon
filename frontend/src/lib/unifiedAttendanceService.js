import { supabase } from './supabaseClient';
import { getCurrentUserOrganizationId } from './data';

// Unified attendance service to ensure consistent calculations across the app
export const unifiedAttendanceService = {
  
  // Get member attendance count - used by member profile
  async getMemberAttendanceCount(memberId, options = {}) {
    try {
      // First, validate that the member exists
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('id, firstname, lastname, organization_id')
        .eq('id', memberId)
        .single();

      if (memberError || !member) {

        return {
          totalCount: 0,
          records: [],
          eventTypeBreakdown: {}
        };
      }

      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) {
        throw new Error('User not associated with any organization');
      }

      // Validate that member belongs to the same organization
      if (member.organization_id !== organizationId) {

        return {
          totalCount: 0,
          records: [],
          eventTypeBreakdown: {}
        };
      }

      const {
        includeFutureEvents = false,
        includeDeclined = false,
        dateRange = null, // { startDate, endDate }
        useLast30Days = false // Default to all-time, but can be overridden
      } = options;

      let query = supabase
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
        .eq('member_id', memberId)
        .eq('events.organization_id', organizationId);

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

      // Group by event type for breakdown with improved categorization
      const eventTypeBreakdown = {};
      data.forEach(record => {
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

  // Get top attendees - used by dashboard and events page
  async getTopAttendees(options = {}) {
    try {
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) {
        throw new Error('User not associated with any organization');
      }

      const {
        limit = 10,
        dateRange = null, // { startDate, endDate }
        includeFutureEvents = false,
        includeDeclined = false,
        useLast30Days = false // Default to all-time, but can be overridden
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
        .eq('members.organization_id', organizationId)
        .not('member_id', 'is', null); // Exclude records with null member_id

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

      // Convert to array and sort by count
      return Object.values(memberAttendanceCount)
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting top attendees:', error);
      throw error;
    }
  },

  // Get attendance statistics for dashboard
  async getDashboardAttendanceStats(options = {}) {
    try {
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) {
        throw new Error('User not associated with any organization');
      }

      const {
        dateRange = null, // { startDate, endDate }
        includeFutureEvents = false
      } = options;

      // Get today's date to filter only past events by default
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let query = supabase
        .from('events')
        .select('id, title, start_date, event_type, organization_id')
        .eq('organization_id', organizationId);

      // Filter by date range if provided
      if (dateRange) {
        if (dateRange.startDate) {
          query = query.gte('start_date', dateRange.startDate);
        }
        if (dateRange.endDate) {
          query = query.lte('start_date', dateRange.endDate);
        }
      } else if (!includeFutureEvents) {
        // Default to past events only if no date range specified
        query = query.lt('start_date', today.toISOString());
      }

      const { data: events, error: eventsError } = await query.order('start_date', { ascending: false });

      if (eventsError) throw eventsError;

      if (!events || events.length === 0) {
        return {
          totalEvents: 0,
          totalAttendance: 0,
          averageAttendance: 0,
          eventTypeBreakdown: {},
          topAttendees: []
        };
      }

      // Get attendance records for these events
      const eventIds = events.map(e => e.id);
      const { data: attendance, error: attendanceError } = await supabase
        .from('event_attendance')
        .select(`
          *,
          members!inner(
            id,
            firstname,
            lastname,
            organization_id
          )
        `)
        .in('event_id', eventIds)
        .eq('members.organization_id', organizationId)
        .in('status', ['attending', 'checked-in']);

      if (attendanceError) throw attendanceError;

      // Calculate statistics
      const totalEvents = events.length;
      const totalAttendance = attendance.length;
      const averageAttendance = totalEvents > 0 ? Math.round(totalAttendance / totalEvents) : 0;

      // Event type breakdown
      const eventTypeBreakdown = {};
      events.forEach(event => {
        const eventType = event.event_type || 'Other';
        const eventAttendance = attendance.filter(a => a.event_id === event.id);
        
        if (!eventTypeBreakdown[eventType]) {
          eventTypeBreakdown[eventType] = {
            events: 0,
            attendance: 0,
            averageAttendance: 0
          };
        }
        
        eventTypeBreakdown[eventType].events++;
        eventTypeBreakdown[eventType].attendance += eventAttendance.length;
      });

      // Calculate averages for each event type
      Object.keys(eventTypeBreakdown).forEach(eventType => {
        const stats = eventTypeBreakdown[eventType];
        stats.averageAttendance = stats.events > 0 ? Math.round(stats.attendance / stats.events) : 0;
      });

      // Get top attendees
      const memberAttendanceCount = {};
      attendance.forEach(record => {
        const memberId = record.member_id;
        if (!memberAttendanceCount[memberId]) {
          memberAttendanceCount[memberId] = {
            id: memberId,
            name: `${record.members.firstname} ${record.members.lastname}`,
            count: 0
          };
        }
        memberAttendanceCount[memberId].count++;
      });

      const topAttendees = Object.values(memberAttendanceCount)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalEvents,
        totalAttendance,
        averageAttendance,
        eventTypeBreakdown,
        topAttendees
      };
    } catch (error) {
      console.error('Error getting dashboard attendance stats:', error);
      throw error;
    }
  },

  // Get attendance data for a specific date range
  async getAttendanceDataForRange(startDate, endDate, options = {}) {
    try {
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) {
        throw new Error('User not associated with any organization');
      }

      const {
        includeFutureEvents = false,
        includeDeclined = false
      } = options;

      // Get events in the date range
      let query = supabase
        .from('events')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('start_date', startDate)
        .lte('start_date', endDate);

      // Filter by future/past events
      if (!includeFutureEvents) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        query = query.lte('start_date', today.toISOString());
      }

      const { data: events, error: eventsError } = await query.order('start_date', { ascending: false });

      if (eventsError) throw eventsError;

      if (!events || events.length === 0) {
        return {
          events: [],
          attendance: [],
          memberStats: [],
          eventTypeBreakdown: {}
        };
      }

      // Get attendance records for these events
      const eventIds = events.map(e => e.id);
      let attendanceQuery = supabase
        .from('event_attendance')
        .select(`
          *,
          members!inner(
            id,
            firstname,
            lastname,
            organization_id
          )
        `)
        .in('event_id', eventIds)
        .eq('members.organization_id', organizationId);

      if (!includeDeclined) {
        attendanceQuery = attendanceQuery.in('status', ['attending', 'checked-in']);
      }

      const { data: attendance, error: attendanceError } = await attendanceQuery;

      if (attendanceError) throw attendanceError;

      // Calculate member statistics
      const memberStats = {};
      attendance.forEach(record => {
        const memberId = record.member_id;
        if (!memberStats[memberId]) {
          memberStats[memberId] = {
            id: memberId,
            name: `${record.members.firstname} ${record.members.lastname}`,
            count: 0
          };
        }
        memberStats[memberId].count++;
      });

      // Calculate event type breakdown
      const eventTypeBreakdown = {};
      events.forEach(event => {
        const eventType = event.event_type || 'Other';
        const eventAttendance = attendance.filter(a => a.event_id === event.id);
        
        if (!eventTypeBreakdown[eventType]) {
          eventTypeBreakdown[eventType] = {
            events: 0,
            attendance: 0
          };
        }
        
        eventTypeBreakdown[eventType].events++;
        eventTypeBreakdown[eventType].attendance += eventAttendance.length;
      });

      return {
        events,
        attendance,
        memberStats: Object.values(memberStats).sort((a, b) => b.count - a.count),
        eventTypeBreakdown
      };
    } catch (error) {
      console.error('Error getting attendance data for range:', error);
      throw error;
    }
  }
}; 
import { supabase } from './supabaseClient';
import { userCacheService } from './userCache';
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';

// Helper function to get the current organization ID
const getCurrentOrganizationId = async () => {
  return await userCacheService.getCurrentUserOrganizationId();
};

export const attendanceReportService = {
  // Get comprehensive attendance data for a specific month
  async getAttendanceData(selectedMonth) {
    const organizationId = await getCurrentOrganizationId();
    const startDate = startOfMonth(selectedMonth);
    const endDate = endOfMonth(selectedMonth);
    const today = new Date();
    const endDateStr = format(endDate, 'yyyy-MM-dd');

    // Use the earlier date between endDate and today
    const filterEndDate = endDate < today ? endDate : today;
    const filterEndDateStr = format(filterEndDate, 'yyyy-MM-dd');

    // Fetch events for the selected month - ONLY PAST EVENTS
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('start_date', format(startDate, 'yyyy-MM-dd'))
      .lte('start_date', filterEndDateStr)
      .order('start_date', { ascending: false });

    if (eventsError) throw eventsError;

    // Fetch attendance records for these events
    const { data: attendance, error: attendanceError } = await supabase
      .from('event_attendance')
      .select(`
        *,
        members (
          firstname,
          lastname,
          organization_id
        )
      `)
      .in('event_id', events.map(e => e.id))
      .eq('members.organization_id', organizationId);

    if (attendanceError) throw attendanceError;

    return this.processAttendanceData(events, attendance);
  },

  // Process attendance data into report format
  processAttendanceData(events, attendance) {
    // Events are already sorted by date from the database query
    const sortedEvents = events;

    // Process daily attendance data
    const dailyData = sortedEvents.map(event => {
      const eventAttendance = attendance.filter(a => a.event_id === event.id);
      const attendingCount = eventAttendance.filter(a => 
        a.status === 'checked-in' || a.status === 'attending'
      ).length;

      // Safely format the date
      let formattedDate = 'Unknown';
      if (event.start_date) {
        try {
          const eventDate = parseISO(event.start_date);
          if (!isNaN(eventDate.getTime())) {
            formattedDate = format(eventDate, 'MMM d');
          }
        } catch (error) {
          console.warn('Invalid date format:', event.start_date);
        }
      }

      return {
        date: formattedDate,
        count: attendingCount
      };
    });

    // Process service breakdown
    const serviceBreakdown = sortedEvents.reduce((acc, event) => {
      const eventAttendance = attendance.filter(a => a.event_id === event.id);
      const attendingCount = eventAttendance.filter(a => 
        a.status === 'checked-in' || a.status === 'attending'
      ).length;

      const type = event.event_type || 'Other';
      if (!acc[type]) {
        acc[type] = 0;
      }
      acc[type] += attendingCount;
      return acc;
    }, {});

    // Format service breakdown data for the chart
    const formattedServiceBreakdown = Object.entries(serviceBreakdown)
      .map(([name, value]) => ({
        name,
        value: value || 0
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);

    // Process member statistics
    const memberStats = attendance.reduce((acc, record) => {
      if (record.members) {
        const memberName = `${record.members.firstname} ${record.members.lastname}`;
        if (!acc[memberName]) {
          acc[memberName] = { name: memberName, events: 0, totalEvents: sortedEvents.length };
        }
        if (record.status === 'checked-in' || record.status === 'attending') {
          acc[memberName].events += 1;
        }
      }
      return acc;
    }, {});

    // Convert to array and calculate percentages
    const memberStatsArray = Object.values(memberStats)
      .map(member => ({
        ...member,
        percentage: member.totalEvents > 0 ? Math.round((member.events / member.totalEvents) * 100) : 0
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 10); // Top 10 attendees

    // Process event details
    const eventDetails = sortedEvents.map(event => {
      const eventAttendance = attendance.filter(a => a.event_id === event.id);
      const attendingMembers = eventAttendance
        .filter(a => a.status === 'checked-in' || a.status === 'attending')
        .map(a => a.members ? `${a.members.firstname} ${a.members.lastname}` : 'Anonymous');

      // Safely format the date
      let formattedDate = 'Date not available';
      let formattedTime = '';
      
      if (event.start_date) {
        try {
          const eventDate = parseISO(event.start_date);
          if (!isNaN(eventDate.getTime())) {
            formattedDate = format(eventDate, 'MMM d, yyyy');
            formattedTime = format(eventDate, 'h:mm a');
          }
        } catch (error) {
          console.warn('Invalid date format:', event.start_date);
        }
      }

      return {
        id: event.id,
        title: event.title,
        date: formattedDate,
        time: formattedTime,
        location: event.location || 'TBD',
        attendance: attendingMembers.length,
        attendingMembers,
        type: event.event_type || 'Other',
        description: event.description
      };
    });

    return {
      dailyData,
      serviceBreakdown: formattedServiceBreakdown,
      memberStats: memberStatsArray,
      eventDetails
    };
  },

  // Get attendance trends over time
  async getAttendanceTrends(months = 12) {
    const organizationId = await getCurrentOrganizationId();
    const trends = [];

    for (let i = 0; i < months; i++) {
      const date = subMonths(new Date(), i);
      const startDate = startOfMonth(date);
      const endDate = endOfMonth(date);

      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id')
        .eq('organization_id', organizationId)
        .gte('start_date', format(startDate, 'yyyy-MM-dd'))
        .lte('start_date', format(endDate, 'yyyy-MM-dd'));

      if (eventsError) throw eventsError;

      let totalAttendance = 0;
      if (events.length > 0) {
        const { data: attendance, error: attendanceError } = await supabase
          .from('event_attendance')
          .select('status')
          .in('event_id', events.map(e => e.id));

        if (attendanceError) throw attendanceError;

        totalAttendance = attendance.filter(a => 
          a.status === 'checked-in' || a.status === 'attending'
        ).length;
      }

      trends.push({
        month: format(date, 'MMM yyyy'),
        events: events.length,
        attendance: totalAttendance,
        avgAttendance: events.length > 0 ? Math.round(totalAttendance / events.length) : 0
      });
    }

    return trends.reverse();
  },

  // Get member attendance history
  async getMemberAttendanceHistory(memberId) {
    const organizationId = await getCurrentOrganizationId();

    const { data: attendance, error } = await supabase
      .from('event_attendance')
      .select(`
        *,
        events!inner(
          title,
          start_date,
          event_type,
          organization_id
        )
      `)
      .eq('member_id', memberId)
      .eq('events.organization_id', organizationId)
      .order('events.start_date', { ascending: false });

    if (error) throw error;

    return attendance.map(record => {
      // Safely format the date
      let formattedDate = 'Date not available';
      if (record.events.start_date) {
        try {
          const eventDate = parseISO(record.events.start_date);
          if (!isNaN(eventDate.getTime())) {
            formattedDate = format(eventDate, 'MMM d, yyyy');
          }
        } catch (error) {
          console.warn('Invalid date format:', record.events.start_date);
        }
      }

      return {
        id: record.id,
        eventTitle: record.events.title,
        eventDate: formattedDate,
        status: record.status,
        memberName: record.members ? `${record.members.firstname} ${record.members.lastname}` : 'Unknown'
      };
    });
  },

  // Get attendance analytics
  async getAttendanceAnalytics() {
    const organizationId = await getCurrentOrganizationId();
    const currentMonth = new Date();
    const startDate = startOfMonth(currentMonth);
    const endDate = endOfMonth(currentMonth);

    // Get current month data
    const { data: currentEvents, error: currentEventsError } = await supabase
      .from('events')
      .select('id')
      .eq('organization_id', organizationId)
      .gte('start_date', format(startDate, 'yyyy-MM-dd'))
      .lte('start_date', format(endDate, 'yyyy-MM-dd'));

    if (currentEventsError) throw currentEventsError;

    let currentAttendance = 0;
    if (currentEvents.length > 0) {
      const { data: currentAttendanceData, error: currentAttendanceError } = await supabase
        .from('event_attendance')
        .select('status')
        .in('event_id', currentEvents.map(e => e.id));

      if (currentAttendanceError) throw currentAttendanceError;

      currentAttendance = currentAttendanceData.filter(a => 
        a.status === 'checked-in' || a.status === 'attending'
      ).length;
    }

    // Get previous month data for comparison
    const previousMonth = subMonths(currentMonth, 1);
    const prevStartDate = startOfMonth(previousMonth);
    const prevEndDate = endOfMonth(previousMonth);

    const { data: prevEvents, error: prevEventsError } = await supabase
      .from('events')
      .select('id')
      .eq('organization_id', organizationId)
      .gte('start_date', format(prevStartDate, 'yyyy-MM-dd'))
      .lte('start_date', format(prevEndDate, 'yyyy-MM-dd'));

    if (prevEventsError) throw prevEventsError;

    let prevAttendance = 0;
    if (prevEvents.length > 0) {
      const { data: prevAttendanceData, error: prevAttendanceError } = await supabase
        .from('event_attendance')
        .select('status')
        .in('event_id', prevEvents.map(e => e.id));

      if (prevAttendanceError) throw prevAttendanceError;

      prevAttendance = prevAttendanceData.filter(a => 
        a.status === 'checked-in' || a.status === 'attending'
      ).length;
    }

    // Calculate percentage change
    const percentageChange = prevAttendance > 0 
      ? Math.round(((currentAttendance - prevAttendance) / prevAttendance) * 100)
      : 0;

    return {
      currentMonth: {
        events: currentEvents.length,
        attendance: currentAttendance,
        avgAttendance: currentEvents.length > 0 ? Math.round(currentAttendance / currentEvents.length) : 0
      },
      previousMonth: {
        events: prevEvents.length,
        attendance: prevAttendance,
        avgAttendance: prevEvents.length > 0 ? Math.round(prevAttendance / prevEvents.length) : 0
      },
      percentageChange
    };
  }
}; 
import { supabase } from './supabaseClient';
import { userCacheService } from './userCache';
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';

// Helper function to get the current organization ID
const getCurrentOrganizationId = async () => {
  const orgId = await userCacheService.getCurrentUserOrganizationId();
  return orgId;
};

export const eventReportService = {
  // Get comprehensive event data for a specific period
  async getEventData(selectedMonth) {
    const organizationId = await getCurrentOrganizationId();
    const startDate = startOfMonth(selectedMonth);
    const endDate = endOfMonth(selectedMonth);
    
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      selectedMonth: format(selectedMonth, 'yyyy-MM-dd')
    });
    
    // Get today's date to filter only past events
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    
    // First, try to get events for the selected month (only past events)
    let { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('start_date', format(startDate, 'yyyy-MM-dd'))
      .lte('start_date', format(endDate, 'yyyy-MM-dd'))
      .lte('start_date', todayStr) // Only include events that have already happened
      .order('start_date', { ascending: false });

    if (eventsError) throw eventsError;

    // If no events found for the selected month, try to get events from the last 3 months
    if (!events || events.length === 0) {
      const threeMonthsAgo = subMonths(selectedMonth, 3);
      
      const { data: expandedEvents, error: expandedError } = await supabase
        .from('events')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('start_date', format(threeMonthsAgo, 'yyyy-MM-dd'))
        .lte('start_date', format(endDate, 'yyyy-MM-dd'))
        .lte('start_date', todayStr) // Only include events that have already happened
        .order('start_date', { ascending: false });

      if (expandedError) throw expandedError;
      events = expandedEvents;
    }

    // Fetch attendance records for these events
    const { data: attendance, error: attendanceError } = await supabase
      .from('event_attendance')
      .select(`
        *,
        members (
          firstname,
          lastname
        )
      `)
      .in('event_id', events.map(e => e.id));

    if (attendanceError) throw attendanceError;

    return this.processEventData(events, attendance);
  },

  // Process event data into report format
  processEventData(events, attendance) {
      attendanceCount: attendance.length,
      events: events,
      attendance: attendance
    });

    // Filter out events that don't have any attendees
    const eventsWithAttendees = events.filter(event => {
      const eventAttendance = attendance.filter(a => 
        a.event_id === event.id && (a.status === 'checked-in' || a.status === 'attending')
      );
      return eventAttendance.length > 0;
    });

    const totalEvents = eventsWithAttendees.length;
    const totalAttendance = attendance.filter(a => 
      a.status === 'checked-in' || a.status === 'attending'
    ).length;
    const averageAttendance = totalEvents > 0 ? Math.round(totalAttendance / totalEvents) : 0;

      totalAttendance,
      averageAttendance
    });

    // Event types breakdown
    const eventTypes = eventsWithAttendees.reduce((acc, event) => {
      const type = event.event_type || 'Other';
      if (!acc[type]) {
        acc[type] = { count: 0, attendance: 0 };
      }
      acc[type].count += 1;
      
      const eventAttendance = attendance.filter(a => 
        a.event_id === event.id && (a.status === 'checked-in' || a.status === 'attending')
      );
      acc[type].attendance += eventAttendance.length;
      return acc;
    }, {});

    const eventTypesData = Object.entries(eventTypes).map(([type, data]) => ({
      type,
      count: data.count,
      attendance: data.attendance,
      avgAttendance: Math.round(data.attendance / data.count)
    }));

    // Event performance (top events by attendance)
    const eventPerformance = eventsWithAttendees.map(event => {
      const eventAttendance = attendance.filter(a => 
        a.event_id === event.id && (a.status === 'checked-in' || a.status === 'attending')
      );
      
      // Safely format the date
      let formattedDate = 'Date not available';
      if (event.start_date) {
        try {
          const eventDate = parseISO(event.start_date);
          if (!isNaN(eventDate.getTime())) {
            formattedDate = format(eventDate, 'MMM d, yyyy');
          }
        } catch (error) {

        }
      }
      
      return {
        id: event.id,
        title: event.title,
        date: formattedDate,
        type: event.event_type || 'Other',
        attendance: eventAttendance.length,
        location: event.location || 'TBD',
        description: event.description
      };
    }).sort((a, b) => b.attendance - a.attendance);

    // Attendance trend (last 12 months)
    const attendanceTrend = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(new Date(), i);
      const monthEvents = eventsWithAttendees.filter(e => {
        const eventDate = parseISO(e.start_date);
        return eventDate.getMonth() === date.getMonth() && 
               eventDate.getFullYear() === date.getFullYear();
      });
      
      const monthAttendance = attendance.filter(a => {
        const event = eventsWithAttendees.find(e => e.id === a.event_id);
        if (!event) return false;
        const eventDate = parseISO(event.start_date);
        return eventDate.getMonth() === date.getMonth() && 
               eventDate.getFullYear() === date.getFullYear() &&
               (a.status === 'checked-in' || a.status === 'attending');
      });

      return {
        month: format(date, 'MMM yyyy'),
        events: monthEvents.length,
        attendance: monthAttendance.length,
        avgAttendance: monthEvents.length > 0 ? Math.round(monthAttendance.length / monthEvents.length) : 0
      };
    }).reverse();

    // Event categories
    const eventCategories = eventsWithAttendees.reduce((acc, event) => {
      const category = event.event_type || 'Other';
      if (!acc[category]) {
        acc[category] = { count: 0, totalAttendance: 0 };
      }
      acc[category].count += 1;
      
      const eventAttendance = attendance.filter(a => 
        a.event_id === event.id && (a.status === 'checked-in' || a.status === 'attending')
      );
      acc[category].totalAttendance += eventAttendance.length;
      return acc;
    }, {});

    const eventCategoriesData = Object.entries(eventCategories).map(([category, data]) => ({
      category,
      count: data.count,
      totalAttendance: data.totalAttendance,
      avgAttendance: Math.round(data.totalAttendance / data.count)
    }));

    // Top events
    const topEvents = eventPerformance.slice(0, 10);

    // Event locations
    const eventLocations = eventsWithAttendees.reduce((acc, event) => {
      const location = event.location || 'TBD';
      if (!acc[location]) {
        acc[location] = { count: 0, totalAttendance: 0, eventAverages: [] };
      }
      acc[location].count += 1;
      
      const eventAttendance = attendance.filter(a => 
        a.event_id === event.id && (a.status === 'checked-in' || a.status === 'attending')
      );
      const eventAttendanceCount = eventAttendance.length;
      acc[location].totalAttendance += eventAttendanceCount;
      acc[location].eventAverages.push(eventAttendanceCount);
      return acc;
    }, {});

    const eventLocationsData = Object.entries(eventLocations).map(([location, data]) => {
      // Filter out events with 0 attendance for average calculation
      const eventsWithAttendance = data.eventAverages.filter(attendance => attendance > 0);
      const avgAttendance = eventsWithAttendance.length > 0 
        ? Math.round(eventsWithAttendance.reduce((sum, attendance) => sum + attendance, 0) / eventsWithAttendance.length)
        : 0;

      return {
        location,
        count: data.count,
        totalAttendance: data.totalAttendance,
        avgAttendance
      };
    });

    // Event engagement (based on attendance vs capacity)
    const eventEngagement = eventsWithAttendees.map(event => {
      const eventAttendance = attendance.filter(a => 
        a.event_id === event.id && (a.status === 'checked-in' || a.status === 'attending')
      );
      
      // Mock capacity based on event type
      const capacity = event.event_type === 'Sunday Service' ? 200 : 
                      event.event_type === 'Bible Study' ? 50 :
                      event.event_type === 'Youth Group' ? 30 : 100;
      
      const engagementRate = Math.round((eventAttendance.length / capacity) * 100);
      
      // Safely format the date
      let formattedDate = 'Date not available';
      if (event.start_date) {
        try {
          const eventDate = parseISO(event.start_date);
          if (!isNaN(eventDate.getTime())) {
            formattedDate = format(eventDate, 'MMM d, yyyy');
          }
        } catch (error) {

        }
      }
      
      return {
        title: event.title,
        date: formattedDate,
        attendance: eventAttendance.length,
        capacity,
        engagementRate: Math.min(engagementRate, 100)
      };
    }).sort((a, b) => b.engagementRate - a.engagementRate);

    // Mock data for features not yet implemented
    const volunteerStats = [
      { area: 'Worship Team', events: Math.floor(totalEvents * 0.3), volunteers: Math.floor(totalEvents * 0.3 * 5) },
      { area: 'Children\'s Ministry', events: Math.floor(totalEvents * 0.2), volunteers: Math.floor(totalEvents * 0.2 * 8) },
      { area: 'Greeting Team', events: Math.floor(totalEvents * 0.4), volunteers: Math.floor(totalEvents * 0.4 * 3) },
      { area: 'Technical Support', events: Math.floor(totalEvents * 0.1), volunteers: Math.floor(totalEvents * 0.1 * 2) }
    ];

    const eventFeedback = [
      { rating: 'Excellent', count: Math.floor(totalEvents * 0.4), percentage: 40 },
      { rating: 'Good', count: Math.floor(totalEvents * 0.4), percentage: 40 },
      { rating: 'Average', count: Math.floor(totalEvents * 0.15), percentage: 15 },
      { rating: 'Poor', count: Math.floor(totalEvents * 0.05), percentage: 5 }
    ];

    const eventCosts = [
      { category: 'Venue Rental', amount: Math.floor(totalEvents * 500), percentage: 40 },
      { category: 'Supplies', amount: Math.floor(totalEvents * 200), percentage: 16 },
      { category: 'Marketing', amount: Math.floor(totalEvents * 150), percentage: 12 },
      { category: 'Food & Refreshments', amount: Math.floor(totalEvents * 300), percentage: 24 },
      { category: 'Other', amount: Math.floor(totalEvents * 100), percentage: 8 }
    ];

    const eventRevenue = [
      { source: 'Donations', amount: Math.floor(totalEvents * 800), percentage: 60 },
      { source: 'Registration Fees', amount: Math.floor(totalEvents * 200), percentage: 15 },
      { source: 'Sponsorships', amount: Math.floor(totalEvents * 300), percentage: 22 },
      { source: 'Other', amount: Math.floor(totalEvents * 50), percentage: 3 }
    ];

    return {
      totalEvents,
      totalAttendance,
      averageAttendance,
      eventTypes: eventTypesData,
      eventPerformance,
      attendanceTrend,
      eventCategories: eventCategoriesData,
      topEvents,
      eventLocations: eventLocationsData,
      eventEngagement,
      volunteerStats,
      eventFeedback,
      eventCosts,
      eventRevenue
    };
  },

  // Get event trends over time
  async getEventTrends(months = 12) {
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

  // Get event analytics
  async getEventAnalytics() {
    const organizationId = await getCurrentOrganizationId();
    const currentMonth = new Date();
    const startDate = startOfMonth(currentMonth);
    const endDate = endOfMonth(currentMonth);

    // Get current month events
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

    // Get previous month events
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
import { useState, useEffect, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { supabase } from '../supabaseClient';

export function useAttendanceStats(startDate, endDate) {
  const [isLoading, setIsLoading] = useState(false);
  const [serviceBreakdown, setServiceBreakdown] = useState([]);
  const [memberStats, setMemberStats] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [eventDetails, setEventDetails] = useState([]);
  const [error, setError] = useState(null);


  // Memoize the loadAttendanceData function to prevent infinite loops
  const loadAttendanceData = useCallback(async () => {
    if (!startDate || !endDate) {
      console.log('No startDate or endDate provided');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');
      
      // Fetch events for the given range
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .gte('start_date', startDateStr)
        .lte('start_date', endDateStr)
        .order('start_date', { ascending: false });
      
      
      if (eventsError) throw eventsError;
      if (!events || events.length === 0) {
        console.log('No events found for date range');
        setServiceBreakdown([]);
        setMemberStats([]);
        setDailyData([]);
        setEventDetails([]);
        setIsLoading(false);
        return;
      }
      
      
      // Fetch attendance records for these events
      const { data: attendance, error: attendanceError } = await supabase
        .from('event_attendance')
        .select(`*, members (id, firstname, lastname, image_url)`)
        .in('event_id', events.map(e => e.id));
      
      
      if (attendanceError) throw attendanceError;
      
      // Process attendance data
      const sortedEvents = events;
      // Daily attendance
      const dailyData = sortedEvents.map(event => {
        const eventAttendance = attendance.filter(a => a.event_id === event.id);
        const attendingCount = eventAttendance.filter(a => a.status === 'checked-in' || a.status === 'attending').length;
        return {
          date: format(parseISO(event.start_date), 'MMM d'),
          count: attendingCount
        };
      });
      
      // Service breakdown
      const serviceBreakdownObj = sortedEvents.reduce((acc, event) => {
        const eventAttendance = attendance.filter(a => a.event_id === event.id);
        const attendingCount = eventAttendance.filter(a => a.status === 'checked-in' || a.status === 'attending').length;
        const type = event.event_type || 'Other';
        if (!acc[type]) acc[type] = 0;
        acc[type] += attendingCount;
        return acc;
      }, {});
      
      const formattedServiceBreakdown = Object.entries(serviceBreakdownObj)
        .map(([name, value]) => ({ name, value: value || 0 }))
        .filter(item => item.value > 0)
        .sort((a, b) => b.value - a.value);
      
      // Member stats
      const memberStatsObj = attendance.reduce((acc, record) => {
        if (record.status === 'checked-in' || record.status === 'attending') {
          const memberId = record.members.id;
          const memberName = `${record.members.firstname} ${record.members.lastname}`;
          if (!acc[memberId]) {
            acc[memberId] = {
              id: memberId,
              name: memberName,
              image: record.members.image_url,
              count: 0
            };
          }
          acc[memberId].count++;
        }
        return acc;
      }, {});
      
      const memberStats = Object.values(memberStatsObj)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      // Event details
      const eventDetails = sortedEvents.map(event => {
        const eventAttendance = attendance.filter(a => a.event_id === event.id);
        const attendingMembers = eventAttendance
          .filter(a => a.status === 'checked-in' || a.status === 'attending')
          .map(a => `${a.members.firstname} ${a.members.lastname}`)
          .sort();
        return {
          id: event.id,
          title: event.title,
          date: event.start_date,
          type: event.event_type || 'Other',
          attendees: attendingMembers.length,
          attendingMembers
        };
      });
      
      setServiceBreakdown(formattedServiceBreakdown);
      setMemberStats(memberStats);
      setDailyData(dailyData);
      setEventDetails(eventDetails);
    } catch (err) {
      console.error('Error in useAttendanceStats:', err);
      setError(err);
      setServiceBreakdown([]);
      setMemberStats([]);
      setDailyData([]);
      setEventDetails([]);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadAttendanceData();
  }, [loadAttendanceData]);

  return { isLoading, serviceBreakdown, memberStats, dailyData, eventDetails, error };
} 
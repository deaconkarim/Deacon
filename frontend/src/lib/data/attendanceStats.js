import { useState, useEffect, useCallback, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { supabase } from '../supabaseClient';

// Cache for attendance data with longer duration
let attendanceCache = null;
let attendanceCacheTimestamp = null;
const ATTENDANCE_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes (increased from 10)

export function useAttendanceStats(startDate, endDate) {
  const [isLoading, setIsLoading] = useState(false);
  const [serviceBreakdown, setServiceBreakdown] = useState([]);
  const [memberStats, setMemberStats] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [eventDetails, setEventDetails] = useState([]);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  // Memoize the loadAttendanceData function to prevent infinite loops
  const loadAttendanceData = useCallback(async () => {
    if (!startDate || !endDate) {
      return;
    }

    // Check cache first with improved key generation
    const now = Date.now();
    const cacheKey = `${startDate.toISOString()}-${endDate.toISOString()}`;
    
    if (attendanceCache && attendanceCacheTimestamp && 
        (now - attendanceCacheTimestamp) < ATTENDANCE_CACHE_DURATION &&
        attendanceCache.cacheKey === cacheKey) {
      setServiceBreakdown(attendanceCache.serviceBreakdown);
      setMemberStats(attendanceCache.memberStats);
      setDailyData(attendanceCache.dailyData);
      setEventDetails(attendanceCache.eventDetails);
      setError(null);
      setIsLoading(false);
      return;
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);
    
    try {
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');
      
      // Get today's date to filter only past events
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      
      // Batch queries with single consolidated query instead of multiple
      const [eventsResult, attendanceResult] = await Promise.all([
        // Fetch events with better filtering
        supabase
          .from('events')
          .select('id, title, start_date, event_type')
          .gte('start_date', startDateStr)
          .lte('start_date', endDateStr <= todayStr ? endDateStr : todayStr)
          .order('start_date', { ascending: false }),
        
        // Pre-fetch all attendance for potential events to avoid N+1 queries
        supabase
          .from('event_attendance')
          .select('event_id, status, member_id, members!inner(id, firstname, lastname, image_url)')
          .gte('created_at', startDateStr) // Use created_at for better performance
      ]);
      
      if (eventsResult.error) throw eventsResult.error;
      if (attendanceResult.error) throw attendanceResult.error;

      const events = eventsResult.data || [];
      const allAttendance = attendanceResult.data || [];

      if (events.length === 0) {
        const emptyData = { serviceBreakdown: [], memberStats: [], dailyData: [], eventDetails: [] };
        
        // Cache empty result
        attendanceCache = { ...emptyData, cacheKey };
        attendanceCacheTimestamp = now;
        
        setServiceBreakdown(emptyData.serviceBreakdown);
        setMemberStats(emptyData.memberStats);
        setDailyData(emptyData.dailyData);
        setEventDetails(emptyData.eventDetails);
        setIsLoading(false);
        return;
      }
      
      // Filter attendance to only include events in our date range
      const eventIds = new Set(events.map(e => e.id));
      const attendance = allAttendance.filter(a => eventIds.has(a.event_id));
      
      // Process attendance data efficiently
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
      
      // Optimized member stats calculation using attendance data we already have
      const memberAttendanceMap = new Map();
      attendance
        .filter(a => a.status === 'checked-in' || a.status === 'attending')
        .forEach(a => {
          if (a.members) {
            const memberId = a.member_id;
            if (!memberAttendanceMap.has(memberId)) {
              memberAttendanceMap.set(memberId, {
                id: memberId,
                name: `${a.members.firstname} ${a.members.lastname}`,
                image_url: a.members.image_url,
                attendanceCount: 0
              });
            }
            memberAttendanceMap.get(memberId).attendanceCount++;
          }
        });

      const memberStats = Array.from(memberAttendanceMap.values())
        .sort((a, b) => b.attendanceCount - a.attendanceCount)
        .slice(0, 10); // Top 10 attendees
      
      // Event details
      const eventDetails = sortedEvents.map(event => {
        const eventAttendance = attendance.filter(a => a.event_id === event.id);
        const attendingMembers = eventAttendance
          .filter(a => a.status === 'checked-in' || a.status === 'attending')
          .map(a => a.members ? `${a.members.firstname} ${a.members.lastname}` : 'Unknown')
          .filter(name => name !== 'Unknown')
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
      
      const result = {
        serviceBreakdown: formattedServiceBreakdown,
        memberStats,
        dailyData,
        eventDetails
      };

      // Cache the result
      attendanceCache = { ...result, cacheKey };
      attendanceCacheTimestamp = now;
      
      setServiceBreakdown(formattedServiceBreakdown);
      setMemberStats(memberStats);
      setDailyData(dailyData);
      setEventDetails(eventDetails);
    } catch (err) {
      if (err.name === 'AbortError') {
        return;
      }
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

  // Clear cache function
  const clearAttendanceCache = useCallback(() => {
    attendanceCache = null;
    attendanceCacheTimestamp = null;
  }, []);

  useEffect(() => {
    loadAttendanceData();
    
    // Cleanup function to abort ongoing requests
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadAttendanceData]);

  return { 
    isLoading, 
    serviceBreakdown, 
    memberStats, 
    dailyData, 
    eventDetails, 
    error,
    clearCache: clearAttendanceCache
  };
} 
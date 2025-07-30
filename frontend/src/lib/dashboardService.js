import { supabase } from './supabaseClient';
import { smsService } from './smsService';
import { familyService } from './familyService';
import { userCacheService } from './userCache';
import { calculateDonationTrend, getWeeklyDonationBreakdown } from './donationTrendAnalysis';

// Cache for dashboard data to prevent redundant requests
let dashboardCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes (increased from 1 minute)

// Cache for donation trend analysis
let donationTrendCache = null;
let donationTrendCacheTimestamp = null;
const DONATION_TREND_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes (increased from 10)

// Clear all caches function
export const clearAllCaches = () => {
  dashboardCache = null;
  cacheTimestamp = null;
  donationTrendCache = null;
  donationTrendCacheTimestamp = null;
  userCacheService.clearCache();
  console.log('📊 [DashboardService] All caches cleared');
};

// Get current user's organization ID
const getCurrentUserOrganizationId = async () => {
  return await userCacheService.getCurrentUserOrganizationId();
};

export const dashboardService = {
  // Consolidated dashboard data fetch - reduces multiple API calls to just a few
  async getDashboardData() {
    try {
      const organizationId = await getCurrentUserOrganizationId();
      console.log('🔍 [DashboardService] Organization ID:', organizationId);
      
      if (!organizationId) {
        throw new Error('User not associated with any organization');
      }

      // Check cache first (removed forced clearing)
      const currentTime = Date.now();
      if (dashboardCache && cacheTimestamp && 
          (currentTime - cacheTimestamp) < CACHE_DURATION &&
          dashboardCache.organizationId === organizationId) {
        console.log('📊 [DashboardService] Using cached dashboard data');
        return dashboardCache;
      }

      console.log('📊 [DashboardService] Cache miss, fetching fresh data');

      // Fetch all data in parallel with optimized queries
      const [membersData, donationsData, eventsData, tasksData, smsData, celebrationsData, attendanceData, familyData] = await Promise.all([
        this.getMembersData(organizationId),
        this.getDonationsData(organizationId),
        this.getEventsData(organizationId),
        this.getTasksData(organizationId),
        this.getSMSData(organizationId),
        this.getCelebrationsData(organizationId),
        this.getAttendanceData(organizationId),
        this.getFamilyData(organizationId)
      ]);

      const result = {
        organizationId,
        members: membersData,
        donations: donationsData,
        events: eventsData,
        tasks: tasksData,
        sms: smsData,
        celebrations: celebrationsData,
        attendance: attendanceData,
        family: familyData
      };

      // Cache the result
      dashboardCache = result;
      cacheTimestamp = currentTime;

      console.log('📊 [DashboardService] Data cached for:', {
        members: membersData.counts?.total || 0,
        donations: donationsData.all?.length || 0,
        events: eventsData.all?.length || 0,
        tasks: tasksData.all?.length || 0,
        attendance: attendanceData
      });

      return result;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  },

  // Clear cache when data changes
  clearCache() {
    dashboardCache = null;
    cacheTimestamp = null;
    console.log('📊 [DashboardService] Cache cleared');
  },

  // Members data - single optimized API call with pagination support
  async getMembersData(organizationId) {
    console.log('🔍 [DashboardService] Fetching members for organization:', organizationId);
    
    // For dashboard, we only need basic member info, not full details
    const { data: members, error } = await supabase
      .from('members')
      .select('id, firstname, lastname, status, created_at, updated_at, join_date')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(1000); // Limit to prevent excessive data transfer

    if (error) throw error;

    console.log('📊 [DashboardService] Members found:', members?.length || 0);

    const activeMembers = members.filter(m => m.status === 'active');
    const inactiveMembers = members.filter(m => m.status === 'inactive');
    const visitors = members.filter(m => m.status === 'visitor');
    const recentMembers = members.slice(0, 5);

    return {
      all: members,
      active: activeMembers,
      inactive: inactiveMembers,
      visitors,
      recent: recentMembers,
      counts: {
        total: members.length,
        active: activeMembers.length,
        inactive: inactiveMembers.length,
        visitors: visitors.length
      }
    };
  },

  // Donations data with all calculations - single API call
  async getDonationsData(organizationId) {
    const { data: donations, error } = await supabase
      .from('donations')
      .select('*')
      .eq('organization_id', organizationId)
      .order('date', { ascending: false });

    if (error) throw error;

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Calculate various donation metrics
    const totalDonations = Math.round(donations.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0) * 100) / 100;
    
    const monthlyDonations = Math.round(donations
      .filter(d => d.date.startsWith(`${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}`))
      .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0) * 100) / 100;

    // Last month calculations
    const lastMonth = new Date(currentYear, currentMonth - 1, 1);
    const lastMonthEnd = new Date(currentYear, currentMonth, 0);
    const lastMonthStr = lastMonth.toISOString().split('T')[0];
    const lastMonthEndStr = lastMonthEnd.toISOString().split('T')[0];
    
    const lastMonthDonations = Math.round(donations
      .filter(d => d.date >= lastMonthStr && d.date <= lastMonthEndStr)
      .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0) * 100) / 100;

    // Two months ago calculations
    const twoMonthsAgo = new Date(currentYear, currentMonth - 2, 1);
    const twoMonthsAgoEnd = new Date(currentYear, currentMonth - 1, 0);
    const twoMonthsAgoStr = twoMonthsAgo.toISOString().split('T')[0];
    const twoMonthsAgoEndStr = twoMonthsAgoEnd.toISOString().split('T')[0];
    
    const twoMonthsAgoDonations = Math.round(donations
      .filter(d => d.date >= twoMonthsAgoStr && d.date <= twoMonthsAgoEndStr)
      .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0) * 100) / 100;

    // This week calculations (current week starting from Sunday)
    const currentDayOfWeek = currentDate.getDay();
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
    
    const thisWeekDonations = Math.round(donations
      .filter(d => d.date >= startOfWeekStr)
      .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0) * 100) / 100;

    // Last week calculations (previous 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];
    
    const lastWeekDonations = Math.round(donations
      .filter(d => d.date >= oneWeekAgoStr && d.date < currentDate.toISOString().split('T')[0])
      .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0) * 100) / 100;

    // Weekly average calculations (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split('T')[0];
    
    const weeklyDonationTotals = {};
    donations
      .filter(d => d.date >= ninetyDaysAgoStr) // Only last 90 days
      .forEach(donation => {
        try {
          const date = new Date(donation.date);
          if (isNaN(date.getTime())) return;
          
          const startOfWeek = new Date(date);
          const donationDayOfWeek = date.getDay();
          startOfWeek.setDate(date.getDate() - donationDayOfWeek);
          startOfWeek.setHours(0, 0, 0, 0);
          
          const weekKey = startOfWeek.toISOString().split('T')[0];
          const amount = parseFloat(donation.amount) || 0;
          
          if (!weeklyDonationTotals[weekKey]) {
            weeklyDonationTotals[weekKey] = 0;
          }
          weeklyDonationTotals[weekKey] += amount;
        } catch (error) {
          console.error('Error processing donation for weekly average:', donation, error);
        }
      });

    const weeklyValues = Object.values(weeklyDonationTotals);
    const weeklyAverage = weeklyValues.length > 0 ? 
      Math.round(weeklyValues.reduce((sum, val) => sum + val, 0) / weeklyValues.length * 100) / 100 : 0;

    // Monthly average calculations (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const twelveMonthsAgoStr = twelveMonthsAgo.toISOString().split('T')[0];
    
    const monthlyDonationTotals = {};
    donations
      .filter(d => d.date >= twelveMonthsAgoStr) // Only last 12 months
      .forEach(donation => {
        try {
          const date = new Date(donation.date);
          if (isNaN(date.getTime())) return;
          
          const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          const amount = parseFloat(donation.amount) || 0;
          
          if (!monthlyDonationTotals[monthKey]) {
            monthlyDonationTotals[monthKey] = 0;
          }
          monthlyDonationTotals[monthKey] += amount;
        } catch (error) {
          console.error('Error processing donation for monthly average:', donation, error);
        }
      });

    const monthlyValues = Object.values(monthlyDonationTotals);
    const monthlyAverage = monthlyValues.length > 0 ? 
      Math.round(monthlyValues.reduce((sum, val) => sum + val, 0) / monthlyValues.length * 100) / 100 : 0;

    // Growth rate calculation (current month vs last month)
    const growthRate = lastMonthDonations > 0 ? 
      Math.round(((monthlyDonations - lastMonthDonations) / lastMonthDonations) * 100) : 0;

    // Last Sunday donations
    const lastSunday = new Date(currentDate);
    const daysSinceSunday = currentDate.getDay();
    lastSunday.setDate(currentDate.getDate() - daysSinceSunday);
    lastSunday.setHours(0, 0, 0, 0);
    
    const lastSundayDonations = Math.round(donations.filter(donation => {
      try {
        const donationDate = new Date(donation.date + 'T00:00:00');
        const donationSunday = new Date(donationDate);
        const donationDayOfWeek = donationDate.getDay();
        donationSunday.setDate(donationDate.getDate() - donationDayOfWeek);
        donationSunday.setHours(0, 0, 0, 0);
        return donationSunday.toDateString() === lastSunday.toDateString();
      } catch (error) {
        return false;
      }
    }).reduce((sum, donation) => sum + (parseFloat(donation.amount) || 0), 0) * 100) / 100;

    // Calculate sophisticated donation trend analysis with caching
    let donationTrendAnalysis;
    let weeklyDonationBreakdown;
    
    // Check cache for donation trend analysis
    const currentTime = Date.now();
    if (donationTrendCache && donationTrendCacheTimestamp && 
        (currentTime - donationTrendCacheTimestamp) < DONATION_TREND_CACHE_DURATION) {
      console.log('📊 [DashboardService] Using cached donation trend analysis');
      donationTrendAnalysis = donationTrendCache.trendAnalysis;
      weeklyDonationBreakdown = donationTrendCache.weeklyBreakdown;
    } else {
      console.log('📊 [DashboardService] Calculating fresh donation trend analysis');
      donationTrendAnalysis = await calculateDonationTrend();
      weeklyDonationBreakdown = await getWeeklyDonationBreakdown();
      
      // Cache the results
      donationTrendCache = {
        trendAnalysis: donationTrendAnalysis,
        weeklyBreakdown: weeklyDonationBreakdown
      };
      donationTrendCacheTimestamp = currentTime;
    }

    return {
      all: donations,
      recent: donations.slice(0, 7),
      stats: {
        total: totalDonations,
        monthly: monthlyDonations,
        lastMonth: lastMonthDonations,
        twoMonthsAgo: twoMonthsAgoDonations,
        thisWeek: thisWeekDonations,
        lastWeek: lastWeekDonations,
        lastSunday: lastSundayDonations,
        weeklyAverage,
        monthlyAverage,
        growthRate
      },
      trendAnalysis: donationTrendAnalysis,
      weeklyBreakdown: weeklyDonationBreakdown
    };
  },

  // Events data - optimized with pagination
  async getEventsData(organizationId) {
    console.log('🔍 [DashboardService] Fetching events for organization:', organizationId);
    
    // For dashboard, limit events and only get essential fields
    const { data: events, error } = await supabase
      .from('events')
      .select('id, title, start_date, event_type, needs_volunteers')
      .eq('organization_id', organizationId)
      .order('start_date', { ascending: true })
      .limit(500); // Limit to prevent excessive data transfer

    if (error) throw error;

    console.log('📅 [DashboardService] Events found:', events?.length || 0);

    const now = new Date();
    const upcomingEvents = events.filter(e => new Date(e.start_date) >= now).slice(0, 5);
    
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    const monthFromNow = new Date();
    monthFromNow.setMonth(monthFromNow.getMonth() + 1);

    const eventsThisWeek = events.filter(e => {
      const eventDate = new Date(e.start_date);
      return eventDate >= now && eventDate <= weekFromNow;
    }).length;

    const eventsThisMonth = events.filter(e => {
      const eventDate = new Date(e.start_date);
      return eventDate >= now && eventDate <= monthFromNow;
    }).length;

    console.log('📊 [DashboardService] Event calculations:', {
      total: events.length,
      upcoming: upcomingEvents.length,
      thisWeek: eventsThisWeek,
      thisMonth: eventsThisMonth,
      now: now.toISOString(),
      weekFromNow: weekFromNow.toISOString(),
      monthFromNow: monthFromNow.toISOString()
    });

    // Calculate average events per month using available data
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const eventsLast6Months = events.filter(e => {
      const eventDate = new Date(e.start_date);
      return eventDate >= sixMonthsAgo && eventDate <= now;
    });

    const monthsWithEvents = new Set();
    eventsLast6Months.forEach(event => {
      const eventDate = new Date(event.start_date);
      const monthKey = `${eventDate.getFullYear()}-${eventDate.getMonth()}`;
      monthsWithEvents.add(monthKey);
    });
    
    const actualMonthsWithEvents = monthsWithEvents.size;
    const averageEventsPerMonth = actualMonthsWithEvents > 0 ? 
      Math.round(eventsLast6Months.length / actualMonthsWithEvents) : 0;

    // Event types breakdown
    const eventTypesBreakdown = {};
    upcomingEvents.forEach(event => {
      const eventType = event.event_type || 'Other';
      eventTypesBreakdown[eventType] = (eventTypesBreakdown[eventType] || 0) + 1;
    });
    
    const mostCommonEventType = Object.keys(eventTypesBreakdown).length > 0 
      ? Object.keys(eventTypesBreakdown).reduce((a, b) => 
          eventTypesBreakdown[a] > eventTypesBreakdown[b] ? a : b
        )
      : 'None';

    const eventsNeedingVolunteers = upcomingEvents.filter(e => e.needs_volunteers === true).length;

    const result = {
      all: events,
      upcoming: upcomingEvents,
      stats: {
        total: events.length,
        upcoming: upcomingEvents.length,
        thisWeek: eventsThisWeek,
        thisMonth: eventsThisMonth,
        averagePerMonth: averageEventsPerMonth,
        mostCommonType: mostCommonEventType,
        needingVolunteers: eventsNeedingVolunteers
      }
    };

    console.log('📊 [DashboardService] Final event stats:', result.stats);
    return result;
  },

  // Tasks data - single API call
  async getTasksData(organizationId) {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('organization_id', organizationId);

    if (error) throw error;

    const now = new Date();
    const taskStats = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      overdue: tasks.filter(t => 
        t.status !== 'completed' && 
        t.due_date && 
        new Date(t.due_date) < now
      ).length
    };

    return {
      all: tasks,
      stats: taskStats
    };
  },

  // Personal tasks for current user
  async getPersonalTasks(organizationId) {
    try {
      // Get current user from cache
      const user = await userCacheService.getCurrentUser();
      if (!user) return [];

      // Get user's member record - use maybeSingle() to handle no results gracefully
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', user.id)
        .eq('organization_id', organizationId)
        .maybeSingle();

      // If there's an error or no member record, return empty array
      if (memberError) {
        console.warn('Error fetching member record for personal tasks:', memberError);
        return [];
      }

      if (!member) {
        console.info('No member record found for user in this organization - returning empty tasks');
        return [];
      }

      // Get tasks assigned to this user
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select(`
          *,
          requestor:requestor_id (id, firstname, lastname),
          assignee:assignee_id (id, firstname, lastname)
        `)
        .eq('organization_id', organizationId)
        .eq('assignee_id', member.id)
        .neq('status', 'completed') // Only active tasks
        .order('created_at', { ascending: false });

      if (error) throw error;

      return tasks.map(task => ({
        ...task,
        requestor: task.requestor ? {
          ...task.requestor,
          fullName: `${task.requestor.firstname} ${task.requestor.lastname}`
        } : null,
        assignee: task.assignee ? {
          ...task.assignee,
          fullName: `${task.assignee.firstname} ${task.assignee.lastname}`
        } : null
      }));
    } catch (error) {
      console.error('Error fetching personal tasks:', error);
      return [];
    }
  },

  // SMS data - consolidated queries to reduce API calls
  async getSMSData(organizationId) {
    // Batch both queries in parallel instead of sequential calls
    const [messagesResult, conversationsResult] = await Promise.all([
      supabase
        .from('sms_messages')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false }),
      supabase
        .from('sms_conversations')
        .select('*')
        .eq('organization_id', organizationId)
        .order('updated_at', { ascending: false })
    ]);

    if (messagesResult.error) throw messagesResult.error;
    if (conversationsResult.error) throw conversationsResult.error;

    const messages = messagesResult.data || [];
    const conversations = conversationsResult.data || [];

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

    // Calculate all stats in one pass to avoid multiple iterations
    let recentMessagesCount = 0;
    let outboundMessagesCount = 0;
    let inboundMessagesCount = 0;
    
    messages.forEach(message => {
      if (message.created_at >= thirtyDaysAgoStr) {
        recentMessagesCount++;
      }
      if (message.direction === 'outbound') {
        outboundMessagesCount++;
      } else if (message.direction === 'inbound') {
        inboundMessagesCount++;
      }
    });

    const activeConversations = conversations.filter(c => c.status === 'active');
    const recentConversations = conversations.slice(0, 5);

    return {
      totalMessages: messages.length,
      recentMessages: recentMessagesCount,
      totalConversations: conversations.length,
      activeConversations: activeConversations.length,
      outboundMessages: outboundMessagesCount,
      inboundMessages: inboundMessagesCount,
      recentConversations
    };
  },

  // Celebrations data - birthdays, anniversaries, memberships
  async getCelebrationsData(organizationId) {
    const { data: members, error } = await supabase
      .from('members')
      .select('birth_date, join_date, anniversary_date')
      .eq('organization_id', organizationId);

    if (error) throw error;

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

    let upcomingBirthdays = 0;
    let upcomingAnniversaries = 0;
    let upcomingMemberships = 0;

    members.forEach(member => {
      // Check birthdays
      if (member.birth_date) {
        const birthDate = new Date(member.birth_date);
        const nextBirthday = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        if (nextBirthday < now) {
          nextBirthday.setFullYear(now.getFullYear() + 1);
        }
        if (nextBirthday <= thirtyDaysFromNow) {
          upcomingBirthdays++;
        }
      }

      // Check anniversaries
      if (member.anniversary_date) {
        const anniversaryDate = new Date(member.anniversary_date);
        const nextAnniversary = new Date(now.getFullYear(), anniversaryDate.getMonth(), anniversaryDate.getDate());
        if (nextAnniversary < now) {
          nextAnniversary.setFullYear(now.getFullYear() + 1);
        }
        if (nextAnniversary <= thirtyDaysFromNow) {
          upcomingAnniversaries++;
        }
      }

      // Check memberships (join dates)
      if (member.join_date) {
        const joinDate = new Date(member.join_date);
        const nextMembership = new Date(now.getFullYear(), joinDate.getMonth(), joinDate.getDate());
        if (nextMembership < now) {
          nextMembership.setFullYear(now.getFullYear() + 1);
        }
        if (nextMembership <= thirtyDaysFromNow) {
          upcomingMemberships++;
        }
      }
    });

    return {
      upcomingBirthdays,
      upcomingAnniversaries,
      upcomingMemberships,
      totalUpcoming: upcomingBirthdays + upcomingAnniversaries + upcomingMemberships
    };
  },

  // Attendance data by event type - optimized single query
  async getAttendanceData(organizationId) {
    // Get active members count first
    const { data: activeMembers, error: membersError } = await supabase
      .from('members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('status', 'active');

    if (membersError) throw membersError;
    const activeMemberCount = activeMembers?.length || 0;

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sixMonthsAgoStr = sixMonthsAgo.toISOString().split('T')[0];
    
    // Get today's date to filter only past events
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Get events and attendance for last 6 months - ONLY PAST EVENTS
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, event_type, start_date, title')
      .eq('organization_id', organizationId)
      .gte('start_date', sixMonthsAgoStr)
      .lte('start_date', todayStr) // Only include events that have already happened
      .order('start_date', { ascending: false });

    if (eventsError) throw eventsError;

    if (!events || events.length === 0) {
      return {
        sundayServiceRate: 0,
        sundayServiceAttendance: 0,
        sundayServiceEvents: 0,
        bibleStudyAttendance: 0,
        bibleStudyEvents: 0,
        fellowshipAttendance: 0,
        fellowshipEvents: 0
      };
    }

    const eventIds = events.map(e => e.id);
    const { data: attendance, error: attendanceError } = await supabase
      .from('event_attendance')
      .select('event_id, status, member_id')
      .in('event_id', eventIds);

    if (attendanceError) throw attendanceError;

    // Helper function to normalize event types
    const normalizeEventType = (eventType) => {
      if (!eventType) return 'Other';
      const type = eventType.toLowerCase();
      
      if (type.includes('sunday') || type.includes('worship') || type.includes('church')) {
        return 'Sunday Service';
      }
      if (type.includes('bible') || type.includes('study')) {
        return 'Bible Study';
      }
      if (type.includes('fellowship') || type.includes('social') || type.includes('gathering')) {
        return 'Fellowship';
      }
      return eventType; // Keep original if no match
    };

    // Calculate attendance by event type
    const eventTypeStats = {};
    let eventsWithRecords = 0;
    let eventsWithoutRecords = 0;
    
    events.forEach(event => {
      const eventType = normalizeEventType(event.event_type);
      const eventAttendance = attendance.filter(a => a.event_id === event.id);
      const attendingCount = eventAttendance.filter(a => a.status === 'checked-in' || a.status === 'attending').length;
      
      // Only count events that have attendance records
      if (eventAttendance.length > 0) {
        eventsWithRecords++;
        if (!eventTypeStats[eventType]) {
          eventTypeStats[eventType] = {
            totalAttendance: 0,
            eventCount: 0,
            averageAttendance: 0
          };
        }
        
        eventTypeStats[eventType].totalAttendance += attendingCount;
        eventTypeStats[eventType].eventCount += 1;
        
      } else {
        eventsWithoutRecords++;
      }
    });

    // Calculate averages
    Object.keys(eventTypeStats).forEach(eventType => {
      const stats = eventTypeStats[eventType];
      stats.averageAttendance = stats.eventCount > 0 ? 
        Math.round(stats.totalAttendance / stats.eventCount) : 0;
    });

    // Map to the existing stats structure
    const sundayServiceStats = eventTypeStats['Sunday Service'] || { averageAttendance: 0, eventCount: 0, totalAttendance: 0 };
    const bibleStudyStats = eventTypeStats['Bible Study'] || { averageAttendance: 0, eventCount: 0, totalAttendance: 0 };
    const fellowshipStats = eventTypeStats['Fellowship'] || { averageAttendance: 0, eventCount: 0, totalAttendance: 0 };

    // Calculate Sunday Service Rate (percentage of active members who attend each week)
    // Use last 90 days instead of 30 days to get more data points
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split('T')[0];

    // Look for Sunday Service events in the last 90 days - ONLY PAST EVENTS
    const recentSundayEvents = events.filter(e => {
      const normalizedType = normalizeEventType(e.event_type);
      const isSundayService = normalizedType === 'Sunday Service';
      const isInLast90Days = e.start_date >= ninetyDaysAgoStr && e.start_date <= todayStr;
      const isPastEvent = e.start_date <= todayStr;
      
      return isSundayService && isInLast90Days && isPastEvent;
    });

    // Get unique active members who attended Sunday services in the last 90 days
    const sundayAttendees = new Set();
    const activeMemberIds = new Set(activeMembers.map(m => m.id));
    
    recentSundayEvents.forEach(event => {
      const eventAttendance = attendance.filter(a => a.event_id === event.id);
      
      const attendingMembers = eventAttendance.filter(a => 
        (a.status === 'checked-in' || a.status === 'attending') && 
        a.member_id && 
        activeMemberIds.has(a.member_id)
      );
      
      attendingMembers.forEach(a => sundayAttendees.add(a.member_id));
    });

    // Calculate percentage of active members who attend Sunday services
    let sundayServiceRate = activeMemberCount > 0 ? 
      Math.round((sundayAttendees.size / activeMemberCount) * 100) : 0;

    // If no recent Sunday events but we have historical data, calculate based on all Sunday events
    if (sundayServiceRate === 0 && sundayServiceStats.eventCount > 0) {
      // Get all Sunday Service events (not just recent ones)
      const allSundayEvents = events.filter(e => {
        const normalizedType = normalizeEventType(e.event_type);
        return normalizedType === 'Sunday Service' && e.start_date <= todayStr;
      });
      
      const allSundayAttendees = new Set();
      allSundayEvents.forEach(event => {
        const eventAttendance = attendance.filter(a => a.event_id === event.id);
        eventAttendance
          .filter(a => (a.status === 'checked-in' || a.status === 'attending') && 
                      a.member_id && activeMemberIds.has(a.member_id))
          .forEach(a => allSundayAttendees.add(a.member_id));
      });
      
      sundayServiceRate = activeMemberCount > 0 ? 
        Math.round((allSundayAttendees.size / activeMemberCount) * 100) : 0;
    }

    return {
      sundayServiceRate: sundayServiceRate,
      sundayServiceAttendance: sundayServiceStats.totalAttendance,
      sundayServiceEvents: sundayServiceStats.eventCount,
      sundayServicePercentage: sundayServiceStats.averageAttendance,
      bibleStudyAttendance: bibleStudyStats.totalAttendance,
      bibleStudyEvents: bibleStudyStats.eventCount,
      bibleStudyPercentage: bibleStudyStats.averageAttendance,
      fellowshipAttendance: fellowshipStats.totalAttendance,
      fellowshipEvents: fellowshipStats.eventCount,
      fellowshipPercentage: fellowshipStats.averageAttendance
    };
  },

  // Family data - optimized with fewer queries
  async getFamilyData(organizationId) {
    // Batch all member and family queries in parallel
    const [membersResult, familyRelationshipsResult, familiesResult] = await Promise.all([
      // Get all members at once instead of separate queries for adults and children
      supabase
        .from('members')
        .select('id, birth_date, status, member_type')
        .eq('organization_id', organizationId),
      
      // Get all family relationships
      supabase
        .from('family_relationships')
        .select('family_id, member_id'),
      
      // Get all families (we'll filter later)
      supabase
        .from('families')
        .select('id, family_name')
    ]);

    if (membersResult.error) throw membersResult.error;
    if (familyRelationshipsResult.error) throw familyRelationshipsResult.error;
    if (familiesResult.error) throw familiesResult.error;

    const allMembers = membersResult.data || [];
    const allFamilyRelationships = familyRelationshipsResult.data || [];
    const allFamilies = familiesResult.data || [];

    // Process members in a single pass
    let activeAdults = 0;
    let totalChildren = 0;
    const activeAdultIds = [];

    allMembers.forEach(member => {
      const memberType = member.member_type || 'adult'; // null defaults to adult
      
      if (memberType === 'child') {
        totalChildren++;
      } else if (member.status === 'active') {
        activeAdults++;
        activeAdultIds.push(member.id);
      }
    });

    // Filter family relationships to only include active adults
    const activeAdultSet = new Set(activeAdultIds);
    const relevantFamilyRelationships = allFamilyRelationships.filter(fr => 
      activeAdultSet.has(fr.member_id)
    );

    // Count unique families that have active adult members
    const familyIdsWithActiveMembers = new Set(relevantFamilyRelationships.map(fr => fr.family_id));
    const totalFamilies = familyIdsWithActiveMembers.size;

    // Count active adults in families vs individual active adults
    const memberIdsInFamilies = new Set(relevantFamilyRelationships.map(fr => fr.member_id));
    const membersInFamilies = memberIdsInFamilies.size;
    const unassignedMembers = activeAdults - membersInFamilies;

    return {
      totalFamilies,
      membersInFamilies,
      membersWithoutFamilies: unassignedMembers,
      unassignedMembers,
      adults: activeAdults,
      children: totalChildren,
      totalActiveMembers: activeAdults // Only count adults as active members
    };
  },

  // Volunteer data
  async getVolunteerData(organizationId) {
    // This would need to be implemented based on your volunteer system
    // For now, returning placeholder data
    return {
      totalVolunteers: 0,
      upcomingVolunteers: 0,
      recentVolunteers: 0,
      eventsWithVolunteersEnabled: 0,
      totalVolunteersSignedUp: 0,
      eventsStillNeedingVolunteers: 0
    };
  }
}; 
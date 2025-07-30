import { supabase } from './supabaseClient';
import { userCacheService } from './userCache';

// Ultra-minimal request dashboard service
// Goal: Reduce 531 requests to under 10 requests total

class OptimizedDashboardService {
  constructor() {
    this.cache = new Map();
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  }

  // Clear all caches
  clearCache() {
    this.cache.clear();
    console.log('🚀 [OptimizedDashboard] All caches cleared');
  }

  // Check if cache is valid
  isCacheValid(key) {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.CACHE_DURATION;
  }

  // Get from cache or set new value
  cacheGet(key) {
    const cached = this.cache.get(key);
    return cached?.data;
  }

  cacheSet(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // SINGLE MEGA QUERY - Get ALL dashboard data in one optimized request
  async getAllDashboardData() {
    const organizationId = await userCacheService.getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('No organization found');
    }

    const cacheKey = `dashboard-${organizationId}`;
    
    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      console.log('🚀 [OptimizedDashboard] Using cached data');
      return this.cacheGet(cacheKey);
    }

    console.log('🚀 [OptimizedDashboard] Fetching fresh data with minimal requests...');

    try {
      // Query 1: Core Member Data (includes family relationships)
      const membersQuery = supabase
        .from('members')
        .select(`
          id,
          firstname,
          lastname,
          status,
          member_type,
          birth_date,
          anniversary_date,
          join_date,
          created_at,
          updated_at,
          gender,
          family_relationships!inner(family_id)
        `)
        .eq('organization_id', organizationId);

      // Query 2: Events with Attendance (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const today = new Date();
      
      const eventsQuery = supabase
        .from('events')
        .select(`
          id,
          title,
          event_type,
          start_date,
          end_date,
          needs_volunteers,
          created_at,
          event_attendance(
            id,
            member_id,
            status,
            checked_in_at
          )
        `)
        .eq('organization_id', organizationId)
        .gte('start_date', sixMonthsAgo.toISOString().split('T')[0])
        .lte('start_date', today.toISOString().split('T')[0])
        .order('start_date', { ascending: false });

      // Query 3: Donations (last 12 months)
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      
      const donationsQuery = supabase
        .from('donations')
        .select('id, amount, date, type, notes, attendance, created_at')
        .eq('organization_id', organizationId)
        .gte('date', twelveMonthsAgo.toISOString().split('T')[0])
        .order('date', { ascending: false });

      // Query 4: Tasks, SMS, and Families (lightweight data)
      const tasksQuery = supabase
        .from('tasks')
        .select('id, title, status, priority, due_date, created_at, assignee_id, requestor_id')
        .eq('organization_id', organizationId);

      const smsQuery = supabase
        .from('sms_conversations')
        .select(`
          id,
          title,
          conversation_type,
          status,
          updated_at,
          sms_messages(count)
        `)
        .eq('organization_id', organizationId)
        .order('updated_at', { ascending: false })
        .limit(10);

      const familiesQuery = supabase
        .from('families')
        .select('id, family_name')
        .eq('organization_id', organizationId);

      // Execute ALL queries in parallel - Only 6 requests total!
      const [
        { data: members, error: membersError },
        { data: events, error: eventsError },
        { data: donations, error: donationsError },
        { data: tasks, error: tasksError },
        { data: smsConversations, error: smsError },
        { data: families, error: familiesError }
      ] = await Promise.all([
        membersQuery,
        eventsQuery,
        donationsQuery,
        tasksQuery,
        smsQuery,
        familiesQuery
      ]);

      // Check for errors
      if (membersError) throw membersError;
      if (eventsError) throw eventsError;
      if (donationsError) throw donationsError;
      if (tasksError) throw tasksError;
      if (smsError) throw smsError;
      if (familiesError) throw familiesError;

      // Process and calculate everything client-side
      const processedData = this.processAllData({
        members: members || [],
        events: events || [],
        donations: donations || [],
        tasks: tasks || [],
        smsConversations: smsConversations || [],
        families: families || [],
        organizationId
      });

      // Cache the result
      this.cacheSet(cacheKey, processedData);

      console.log('🚀 [OptimizedDashboard] Data processed successfully with only 6 requests!');
      return processedData;

    } catch (error) {
      console.error('🚀 [OptimizedDashboard] Error:', error);
      throw error;
    }
  }

  // Process all data client-side to avoid additional requests
  processAllData({ members, events, donations, tasks, smsConversations, families, organizationId }) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Process Members
    const activeMembers = members.filter(m => m.status === 'active');
    const inactiveMembers = members.filter(m => m.status === 'inactive');
    const visitors = members.filter(m => m.status === 'visitor');
    const recentVisitors = visitors.filter(m => new Date(m.created_at) >= thirtyDaysAgo);
    const adults = members.filter(m => !m.member_type || m.member_type === 'adult');
    const children = members.filter(m => m.member_type === 'child');

    // Process Events
    const upcomingEvents = events.filter(e => new Date(e.start_date) >= now).slice(0, 10);
    const pastEvents = events.filter(e => new Date(e.start_date) < now);
    const eventsThisWeek = events.filter(e => {
      const eventDate = new Date(e.start_date);
      const weekFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
      return eventDate >= now && eventDate <= weekFromNow;
    });
    const eventsThisMonth = events.filter(e => {
      const eventDate = new Date(e.start_date);
      return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
    });

    // Process Donations
    const currentMonthDonations = donations.filter(d => 
      d.date.startsWith(`${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}`)
    );
    const monthlyTotal = currentMonthDonations.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
    
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay());
    const thisWeekDonations = donations.filter(d => new Date(d.date) >= thisWeekStart);
    const weeklyTotal = thisWeekDonations.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);

    // Process Tasks  
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const overdueTasks = tasks.filter(t => 
      t.status !== 'completed' && t.due_date && new Date(t.due_date) < now
    );

    // Process Attendance from Events
    let totalAttendance = 0;
    let sundayServiceAttendance = 0;
    let sundayServiceEvents = 0;
    let bibleStudyAttendance = 0;
    let bibleStudyEvents = 0;
    let fellowshipAttendance = 0;
    let fellowshipEvents = 0;

    pastEvents.forEach(event => {
      const attendance = event.event_attendance?.filter(a => 
        a.status === 'checked-in' || a.status === 'attending'
      ).length || 0;
      
      totalAttendance += attendance;
      
      const eventType = (event.event_type || '').toLowerCase();
      if (eventType.includes('sunday') || eventType.includes('worship')) {
        sundayServiceAttendance += attendance;
        sundayServiceEvents++;
      } else if (eventType.includes('bible') || eventType.includes('study')) {
        bibleStudyAttendance += attendance;
        bibleStudyEvents++;
      } else if (eventType.includes('fellowship')) {
        fellowshipAttendance += attendance;
        fellowshipEvents++;
      }
    });

    // Calculate Sunday Service Rate
    const uniqueSundayAttendees = new Set();
    pastEvents
      .filter(e => {
        const eventType = (e.event_type || '').toLowerCase();
        return eventType.includes('sunday') || eventType.includes('worship');
      })
      .forEach(event => {
        event.event_attendance?.forEach(a => {
          if ((a.status === 'checked-in' || a.status === 'attending') && a.member_id) {
            uniqueSundayAttendees.add(a.member_id);
          }
        });
      });

    const sundayServiceRate = activeMembers.length > 0 ? 
      Math.round((uniqueSundayAttendees.size / activeMembers.length) * 100) : 0;

    // Process Celebrations
    const upcomingBirthdays = members.filter(m => {
      if (!m.birth_date) return false;
      const birthday = new Date(m.birth_date);
      const nextBirthday = new Date(now.getFullYear(), birthday.getMonth(), birthday.getDate());
      if (nextBirthday < now) nextBirthday.setFullYear(now.getFullYear() + 1);
      return nextBirthday <= new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    }).length;

    const upcomingAnniversaries = members.filter(m => {
      if (!m.anniversary_date) return false;
      const anniversary = new Date(m.anniversary_date);
      const nextAnniversary = new Date(now.getFullYear(), anniversary.getMonth(), anniversary.getDate());
      if (nextAnniversary < now) nextAnniversary.setFullYear(now.getFullYear() + 1);
      return nextAnniversary <= new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    }).length;

    // Process SMS
    const totalMessages = smsConversations.reduce((sum, conv) => 
      sum + (conv.sms_messages?.[0]?.count || 0), 0
    );
    const recentMessages = smsConversations.filter(conv => 
      new Date(conv.updated_at) >= thirtyDaysAgo
    ).length;

    // Process Families
    const familyIds = new Set();
    const membersInFamilies = new Set();
    members.forEach(member => {
      if (member.family_relationships?.[0]?.family_id) {
        familyIds.add(member.family_relationships[0].family_id);
        membersInFamilies.add(member.id);
      }
    });

    return {
      organizationId,
      stats: {
        members: {
          total: members.length,
          active: activeMembers.length,
          inactive: inactiveMembers.length,
          visitors: visitors.length,
          recent: recentVisitors.length,
          engagementRate: members.length > 0 ? Math.round((activeMembers.length / members.length) * 100) : 0
        },
        donations: {
          total: donations.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0),
          monthly: monthlyTotal,
          weekly: weeklyTotal,
          thisWeek: weeklyTotal,
          lastWeek: 0, // Could calculate if needed
          trend: 0, // Could calculate if needed
          growth: 0 // Could calculate if needed
        },
        events: {
          total: events.length,
          upcoming: upcomingEvents.length,
          thisWeek: eventsThisWeek.length,
          thisMonth: eventsThisMonth.length,
          needingVolunteers: upcomingEvents.filter(e => e.needs_volunteers).length,
          mostCommonType: 'Sunday Service' // Could calculate properly if needed
        },
        tasks: {
          total: tasks.length,
          pending: pendingTasks.length,
          completed: completedTasks.length,
          overdue: overdueTasks.length,
          completionRate: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0
        },
        celebrations: {
          birthdays: upcomingBirthdays,
          anniversaries: upcomingAnniversaries,
          memberships: 0, // Could calculate if needed
          totalUpcoming: upcomingBirthdays + upcomingAnniversaries
        },
        sms: {
          totalMessages,
          conversations: smsConversations.length,
          recent: recentMessages,
          active: smsConversations.filter(c => c.status === 'active').length
        },
        attendance: {
          sundayServiceRate,
          sundayServiceAttendance,
          sundayServiceEvents,
          bibleStudyAttendance,
          bibleStudyEvents,
          fellowshipAttendance,
          fellowshipEvents
        },
        family: {
          totalFamilies: familyIds.size,
          membersInFamilies: membersInFamilies.size,
          membersWithoutFamilies: activeMembers.length - membersInFamilies.size,
          adults: adults.length,
          children: children.length
        }
      },
      // Raw data for components that need it
      members: members.slice(0, 100), // Limit for performance
      donations: donations.slice(0, 50),
      events: events.slice(0, 50),
      upcomingEvents: upcomingEvents.slice(0, 10),
      recentPeople: members.slice(0, 5),
      tasks: tasks.slice(0, 20),
      smsConversations: smsConversations.slice(0, 5),
      personalTasks: [], // Will be loaded separately if needed
      donationTrendAnalysis: {}, // Simplified for now
      lastUpdated: now
    };
  }

  // Get personal tasks for current user (separate small query)
  async getPersonalTasks(organizationId) {
    try {
      const user = await userCacheService.getCurrentUser();
      if (!user) return [];

      // Single efficient query for personal tasks
      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', user.id)
        .eq('organization_id', organizationId)
        .single();

      if (!member) return [];

      const { data: tasks } = await supabase
        .from('tasks')
        .select(`
          *,
          requestor:requestor_id(firstname, lastname),
          assignee:assignee_id(firstname, lastname)
        `)
        .eq('organization_id', organizationId)
        .eq('assignee_id', member.id)
        .neq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);

      return tasks || [];
    } catch (error) {
      console.warn('Could not load personal tasks:', error);
      return [];
    }
  }
}

// Export singleton instance
export const optimizedDashboardService = new OptimizedDashboardService();
export default optimizedDashboardService;
import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from './dashboardService';
import { useAttendanceStats } from './data/attendanceStats';
import { useToast } from '@/components/ui/use-toast';

// Custom hook for managing all dashboard data in a centralized way
export const useDashboardData = () => {
  const [data, setData] = useState({
    // Core data
    members: [],
    donations: [],
    events: [],
    tasks: [],
    smsConversations: [],
    personalTasks: [],
    
    // Calculated stats
    stats: {
      members: { total: 0, active: 0, inactive: 0, visitors: 0 },
      donations: { total: 0, monthly: 0, weekly: 0, trend: 0 },
      events: { total: 0, upcoming: 0, thisWeek: 0, thisMonth: 0 },
      tasks: { total: 0, pending: 0, completed: 0, overdue: 0 },
      celebrations: { birthdays: 0, anniversaries: 0, memberships: 0 },
      sms: { totalMessages: 0, conversations: 0, recent: 0 },
      attendance: { sundayServiceRate: 0, averageAttendance: 0 },
      family: { totalFamilies: 0, membersInFamilies: 0, adults: 0, children: 0 }
    },
    
    // UI state
    isLoading: true,
    organizationId: null,
    lastUpdated: null
  });

  const { toast } = useToast();

  // Attendance stats hook with date range
  const attendanceDateRange = {
    startDate: new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)),
    endDate: new Date()
  };

  const { 
    isLoading: attendanceLoading, 
    serviceBreakdown, 
    memberStats, 
    dailyData, 
    eventDetails, 
    error: attendanceError,
    clearCache: clearAttendanceCache 
  } = useAttendanceStats(attendanceDateRange.startDate, attendanceDateRange.endDate);

  // Centralized data calculator
  const calculateDerivedData = useCallback((rawData) => {
    const { members, donations, events, tasks, sms, celebrations, attendance, family } = rawData;
    
    // Member calculations
    const memberStats = {
      total: members.all?.length || 0,
      active: members.counts?.active || 0,
      inactive: members.counts?.inactive || 0,
      visitors: members.counts?.visitors || 0,
      recent: calculateRecentVisitors(members.all || []),
      engagementRate: members.counts?.total > 0 ? 
        Math.round((members.counts.active / members.counts.total) * 100) : 0
    };

    // Donation calculations  
    const donationStats = {
      total: donations.stats?.total || 0,
      monthly: donations.stats?.monthly || 0,
      weekly: donations.stats?.weeklyAverage || 0,
      trend: donations.trendAnalysis?.primaryTrend || 0,
      growth: donations.stats?.growthRate || 0,
      lastWeek: donations.stats?.lastWeek || 0,
      thisWeek: donations.stats?.thisWeek || 0
    };

    // Event calculations
    const eventStats = {
      total: events.stats?.total || 0,
      upcoming: events.stats?.upcoming || 0,
      thisWeek: events.stats?.thisWeek || 0,
      thisMonth: events.stats?.thisMonth || 0,
      needingVolunteers: events.stats?.needingVolunteers || 0,
      mostCommonType: events.stats?.mostCommonType || 'None'
    };

    // Task calculations
    const taskStats = {
      total: tasks.stats?.total || 0,
      pending: tasks.stats?.pending || 0,
      completed: tasks.stats?.completed || 0,
      overdue: tasks.stats?.overdue || 0,
      completionRate: tasks.stats?.total > 0 ? 
        Math.round((tasks.stats.completed / tasks.stats.total) * 100) : 0
    };

    // SMS calculations
    const smsStats = {
      totalMessages: sms.totalMessages || 0,
      conversations: sms.totalConversations || 0,
      recent: sms.recentMessages || 0,
      active: sms.activeConversations || 0
    };

    return {
      members: memberStats,
      donations: donationStats,
      events: eventStats,
      tasks: taskStats,
      celebrations: celebrations || {},
      sms: smsStats,
      attendance: attendance || {},
      family: family || {}
    };
  }, []);

  // Helper function to calculate recent visitors
  const calculateRecentVisitors = useCallback((members) => {
    const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
    return members.filter(member => 
      member.status === 'visitor' && 
      new Date(member.createdAt || member.created_at) >= thirtyDaysAgo
    ).length;
  }, []);

  // Load dashboard data
  const loadData = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, isLoading: true }));
      
      const rawData = await dashboardService.getDashboardData();
      const calculatedStats = calculateDerivedData(rawData);
      
      // Load personal tasks
      let personalTasks = [];
      try {
        personalTasks = await dashboardService.getPersonalTasks(rawData.organizationId);
      } catch (error) {
        console.warn('Could not load personal tasks:', error);
      }

      setData({
        // Core data
        members: rawData.members.all || [],
        donations: rawData.donations.all || [],
        events: rawData.events.all || [],
        tasks: rawData.tasks.all || [],
        smsConversations: rawData.sms.recentConversations || [],
        personalTasks,
        
        // Calculated stats
        stats: calculatedStats,
        
        // Additional data
        upcomingEvents: rawData.events.upcoming || [],
        recentPeople: rawData.members.recent || [],
        weeklyDonations: rawData.donations.recent || [],
        donationTrendAnalysis: rawData.donations.trendAnalysis || {},
        
        // UI state
        isLoading: false,
        organizationId: rawData.organizationId,
        lastUpdated: new Date()
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try refreshing the page.",
        variant: "destructive",
      });
      setData(prev => ({ ...prev, isLoading: false }));
    }
  }, [calculateDerivedData, toast]);

  // Refresh function that clears caches
  const refresh = useCallback(async () => {
    dashboardService.clearCache();
    clearAttendanceCache?.();
    await loadData();
    toast({
      title: "Success",
      description: "Dashboard data refreshed",
    });
  }, [loadData, clearAttendanceCache, toast]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Expose attendance stats
  const attendanceStats = {
    isLoading: attendanceLoading,
    serviceBreakdown,
    memberStats,
    dailyData,
    eventDetails,
    error: attendanceError
  };

  return {
    ...data,
    attendanceStats,
    refresh,
    loadData
  };
};

// Calculation utilities that can be reused
export const dashboardCalculations = {
  // Calculate health score for a metric
  getHealthScore: (current, target, isHigherBetter = true) => {
    if (!current || !target) return 0;
    const percentage = isHigherBetter ? 
      Math.min((current / target) * 100, 100) :
      Math.max(100 - ((current / target) * 100), 0);
    return Math.round(percentage);
  },

  // Get status color based on percentage
  getStatusColor: (percentage) => {
    if (percentage >= 80) return 'green';
    if (percentage >= 60) return 'yellow';
    if (percentage >= 40) return 'orange';
    return 'red';
  },

  // Calculate trend indicators
  getTrendIndicator: (current, previous) => {
    if (!previous || previous === 0) return { direction: 'stable', percentage: 0 };
    const change = ((current - previous) / previous) * 100;
    return {
      direction: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
      percentage: Math.abs(change)
    };
  },

  // Format numbers for display
  formatNumber: (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toString() || '0';
  },

  // Format currency
  formatCurrency: (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  }
};

export default { useDashboardData, dashboardCalculations };
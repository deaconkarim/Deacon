import { useState, useEffect, useCallback } from 'react';
import { optimizedDashboardService } from './optimizedDashboardService';
import { useToast } from '@/components/ui/use-toast';

// Custom hook for managing all dashboard data with MINIMAL requests
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
      members: { total: 0, active: 0, inactive: 0, visitors: 0, recent: 0, engagementRate: 0 },
      donations: { total: 0, monthly: 0, weekly: 0, trend: 0, thisWeek: 0, lastWeek: 0, growth: 0 },
      events: { total: 0, upcoming: 0, thisWeek: 0, thisMonth: 0, needingVolunteers: 0, mostCommonType: 'None' },
      tasks: { total: 0, pending: 0, completed: 0, overdue: 0, completionRate: 0 },
      celebrations: { birthdays: 0, anniversaries: 0, memberships: 0, totalUpcoming: 0 },
      sms: { totalMessages: 0, conversations: 0, recent: 0, active: 0 },
      attendance: { sundayServiceRate: 0, sundayServiceAttendance: 0, sundayServiceEvents: 0, bibleStudyAttendance: 0, bibleStudyEvents: 0, fellowshipAttendance: 0, fellowshipEvents: 0 },
      family: { totalFamilies: 0, membersInFamilies: 0, membersWithoutFamilies: 0, adults: 0, children: 0 }
    },
    
    // Additional data
    upcomingEvents: [],
    recentPeople: [],
    weeklyDonations: [],
    donationTrendAnalysis: {},
    
    // UI state
    isLoading: true,
    organizationId: null,
    lastUpdated: null
  });

  const { toast } = useToast();

  // Fake attendance stats for compatibility (we calculate this in the optimized service)
  const attendanceStats = {
    isLoading: false,
    serviceBreakdown: [
      { name: 'Sunday Service', value: Math.round(data.stats.attendance.sundayServiceAttendance / Math.max(data.stats.attendance.sundayServiceEvents, 1)) },
      { name: 'Bible Study', value: Math.round(data.stats.attendance.bibleStudyAttendance / Math.max(data.stats.attendance.bibleStudyEvents, 1)) },
      { name: 'Fellowship', value: Math.round(data.stats.attendance.fellowshipAttendance / Math.max(data.stats.attendance.fellowshipEvents, 1)) }
    ].filter(s => s.value > 0),
    memberStats: [],
    dailyData: [],
    eventDetails: [],
    error: null
  };

  // Load dashboard data with MINIMAL requests
  const loadData = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, isLoading: true }));
      
      console.log('🚀 [DashboardDataManager] Loading data with MINIMAL requests...');
      
      // MAIN DATA: Only 6 requests total!
      const dashboardData = await optimizedDashboardService.getAllDashboardData();
      
      // PERSONAL TASKS: Optional 7th request only if needed
      let personalTasks = [];
      try {
        personalTasks = await optimizedDashboardService.getPersonalTasks(dashboardData.organizationId);
      } catch (error) {
        console.warn('Could not load personal tasks:', error);
      }

      setData({
        // Core data from optimized service
        members: dashboardData.members,
        donations: dashboardData.donations,
        events: dashboardData.events,
        tasks: dashboardData.tasks,
        smsConversations: dashboardData.smsConversations,
        personalTasks,
        
        // Pre-calculated stats
        stats: dashboardData.stats,
        
        // Additional data
        upcomingEvents: dashboardData.upcomingEvents,
        recentPeople: dashboardData.recentPeople,
        weeklyDonations: dashboardData.donations.slice(0, 7), // Last 7 donations as weekly
        donationTrendAnalysis: dashboardData.donationTrendAnalysis,
        
        // UI state
        isLoading: false,
        organizationId: dashboardData.organizationId,
        lastUpdated: dashboardData.lastUpdated
      });

      console.log('🚀 [DashboardDataManager] Data loaded successfully with only 6-7 requests total!');

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try refreshing the page.",
        variant: "destructive",
      });
      setData(prev => ({ ...prev, isLoading: false }));
    }
  }, [toast]);

  // Refresh function that clears caches
  const refresh = useCallback(async () => {
    optimizedDashboardService.clearCache();
    await loadData();
    toast({
      title: "Success",
      description: "Dashboard data refreshed with minimal requests",
    });
  }, [loadData, toast]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

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
import { supabase } from './supabaseClient';
import { userCacheService } from './userCache';

// Helper function to get the week of the month (1-5)
const getWeekOfMonth = (date) => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstDayWeek = Math.ceil((firstDay.getDate() + firstDay.getDay()) / 7);
  const currentWeek = Math.ceil((date.getDate() + firstDay.getDay()) / 7);
  return currentWeek - firstDayWeek + 1;
};

// Helper function to get the start and end dates for a specific week of a month
const getWeekDates = (year, month, weekOfMonth) => {
  const firstDay = new Date(year, month, 1);
  const firstDayWeek = Math.ceil((firstDay.getDate() + firstDay.getDay()) / 7);
  const targetWeek = firstDayWeek + weekOfMonth - 1;
  
  const startDate = new Date(year, month, 1);
  startDate.setDate(startDate.getDate() + (targetWeek - 1) * 7 - firstDay.getDay());
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  
  return { startDate, endDate };
};

// Helper function to get donations for a specific week from cached data
const getDonationsForWeekFromData = (donations, year, month, weekOfMonth) => {
  const { startDate, endDate } = getWeekDates(year, month, weekOfMonth);
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  
  return donations
    .filter(donation => {
      const donationDate = donation.date;
      return donationDate >= startDateStr && donationDate <= endDateStr;
    })
    .reduce((sum, donation) => sum + (parseFloat(donation.amount) || 0), 0);
};

// Helper function to get average donations for a specific week across multiple months
const getAverageDonationsForWeekFromData = (donations, weekOfMonth, monthsBack = 3) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  let totalDonations = 0;
  let monthCount = 0;
  
  for (let i = 1; i <= monthsBack; i++) {
    const targetMonth = currentMonth - i;
    const targetYear = currentYear;
    
    // Handle year rollover
    const actualYear = targetMonth < 0 ? targetYear - 1 : targetYear;
    const actualMonth = targetMonth < 0 ? 12 + targetMonth : targetMonth;
    
    const weekDonations = getDonationsForWeekFromData(donations, actualYear, actualMonth, weekOfMonth);
    totalDonations += weekDonations;
    monthCount++;
  }
  
  return monthCount > 0 ? totalDonations / monthCount : 0;
};

// Main function to calculate sophisticated donation trend - OPTIMIZED VERSION
export const calculateDonationTrend = async () => {
  try {
    const organizationId = await userCacheService.getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('No organization ID found');
    }

    const now = new Date();
    const currentWeekOfMonth = getWeekOfMonth(now);
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    console.log('📊 [DonationTrend] Analyzing week', currentWeekOfMonth, 'of month', currentMonth + 1);

    // SINGLE QUERY: Get all donations for the last 4 months (enough for trend analysis)
    const fourMonthsAgo = new Date();
    fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);
    const fourMonthsAgoStr = fourMonthsAgo.toISOString().split('T')[0];
    
    const { data: donations, error } = await supabase
      .from('donations')
      .select('amount, date')
      .eq('organization_id', organizationId)
      .gte('date', fourMonthsAgoStr)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching donations for trend analysis:', error);
      throw error;
    }

    console.log('📊 [DonationTrend] Fetched', donations?.length || 0, 'donations for analysis');

    // Process all data in memory
    let currentWeekDonations = getDonationsForWeekFromData(
      donations, 
      currentYear, 
      currentMonth, 
      currentWeekOfMonth
    );

    // If no donations this week, try the previous week
    let weekToAnalyze = currentWeekOfMonth;
    if (currentWeekDonations === 0 && currentWeekOfMonth > 1) {
      weekToAnalyze = currentWeekOfMonth - 1;
      currentWeekDonations = getDonationsForWeekFromData(
        donations, 
        currentYear, 
        currentMonth, 
        weekToAnalyze
      );
    }

    const averageWeekDonations = getAverageDonationsForWeekFromData(
      donations, 
      weekToAnalyze
    );

    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthWeekDonations = getDonationsForWeekFromData(
      donations,
      lastMonthYear,
      lastMonth,
      weekToAnalyze
    );

    // Calculate trend percentages
    let trendVsAverage = null;
    let trendVsLastMonth = null;
    let canCalculateTrend = false;
    let trendDescription = '';

    if (averageWeekDonations > 0) {
      trendVsAverage = ((currentWeekDonations - averageWeekDonations) / averageWeekDonations) * 100;
      canCalculateTrend = true;
    }

    if (lastMonthWeekDonations > 0) {
      trendVsLastMonth = ((currentWeekDonations - lastMonthWeekDonations) / lastMonthWeekDonations) * 100;
      canCalculateTrend = true;
    }

    // Determine the primary trend to show
    let primaryTrend = null;
    let trendType = '';

    if (trendVsLastMonth !== null) {
      primaryTrend = trendVsLastMonth;
      trendType = 'lastMonth';
      const weekLabel = weekToAnalyze === currentWeekOfMonth ? `Week ${currentWeekOfMonth}` : `Week ${weekToAnalyze} (previous week)`;
      trendDescription = `${weekLabel}: $${currentWeekDonations.toLocaleString()} vs Last Month: $${lastMonthWeekDonations.toLocaleString()}`;
    } else if (trendVsAverage !== null) {
      primaryTrend = trendVsAverage;
      trendType = 'average';
      const weekLabel = weekToAnalyze === currentWeekOfMonth ? `Week ${currentWeekOfMonth}` : `Week ${weekToAnalyze} (previous week)`;
      trendDescription = `${weekLabel}: $${currentWeekDonations.toLocaleString()} vs 3-Month Avg: $${averageWeekDonations.toLocaleString()}`;
    }

    // Additional context for the trend
    let trendContext = '';
    if (currentWeekOfMonth === 1) {
      trendContext = 'First week of month (typically highest giving)';
    } else if (currentWeekOfMonth === 2) {
      trendContext = 'Second week of month';
    } else if (currentWeekOfMonth === 3) {
      trendContext = 'Third week of month';
    } else if (currentWeekOfMonth === 4) {
      trendContext = 'Fourth week of month';
    } else {
      trendContext = 'Final week of month';
    }

    const result = {
      currentWeekDonations,
      averageWeekDonations,
      lastMonthWeekDonations,
      currentWeekOfMonth,
      weekAnalyzed: weekToAnalyze,
      trendVsAverage,
      trendVsLastMonth,
      primaryTrend,
      trendType,
      canCalculateTrend,
      trendDescription,
      trendContext,
      debug: {
        currentYear,
        currentMonth: currentMonth + 1,
        lastMonthYear,
        lastMonth: lastMonth + 1,
        totalDonationsAnalyzed: donations?.length || 0
      }
    };

    console.log('📊 [DonationTrend] Analysis result:', result);
    return result;

  } catch (error) {
    console.error('Error calculating donation trend:', error);
    return {
      currentWeekDonations: 0,
      averageWeekDonations: 0,
      lastMonthWeekDonations: 0,
      currentWeekOfMonth: 0,
      trendVsAverage: null,
      trendVsLastMonth: null,
      primaryTrend: null,
      trendType: '',
      canCalculateTrend: false,
      trendDescription: 'Unable to calculate trend',
      trendContext: '',
      error: error.message
    };
  }
};

// Helper function to get weekly donation breakdown for current month - OPTIMIZED VERSION
export const getWeeklyDonationBreakdown = async () => {
  try {
    const organizationId = await userCacheService.getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('No organization ID found');
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const weeksInMonth = Math.ceil(daysInMonth / 7);

    // SINGLE QUERY: Get all donations for the last 4 months
    const fourMonthsAgo = new Date();
    fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);
    const fourMonthsAgoStr = fourMonthsAgo.toISOString().split('T')[0];
    
    const { data: donations, error } = await supabase
      .from('donations')
      .select('amount, date')
      .eq('organization_id', organizationId)
      .gte('date', fourMonthsAgoStr)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching donations for weekly breakdown:', error);
      return [];
    }

    const weeklyBreakdown = [];

    for (let week = 1; week <= weeksInMonth; week++) {
      const weekDonations = getDonationsForWeekFromData(donations, currentYear, currentMonth, week);
      const averageWeekDonations = getAverageDonationsForWeekFromData(donations, week);
      
      weeklyBreakdown.push({
        week,
        currentDonations: weekDonations,
        averageDonations: averageWeekDonations,
        trend: averageWeekDonations > 0 ? ((weekDonations - averageWeekDonations) / averageWeekDonations) * 100 : null
      });
    }

    return weeklyBreakdown;

  } catch (error) {
    console.error('Error getting weekly donation breakdown:', error);
    return [];
  }
}; 
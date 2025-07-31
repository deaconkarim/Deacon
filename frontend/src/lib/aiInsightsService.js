import { supabase } from './supabaseClient';

// Configuration for AI services
const AI_CONFIG = {
  // Use GPT-3.5 for most tasks (cheaper)
  OPENAI_MODEL: 'gpt-3.5-turbo-16k',
  // Use GPT-4o only for complex reasoning
  OPENAI_MODEL_COMPLEX: 'gpt-4o-mini',
  // Batch processing to reduce API calls
  BATCH_SIZE: 10,
  // Cache insights for 24 hours
  CACHE_DURATION: 24 * 60 * 60 * 1000,
};

// Persistent cache using localStorage for 24-hour caching
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const CACHE_PREFIX = 'ai_insights_';

// Cache structure: { data, timestamp }
const getCacheKey = (type, organizationId) => `${CACHE_PREFIX}${type}_${organizationId}`;

const isCacheValid = (timestamp) => {
  return Date.now() - timestamp < CACHE_DURATION;
};

// Get cached data from localStorage
const getCachedData = (cacheKey) => {
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (isCacheValid(parsed.timestamp)) {
        return parsed.data;
      } else {
        // Remove expired cache
        localStorage.removeItem(cacheKey);
      }
    }
    return null;
  } catch (error) {
    console.warn('Error reading cache:', error);
    return null;
  }
};

// Set cached data in localStorage
const setCachedData = (cacheKey, data) => {
  try {
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Error writing cache:', error);
    // If localStorage is full, clear old entries
    clearOldCache();
  }
};

// Clear old cache entries to prevent localStorage overflow
const clearOldCache = () => {
  try {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
    
    // Sort by timestamp and remove oldest entries if we have too many
    if (cacheKeys.length > 50) {
      const cacheData = cacheKeys.map(key => ({
        key,
        timestamp: JSON.parse(localStorage.getItem(key))?.timestamp || 0
      })).sort((a, b) => a.timestamp - b.timestamp);
      
      // Remove oldest 20 entries
      cacheData.slice(0, 20).forEach(({ key }) => {
        localStorage.removeItem(key);
      });
    }
  } catch (error) {
    console.warn('Error clearing old cache:', error);
  }
};

/**
 * Smart SQL Queries for Pattern Detection (Free - No AI cost)
 */
export class SmartInsightsQueries {
  
  /**
   * Detect at-risk members (no check-in + no giving + no events in 60 days)
   * Only includes active adult members (excludes children and visitors)
   */
  static async getAtRiskMembers(organizationId) {
    if (!organizationId) {
      console.warn('Organization ID is undefined, skipping at-risk members query');
      return [];
    }

    const cacheKey = getCacheKey('at_risk_members', organizationId);
    
    // Check cache first
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log('📊 [AIInsights] Using cached at-risk members');
      return cached;
    }

    console.log('📊 [AIInsights] Generating fresh at-risk members data');
    
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    const { data, error } = await supabase
      .from('members')
      .select(`
        id,
        firstname,
        lastname,
        email,
        phone,
        created_at,
        status,
        member_type
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .eq('member_type', 'adult');

    if (error) {
      console.error('Error fetching at-risk members:', error);
      return [];
    }

    // Batch query for recent giving and events instead of individual calls
    const memberIds = data.map(member => member.id);
    
    // Get all recent donations for these members
    const { data: recentDonations, error: donationsError } = await supabase
      .from('donations')
      .select('donor_id')
      .in('donor_id', memberIds)
      .gte('created_at', sixtyDaysAgo.toISOString());

    // Get all recent event attendance for these members
    const { data: recentAttendance, error: attendanceError } = await supabase
      .from('event_attendance')
      .select('member_id')
      .in('member_id', memberIds)
      .gte('created_at', sixtyDaysAgo.toISOString());

    if (donationsError || attendanceError) {
      console.error('Error fetching recent activity:', { donationsError, attendanceError });
      return [];
    }

    // Create sets for O(1) lookup
    const membersWithRecentGiving = new Set(recentDonations.map(d => d.donor_id));
    const membersWithRecentEvents = new Set(recentAttendance.map(a => a.member_id));

    // Filter at-risk members
    const atRiskMembers = data.filter(member => {
      const hasRecentGiving = membersWithRecentGiving.has(member.id);
      const hasRecentEvents = membersWithRecentEvents.has(member.id);
      
      if (!hasRecentGiving && !hasRecentEvents) {
        // Add profile link to member data
        member.profileUrl = `/members/${member.id}`;
        return true;
      }
      return false;
    });

    // Cache the result
    setCachedData(cacheKey, atRiskMembers);
    console.log('📊 [AIInsights] Cached at-risk members');

    return atRiskMembers;
  }

  /**
   * Helper methods
   */
  static async checkRecentGiving(memberId, sinceDate) {
    const { data, error } = await supabase
      .from('donations')
      .select('id')
      .eq('donor_id', memberId)
      .gte('created_at', sinceDate.toISOString())
      .limit(1);

    return !error && data && data.length > 0;
  }

  static async checkRecentEvents(memberId, sinceDate) {
    const { data, error } = await supabase
      .from('event_attendance')
      .select('id')
      .eq('member_id', memberId)
      .gte('created_at', sinceDate.toISOString())
      .limit(1);

    return !error && data && data.length > 0;
  }

  /**
   * Get predictive attendance data
   * TEMPORARILY DISABLED - Returns null to prevent API calls
   */
  static async getPredictiveAttendance(organizationId) {
    // TEMPORARILY DISABLED - Predictive attendance disabled to reduce API calls
    console.log('📊 [AIInsights] Predictive attendance disabled');
    return null;
  }

  /**
   * Get donation insights and trends
   */
  static async getDonationInsights(organizationId) {
    // TEMPORARILY DISABLED - Donation insights disabled to reduce API calls
    console.log('📊 [AIInsights] Donation insights disabled');
    return null;
  }

  /**
   * Calculate donation insights from donation data
   */
  static calculateDonationInsights(donations, sevenDaysAgo, startOfMonth, endOfMonth, now) {
    if (!donations || donations.length === 0) {
      return {
        totalAmount: 0,
        totalDonations: 0,
        averageDonation: 0,
        recurringDonations: 0,
        topDonors: [],
        monthlyTrends: {},
        paymentMethodBreakdown: {},
        fundDesignationBreakdown: {},
        givingPatterns: {},
        currentWeek: {
          amount: 0,
          donations: 0,
          average: 0,
          trend: 'no-data'
        },
        currentMonth: {
          amount: 0,
          donations: 0,
          average: 0,
          trend: 'no-data',
          projected: 0
        },
        predictions: {
          nextWeek: 0,
          nextMonth: 0,
          confidence: 'low'
        },
        recommendations: []
      };
    }

    const insights = {
      totalAmount: 0,
      totalDonations: donations.length,
      recurringDonations: 0,
      topDonors: [],
      monthlyTrends: {},
      paymentMethodBreakdown: {},
      fundDesignationBreakdown: {},
      givingPatterns: {},
      currentWeek: {
        amount: 0,
        donations: 0,
        average: 0,
        trend: 'no-data'
      },
      currentMonth: {
        amount: 0,
        donations: 0,
        average: 0,
        trend: 'no-data',
        projected: 0
      },
      predictions: {
        nextWeek: 0,
        nextMonth: 0,
        confidence: 'low'
      },
      recommendations: []
    };

    // Calculate totals and breakdowns
    donations.forEach(donation => {
      insights.totalAmount += donation.amount || 0;
      if (donation.is_recurring) {
        insights.recurringDonations++;
      }

      // Monthly trends
      const month = new Date(donation.date).toISOString().slice(0, 7); // YYYY-MM
      insights.monthlyTrends[month] = (insights.monthlyTrends[month] || 0) + (donation.amount || 0);

      // Payment method breakdown
      const method = donation.payment_method || 'unknown';
      insights.paymentMethodBreakdown[method] = (insights.paymentMethodBreakdown[method] || 0) + (donation.amount || 0);

      // Fund designation breakdown
      const designation = donation.fund_designation || 'general';
      insights.fundDesignationBreakdown[designation] = (insights.fundDesignationBreakdown[designation] || 0) + (donation.amount || 0);
    });

    // Calculate average donation
    insights.averageDonation = insights.totalAmount / insights.totalDonations;

    // Find top donors (by total amount)
    const donorTotals = {};
    donations.forEach(donation => {
      if (donation.donor_id && donation.donor) {
        const donorKey = donation.donor_id;
        donorTotals[donorKey] = (donorTotals[donorKey] || 0) + (donation.amount || 0);
      }
    });

    insights.topDonors = Object.entries(donorTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([donorId, total]) => {
        const donor = donations.find(d => d.donor_id === donorId)?.donor;
        return {
          donor_id: donorId,
          total,
          name: donor ? `${donor.firstname} ${donor.lastname}` : 'Unknown',
          email: donor?.email || ''
        };
      });

    // Analyze giving patterns
    const recentDonations = donations.filter(d => {
      const donationDate = new Date(d.date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return donationDate >= thirtyDaysAgo;
    });

    insights.givingPatterns = {
      recentDonations: recentDonations.length,
      recentAmount: recentDonations.reduce((sum, d) => sum + (d.amount || 0), 0),
      averageRecentDonation: recentDonations.length > 0 ? 
        recentDonations.reduce((sum, d) => sum + (d.amount || 0), 0) / recentDonations.length : 0
    };

    // Calculate current week insights (last 7 days)
    const currentWeekDonations = donations.filter(d => {
      const donationDate = new Date(d.date);
      return donationDate >= sevenDaysAgo && donationDate <= now;
    });

    insights.currentWeek = {
      amount: currentWeekDonations.reduce((sum, d) => sum + (d.amount || 0), 0),
      donations: currentWeekDonations.length,
      average: currentWeekDonations.length > 0 ? 
        currentWeekDonations.reduce((sum, d) => sum + (d.amount || 0), 0) / currentWeekDonations.length : 0,
      trend: this.calculateTrend(currentWeekDonations, donations, 'week')
    };

    // Calculate current month insights
    const currentMonthDonations = donations.filter(d => {
      const startOfMonthStr = startOfMonth.toISOString().split('T')[0];
      const endOfMonthStr = endOfMonth.toISOString().split('T')[0];
      return d.date >= startOfMonthStr && d.date <= endOfMonthStr;
    });

    const currentMonthAmount = currentMonthDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
    


    insights.currentMonth = {
      amount: currentMonthAmount,
      donations: currentMonthDonations.length,
      average: currentMonthDonations.length > 0 ? 
        currentMonthAmount / currentMonthDonations.length : 0,
      trend: this.calculateTrend(currentMonthDonations, donations, 'month'),
      projected: this.calculateMonthlyProjection(currentMonthDonations, endOfMonth, now)
    };

    // Generate predictions
    insights.predictions = this.generateDonationPredictions(donations, insights);

    // Generate recommendations
    insights.recommendations = this.generateDonationRecommendations(insights);

    return insights;
  }

  /**
   * Calculate trend for current period vs previous period
   */
  static calculateTrend(currentPeriodDonations, allDonations, period) {
    if (currentPeriodDonations.length === 0) return 'no-data';

    const now = new Date();
    let previousPeriodStart, previousPeriodEnd;

    if (period === 'week') {
      // Previous 7 days (days 8-14 ago)
      previousPeriodStart = new Date(now);
      previousPeriodStart.setDate(now.getDate() - 14);
      previousPeriodEnd = new Date(now);
      previousPeriodEnd.setDate(now.getDate() - 8);
    } else {
      // Previous month
      previousPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      previousPeriodEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    }

    const previousPeriodDonations = allDonations.filter(d => {
      const previousPeriodStartStr = previousPeriodStart.toISOString().split('T')[0];
      const previousPeriodEndStr = previousPeriodEnd.toISOString().split('T')[0];
      return d.date >= previousPeriodStartStr && d.date <= previousPeriodEndStr;
    });

    const currentAmount = currentPeriodDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const previousAmount = previousPeriodDonations.reduce((sum, d) => sum + (d.amount || 0), 0);

    if (previousAmount === 0) return 'no-comparison';
    if (currentAmount > previousAmount * 1.1) return 'up';
    if (currentAmount < previousAmount * 0.9) return 'down';
    return 'stable';
  }

  /**
   * Calculate monthly projection based on current progress
   */
  static calculateMonthlyProjection(currentMonthDonations, endOfMonth, now) {
    if (currentMonthDonations.length === 0) return 0;

    const currentAmount = currentMonthDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const daysInMonth = endOfMonth.getDate();
    const daysElapsed = now.getDate();
    const daysRemaining = daysInMonth - daysElapsed;

    if (daysElapsed === 0) return currentAmount;

    const dailyAverage = currentAmount / daysElapsed;
    const projectedAmount = currentAmount + (dailyAverage * daysRemaining);

    return Math.round(projectedAmount);
  }

  /**
   * Generate donation predictions for next week and month
   */
  static generateDonationPredictions(donations, insights) {
    const predictions = {
      nextWeek: 0,
      nextMonth: 0,
      confidence: 'low'
    };

    // Calculate next week prediction based on current week and historical patterns
    if (insights.currentWeek.amount > 0) {
      const weeklyAverage = insights.currentWeek.amount;
      const trendMultiplier = insights.currentWeek.trend === 'up' ? 1.1 : 
                             insights.currentWeek.trend === 'down' ? 0.9 : 1.0;
      predictions.nextWeek = Math.round(weeklyAverage * trendMultiplier);
    } else {
      // Fallback to historical average
      const recentWeeks = donations.filter(d => {
        const donationDate = new Date(d.date);
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
        return donationDate >= fourWeeksAgo;
      });
      
      if (recentWeeks.length > 0) {
        const weeklyGroups = {};
        recentWeeks.forEach(donation => {
          const weekKey = this.getWeekKey(new Date(donation.date));
          weeklyGroups[weekKey] = (weeklyGroups[weekKey] || 0) + (donation.amount || 0);
        });
        
        const weeklyAverages = Object.values(weeklyGroups);
        const averageWeekly = weeklyAverages.reduce((sum, amount) => sum + amount, 0) / weeklyAverages.length;
        predictions.nextWeek = Math.round(averageWeekly);
      }
    }

    // Calculate next month prediction
    if (insights.currentMonth.projected > 0) {
      predictions.nextMonth = insights.currentMonth.projected;
    } else {
      // Fallback to historical monthly average
      const monthlyGroups = {};
      donations.forEach(donation => {
        const monthKey = this.getMonthKey(new Date(donation.date));
        monthlyGroups[monthKey] = (monthlyGroups[monthKey] || 0) + (donation.amount || 0);
      });
      
      const monthlyAverages = Object.values(monthlyGroups);
      if (monthlyAverages.length > 0) {
        const averageMonthly = monthlyAverages.reduce((sum, amount) => sum + amount, 0) / monthlyAverages.length;
        predictions.nextMonth = Math.round(averageMonthly);
      }
    }

    // Calculate confidence based on data availability and consistency
    const hasRecentData = insights.currentWeek.donations > 0 || insights.currentMonth.donations > 0;
    const hasHistoricalData = donations.length > 10;
    const hasConsistentPatterns = insights.currentWeek.trend !== 'no-data' && insights.currentMonth.trend !== 'no-data';

    if (hasRecentData && hasHistoricalData && hasConsistentPatterns) {
      predictions.confidence = 'high';
    } else if (hasRecentData || hasHistoricalData) {
      predictions.confidence = 'medium';
    } else {
      predictions.confidence = 'low';
    }

    return predictions;
  }

  /**
   * Generate donation recommendations based on insights
   */
  static generateDonationRecommendations(insights) {
    const recommendations = [];

    // Analyze current week performance
    if (insights.currentWeek.trend === 'down') {
      recommendations.push('Last 7 days giving is below average. Consider a mid-week giving reminder');
    } else if (insights.currentWeek.trend === 'up') {
      recommendations.push('Great giving momentum in the last 7 days! Consider thanking donors for their generosity');
    }

    // Analyze current month performance
    if (insights.currentMonth.trend === 'down') {
      recommendations.push('Monthly giving is declining. Consider stewardship messaging this week');
    } else if (insights.currentMonth.projected > insights.currentMonth.amount * 1.2) {
      recommendations.push('Strong monthly projection. Consider highlighting ministry impact');
    }

    // Analyze predictions
    if (insights.predictions.confidence === 'high' && insights.predictions.nextWeek < insights.currentWeek.amount * 0.8) {
      recommendations.push('Predicted decline next week. Consider proactive giving encouragement');
    }

    // Analyze recurring donations
    const recurringPercentage = (insights.recurringDonations / insights.totalDonations) * 100;
    if (recurringPercentage < 20) {
      recommendations.push('Consider promoting recurring donations to increase giving consistency');
    }

    // Analyze average donation
    if (insights.averageDonation < 50) {
      recommendations.push('Average donation is below typical church giving. Consider stewardship education');
    }

    // Analyze recent giving
    if (insights.givingPatterns.recentDonations < 10) {
      recommendations.push('Recent giving activity is low. Consider outreach to encourage giving');
    }

    // Analyze fund designation diversity
    const fundCount = Object.keys(insights.fundDesignationBreakdown).length;
    if (fundCount < 3) {
      recommendations.push('Limited fund designations. Consider adding specific ministry funds');
    }

    // Analyze payment method diversity
    const methodCount = Object.keys(insights.paymentMethodBreakdown).length;
    if (methodCount < 2) {
      recommendations.push('Limited payment methods. Consider adding online giving options');
    }

    return recommendations;
  }

  /**
   * Calculate detailed attendance patterns from historical data
   */
  static calculateDetailedAttendancePatterns(historicalAttendance) {
    const patterns = {
      weeklyAverage: 0,
      monthlyAverage: 0,
      eventTypePatterns: {},
      eventNamePatterns: {},
      recurringEventPatterns: {},
      seasonalTrends: {},
      memberConsistency: {},
      eventHistory: {}
    };

    if (!historicalAttendance || historicalAttendance.length === 0) {
      return patterns;
    }

    // Group by week and month
    const weeklyGroups = {};
    const monthlyGroups = {};
    const eventTypeGroups = {};
    const eventNameGroups = {};
    const recurringEventGroups = {};

    historicalAttendance.forEach(attendance => {
      const eventDate = new Date(attendance.events?.end_date || attendance.created_at);
      const weekKey = this.getWeekKey(eventDate);
      const monthKey = this.getMonthKey(eventDate);
      const eventType = attendance.events?.event_type || 'general';
      const eventTitle = attendance.events?.title || 'Unknown';
      
      // Extract recurring event name (e.g., "Sunday Service" from "Sunday Service - Week 1")
      const recurringEventName = this.extractRecurringEventName(eventTitle);

      // Weekly grouping
      if (!weeklyGroups[weekKey]) {
        weeklyGroups[weekKey] = [];
      }
      weeklyGroups[weekKey].push(attendance);

      // Monthly grouping
      if (!monthlyGroups[monthKey]) {
        monthlyGroups[monthKey] = [];
      }
      monthlyGroups[monthKey].push(attendance);

      // Event type grouping
      if (!eventTypeGroups[eventType]) {
        eventTypeGroups[eventType] = [];
      }
      eventTypeGroups[eventType].push(attendance);

      // Event name grouping
      if (!eventNameGroups[eventTitle]) {
        eventNameGroups[eventTitle] = [];
      }
      eventNameGroups[eventTitle].push(attendance);

      // Recurring event grouping
      if (!recurringEventGroups[recurringEventName]) {
        recurringEventGroups[recurringEventName] = [];
      }
      recurringEventGroups[recurringEventName].push(attendance);
    });

    // Calculate averages
    const weeklyCounts = Object.values(weeklyGroups).map(group => group.length);
    const monthlyCounts = Object.values(monthlyGroups).map(group => group.length);

    patterns.weeklyAverage = weeklyCounts.length > 0 ? 
      weeklyCounts.reduce((sum, count) => sum + count, 0) / weeklyCounts.length : 0;
    
    patterns.monthlyAverage = monthlyCounts.length > 0 ? 
      monthlyCounts.reduce((sum, count) => sum + count, 0) / monthlyCounts.length : 0;

    // Event type patterns
    Object.keys(eventTypeGroups).forEach(eventType => {
      patterns.eventTypePatterns[eventType] = eventTypeGroups[eventType].length;
    });

    // Event name patterns
    Object.keys(eventNameGroups).forEach(eventName => {
      patterns.eventNamePatterns[eventName] = eventNameGroups[eventName].length;
    });

    // Recurring event patterns
    Object.keys(recurringEventGroups).forEach(recurringName => {
      patterns.recurringEventPatterns[recurringName] = recurringEventGroups[recurringName].length;
    });

    // Store detailed event history
    patterns.eventHistory = eventNameGroups;

    return patterns;
  }

  /**
   * Generate detailed attendance predictions for upcoming events
   */
  static generateDetailedAttendancePredictions(upcomingEvents, patterns, historicalAttendance) {
    const predictions = [];

    // Event type base predictions (when no historical data)
    const eventTypeDefaults = {
      'Worship Service': 45,
      'Bible Study or Class': 12,
      'Youth Group': 15,
      'Prayer Meeting': 8,
      'Fellowship': 25,
      'general': 20
    };

    upcomingEvents.forEach((event, index) => {
      const eventDate = new Date(event.end_date);
      const eventType = event.event_type || 'general';
      const eventTitle = event.title;
      
      // Extract recurring event name
      const recurringEventName = this.extractRecurringEventName(eventTitle);
      
      // Find similar historical events
      const similarEvents = this.findSimilarHistoricalEvents(eventTitle, recurringEventName, eventType, historicalAttendance);
      
      // Calculate base prediction from similar events
      let basePrediction = this.calculateBasePredictionFromSimilarEvents(similarEvents, eventTypeDefaults, eventType);
      
      // Adjust for comprehensive factors including weather, community events, and travel patterns
      const comprehensiveAdjustment = this.calculateComprehensiveAdjustment(eventDate);
      
      // Calculate trend adjustment based on recent attendance patterns
      const trendAdjustment = this.calculateTrendAdjustment(similarEvents, eventDate);
      
      // Calculate confidence based on data quality
      const confidence = this.calculateDetailedConfidence(similarEvents, patterns, eventTitle, recurringEventName);
      
      const predictedAttendance = Math.round(basePrediction * comprehensiveAdjustment.adjustment * trendAdjustment);

      predictions.push({
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.end_date,
        eventType: eventType,
        predictedAttendance: Math.max(predictedAttendance, 3),
        confidence: confidence.level,
        confidenceScore: confidence.score,
        factors: {
          similarEvents: similarEvents.length,
          historicalAverage: basePrediction,
          comprehensiveFactors: comprehensiveAdjustment.factors,
          adjustmentFactor: comprehensiveAdjustment.adjustment,
          trendFactor: trendAdjustment,
          recurringEventName: recurringEventName,
          eventTypeFactor: patterns.eventTypePatterns[eventType] || 0
        }
      });
    });

    return predictions;
  }

  /**
   * Helper methods for date calculations
   */
  static getWeekKey(date) {
    const year = date.getFullYear();
    const week = Math.ceil((date.getDate() + new Date(year, date.getMonth(), 1).getDay()) / 7);
    return `${year}-W${week}`;
  }

  static getMonthKey(date) {
    return `${date.getFullYear()}-${date.getMonth() + 1}`;
  }

  /**
   * Extract recurring event name from title
   */
  static extractRecurringEventName(title) {
    // Remove common suffixes like " - Week 1", " (Week 1)", etc.
    return title.replace(/\s*[-\(]\s*Week\s*\d+[\)]?\s*$/i, '')
                .replace(/\s*[-\(]\s*Session\s*\d+[\)]?\s*$/i, '')
                .replace(/\s*[-\(]\s*Part\s*\d+[\)]?\s*$/i, '')
                .trim();
  }

  /**
   * Find similar historical events
   */
  static findSimilarHistoricalEvents(eventTitle, recurringEventName, eventType, historicalAttendance) {
    const similarEvents = [];
    
    historicalAttendance.forEach(attendance => {
      const historicalEvent = attendance.events;
      if (!historicalEvent) return;
      
      const historicalTitle = historicalEvent.title;
      const historicalRecurringName = this.extractRecurringEventName(historicalTitle);
      const historicalEventType = historicalEvent.event_type || 'general';
      
      // Check for exact title match
      if (historicalTitle.toLowerCase() === eventTitle.toLowerCase()) {
        similarEvents.push({ attendance, matchType: 'exact', score: 1.0 });
      }
      // Check for recurring event name match
      else if (historicalRecurringName.toLowerCase() === recurringEventName.toLowerCase()) {
        similarEvents.push({ attendance, matchType: 'recurring', score: 0.8 });
      }
      // Check for event type match
      else if (historicalEventType === eventType) {
        similarEvents.push({ attendance, matchType: 'type', score: 0.6 });
      }
    });
    
    return similarEvents.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate base prediction from similar events
   */
  static calculateBasePredictionFromSimilarEvents(similarEvents, eventTypeDefaults, eventType) {
    if (similarEvents.length === 0) {
      return eventTypeDefaults[eventType] || eventTypeDefaults.general;
    }
    
    // Calculate average attendance from similar events
    const totalAttendance = similarEvents.reduce((sum, { attendance }) => sum + 1, 0);
    return totalAttendance / similarEvents.length;
  }

  /**
   * Calculate comprehensive adjustment including weather, community events, and travel patterns
   */
  static calculateComprehensiveAdjustment(eventDate) {
    const month = eventDate.getMonth();
    const dayOfWeek = eventDate.getDay();
    const dayOfMonth = eventDate.getDate();
    
    let adjustment = 1.0;
    let factors = [];
    
    // Weather patterns (seasonal)
    const isSummer = month >= 5 && month <= 8; // June to September
    const isWinter = month === 11 || month === 0 || month === 1; // Dec, Jan, Feb
    const isSpring = month >= 2 && month <= 4; // March to May
    const isFall = month >= 9 && month <= 10; // September to October
    
    if (isSummer) {
      adjustment *= 0.85; // 15% decrease in summer (vacations, outdoor activities)
      factors.push('Summer vacation season');
    }
    if (isWinter) {
      adjustment *= 0.9; // 10% decrease in winter (weather concerns)
      factors.push('Winter weather patterns');
    }
    if (isSpring) {
      adjustment *= 1.05; // 5% increase in spring (renewal, better weather)
      factors.push('Spring renewal period');
    }
    if (isFall) {
      adjustment *= 1.02; // 2% increase in fall (back to routine)
      factors.push('Fall routine return');
    }
    
    // Community events and holidays
    const isHolidaySeason = month === 11 || month === 0; // December and January
    const isSchoolBreak = (month === 6 || month === 7) || (month === 11 && dayOfMonth > 20) || (month === 0 && dayOfMonth < 10);
    const isMajorHoliday = this.isMajorHoliday(eventDate);
    
    if (isHolidaySeason) {
      adjustment *= 0.75; // 25% decrease during holidays
      factors.push('Holiday season travel');
    }
    if (isSchoolBreak) {
      adjustment *= 0.8; // 20% decrease during school breaks
      factors.push('School break family travel');
    }
    if (isMajorHoliday) {
      adjustment *= 0.7; // 30% decrease on major holidays
      factors.push('Major holiday conflict');
    }
    
    // Weekend vs weekday patterns
    if (dayOfWeek === 0) { // Sunday
      adjustment *= 1.1; // 10% increase for Sunday services
      factors.push('Sunday service tradition');
    } else if (dayOfWeek === 6) { // Saturday
      adjustment *= 0.9; // 10% decrease for Saturday events
      factors.push('Weekend family activities');
    } else if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Weekdays
      adjustment *= 0.85; // 15% decrease for weekday events
      factors.push('Weekday work commitments');
    }
    
    // Family travel patterns
    const isTravelSeason = this.isTravelSeason(eventDate);
    if (isTravelSeason) {
      adjustment *= 0.8; // 20% decrease during travel seasons
      factors.push('Family travel season');
    }
    
    return { adjustment, factors };
  }
  
  /**
   * Check if date falls on a major holiday
   */
  static isMajorHoliday(date) {
    const month = date.getMonth();
    const day = date.getDate();
    
    // Major US holidays that affect church attendance
    const holidays = [
      { month: 0, day: 1 }, // New Year's Day
      { month: 6, day: 4 }, // Independence Day
      { month: 10, day: 11 }, // Veterans Day
      { month: 11, day: 25 }, // Christmas
      { month: 11, day: 31 }, // New Year's Eve
    ];
    
    return holidays.some(holiday => holiday.month === month && holiday.day === day);
  }
  
  /**
   * Check if date is during travel season
   */
  static isTravelSeason(date) {
    const month = date.getMonth();
    const day = date.getDate();
    
    // Common travel periods
    const travelPeriods = [
      { startMonth: 6, startDay: 15, endMonth: 8, endDay: 15 }, // Summer travel
      { startMonth: 11, startDay: 20, endMonth: 0, endDay: 5 }, // Holiday travel
      { startMonth: 2, startDay: 15, endMonth: 3, endDay: 15 }, // Spring break
    ];
    
    return travelPeriods.some(period => {
      const isAfterStart = (month > period.startMonth) || (month === period.startMonth && day >= period.startDay);
      const isBeforeEnd = (month < period.endMonth) || (month === period.endMonth && day <= period.endDay);
      return isAfterStart && isBeforeEnd;
    });
  }

  /**
   * Calculate trend adjustment based on recent attendance
   */
  static calculateTrendAdjustment(similarEvents, eventDate) {
    if (similarEvents.length < 2) return 1.0;
    
    // Sort by date and get recent events
    const sortedEvents = similarEvents
      .map(({ attendance }) => ({
        date: new Date(attendance.events?.end_date || attendance.created_at),
        attendance
      }))
      .sort((a, b) => b.date - a.date);
    
    // Calculate trend from last 3 events
    const recentEvents = sortedEvents.slice(0, 3);
    if (recentEvents.length < 2) return 1.0;
    
    // Simple trend calculation
    const firstAttendance = recentEvents[recentEvents.length - 1].attendance;
    const lastAttendance = recentEvents[0].attendance;
    
    if (firstAttendance && lastAttendance) {
      const trend = 1.0; // No change for now, could be enhanced
      return trend;
    }
    
    return 1.0;
  }

  /**
   * Calculate detailed confidence based on data quality
   */
  static calculateDetailedConfidence(similarEvents, patterns, eventTitle, recurringEventName) {
    let score = 0;
    let level = 'Low';
    
    // Score based on number of similar events
    if (similarEvents.length >= 5) score += 30;
    else if (similarEvents.length >= 3) score += 20;
    else if (similarEvents.length >= 1) score += 10;
    
    // Score based on match quality
    const exactMatches = similarEvents.filter(e => e.matchType === 'exact').length;
    const recurringMatches = similarEvents.filter(e => e.matchType === 'recurring').length;
    
    if (exactMatches > 0) score += 40;
    else if (recurringMatches > 0) score += 30;
    else if (similarEvents.length > 0) score += 15;
    
    // Score based on event type data
    if (patterns.eventTypePatterns[eventTitle]) score += 20;
    if (patterns.recurringEventPatterns[recurringEventName]) score += 15;
    
    // Determine confidence level
    if (score >= 80) level = 'High';
    else if (score >= 50) level = 'Medium';
    else level = 'Low';
    
    return { level, score };
  }

  static calculateConfidence(patterns) {
    // Simple confidence calculation based on data availability
    const hasHistoricalData = patterns.weeklyAverage > 0;
    const hasEventTypeData = Object.keys(patterns.eventTypePatterns).length > 0;
    
    if (hasHistoricalData && hasEventTypeData) return 'High';
    if (hasHistoricalData) return 'Medium';
    return 'Low';
  }
}

/**
 * Lightweight AI Integration (Minimal cost)
 */
export class AIInsightsGenerator {
  
  /**
   * Generate human-like summaries from structured data
   */
  static async generateInsightSummary(data, insightType, organizationId, forceRefresh = false) {
    const cacheKey = getCacheKey(`summary_${insightType}`, organizationId);
    
    // Check persistent cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = getCachedData(cacheKey);
      if (cached) {
        console.log(`Using cached insight for ${insightType}`);
        return cached;
      }
    }

    const prompt = this.buildPrompt(data, insightType);
    
    try {
      const response = await fetch('/api/ai/generate-insight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model: AI_CONFIG.OPENAI_MODEL,
          max_tokens: 250
        })
      });

      if (!response.ok) {
        throw new Error('AI service unavailable');
      }

      const result = await response.json();
      const summary = result.choices?.[0]?.message?.content || 'Unable to generate insight';

      // Cache the result persistently
      setCachedData(cacheKey, summary);

      return summary;
    } catch (error) {
      console.error('AI insight generation failed:', error);
      return this.generateFallbackSummary(data, insightType);
    }
  }

  /**
   * Generate action suggestions
   */
  static async generateActionSuggestions(data, insightType, organizationId, forceRefresh = false) {
    const cacheKey = getCacheKey(`action_${insightType}`, organizationId);
    
    // Check persistent cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = getCachedData(cacheKey);
      if (cached) {
        console.log(`Using cached action for ${insightType}`);
        return cached;
      }
    }

    const prompt = this.buildActionPrompt(data, insightType);
    
    try {
      const response = await fetch('/api/ai/generate-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model: AI_CONFIG.OPENAI_MODEL,
          max_tokens: 300
        })
      });

      if (!response.ok) {
        throw new Error('AI service unavailable');
      }

      const result = await response.json();
      const actions = result.choices?.[0]?.message?.content || 'Consider reviewing the data manually';

      // Cache the result persistently
      setCachedData(cacheKey, actions);

      return actions;
    } catch (error) {
      console.error('AI action generation failed:', error);
      return this.generateFallbackAction(data, insightType);
    }
  }

  /**
   * Prompt builders
   */
  static buildPrompt(data, insightType) {
    const basePrompt = "Analyze this church data and provide 2-3 specific, actionable insights that church leaders can implement immediately. Focus on concrete steps and specific strategies based on the actual data:";
    
    switch (insightType) {
      case 'at-risk-members':
        return `${basePrompt}
        
        AT-RISK MEMBERS DATA:
        - ${data.length} members with no activity in 60 days
        - Specific members: ${data.map(m => `${m.firstname} ${m.lastname}`).join(', ')}
        - Last contact dates and activity patterns available
        
        Provide specific outreach strategies and engagement tactics for these exact members.`;
        
      default:
        return `${basePrompt} ${JSON.stringify(data)}`;
    }
  }

  static buildActionPrompt(data, insightType) {
    const basePrompt = "Based on this specific church data, provide 2-3 immediate action steps that church leaders can implement THIS WEEK. Include specific names, numbers, and timeframes when available:";
    
    switch (insightType) {
      case 'at-risk-members':
        return `${basePrompt}
        
        CRITICAL DATA:
        - ${data.length} members inactive for 60+ days
        - Specific members: ${data.map(m => `${m.firstname} ${m.lastname}`).join(', ')}
        - No recent giving, events, or check-ins
        
        Provide specific outreach actions with names, timing, and follow-up steps.`;
        
      default:
        return `${basePrompt} ${JSON.stringify(data)}`;
    }
  }

  /**
   * Fallback methods (when AI is unavailable)
   */
  static generateFallbackSummary(data, insightType) {
    switch (insightType) {
      case 'at-risk-members':
        return `${data.length} members haven't been active recently. Consider reaching out to them.`;
      case 'donation-insights':
        if (!data || !data.insights) {
          return 'No donation data available for analysis.';
        }
        const insights = data.insights;
        const currentWeekText = insights.currentWeek.amount > 0 ? 
          `Last 7 days: $${insights.currentWeek.amount.toLocaleString()} (${insights.currentWeek.trend === 'up' ? '↗' : insights.currentWeek.trend === 'down' ? '↘' : '→'})` : 
          'No giving in last 7 days';
        const currentMonthText = insights.currentMonth.amount > 0 ? 
          `This month: $${insights.currentMonth.amount.toLocaleString()} (projected: $${insights.currentMonth.projected.toLocaleString()})` : 
          'No giving this month';
        
        return `${currentWeekText}. ${currentMonthText}. Total: $${insights.totalAmount.toLocaleString()} from ${insights.totalDonations} donations.`;
      default:
        return 'Data analysis complete. Review the details for insights.';
    }
  }

  static generateFallbackAction(data, insightType) {
    switch (insightType) {
      case 'at-risk-members':
        return '1. Send personalized outreach messages\n2. Schedule follow-up calls\n3. Invite to upcoming events';
      case 'donation-insights':
        if (!data || !data.insights) {
          return '1. Review donation data\n2. Set up giving campaigns\n3. Promote recurring donations';
        }
        const recommendations = data.insights.recommendations;
        if (recommendations && recommendations.length > 0) {
          return recommendations.slice(0, 3).join('\n');
        }
        return '1. Promote recurring donations\n2. Set up stewardship education\n3. Add online giving options';
      default:
        return '1. Review the data\n2. Identify key areas\n3. Develop action plan';
    }
  }
}

/**
 * Main AI Insights Service
 */
export class AIInsightsService {
  
  /**
   * Get comprehensive insights for dashboard
   */
  static async getDashboardInsights(organizationId, forceRefresh = false) {
    try {
      const cacheKey = getCacheKey('dashboard_insights', organizationId);
      
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = getCachedData(cacheKey);
        if (cached) {
          console.log('📊 [AIInsights] Using cached dashboard insights');
          return cached;
        }
      }

      console.log('📊 [AIInsights] Generating fresh dashboard insights');
      
      const [atRisk] = await Promise.all([
        SmartInsightsQueries.getAtRiskMembers(organizationId)
        // SmartInsightsQueries.getPredictiveAttendance(organizationId) // TEMPORARILY DISABLED
        // SmartInsightsQueries.getDonationInsights(organizationId) // TEMPORARILY DISABLED
      ]);

      // Use simple SQL-based summaries instead of AI
      const atRiskSummary = AIInsightsGenerator.generateFallbackSummary(atRisk, 'at-risk-members');
      const atRiskActions = AIInsightsGenerator.generateFallbackAction(atRisk, 'at-risk-members');
      // const donationSummary = AIInsightsGenerator.generateFallbackSummary(donationInsights, 'donation-insights'); // TEMPORARILY DISABLED
      // const donationActions = AIInsightsGenerator.generateFallbackAction(donationInsights, 'donation-insights'); // TEMPORARILY DISABLED

      // Enhance predictions with AI if available - TEMPORARILY DISABLED
      // let enhancedPredictions = predictiveAttendance?.predictions || [];
      // if (predictiveAttendance?.predictions?.length > 0) {
      //   try {
      //     enhancedPredictions = await this.enhancePredictionsWithAI(predictiveAttendance.predictions, organizationId, forceRefresh);
      //   } catch (error) {
      //     console.warn('AI enhancement failed, using base predictions:', error);
      //   }
      // }

      const result = {
        insights: {
          atRisk: {
            data: atRisk,
            summary: atRiskSummary,
            actions: atRiskActions
          },
          // predictiveAttendance: {
          //   data: {
          //     ...predictiveAttendance,
          //     predictions: enhancedPredictions
          //   }
          // }, // TEMPORARILY DISABLED
          // donationInsights: {
          //   data: donationInsights,
          //   summary: donationSummary,
          //   actions: donationActions
          // } // TEMPORARILY DISABLED
        },
        timestamp: new Date().toISOString()
      };

      // Cache the result
      setCachedData(cacheKey, result);
      console.log('📊 [AIInsights] Cached dashboard insights');

      return result;
    } catch (error) {
      console.error('Error generating dashboard insights:', error);
      return {
        insights: {},
        error: 'Unable to generate insights at this time',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get weekly digest for email distribution
   */
  static async getWeeklyDigest(organizationId, forceRefresh = false) {
    try {
      // Gather all insights for the weekly digest
      const insights = await this.getDashboardInsights(organizationId, forceRefresh);
      
      // Create a comprehensive prompt for weekly digest
      const digestData = {
        atRiskMembers: insights.insights?.atRisk?.data || [],
        atRiskSummary: insights.insights?.atRisk?.summary || '',
        atRiskActions: insights.insights?.atRisk?.actions || '',
        attendancePredictions: insights.insights?.predictiveAttendance?.data?.predictions || [],
        donationInsights: insights.insights?.donationInsights?.data || null,
        donationSummary: insights.insights?.donationInsights?.summary || '',
        donationActions: insights.insights?.donationInsights?.actions || '',
        timestamp: insights.timestamp
      };

      const cacheKey = getCacheKey('weekly_digest', organizationId);
      
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = getCachedData(cacheKey);
        if (cached) {
          console.log('Using cached weekly digest');
          return cached;
        }
      }

      // Generate weekly digest using AI
      const response = await fetch('/api/ai/generate-digest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Create a comprehensive weekly church digest based on this REAL data:

AT-RISK MEMBERS DATA:
${digestData.atRiskMembers.map(member => `
- ${member.firstname} ${member.lastname} (${member.email || 'No email'})
  Last Activity: ${new Date(member.created_at).toLocaleDateString()}
  Status: ${member.status}
  Member Type: ${member.member_type}
`).join('\n')}

TOTAL AT-RISK MEMBERS: ${digestData.atRiskMembers.length}

ATTENDANCE PREDICTIONS:
${digestData.attendancePredictions.map(prediction => `
- ${prediction.eventTitle} (${prediction.eventType})
  Date: ${new Date(prediction.eventDate).toLocaleDateString()}
  Predicted Attendance: ${prediction.predictedAttendance} people
  Confidence: ${prediction.confidence}
  Factors: ${prediction.factors?.comprehensiveFactors?.join(', ') || 'Standard factors'}
`).join('\n')}

TOTAL UPCOMING EVENTS: ${digestData.attendancePredictions.length}

DONATION INSIGHTS:
${digestData.donationInsights ? `
Last 7 Days: $${digestData.donationInsights.insights?.currentWeek?.amount?.toLocaleString() || '0'} (${digestData.donationInsights.insights?.currentWeek?.trend || 'no-data'} trend)
Current Month: $${digestData.donationInsights.insights?.currentMonth?.amount?.toLocaleString() || '0'} (projected: $${digestData.donationInsights.insights?.currentMonth?.projected?.toLocaleString() || '0'})

Predictions:
- Next Week: $${digestData.donationInsights.insights?.predictions?.nextWeek?.toLocaleString() || '0'} (${digestData.donationInsights.insights?.predictions?.confidence || 'low'} confidence)
- Next Month: $${digestData.donationInsights.insights?.predictions?.nextMonth?.toLocaleString() || '0'}

Total Giving: $${digestData.donationInsights.insights?.totalAmount?.toLocaleString() || '0'}
Total Donations: ${digestData.donationInsights.insights?.totalDonations || '0'}
Average Donation: $${digestData.donationInsights.insights?.averageDonation?.toFixed(2) || '0.00'}
Recurring Donations: ${digestData.donationInsights.insights?.recurringDonations || '0'}

Top Donors:
${digestData.donationInsights.insights?.topDonors?.map(donor => `
- ${donor.name}: $${donor.total.toLocaleString()}`).join('\n') || 'No donor data available'}

Recommendations:
${digestData.donationInsights.insights?.recommendations?.join('\n') || 'No specific recommendations available'}
` : 'No donation data available'}

Please provide a compelling weekly digest that includes:

Weekly Church Digest

Dear Church Leadership Team,

Summary of Current State:
[Provide a warm, encouraging summary based on the ACTUAL data above. Include at-risk members, attendance predictions, and giving insights]

Areas Needing Attention:
[Detail specific concerns using the ACTUAL member names and data provided above. Be specific about each at-risk member's situation]

Attendance Outlook:
[Provide insights about upcoming events and attendance predictions. Highlight any concerning trends or positive indicators]

Giving Insights:
[Provide insights about donation patterns, top donors, and recommendations for improving giving]

Recommended Actions:
• [Specific action for each at-risk member by name]
• [Timeline and responsible parties for each action]
• [Actions to improve attendance if needed]
• [Actions to improve giving based on donation insights]
• [Additional actions as needed]

Positive Insights:
[End with encouraging, positive insights that motivate leadership and emphasize the church's strengths]

IMPORTANT: Use ONLY the real data provided above. Do not make up names or details. If no at-risk members, acknowledge that as a positive sign.

Format the response with proper HTML tags for nice formatting:
- Use <h2> for main sections
- Use <h3> for subsections  
- Use <p> for paragraphs
- Use <ul> and <li> for lists
- Use <strong> for emphasis
- Add proper spacing and structure`,
          model: AI_CONFIG.OPENAI_MODEL,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error('AI service unavailable');
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content || 'Unable to generate weekly digest';

      const digestResult = {
        content,
        timestamp: new Date().toISOString(),
        insights: digestData
      };

      // Cache the result
      setCachedData(cacheKey, digestResult);

      return digestResult;
    } catch (error) {
      console.error('Error generating weekly digest:', error);
      return {
        content: 'Weekly digest generation failed. Please try again later.',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Enhance attendance predictions with AI analysis
   */
  static async enhancePredictionsWithAI(predictions, organizationId, forceRefresh = false) {
    const cacheKey = getCacheKey('enhanced_predictions', organizationId);
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = getCachedData(cacheKey);
      if (cached) {
        console.log('Using cached enhanced predictions');
        return cached;
      }
    }

    try {
      const response = await fetch('/api/ai/generate-prediction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Analyze these church attendance predictions and provide enhanced insights:

PREDICTIONS DATA:
${predictions.map(p => `
Event: ${p.eventTitle}
Type: ${p.eventType}
Date: ${p.eventDate}
Current Prediction: ${p.predictedAttendance} people
Confidence: ${p.confidence}
Factors: ${JSON.stringify(p.factors)}
`).join('\n')}

Please provide enhanced predictions in this EXACT JSON format:
{
  "predictions": [
    {
      "eventTitle": "Sunday Morning Worship Service",
      "enhancedAttendance": 25,
      "enhancedConfidence": "High",
      "insights": ["Reasoning for the prediction"],
      "factors": ["Key factors affecting attendance"]
    }
  ]
}

CRITICAL: Return ONLY the JSON object above. No explanations, no markdown, no extra text. Just the JSON.`,
          model: AI_CONFIG.OPENAI_MODEL,
          max_tokens: 800
        })
      });

      if (!response.ok) {
        throw new Error('AI service unavailable');
      }

      const result = await response.json();
      const aiAnalysis = result.choices?.[0]?.message?.content || '';

      // Parse AI response and enhance predictions
      const enhancedPredictions = this.parseAIEnhancement(predictions, aiAnalysis);

      // Cache the enhanced predictions
      setCachedData(cacheKey, enhancedPredictions);

      return enhancedPredictions;
    } catch (error) {
      console.error('AI prediction enhancement failed:', error);
      return predictions; // Return original predictions if AI fails
    }
  }

  /**
   * Parse AI enhancement and apply to predictions
   */
  static parseAIEnhancement(predictions, aiAnalysis) {
    try {
      // Clean the AI response - remove any non-JSON text
      let cleanedResponse = aiAnalysis.trim();
      
      // Try to extract JSON if there's extra text
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedResponse = jsonMatch[0];
      }
      
      // Try to parse JSON from AI response
      const aiData = JSON.parse(cleanedResponse);
      
      // Apply AI enhancements to predictions
      return predictions.map(prediction => {
        const aiPrediction = aiData.predictions?.find(p => p.eventTitle === prediction.eventTitle);
        
        if (aiPrediction) {
          return {
            ...prediction,
            predictedAttendance: aiPrediction.enhancedAttendance || prediction.predictedAttendance,
            confidence: aiPrediction.enhancedConfidence || prediction.confidence,
            aiInsights: aiPrediction.insights || [],
            aiFactors: aiPrediction.factors || prediction.factors
          };
        }
        
        return prediction;
      });
    } catch (error) {
      console.warn('Failed to parse AI enhancement, using original predictions');
      console.debug('AI Response:', aiAnalysis);
      return predictions;
    }
  }

  /**
   * Clear all AI insights cache from localStorage
   */
  static clearCache() {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      cacheKeys.forEach(key => localStorage.removeItem(key));
      console.log(`AI insights cache cleared: ${cacheKeys.length} entries removed`);
    } catch (error) {
      console.warn('Error clearing cache:', error);
    }
  }

  /**
   * Get cache statistics from localStorage
   */
  static getCacheStats() {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      const cacheData = cacheKeys.map(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          return {
            key,
            timestamp: data.timestamp,
            age: Date.now() - data.timestamp
          };
        } catch {
          return { key, timestamp: 0, age: 0 };
        }
      });
      
    return {
        totalEntries: cacheKeys.length,
        entries: cacheData,
        totalSize: cacheKeys.reduce((size, key) => size + (localStorage.getItem(key)?.length || 0), 0)
    };
    } catch (error) {
      console.warn('Error getting cache stats:', error);
      return { totalEntries: 0, entries: [], totalSize: 0 };
    }
  }
}

export default AIInsightsService;
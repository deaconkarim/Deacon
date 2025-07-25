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

// Cache for storing insights to reduce API calls
const insightsCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Cache structure: { data, timestamp }
const getCacheKey = (type, organizationId) => `${type}_${organizationId}`;

const isCacheValid = (timestamp) => {
  return Date.now() - timestamp < CACHE_DURATION;
};

/**
 * Smart SQL Queries for Pattern Detection (Free - No AI cost)
 */
export class SmartInsightsQueries {
  
  /**
   * Detect at-risk members (no check-in + no giving + no events in 60 days)
   */
  static async getAtRiskMembers(organizationId) {
    if (!organizationId) {
      console.warn('Organization ID is undefined, skipping at-risk members query');
      return [];
    }

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
        status
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching at-risk members:', error);
      return [];
    }

    // Further filter by giving and event attendance
    const atRiskMembers = [];
    for (const member of data) {
      const hasRecentGiving = await this.checkRecentGiving(member.id, sixtyDaysAgo);
      const hasRecentEvents = await this.checkRecentEvents(member.id, sixtyDaysAgo);
      
      if (!hasRecentGiving && !hasRecentEvents) {
        atRiskMembers.push(member);
      }
    }

    return atRiskMembers;
  }

  /**
   * Detect volunteer burnout (high event count per month)
   */
  static async getVolunteerBurnout(organizationId) {
    if (!organizationId) {
      console.warn('Organization ID is undefined, skipping volunteer burnout query');
      return [];
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data, error } = await supabase
      .from('event_attendance')
      .select(`
        member_id,
        members!inner(
          id,
          firstname,
          lastname,
          organization_id
        ),
        events!inner(
          id,
          title,
          start_date
        )
      `)
      .eq('members.organization_id', organizationId)
      .gte('events.start_date', thirtyDaysAgo.toISOString());

    if (error) {
      console.error('Error fetching volunteer data:', error);
      return [];
    }

    // Group by member and count events
    const volunteerStats = {};
    data.forEach(record => {
      const memberId = record.member_id;
      if (!volunteerStats[memberId]) {
        volunteerStats[memberId] = {
          member: record.members,
          eventCount: 0,
          events: []
        };
      }
      volunteerStats[memberId].eventCount++;
      volunteerStats[memberId].events.push(record.events);
    });

    // Return volunteers with 5+ events in 30 days (potential burnout)
    return Object.values(volunteerStats).filter(vol => vol.eventCount >= 5);
  }

  /**
   * Detect giving trends and anomalies
   */
  static async getGivingInsights(organizationId) {
    if (!organizationId) {
      console.warn('Organization ID is undefined, skipping giving insights query');
      return null;
    }

    const { data, error } = await supabase
      .from('donations')
      .select(`
        id,
        amount,
        created_at,
        payment_method,
        donor_id
      `)
      .eq('organization_id', organizationId)
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching giving data:', error);
      return null;
    }

    // Calculate insights
    const totalAmount = data.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
    const avgAmount = data.length > 0 ? totalAmount / data.length : 0;
    const trend = this.calculateTrend(data);
    
    return {
      totalAmount,
      avgAmount,
      donationCount: data.length,
      trend,
      recentDonations: data.slice(0, 10)
    };
  }

  /**
   * Detect visitor retention patterns
   */
  static async getVisitorRetention(organizationId) {
    if (!organizationId) {
      console.warn('Organization ID is undefined, skipping visitor retention query');
      return null;
    }

    const { data, error } = await supabase
      .from('members')
      .select(`
        id,
        firstname,
        lastname,
        created_at,
        status
      `)
      .eq('organization_id', organizationId)
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      console.error('Error fetching visitor data:', error);
      return null;
    }

    const visitors = data.filter(member => {
      const memberDate = new Date(member.created_at);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return memberDate >= thirtyDaysAgo;
    });

    // Check if visitors have recent activity (attendance or giving)
    const returnedVisitors = [];
    for (const visitor of visitors) {
      const hasRecentActivity = await this.checkRecentActivity(visitor.id);
      if (hasRecentActivity) {
        returnedVisitors.push(visitor);
      }
    }

    return {
      newVisitors: visitors.length,
      returnedVisitors: returnedVisitors.length,
      retentionRate: visitors.length > 0 ? (returnedVisitors.length / visitors.length) * 100 : 0,
      visitors: visitors,
      returnedVisitors: returnedVisitors
    };
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

  static async checkRecentActivity(memberId) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [givingData, eventsData] = await Promise.all([
      supabase
        .from('donations')
        .select('id')
        .eq('donor_id', memberId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .limit(1),
      supabase
        .from('event_attendance')
        .select('id')
        .eq('member_id', memberId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .limit(1)
    ]);

    return (givingData.data && givingData.data.length > 0) || 
           (eventsData.data && eventsData.data.length > 0);
  }

  static calculateTrend(data) {
    if (data.length < 2) return 'stable';
    
    const sortedData = data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const firstHalf = sortedData.slice(0, Math.floor(sortedData.length / 2));
    const secondHalf = sortedData.slice(Math.floor(sortedData.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0) / secondHalf.length;
    
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
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
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = insightsCache.get(cacheKey);
      if (cached && isCacheValid(cached.timestamp)) {
        return cached.data;
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
          max_tokens: 200
        })
      });

      if (!response.ok) {
        throw new Error('AI service unavailable');
      }

      const result = await response.json();
      const summary = result.choices?.[0]?.message?.content || 'Unable to generate insight';

      // Cache the result
      insightsCache.set(cacheKey, {
        data: summary,
        timestamp: Date.now()
      });

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
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = insightsCache.get(cacheKey);
      if (cached && isCacheValid(cached.timestamp)) {
        return cached.data;
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
          max_tokens: 250
        })
      });

      if (!response.ok) {
        throw new Error('AI service unavailable');
      }

      const result = await response.json();
      const actions = result.choices?.[0]?.message?.content || 'Consider reviewing the data manually';

      // Cache the result
      insightsCache.set(cacheKey, {
        data: actions,
        timestamp: Date.now()
      });

      return actions;
    } catch (error) {
      console.error('AI action generation failed:', error);
      return this.generateFallbackAction(data, insightType);
    }
  }

  /**
   * Generate weekly digest content
   */
  static async generateWeeklyDigest(organizationId, forceRefresh = false) {
    const cacheKey = getCacheKey('weekly_digest', organizationId);
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = insightsCache.get(cacheKey);
      if (cached && isCacheValid(cached.timestamp)) {
        return cached.data;
      }
    }

    const insights = await this.gatherWeeklyInsights(organizationId);
    
    // Build a prompt from the insights object
    const prompt = `Create a weekly church digest based on these insights:
    
• ${insights.atRiskCount} members may need outreach
• ${insights.volunteerBurnoutCount} volunteers at risk of burnout
• Monthly giving: $${insights.monthlyGiving}
• Visitor retention: ${insights.visitorRetentionRate.toFixed(1)}%
• ${insights.newVisitors} new visitors this week

Please provide a concise, encouraging summary of the week's key developments and trends.`;

    try {
      const response = await fetch('/api/ai/generate-digest', {
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
      const digest = result.choices?.[0]?.message?.content || 'Weekly digest unavailable';

      // Cache the result
      insightsCache.set(cacheKey, {
        data: digest,
        timestamp: Date.now()
      });

      return digest;
    } catch (error) {
      console.error('AI digest generation failed:', error);
      return this.generateFallbackDigest(insights);
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
        
      case 'volunteer-burnout':
        return `${basePrompt}
        
        VOLUNTEER BURNOUT DATA:
        - ${data.length} volunteers with 5+ events in 30 days
        - High-activity volunteers: ${data.map(v => `${v.member.firstname} ${v.member.lastname} (${v.eventCount} events)`).join(', ')}
        - Event frequency and volunteer load patterns
        
        Provide specific support strategies and rotation plans for these exact volunteers.`;
        
      case 'giving-trends':
        return `${basePrompt}
        
        GIVING TRENDS DATA:
        - Monthly total: $${data.totalAmount}
        - Average donation: $${data.avgAmount}
        - Trend direction: ${data.trend}
        - Recent donation count: ${data.recentDonations.length}
        - Donation patterns and frequency data
        
        Provide specific stewardship strategies and giving initiatives based on these exact numbers.`;
        
      case 'visitor-retention':
        return `${basePrompt}
        
        VISITOR RETENTION DATA:
        - New visitors this period: ${data.newVisitors}
        - Visitors who returned: ${data.returnedVisitors}
        - Retention rate: ${data.retentionRate.toFixed(1)}%
        - Gap: ${data.newVisitors - data.returnedVisitors} visitors didn't return
        
        Provide specific follow-up strategies and engagement tactics to improve this exact retention rate.`;
        
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
        
      case 'volunteer-burnout':
        return `${basePrompt}
        
        CRITICAL DATA:
        - ${data.length} volunteers at burnout risk
        - High-activity volunteers: ${data.map(v => `${v.member.firstname} ${v.member.lastname} (${v.eventCount} events)`).join(', ')}
        - 5+ events in 30 days per volunteer
        
        Provide specific support actions with names, rotation plans, and recognition strategies.`;
        
      case 'giving-trends':
        return `${basePrompt}
        
        CRITICAL DATA:
        - Monthly giving: $${data.totalAmount}
        - Average donation: $${data.avgAmount}
        - Trend: ${data.trend}
        - Recent donations: ${data.recentDonations.length}
        
        Provide specific stewardship actions with dollar amounts, campaigns, and donor engagement strategies.`;
        
      case 'visitor-retention':
        return `${basePrompt}
        
        CRITICAL DATA:
        - Retention rate: ${data.retentionRate.toFixed(1)}%
        - New visitors: ${data.newVisitors}
        - Returned visitors: ${data.returnedVisitors}
        - Gap: ${data.newVisitors - data.returnedVisitors} lost visitors
        
        Provide specific follow-up actions with visitor names, contact strategies, and engagement plans.`;
        
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
      case 'volunteer-burnout':
        return `${data.length} volunteers may be experiencing burnout. Consider rotating responsibilities.`;
      case 'giving-trends':
        return `Monthly giving is $${data.avgAmount}. The trend is ${data.trend}.`;
      case 'visitor-retention':
        return `Visitor retention rate is ${data.retentionRate.toFixed(1)}%. ${data.newVisitors - data.returnedVisitors} visitors didn't return.`;
      default:
        return 'Data analysis complete. Review the details for insights.';
    }
  }

  static generateFallbackAction(data, insightType) {
    switch (insightType) {
      case 'at-risk-members':
        return '1. Send personalized outreach messages\n2. Schedule follow-up calls\n3. Invite to upcoming events';
      case 'volunteer-burnout':
        return '1. Rotate volunteer responsibilities\n2. Provide additional support\n3. Recognize their service';
      case 'giving-trends':
        return '1. Share giving impact stories\n2. Offer giving challenges\n3. Provide giving education';
      case 'visitor-retention':
        return '1. Improve follow-up process\n2. Create visitor welcome events\n3. Assign visitor buddies';
      default:
        return '1. Review the data\n2. Identify key areas\n3. Develop action plan';
    }
  }

  static async gatherWeeklyInsights(organizationId) {
    const [atRisk, volunteers, giving, visitors] = await Promise.all([
      SmartInsightsQueries.getAtRiskMembers(organizationId),
      SmartInsightsQueries.getVolunteerBurnout(organizationId),
      SmartInsightsQueries.getGivingInsights(organizationId),
      SmartInsightsQueries.getVisitorRetention(organizationId)
    ]);

    return {
      atRiskCount: atRisk.length,
      volunteerBurnoutCount: volunteers.length,
      monthlyGiving: giving?.avgAmount || 0,
      visitorRetentionRate: visitors?.retentionRate || 0,
      newVisitors: visitors?.newVisitors || 0
    };
  }

  static generateFallbackDigest(insights) {
    return `Weekly Church Insights:
    
    • ${insights.atRiskCount} members may need outreach
    • ${insights.volunteerBurnoutCount} volunteers at risk of burnout
    • Monthly giving: $${insights.monthlyGiving}
    • Visitor retention: ${insights.visitorRetentionRate.toFixed(1)}%
    • ${insights.newVisitors} new visitors this week
    
    Consider reviewing these areas and taking action where needed.`;
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
      const [atRisk, volunteers, giving, visitors] = await Promise.all([
        SmartInsightsQueries.getAtRiskMembers(organizationId),
        SmartInsightsQueries.getVolunteerBurnout(organizationId),
        SmartInsightsQueries.getGivingInsights(organizationId),
        SmartInsightsQueries.getVisitorRetention(organizationId)
      ]);

      // Generate AI summaries for each insight type
      const [atRiskSummary, volunteerSummary, givingSummary, visitorSummary] = await Promise.all([
        AIInsightsGenerator.generateInsightSummary(atRisk, 'at-risk-members', organizationId, forceRefresh),
        AIInsightsGenerator.generateInsightSummary(volunteers, 'volunteer-burnout', organizationId, forceRefresh),
        AIInsightsGenerator.generateInsightSummary(giving, 'giving-trends', organizationId, forceRefresh),
        AIInsightsGenerator.generateInsightSummary(visitors, 'visitor-retention', organizationId, forceRefresh)
      ]);

      // Generate action suggestions
      const [atRiskActions, volunteerActions, givingActions, visitorActions] = await Promise.all([
        AIInsightsGenerator.generateActionSuggestions(atRisk, 'at-risk-members', organizationId, forceRefresh),
        AIInsightsGenerator.generateActionSuggestions(volunteers, 'volunteer-burnout', organizationId, forceRefresh),
        AIInsightsGenerator.generateActionSuggestions(giving, 'giving-trends', organizationId, forceRefresh),
        AIInsightsGenerator.generateActionSuggestions(visitors, 'visitor-retention', organizationId, forceRefresh)
      ]);

      return {
        insights: {
          atRisk: {
            data: atRisk,
            summary: atRiskSummary,
            actions: atRiskActions
          },
          volunteers: {
            data: volunteers,
            summary: volunteerSummary,
            actions: volunteerActions
          },
          giving: {
            data: giving,
            summary: givingSummary,
            actions: givingActions
          },
          visitors: {
            data: visitors,
            summary: visitorSummary,
            actions: visitorActions
          }
        },
        timestamp: new Date().toISOString()
      };
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
   * Get weekly digest
   */
  static async getWeeklyDigest(organizationId, forceRefresh = false) {
    try {
      const digest = await AIInsightsGenerator.generateWeeklyDigest(organizationId, forceRefresh);
      return {
        content: digest,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating weekly digest:', error);
      return {
        content: 'Weekly digest unavailable',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Clear cache
   */
  static clearCache() {
    insightsCache.clear();
    console.log('AI insights cache cleared');
  }

  /**
   * Get cache statistics
   */
  static getCacheStats() {
    return {
      size: insightsCache.size,
      keys: Array.from(insightsCache.keys())
    };
  }
}

export default AIInsightsService;
import { supabase } from './supabaseClient';

// Configuration for AI services
const AI_CONFIG = {
  // Use GPT-3.5 for most tasks (cheaper)
  OPENAI_MODEL: 'gpt-3.5-turbo',
  // Use GPT-4o only for complex reasoning
  OPENAI_MODEL_COMPLEX: 'gpt-4o-mini',
  // Batch processing to reduce API calls
  BATCH_SIZE: 10,
  // Cache insights for 24 hours
  CACHE_DURATION: 24 * 60 * 60 * 1000,
};

// Cache for storing insights to reduce API calls
const insightsCache = new Map();

/**
 * Smart SQL Queries for Pattern Detection (Free - No AI cost)
 */
export class SmartInsightsQueries {
  
  /**
   * Detect at-risk members (no check-in + no giving + no events in 60 days)
   */
  static async getAtRiskMembers(organizationId) {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    const { data, error } = await supabase
      .from('members')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        created_at,
        last_check_in,
        families!inner(organization_id)
      `)
      .eq('families.organization_id', organizationId)
      .lt('last_check_in', sixtyDaysAgo.toISOString())
      .or('last_check_in.is.null');

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
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data, error } = await supabase
      .from('event_attendance')
      .select(`
        member_id,
        members!inner(
          id,
          first_name,
          last_name,
          families!inner(organization_id)
        ),
        events!inner(
          id,
          title,
          start_time,
          is_volunteer_event
        )
      `)
      .eq('families.organization_id', organizationId)
      .eq('events.is_volunteer_event', true)
      .gte('events.start_time', thirtyDaysAgo.toISOString());

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
    const { data, error } = await supabase
      .from('donations')
      .select(`
        id,
        amount,
        created_at,
        payment_method,
        families!inner(organization_id)
      `)
      .eq('families.organization_id', organizationId)
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching giving data:', error);
      return null;
    }

    // Calculate insights
    const totalAmount = data.reduce((sum, donation) => sum + donation.amount, 0);
    const averageAmount = data.length > 0 ? totalAmount / data.length : 0;
    const monthlyGiving = data.filter(d => {
      const donationDate = new Date(d.created_at);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return donationDate >= thirtyDaysAgo;
    }).reduce((sum, donation) => sum + donation.amount, 0);

    // Detect unusual patterns
    const amounts = data.map(d => d.amount);
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    const unusualDonations = data.filter(d => Math.abs(d.amount - mean) > 2 * stdDev);

    return {
      totalAmount,
      averageAmount,
      monthlyGiving,
      donationCount: data.length,
      unusualDonations,
      trend: this.calculateTrend(data)
    };
  }

  /**
   * Detect visitor retention patterns
   */
  static async getVisitorRetention(organizationId) {
    const { data, error } = await supabase
      .from('members')
      .select(`
        id,
        first_name,
        last_name,
        created_at,
        last_check_in,
        families!inner(organization_id)
      `)
      .eq('families.organization_id', organizationId)
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

    const returnedVisitors = visitors.filter(visitor => {
      if (!visitor.last_check_in) return false;
      const checkInDate = new Date(visitor.last_check_in);
      const createdDate = new Date(visitor.created_at);
      return checkInDate > createdDate;
    });

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
      .eq('member_id', memberId)
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

  static calculateTrend(data) {
    if (data.length < 2) return 'stable';
    
    const sortedData = data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const firstHalf = sortedData.slice(0, Math.floor(sortedData.length / 2));
    const secondHalf = sortedData.slice(Math.floor(sortedData.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, d) => sum + d.amount, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.amount, 0) / secondHalf.length;
    
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
  static async generateInsightSummary(data, insightType) {
    const cacheKey = `summary_${insightType}_${JSON.stringify(data)}`;
    
    // Check cache first
    if (insightsCache.has(cacheKey)) {
      const cached = insightsCache.get(cacheKey);
      if (Date.now() - cached.timestamp < AI_CONFIG.CACHE_DURATION) {
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
          max_tokens: 150
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
  static async generateActionSuggestions(data, insightType) {
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
          max_tokens: 200
        })
      });

      if (!response.ok) {
        throw new Error('AI service unavailable');
      }

      const result = await response.json();
      return result.choices?.[0]?.message?.content || 'Consider reviewing the data manually';
    } catch (error) {
      console.error('AI action generation failed:', error);
      return this.generateFallbackAction(data, insightType);
    }
  }

  /**
   * Generate weekly digest content
   */
  static async generateWeeklyDigest(organizationId) {
    const insights = await this.gatherWeeklyInsights(organizationId);
    
    try {
      const response = await fetch('/api/ai/generate-digest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          insights,
          model: AI_CONFIG.OPENAI_MODEL,
          max_tokens: 300
        })
      });

      if (!response.ok) {
        throw new Error('AI service unavailable');
      }

      const result = await response.json();
      return result.choices?.[0]?.message?.content || 'Weekly digest unavailable';
    } catch (error) {
      console.error('AI digest generation failed:', error);
      return this.generateFallbackDigest(insights);
    }
  }

  /**
   * Prompt builders
   */
  static buildPrompt(data, insightType) {
    const basePrompt = "You are a church insights assistant. Generate 2-3 short, actionable insights from this data:";
    
    switch (insightType) {
      case 'at-risk-members':
        return `${basePrompt}
        At-risk members (no activity in 60 days): ${data.length} members
        Names: ${data.map(m => `${m.first_name} ${m.last_name}`).join(', ')}
        
        Generate insights about member engagement and retention.`;
        
      case 'volunteer-burnout':
        return `${basePrompt}
        Volunteer burnout risk: ${data.length} volunteers with 5+ events in 30 days
        Events per volunteer: ${data.map(v => `${v.member.first_name} ${v.member.last_name}: ${v.eventCount} events`).join(', ')}
        
        Generate insights about volunteer management and support.`;
        
      case 'giving-trends':
        return `${basePrompt}
        Giving insights:
        - Total: $${data.totalAmount}
        - Average: $${data.averageAmount}
        - Monthly: $${data.monthlyGiving}
        - Trend: ${data.trend}
        - Unusual donations: ${data.unusualDonations.length}
        
        Generate insights about giving patterns and stewardship.`;
        
      case 'visitor-retention':
        return `${basePrompt}
        Visitor retention:
        - New visitors: ${data.newVisitors}
        - Returned: ${data.returnedVisitors}
        - Retention rate: ${data.retentionRate.toFixed(1)}%
        
        Generate insights about visitor engagement and follow-up.`;
        
      default:
        return `${basePrompt} ${JSON.stringify(data)}`;
    }
  }

  static buildActionPrompt(data, insightType) {
    const basePrompt = "Based on this church data, suggest 2-3 specific, actionable steps the leadership should take:";
    
    switch (insightType) {
      case 'at-risk-members':
        return `${basePrompt}
        ${data.length} members haven't been active in 60 days.
        Suggest specific outreach strategies and follow-up actions.`;
        
      case 'volunteer-burnout':
        return `${basePrompt}
        ${data.length} volunteers are at risk of burnout (5+ events in 30 days).
        Suggest ways to support and retain these volunteers.`;
        
      case 'giving-trends':
        return `${basePrompt}
        Giving trend: ${data.trend}
        Monthly giving: $${data.monthlyGiving}
        Suggest stewardship and giving initiatives.`;
        
      case 'visitor-retention':
        return `${basePrompt}
        Visitor retention rate: ${data.retentionRate.toFixed(1)}%
        ${data.newVisitors - data.returnedVisitors} visitors didn't return.
        Suggest visitor follow-up and engagement strategies.`;
        
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
        return `Monthly giving is $${data.monthlyGiving}. The trend is ${data.trend}.`;
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
      monthlyGiving: giving?.monthlyGiving || 0,
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
  static async getDashboardInsights(organizationId) {
    try {
      const [atRisk, volunteers, giving, visitors] = await Promise.all([
        SmartInsightsQueries.getAtRiskMembers(organizationId),
        SmartInsightsQueries.getVolunteerBurnout(organizationId),
        SmartInsightsQueries.getGivingInsights(organizationId),
        SmartInsightsQueries.getVisitorRetention(organizationId)
      ]);

      // Generate AI summaries for each insight type
      const [atRiskSummary, volunteerSummary, givingSummary, visitorSummary] = await Promise.all([
        AIInsightsGenerator.generateInsightSummary(atRisk, 'at-risk-members'),
        AIInsightsGenerator.generateInsightSummary(volunteers, 'volunteer-burnout'),
        AIInsightsGenerator.generateInsightSummary(giving, 'giving-trends'),
        AIInsightsGenerator.generateInsightSummary(visitors, 'visitor-retention')
      ]);

      // Generate action suggestions
      const [atRiskActions, volunteerActions, givingActions, visitorActions] = await Promise.all([
        AIInsightsGenerator.generateActionSuggestions(atRisk, 'at-risk-members'),
        AIInsightsGenerator.generateActionSuggestions(volunteers, 'volunteer-burnout'),
        AIInsightsGenerator.generateActionSuggestions(giving, 'giving-trends'),
        AIInsightsGenerator.generateActionSuggestions(visitors, 'visitor-retention')
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
  static async getWeeklyDigest(organizationId) {
    try {
      const digest = await AIInsightsGenerator.generateWeeklyDigest(organizationId);
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
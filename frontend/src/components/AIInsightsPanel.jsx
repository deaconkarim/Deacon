import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  TrendingUp, 
  Users, 
  Heart, 
  DollarSign, 
  AlertCircle, 
  CheckCircle, 
  Lightbulb,
  RefreshCw,
  Sparkles,
  Clock,
  Target,
  ArrowRight,
  MessageSquare,
  Calendar,
  UserCheck,
  UserX
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import AIInsightsService from '@/lib/aiInsightsService';

const InsightCard = ({ title, summary, actions, icon: Icon, color, count, loading, isCached = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Helper function to format AI text into readable sections
  const formatAIText = (text) => {
    if (!text) return [];
    
    // Simple split by newlines and filter out empty lines
    return text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => ({ type: 'text', content: line }));
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  const formattedSummary = formatAIText(summary);
  const formattedActions = formatAIText(actions);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`h-full border-l-4 ${color} hover:shadow-md transition-shadow`}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${color.replace('border-', 'bg-').replace('-500', '-100')}`}>
                <Icon className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-gray-800">{title}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  {count !== undefined && (
                    <Badge variant="secondary" className="text-xs">
                      {count} {count === 1 ? 'item' : 'items'}
                    </Badge>
                  )}
                  {isCached && (
                    <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">
                      <Clock className="h-3 w-3 mr-1" />
                      Cached
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              <ArrowRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Summary Section */}
          <div className="space-y-3">
            {formattedSummary.map((section, index) => (
              <div key={index} className="text-sm text-gray-600 leading-relaxed">
                {section.content}
              </div>
            ))}
          </div>
          
          {/* Actions Section */}
          {isExpanded && actions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-4 border-t border-gray-200"
            >
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-gray-800">Suggested Actions</span>
              </div>
              <div className="space-y-3">
                {formattedActions.map((section, index) => (
                  <div key={index} className="text-sm text-gray-600 leading-relaxed">
                    {section.content}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const WeeklyDigestCard = ({ digest, loading, onRefresh, isCached = false }) => {
  // Helper function to format digest text
  const formatDigestText = (text) => {
    if (!text) return [];
    
    // Simple split by newlines and filter out empty lines
    return text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => ({ type: 'text', content: line }));
  };

  if (loading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-5 w-32" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  const formattedDigest = formatDigestText(digest);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="col-span-full"
    >
      <Card className="border-l-4 border-blue-500">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100">
                <Sparkles className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-800">Weekly AI Digest</CardTitle>
                <div className="flex items-center gap-2">
                  <CardDescription className="text-gray-600">AI-powered insights for your ministry</CardDescription>
                  {isCached && (
                    <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">
                      <Clock className="h-3 w-3 mr-1" />
                      Cached
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRefresh(true)}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {formattedDigest.map((section, index) => (
              <div key={index} className="text-sm text-gray-600 leading-relaxed">
                {section.content}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export function AIInsightsPanel({ organizationId }) {
  const [insights, setInsights] = useState(null);
  const [weeklyDigest, setWeeklyDigest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [digestLoading, setDigestLoading] = useState(false);
  const [cacheStatus, setCacheStatus] = useState({});
  const { toast } = useToast();

  const loadInsights = async (forceRefresh = false) => {
    try {
      setLoading(true);
      // Clear cache if force refresh
      if (forceRefresh) {
        AIInsightsService.clearCache();
        setCacheStatus({});
      }
      
      // Check cache status before loading
      const cacheStats = AIInsightsService.getCacheStats();
      const newCacheStatus = {};
      
      // Check if each insight type is cached
      const insightTypes = ['summary_at-risk-members', 'summary_volunteer-burnout', 'summary_giving-trends', 'summary_visitor-retention'];
      insightTypes.forEach(type => {
        const cacheKey = `ai_insights_${type}_${organizationId}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
              newCacheStatus[type.replace('summary_', '')] = true;
            }
          } catch (e) {
            // Invalid cache entry
          }
        }
      });
      
      setCacheStatus(newCacheStatus);
      
      const result = await AIInsightsService.getDashboardInsights(organizationId, forceRefresh);
      setInsights(result);
    } catch (error) {
      console.error('Error loading insights:', error);
      toast({
        title: "Error",
        description: "Failed to load AI insights. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadWeeklyDigest = async (forceRefresh = false) => {
    try {
      setDigestLoading(true);
      // Clear cache if force refresh
      if (forceRefresh) {
        AIInsightsService.clearCache();
      }
      
      // Check if weekly digest is cached
      const cacheKey = `ai_insights_weekly_digest_${organizationId}`;
      const cached = localStorage.getItem(cacheKey);
      const isCached = cached && (() => {
        try {
          const parsed = JSON.parse(cached);
          return Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000;
        } catch (e) {
          return false;
        }
      })();
      
      setCacheStatus(prev => ({ ...prev, weeklyDigest: isCached }));
      
      const result = await AIInsightsService.getWeeklyDigest(organizationId, forceRefresh);
      setWeeklyDigest(result);
    } catch (error) {
      console.error('Error loading weekly digest:', error);
      toast({
        title: "Error",
        description: "Failed to load weekly digest. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDigestLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      loadInsights();
      loadWeeklyDigest();
    }
  }, [organizationId]);

  const insightCards = [
    {
      key: 'atRisk',
      title: 'At-Risk Members',
      icon: UserX,
      color: 'border-red-500',
      count: insights?.insights?.atRisk?.data?.length || 0,
      summary: insights?.insights?.atRisk?.summary,
      actions: insights?.insights?.atRisk?.actions
    },
    {
      key: 'volunteers',
      title: 'Volunteer Burnout',
      icon: AlertCircle,
      color: 'border-orange-500',
      count: insights?.insights?.volunteers?.data?.length || 0,
      summary: insights?.insights?.volunteers?.summary,
      actions: insights?.insights?.volunteers?.actions
    },
    {
      key: 'giving',
      title: 'Giving Trends',
      icon: DollarSign,
      color: 'border-green-500',
      count: insights?.insights?.giving?.data?.donationCount || 0,
      summary: insights?.insights?.giving?.summary,
      actions: insights?.insights?.giving?.actions
    },
    {
      key: 'visitors',
      title: 'Visitor Retention',
      icon: UserCheck,
      color: 'border-blue-500',
      count: insights?.insights?.visitors?.data?.newVisitors || 0,
      summary: insights?.insights?.visitors?.summary,
      actions: insights?.insights?.visitors?.actions
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-purple-100">
            <Brain className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">AI Ministry Insights</h2>
            <p className="text-sm text-gray-600 mt-1">Powered by intelligent analysis of your data</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadInsights(true)}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Weekly Digest */}
      <WeeklyDigestCard
        digest={weeklyDigest?.content}
        loading={digestLoading}
        onRefresh={loadWeeklyDigest}
        isCached={cacheStatus.weeklyDigest}
      />

      {/* Insight Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {insightCards.map((card) => (
          <InsightCard
            key={card.key}
            title={card.title}
            icon={card.icon}
            color={card.color}
            count={card.count}
            summary={card.summary}
            actions={card.actions}
            loading={loading}
            isCached={cacheStatus[card.key]}
          />
        ))}
      </div>

      {/* Cost Efficiency Info */}
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-dashed">
        <CardContent className="pt-6 pb-4">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            <span className="font-medium">
              💡 Cost-efficient AI: Using smart SQL queries + lightweight AI APIs. 
              Estimated cost: ~$0.75-1.00 per church per month.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AIInsightsPanel;
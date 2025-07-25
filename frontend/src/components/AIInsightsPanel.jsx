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

const InsightCard = ({ title, summary, actions, icon: Icon, color, count, loading }) => {
  const [isExpanded, setIsExpanded] = useState(false);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`h-full border-l-4 ${color} hover:shadow-md transition-shadow`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-full ${color.replace('border-', 'bg-').replace('-500', '-100')}`}>
                <Icon className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">{title}</CardTitle>
                {count !== undefined && (
                  <Badge variant="secondary" className="text-xs">
                    {count} {count === 1 ? 'item' : 'items'}
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              <ArrowRight className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-gray-600 leading-relaxed">
            {summary}
          </div>
          
          {isExpanded && actions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-3 border-t border-gray-100"
            >
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Suggested Actions</span>
              </div>
              <div className="text-sm text-gray-600 whitespace-pre-line">
                {actions}
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const WeeklyDigestCard = ({ digest, loading, onRefresh }) => {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="col-span-full"
    >
      <Card className="border-l-4 border-blue-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-blue-100">
                <Sparkles className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Weekly AI Digest</CardTitle>
                <CardDescription>AI-powered insights for your ministry</CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
            {digest}
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
  const { toast } = useToast();

  const loadInsights = async () => {
    try {
      setLoading(true);
      const result = await AIInsightsService.getDashboardInsights(organizationId);
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

  const loadWeeklyDigest = async () => {
    try {
      setDigestLoading(true);
      const result = await AIInsightsService.getWeeklyDigest(organizationId);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-purple-100">
            <Brain className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">AI Ministry Insights</h2>
            <p className="text-sm text-gray-600">Powered by intelligent analysis of your data</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadInsights}
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
      />

      {/* Insight Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          />
        ))}
      </div>

      {/* Cost Efficiency Info */}
      <Card className="bg-gray-50 border-dashed">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Lightbulb className="h-4 w-4" />
            <span>
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
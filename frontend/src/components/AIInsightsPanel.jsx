import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  UserX,
  RefreshCw,
  ExternalLink,
  User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import AIInsightsService from '@/lib/aiInsightsService';

const InsightCard = ({ title, summary, actions, icon: Icon, color, count, loading, isCached = false, memberData = null }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  // Helper function to format AI text into readable sections
  const formatAIText = (text) => {
    if (!text) return [];
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
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${isExpanded ? 'rotate-90' : ''}`} />
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
          
          {/* Member List Section - Only for At-Risk Members */}
          {memberData && memberData.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">At-Risk Members:</div>
              <div className="space-y-1">
                {memberData.map((member, index) => (
                  <div 
                    key={member.id || index}
                    className="flex items-center justify-between p-2 rounded-md bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => navigate(member.profileUrl)}
                  >
                    <div className="flex items-center gap-2">
                      <UserX className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium text-gray-800">
                        {member.firstname} {member.lastname}
                      </span>
                    </div>
                    <ExternalLink className="h-3 w-3 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Actions Section */}
          {isExpanded && actions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-4 border-t border-gray-200"
            >
              <div className="flex items-center gap-2 mb-3">
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

export function AIInsightsPanel({ organizationId }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadInsights = async (forceRefresh = false) => {
    try {
      setLoading(true);
      if (forceRefresh) {
        AIInsightsService.clearCache();
      }
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

  useEffect(() => {
    if (organizationId) {
      loadInsights();
    }
  }, [organizationId]);

  // Only show At-Risk Members card
  const atRisk = {
    key: 'atRisk',
    title: 'At-Risk Members',
    icon: UserX,
    color: 'border-red-500',
    count: insights?.insights?.atRisk?.data?.length || 0,
    summary: insights?.insights?.atRisk?.summary,
    actions: insights?.insights?.atRisk?.actions,
    memberData: insights?.insights?.atRisk?.data || []
  };

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
      {/* At-Risk Members Card Only */}
      <div className="grid grid-cols-1 gap-6">
        <InsightCard
          key={atRisk.key}
          title={atRisk.title}
          icon={atRisk.icon}
          color={atRisk.color}
          count={atRisk.count}
          summary={atRisk.summary}
          actions={atRisk.actions}
          loading={loading}
          memberData={atRisk.memberData}
        />
      </div>
    </div>
  );
}

export default AIInsightsPanel;
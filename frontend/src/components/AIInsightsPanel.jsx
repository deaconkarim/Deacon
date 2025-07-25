import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  UserX,
  RefreshCw,
  ExternalLink,
  User,
  Mail
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import AIInsightsService from '@/lib/aiInsightsService';

const InsightCard = ({ title, summary, actions, icon: Icon, color, count, loading, memberData = null }) => {
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
          {actions && (
            <div className="pt-4 border-t border-gray-200">
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
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const WeeklyDigestCard = ({ content, loading, onRefresh }) => {
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
      <Card className="h-full border-l-4 border-purple-500 hover:shadow-md transition-shadow">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-100">
                <Mail className="h-5 w-5 text-purple-700" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-gray-800">Weekly Digest</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    AI Generated
                  </Badge>
                </div>
              </div>
            </div>
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRefresh(true)}
                className="h-8 w-8 p-0"
                title="Refresh digest"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Full Content - Render as HTML */}
          <div 
            className="text-sm text-gray-600 leading-relaxed prose prose-sm max-w-none weekly-digest"
            dangerouslySetInnerHTML={{ 
              __html: content || 'No weekly digest available. Click refresh to generate one.' 
            }}
          />
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

  const loadWeeklyDigest = async (forceRefresh = false) => {
    try {
      setDigestLoading(true);
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

      {/* Weekly Digest Card */}
      <div className="grid grid-cols-1 gap-6">
        <WeeklyDigestCard
          content={weeklyDigest?.content}
          loading={digestLoading}
          onRefresh={loadWeeklyDigest}
        />
      </div>

      {/* At-Risk Members and Predictive Attendance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
        
        {/* Predictive Attendance Card */}
        <Card className="h-full border-l-4 border-blue-500 hover:shadow-md transition-shadow">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100">
                <Brain className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-gray-800">Predictive Attendance</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {insights?.insights?.predictiveAttendance?.data?.predictions?.length || 0} Events
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : insights?.insights?.predictiveAttendance?.data?.predictions ? (
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  <p className="mb-3 font-medium">Upcoming Event Predictions:</p>
                  {insights.insights.predictiveAttendance.data.predictions.slice(0, 3).map((prediction, index) => (
                    <div key={index} className="mb-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-gray-800 text-sm">
                          {prediction.eventTitle}
                        </div>
                        <Badge 
                          variant={prediction.confidence === 'High' ? 'default' : prediction.confidence === 'Medium' ? 'secondary' : 'outline'} 
                          className={`text-xs ${
                            prediction.confidence === 'High' ? 'bg-green-100 text-green-800' :
                            prediction.confidence === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {prediction.confidence}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600">
                        <div className="flex justify-between mb-1">
                          <span>Predicted Attendance:</span>
                          <span className="font-medium">{prediction.predictedAttendance} people</span>
                        </div>
                        <div className="flex justify-between mb-1">
                          <span>Event Type:</span>
                          <span className="capitalize">{prediction.eventType}</span>
                        </div>
                        <div className="flex justify-between mb-1">
                          <span>Date:</span>
                          <span>{new Date(prediction.eventDate).toLocaleDateString()}</span>
                        </div>
                        {prediction.factors?.comprehensiveFactors?.length > 0 && (
                          <div className="group relative">
                            <div className="text-xs text-blue-600 cursor-help">ℹ️ Hover for factors</div>
                            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded-lg p-3 shadow-lg z-10 min-w-48">
                              <div className="font-medium mb-1">Factors Considered:</div>
                              <div className="space-y-1">
                                {prediction.factors.comprehensiveFactors.map((factor, idx) => (
                                  <div key={idx} className="text-gray-200">• {factor}</div>
                                ))}
                              </div>
                              <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {insights.insights.predictiveAttendance.data.predictions.length > 3 && (
                    <p className="text-xs text-gray-500 text-center">
                      +{insights.insights.predictiveAttendance.data.predictions.length - 3} more events
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600 leading-relaxed">
                <p className="mb-3">
                  No upcoming events found. Create events to see attendance predictions based on historical data.
                </p>
                <p className="text-xs text-gray-500">
                  Predictions are based on historical attendance patterns, event types, and seasonal trends.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AIInsightsPanel;
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
      <motion.div className="group/card relative" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-500/20 to-slate-600/20 rounded-2xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
        <div className="relative backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </motion.div>
    );
  }

  const formattedSummary = formatAIText(summary);
  const formattedActions = formatAIText(actions);

  return (
    <motion.div className="group/card relative" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${color.replace('border-', 'from-').replace('-500', '-500/20')} to-${color.replace('border-', '').replace('-500', '-600/20')} rounded-2xl blur opacity-0 group-hover/card:opacity-100 transition duration-300`}></div>
      <div className="relative backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-8 h-8 bg-gradient-to-br ${color.replace('border-', 'from-').replace('-500', '-500')} to-${color.replace('border-', '').replace('-500', '-600')} rounded-lg flex items-center justify-center shadow-lg`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h4>
            {count !== undefined && (
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {count} {count === 1 ? 'item' : 'items'}
                </Badge>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          {/* Summary Section */}
          <div className="space-y-3">
            {formattedSummary.map((section, index) => (
              <div key={index} className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {section.content}
              </div>
            ))}
          </div>
          
          {/* Member List Section - Only for At-Risk Members */}
          {memberData && memberData.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300">At-Risk Members:</div>
              <div className="space-y-1">
                {memberData.map((member, index) => (
                  <div 
                    key={member.id || index}
                    className="flex items-center justify-between p-2 rounded-md bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                    onClick={() => navigate(member.profileUrl)}
                  >
                    <div className="flex items-center gap-2">
                      <UserX className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {member.firstname} {member.lastname}
                      </span>
                    </div>
                    <ExternalLink className="h-3 w-3 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Actions Section */}
          {actions && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Recommended Actions:</div>
              <div className="space-y-1">
                {formattedActions.map((action, index) => (
                  <div key={index} className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {action.content}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const WeeklyDigestCard = ({ content, loading, onRefresh }) => {
  if (loading) {
    return (
      <motion.div className="group/card relative" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-2xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
        <div className="relative backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div className="group/card relative" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-2xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
      <div className="relative backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
              <Mail className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Weekly Digest</h4>
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
        
        <div className="space-y-4">
          {/* Full Content - Render as HTML */}
          <div 
            className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed prose prose-sm max-w-none weekly-digest"
            dangerouslySetInnerHTML={{ 
              __html: content || 'No weekly digest available. Click refresh to generate one.' 
            }}
          />
        </div>
      </div>
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
        <motion.div className="group/card relative" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-2xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
          <div className="relative backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Predictive Attendance</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {insights?.insights?.predictiveAttendance?.data?.predictions?.length || 0} Events
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : insights?.insights?.predictiveAttendance?.data?.predictions ? (
                <div className="space-y-3">
                  <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    <p className="mb-3 font-medium">Upcoming Event Predictions:</p>
                    {insights.insights.predictiveAttendance.data.predictions.slice(0, 3).map((prediction, index) => (
                      <div key={index} className="mb-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                            {prediction.eventTitle}
                          </div>
                          <Badge 
                            variant={prediction.confidence === 'High' ? 'default' : prediction.confidence === 'Medium' ? 'secondary' : 'outline'} 
                            className={`text-xs ${
                              prediction.confidence === 'High' ? 'bg-green-100 text-green-800' :
                              prediction.confidence === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {prediction.confidence}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">
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
                              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-slate-800 text-white text-xs rounded-lg p-3 shadow-lg z-10 min-w-48">
                                <div className="font-medium mb-1">Factors Considered:</div>
                                <div className="space-y-1">
                                  {prediction.factors.comprehensiveFactors.map((factor, idx) => (
                                    <div key={idx} className="text-slate-200">• {factor}</div>
                                  ))}
                                </div>
                                <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {insights.insights.predictiveAttendance.data.predictions.length > 3 && (
                      <p className="text-xs text-slate-500 text-center">
                        +{insights.insights.predictiveAttendance.data.predictions.length - 3} more events
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  <p className="mb-3">
                    No upcoming events found. Create events to see attendance predictions based on historical data.
                  </p>
                  <p className="text-xs text-slate-500">
                    Predictions are based on historical attendance patterns, event types, and seasonal trends.
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default AIInsightsPanel;
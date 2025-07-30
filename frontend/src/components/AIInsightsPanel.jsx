import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  UserX,
  RefreshCw,
  ExternalLink,
  User,
  Mail,
  Calendar,
  CheckSquare,
  X
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
    <motion.div className="group relative" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className={`absolute -inset-1 bg-gradient-to-r ${color.replace('border-', 'from-').replace('-500', '-500')} to-${color.replace('border-', '').replace('-500', '-600')} rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-300`}></div>
      <div className="relative backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border border-white/20 dark:border-slate-700/20 rounded-3xl p-3 sm:p-6 lg:p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-12 h-12 bg-gradient-to-br ${color.replace('border-', 'from-').replace('-500', '-500')} to-${color.replace('border-', '').replace('-500', '-600')} rounded-2xl flex items-center justify-center shadow-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h3>
            <p className="text-slate-600 dark:text-slate-400">
              {count !== undefined ? `${count} ${count === 1 ? 'item' : 'items'}` : 'AI-powered insights'}
            </p>
          </div>
        </div>
        
        <div className="grid gap-4 grid-cols-1">
          {/* Summary Section */}
          <motion.div className="group/card relative">
            <div className={`absolute -inset-0.5 bg-gradient-to-r ${color.replace('border-', 'from-').replace('-500', '-500/20')} to-${color.replace('border-', '').replace('-500', '-600/20')} rounded-2xl blur opacity-0 group-hover/card:opacity-100 transition duration-300`}></div>
            <div className="relative backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-br ${color.replace('border-', 'from-').replace('-500', '-500')} to-${color.replace('border-', '').replace('-500', '-600')} rounded-xl flex items-center justify-center`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-slate-900 dark:text-white">Summary</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      AI-generated insights
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                    {memberData?.length || 0}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-500">members</p>
                </div>
              </div>
              <div className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                {formattedSummary.map((section, index) => (
                  <div key={index} className="leading-relaxed">
                    {section.content}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
          
          {/* Member List Section - Only for At-Risk Members */}
          {memberData && memberData.length > 0 && (
            <motion.div className="group/card relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-2xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
              <div className="relative backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                      <UserX className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-slate-900 dark:text-white">At-Risk Members</h4>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-600">
                      {memberData.length}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-500">members</p>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  {memberData.slice(0, 3).map((member, index) => (
                    <div 
                      key={member.id || index}
                      className="flex items-center justify-between p-2 rounded-md bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                      onClick={() => navigate(member.profileUrl)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {member.firstname} {member.lastname}
                        </span>
                      </div>
                      <ExternalLink className="h-3 w-3 text-slate-400" />
                    </div>
                  ))}
                  {memberData.length > 3 && (
                    <p className="text-xs text-slate-500 text-center">
                      +{memberData.length - 3} more members
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Actions Section */}
          {actions && (
            <motion.div className="group/card relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-2xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
              <div className="relative backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                      <CheckSquare className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-slate-900 dark:text-white">Recommended Actions</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        AI-generated suggestions
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {formattedActions.length}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-500">actions</p>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  {formattedActions.map((action, index) => (
                    <div key={index} className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {action.content}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
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
    <motion.div className="group relative" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-purple-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
      <div className="relative backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border border-white/20 dark:border-slate-700/20 rounded-3xl p-3 sm:p-6 lg:p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Weekly Digest</h3>
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
        
        <div className="grid gap-4 grid-cols-1">
          <motion.div className="group/card relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-2xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
            <div className="relative backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-slate-900 dark:text-white">Weekly Summary</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      AI-generated insights
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-600">
                    Weekly
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-500">digest</p>
                </div>
              </div>
              <div className="mt-3">
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
        </div>
      </div>
    </motion.div>
  );
};

export function AIInsightsPanel({ organizationId }) {
  const [insights, setInsights] = useState(null);
  const [weeklyDigest, setWeeklyDigest] = useState(null);
  const [loading, setLoading] = useState(false); // Changed from true to false
  const [digestLoading, setDigestLoading] = useState(false);
  const [selectedFactors, setSelectedFactors] = useState(null);
  const [factorsPopoverOpen, setFactorsPopoverOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const panelRef = useRef(null);
  const { toast } = useToast();

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '100px' // Start loading when panel is 100px away from viewport
      }
    );

    if (panelRef.current) {
      observer.observe(panelRef.current);
    }

    return () => {
      if (panelRef.current) {
        observer.unobserve(panelRef.current);
      }
    };
  }, [hasLoaded]);

  const loadInsights = async (forceRefresh = false) => {
    try {
      setLoading(true);
      if (forceRefresh) {
        AIInsightsService.clearCache();
      }
      
      const result = await AIInsightsService.getDashboardInsights(organizationId, forceRefresh);
      setInsights(result);
      setHasLoaded(true);
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

  // Only load when panel becomes visible and organizationId is available
  useEffect(() => {
    if (organizationId && isVisible && !hasLoaded) {
      loadInsights();
      // Load weekly digest only if user explicitly requests it (remove auto-load)
      // loadWeeklyDigest();
    }
  }, [organizationId, isVisible, hasLoaded]);

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
    <div ref={panelRef} className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-purple-100">
            <Brain className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Ministry Insights</h2>
            <p className="text-sm text-gray-600 mt-1">Powered by intelligent analysis of your data</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!hasLoaded && !loading && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadInsights(false)}
              className="flex items-center gap-2"
            >
              <Brain className="h-4 w-4" />
              Load Insights
            </Button>
          )}
          {hasLoaded && (
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
          )}
        </div>
      </div>

      {/* Show loading state or insights */}
      {!hasLoaded && !loading ? (
        <div className="grid grid-cols-1 gap-6">
          <motion.div className="group relative" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-purple-600 rounded-3xl blur opacity-25"></div>
            <div className="relative backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border border-white/20 dark:border-slate-700/20 rounded-3xl p-6 shadow-xl text-center">
              <Brain className="h-16 w-16 text-purple-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">AI Insights Ready</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Click "Load Insights" to analyze your church data and get AI-powered recommendations.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500">
                This may take a few seconds to process your data.
              </p>
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {/* Weekly Digest Card - Load on demand */}
          {weeklyDigest && (
            <WeeklyDigestCard 
              content={weeklyDigest.content} 
              loading={digestLoading}
              onRefresh={loadWeeklyDigest}
            />
          )}
          
          {!weeklyDigest && !digestLoading && hasLoaded && (
            <motion.div className="group relative" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-purple-600 rounded-3xl blur opacity-25"></div>
              <div className="relative backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border border-white/20 dark:border-slate-700/20 rounded-3xl p-6 shadow-xl text-center">
                <Mail className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Weekly Digest Available</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm">
                  Generate a comprehensive weekly digest with AI-powered insights and recommendations.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadWeeklyDigest(false)}
                  className="flex items-center gap-2 mx-auto"
                >
                  <Mail className="h-4 w-4" />
                  Generate Digest
                </Button>
              </div>
            </motion.div>
          )}

          {/* At-Risk Members Card */}
          <InsightCard
            {...atRisk}
            loading={loading}
          />

          {/* Predictive Attendance Card */}
          <motion.div className="group relative" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
            <div className="relative backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border border-white/20 dark:border-slate-700/20 rounded-3xl p-3 sm:p-6 lg:p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Predictive Attendance</h3>
                </div>
              </div>
              
              <div className="grid gap-4 grid-cols-1">
                {loading ? (
                  <motion.div className="group/card relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-2xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                    <div className="relative backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                  </motion.div>
                                ) : insights?.insights?.predictiveAttendance?.data?.predictions ? (
                  insights.insights.predictiveAttendance.data.predictions.slice(0, 4).map((prediction, index) => (
                    <motion.div 
                      key={index}
                      className="group/card relative"
                    >
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-2xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                      <div 
                        className="relative backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                        onClick={() => {
                          if (prediction.factors?.comprehensiveFactors?.length > 0) {
                            setSelectedFactors({
                              eventTitle: prediction.eventTitle,
                              factors: prediction.factors.comprehensiveFactors
                            });
                            setFactorsPopoverOpen(true);
                          }
                        }}
                        title={prediction.factors?.comprehensiveFactors?.length > 0 ? `Click to see factors considered` : ''}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                              <Calendar className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h4 className="text-base font-semibold text-slate-900 dark:text-white">{prediction.eventTitle}</h4>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                {new Date(prediction.eventDate).toLocaleDateString()} • {prediction.eventType}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">
                              {prediction.predictedAttendance}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-500">predicted</p>
                          </div>
                        </div>
                        <div className="mt-3 flex justify-between items-center">
                          <Badge 
                            variant={prediction.confidence === 'High' ? 'default' : prediction.confidence === 'Medium' ? 'secondary' : 'outline'} 
                            className={`text-xs ${
                              prediction.confidence === 'High' ? 'bg-green-100 text-green-800' :
                              prediction.confidence === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {prediction.confidence} confidence
                          </Badge>
                          {prediction.factors?.comprehensiveFactors?.length > 0 && (
                            <div className="text-xs text-blue-600 dark:text-blue-400">
                              ℹ️ Click to see factors
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <motion.div className="group/card relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-2xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                    <div className="relative backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="text-base font-semibold text-slate-900 dark:text-white">No Predictions</h4>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              Create events to see predictions
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-slate-400">
                            0
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-500">events</p>
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                        <p>No upcoming events found. Create events to see attendance predictions based on historical data.</p>
                        <p className="text-xs text-slate-500 mt-2">
                          Predictions are based on historical attendance patterns, event types, and seasonal trends.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
                {insights?.insights?.predictiveAttendance?.data?.predictions?.length > 4 && (
                  <p className="text-xs text-slate-500 text-center">
                    +{insights.insights.predictiveAttendance.data.predictions.length - 4} more events
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Factors Popover */}
      {factorsPopoverOpen && selectedFactors && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Factors Considered
              </h3>
              <button
                onClick={() => setFactorsPopoverOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            
            <div className="mb-4">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {selectedFactors.eventTitle}
              </h4>
              <div className="space-y-2">
                {selectedFactors.factors.map((factor, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{factor}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFactorsPopoverOpen(false)}
                className="text-sm"
              >
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default AIInsightsPanel;
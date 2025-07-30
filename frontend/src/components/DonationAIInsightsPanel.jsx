import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp,
  RefreshCw,
  ExternalLink,
  User,
  Gift,
  Heart,
  Target,
  BarChart3,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ChevronRight,
  Users,
  CreditCard,
  Banknote
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import AIInsightsService from '@/lib/aiInsightsService';

const DonationInsightCard = ({ title, summary, actions, icon: Icon, color, count, loading, data = null }) => {
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
                    {data?.insights?.totalDonations || 0}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-500">donations</p>
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
          
          {/* Top Donors Section */}
          {data?.insights?.topDonors && data.insights.topDonors.length > 0 && (
            <motion.div className="group/card relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-2xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
              <div className="relative backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                      <Gift className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-slate-900 dark:text-white">Top Donors</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {data.insights.topDonors.length} donors • Highest contributors
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      ${data.insights.topDonors.reduce((sum, donor) => sum + donor.total, 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-500">total</p>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  {data.insights.topDonors.slice(0, 3).map((donor, index) => (
                    <div 
                      key={donor.donor_id || index}
                      className="flex items-center justify-between p-2 rounded-md bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                      onClick={() => navigate(`/members/${donor.donor_id}`)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {donor.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-green-600 font-semibold">
                          ${donor.total.toLocaleString()}
                        </span>
                        <ExternalLink className="h-3 w-3 text-slate-400" />
                      </div>
                    </div>
                  ))}
                  {data.insights.topDonors.length > 3 && (
                    <p className="text-xs text-slate-500 text-center">
                      +{data.insights.topDonors.length - 3} more donors
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Recommendations Section */}
          {data?.insights?.recommendations && data.insights.recommendations.length > 0 && (
            <motion.div className="group/card relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-2xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
              <div className="relative backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <Target className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-slate-900 dark:text-white">Recommendations</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {data.insights.recommendations.length} suggestions • AI-powered insights
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {data.insights.recommendations.length}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-500">actions</p>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  {data.insights.recommendations.slice(0, 3).map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{recommendation}</p>
                    </div>
                  ))}
                  {data.insights.recommendations.length > 3 && (
                    <p className="text-xs text-slate-500 text-center">
                      +{data.insights.recommendations.length - 3} more recommendations
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export function DonationAIInsightsPanel({ organizationId }) {
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
      console.error('Error loading donation insights:', error);
      toast({
        title: "Error",
        description: "Failed to load donation insights. Please try again.",
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

  // Donation Insights card
  const donationInsights = {
    key: 'donationInsights',
    title: 'Giving Insights',
    icon: DollarSign,
    color: 'border-green-500',
    count: insights?.insights?.donationInsights?.data?.insights?.totalDonations || 0,
    summary: insights?.insights?.donationInsights?.summary,
    actions: insights?.insights?.donationInsights?.actions,
    data: insights?.insights?.donationInsights?.data
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-green-100">
            <DollarSign className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Giving AI Insights</h2>
            <p className="text-sm text-gray-600 mt-1">Powered by intelligent analysis of your giving data</p>
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

      {/* Donation Insights Card */}
      <div className="grid grid-cols-1 gap-6">
        <DonationInsightCard
          key={donationInsights.key}
          title={donationInsights.title}
          icon={donationInsights.icon}
          color={donationInsights.color}
          count={donationInsights.count}
          summary={donationInsights.summary}
          actions={donationInsights.actions}
          loading={loading}
          data={donationInsights.data}
        />
      </div>
    </div>
  );
}

export default DonationAIInsightsPanel;
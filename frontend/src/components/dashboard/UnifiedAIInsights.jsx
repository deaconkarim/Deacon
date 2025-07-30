import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  DollarSign,
  UserX,
  RefreshCw,
  ExternalLink,
  TrendingUp,
  Users,
  Gift,
  Heart,
  Target,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import AIInsightsService from '@/lib/aiInsightsService';
import InsightCard from './InsightCard';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
};

const UnifiedAIInsights = ({ organizationId }) => {
  const [memberInsights, setMemberInsights] = useState([]);
  const [donationInsights, setDonationInsights] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isLoadingDonations, setIsLoadingDonations] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load member insights
  const loadMemberInsights = async () => {
    if (!organizationId) return;
    
    try {
      setIsLoadingMembers(true);
      const insights = await AIInsightsService.getMemberInsights(organizationId);
      
      // Transform insights to unified format
      const transformedInsights = insights.map(insight => ({
        title: insight.category || 'Member Insight',
        category: 'Member Analytics',
        description: insight.summary,
        recommendations: insight.actions ? insight.actions.split('\n').filter(a => a.trim()) : [],
        score: insight.memberData?.length || 0,
        scoreLabel: 'members',
        metrics: insight.memberData ? [
          { label: 'Affected Members', value: insight.memberData.length },
          { label: 'Priority', value: insight.priority || 'Medium' }
        ] : []
      }));
      
      setMemberInsights(transformedInsights);
    } catch (error) {
      console.error('Error loading member insights:', error);
      toast({
        title: "Warning",
        description: "Could not load member insights",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMembers(false);
    }
  };

  // Load donation insights
  const loadDonationInsights = async () => {
    if (!organizationId) return;
    
    try {
      setIsLoadingDonations(true);
      const insights = await AIInsightsService.getDonationInsights(organizationId);
      
      // Transform insights to unified format
      const transformedInsights = insights.map(insight => ({
        title: insight.category || 'Donation Insight',
        category: 'Financial Analytics',
        description: insight.summary,
        recommendations: insight.actions ? insight.actions.split('\n').filter(a => a.trim()) : [],
        score: insight.data?.amount || insight.data?.count || 0,
        scoreLabel: insight.data?.amount ? '$' : 'items',
        metrics: insight.data ? [
          { label: 'Impact Score', value: insight.impact_score || 'N/A' },
          { label: 'Trend', value: insight.trend || 'Stable' }
        ] : []
      }));
      
      setDonationInsights(transformedInsights);
    } catch (error) {
      console.error('Error loading donation insights:', error);
      toast({
        title: "Warning", 
        description: "Could not load donation insights",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDonations(false);
    }
  };

  // Load all insights
  const loadInsights = async () => {
    await Promise.all([
      loadMemberInsights(),
      loadDonationInsights()
    ]);
  };

  // Refresh all insights
  const refreshInsights = async () => {
    setRefreshing(true);
    try {
      await loadInsights();
      toast({
        title: "Success",
        description: "AI insights refreshed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh insights",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Load insights on mount
  useEffect(() => {
    loadInsights();
  }, [organizationId]);

  // Check if we have any insights to show
  const hasInsights = memberInsights.length > 0 || donationInsights.length > 0;
  const isLoading = isLoadingMembers || isLoadingDonations;

  if (!organizationId) {
    return null;
  }

  return (
    <motion.div variants={itemVariants} className="mb-6 sm:mb-12">
      <div className="group relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
        <div className="relative backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border border-white/20 dark:border-slate-700/20 rounded-3xl p-3 sm:p-6 lg:p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">AI Ministry Insights</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Intelligent analysis and recommendations for your ministry
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">AI Intelligence</span>
              </div>
              <Button
                onClick={refreshInsights}
                disabled={refreshing || isLoading}
                variant="outline"
                size="sm"
                className="bg-white/60 dark:bg-slate-800/60"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Insights Grid */}
          {isLoading ? (
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              <InsightCard
                title="Member Insights"
                icon={Users}
                color="blue"
                isLoading={true}
              />
              <InsightCard
                title="Donation Insights"
                icon={DollarSign}
                color="emerald"
                isLoading={true}
              />
            </div>
          ) : hasInsights ? (
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              {/* Member Insights */}
              {memberInsights.length > 0 && (
                <InsightCard
                  title="Member Insights"
                  icon={Users}
                  insights={memberInsights}
                  color="blue"
                  actions={[
                    {
                      label: "View Members",
                      onClick: () => navigate('/members'),
                      icon: ExternalLink,
                      variant: "outline"
                    }
                  ]}
                />
              )}

              {/* Donation Insights */}
              {donationInsights.length > 0 && (
                <InsightCard
                  title="Donation Insights"
                  icon={DollarSign}
                  insights={donationInsights}
                  color="emerald"
                  actions={[
                    {
                      label: "View Donations",
                      onClick: () => navigate('/donations'),
                      icon: ExternalLink,
                      variant: "outline"
                    }
                  ]}
                />
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Brain className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              </div>
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                No Insights Available
              </h4>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                AI insights will appear here as your ministry data grows. The system needs time to analyze patterns and generate meaningful recommendations.
              </p>
              <Button
                onClick={refreshInsights}
                disabled={refreshing}
                variant="outline"
                className="mt-4"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Check for Insights
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default UnifiedAIInsights;
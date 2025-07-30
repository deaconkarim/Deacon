import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users2, 
  DollarSign, 
  Calendar, 
  CheckSquare, 
  MessageSquare,
  Bell,
  BarChart3,
  Activity,
  TrendingUp,
  Clock,
  Users,
  BookOpen,
  Book,
  UserPlus,
  Baby,
  ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/authContext';
import { useDashboardData, dashboardCalculations } from '@/lib/dashboardDataManager';
import { PermissionFeature } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/lib/permissions';

// Reusable components
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatCard from '@/components/dashboard/StatCard';
import InsightCard from '@/components/dashboard/InsightCard';
import UnifiedAIInsights from '@/components/dashboard/UnifiedAIInsights';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
};

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    stats,
    isLoading,
    organizationId,
    attendanceStats,
    personalTasks,
    smsConversations,
    upcomingEvents,
    donationTrendAnalysis,
    refresh
  } = useDashboardData();

  // Check user permissions
  const userPermissions = user?.user_metadata?.permissions || [];
  const hasPermission = (permission) => userPermissions.includes(permission);

  // Calculate trends and health indicators
  const memberTrend = dashboardCalculations.getTrendIndicator(
    stats.members.active, 
    stats.members.total - stats.members.active
  );

  const donationTrend = dashboardCalculations.getTrendIndicator(
    stats.donations.thisWeek,
    stats.donations.lastWeek
  );

  const eventTrend = dashboardCalculations.getTrendIndicator(
    stats.events.thisMonth,
    stats.events.total / 12 // rough monthly average
  );

  // Create smart insights based on data
  const generateSmartInsights = () => {
    const insights = [];

    // Growth insight
    if (stats.members.recent > 0) {
      insights.push({
        title: 'Growing Community',
        category: 'Growth Analysis',
        description: `You've welcomed ${stats.members.recent} new visitors in the last 30 days. This indicates healthy community growth and effective outreach.`,
        recommendations: [
          'Follow up with recent visitors within 48 hours',
          'Consider hosting a newcomer welcome event',
          'Ensure your visitor integration process is smooth'
        ],
        score: stats.members.recent,
        scoreLabel: 'new visitors',
        metrics: [
          { label: 'Growth Rate', value: `${stats.members.engagementRate}%` },
          { label: 'Active Members', value: stats.members.active }
        ]
      });
    }

    // Financial health insight
    if (stats.donations.trend !== 0) {
      const isPositive = stats.donations.trend > 0;
      insights.push({
        title: isPositive ? 'Financial Growth' : 'Financial Focus Needed',
        category: 'Financial Health',
        description: `Donations are ${isPositive ? 'trending upward' : 'declining'} by ${Math.abs(stats.donations.trend).toFixed(1)}%. ${isPositive ? 'Keep communicating impact.' : 'Consider stewardship emphasis.'}`,
        recommendations: isPositive ? [
          'Share stories of ministry impact',
          'Thank donors for their faithfulness',
          'Plan for strategic growth initiatives'
        ] : [
          'Schedule stewardship education series',
          'Share clear ministry impact stories',
          'Review and communicate budget transparency'
        ],
        score: Math.abs(stats.donations.trend),
        scoreLabel: '% change',
        metrics: [
          { label: 'This Week', value: dashboardCalculations.formatCurrency(stats.donations.thisWeek) },
          { label: 'Monthly Average', value: dashboardCalculations.formatCurrency(stats.donations.monthly) }
        ]
      });
    }

    // Task management insight
    if (stats.tasks.overdue > 0) {
      insights.push({
        title: 'Task Management Alert',
        category: 'Operational Efficiency',
        description: `You have ${stats.tasks.overdue} overdue tasks that need attention. Staying on top of ministry tasks ensures smooth operations.`,
        recommendations: [
          'Review and prioritize overdue tasks',
          'Delegate tasks where appropriate',
          'Set up automated reminders for deadlines'
        ],
        score: stats.tasks.overdue,
        scoreLabel: 'overdue',
        metrics: [
          { label: 'Completion Rate', value: `${stats.tasks.completionRate}%` },
          { label: 'Total Tasks', value: stats.tasks.total }
        ]
      });
    }

    return insights;
  };

  const smartInsights = generateSmartInsights();

  return (
    <motion.div 
      className="min-h-screen w-full max-w-full overflow-x-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="w-full max-w-7xl mx-auto min-w-0 px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 overflow-x-hidden">
        
        {/* Header */}
        <DashboardHeader
          isLoading={isLoading}
          onRefresh={refresh}
        />

        {/* Permission-based access check */}
        {(() => {
          const hasDashboardAccess = 
            hasPermission(PERMISSIONS.MEMBERS_VIEW) ||
            hasPermission(PERMISSIONS.DONATIONS_VIEW) ||
            hasPermission(PERMISSIONS.EVENTS_VIEW) ||
            hasPermission(PERMISSIONS.TASKS_VIEW) ||
            hasPermission(PERMISSIONS.SETTINGS_VIEW) ||
            hasPermission(PERMISSIONS.REPORTS_VIEW);
          
          if (!hasDashboardAccess) {
            return (
              <motion.div variants={itemVariants} className="mb-6 sm:mb-12">
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                    Welcome to Your Dashboard
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 mb-8">
                    Contact your administrator to gain access to dashboard features.
                  </p>
                </div>
              </motion.div>
            );
          }

          return null;
        })()}

        {/* Main Analytics Grid */}
        <div className="grid gap-3 sm:gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-3 mb-6 sm:mb-12">
          
          {/* People Analytics */}
          <PermissionFeature permission={PERMISSIONS.MEMBERS_VIEW}>
            <StatCard
              title="People"
              icon={Users2}
              value={stats.members.total}
              subValue="Total Members"
              description="Community growth and engagement"
              color="blue"
              isLoading={isLoading}
              trend={memberTrend}
              metrics={[
                { 
                  label: 'Active Members', 
                  value: stats.members.active, 
                  progress: stats.members.engagementRate 
                },
                { label: 'Recent Visitors', value: stats.members.recent },
                { label: 'Engagement Rate', value: `${stats.members.engagementRate}%` }
              ]}
              actionLabel="View All People"
              actionUrl="/members"
            />
          </PermissionFeature>

          {/* Financial Analytics */}
          <PermissionFeature permission={PERMISSIONS.DONATIONS_VIEW}>
            <StatCard
              title="Donations"
              icon={DollarSign}
              value={dashboardCalculations.formatCurrency(stats.donations.monthly)}
              subValue="This Month"
              description="Financial stewardship overview"
              color="emerald"
              isLoading={isLoading}
              trend={donationTrend}
              metrics={[
                { label: 'Weekly Average', value: dashboardCalculations.formatCurrency(stats.donations.weekly) },
                { label: 'This Week', value: dashboardCalculations.formatCurrency(stats.donations.thisWeek) },
                { label: 'Growth Rate', value: `${stats.donations.growth}%` }
              ]}
              actionLabel="View All Donations"
              actionUrl="/donations"
            />
          </PermissionFeature>

          {/* Events & Activities */}
          <PermissionFeature permission={PERMISSIONS.EVENTS_VIEW}>
            <StatCard
              title="Events"
              icon={Calendar}
              value={stats.events.upcoming}
              subValue="Upcoming"
              description="Ministry events and activities"
              color="blue"
              isLoading={isLoading}
              trend={eventTrend}
              metrics={[
                { label: 'This Week', value: stats.events.thisWeek },
                { label: 'This Month', value: stats.events.thisMonth },
                { label: 'Need Volunteers', value: stats.events.needingVolunteers }
              ]}
              actionLabel="View All Events"
              actionUrl="/events"
            />
          </PermissionFeature>

          {/* Tasks & Productivity */}
          <PermissionFeature permission={PERMISSIONS.TASKS_VIEW}>
            <StatCard
              title="Tasks"
              icon={CheckSquare}
              value={stats.tasks.pending}
              subValue="Pending"
              description="Ministry task management"
              color="orange"
              isLoading={isLoading}
              metrics={[
                { label: 'Total Tasks', value: stats.tasks.total },
                { label: 'Completed', value: stats.tasks.completed },
                { label: 'Overdue', value: stats.tasks.overdue },
                { 
                  label: 'Completion Rate', 
                  value: `${stats.tasks.completionRate}%`, 
                  progress: stats.tasks.completionRate 
                }
              ]}
              actionLabel="View All Tasks"
              actionUrl="/tasks"
            />
          </PermissionFeature>

          {/* Communications */}
          <PermissionFeature permission={PERMISSIONS.SETTINGS_VIEW}>
            <StatCard
              title="Communications"
              icon={MessageSquare}
              value={stats.sms.recent}
              subValue="Recent Messages"
              description="SMS and communication overview"
              color="teal"
              isLoading={isLoading}
              metrics={[
                { label: 'Total Conversations', value: stats.sms.conversations },
                { label: 'Active Conversations', value: stats.sms.active },
                { label: 'Total Messages', value: stats.sms.totalMessages }
              ]}
              actionLabel="View All Messages"
              actionUrl="/sms"
            />
          </PermissionFeature>

          {/* Celebrations */}
          <PermissionFeature permission={PERMISSIONS.REPORTS_VIEW}>
            <StatCard
              title="Celebrations"
              icon={Bell}
              value={stats.celebrations.totalUpcoming || 0}
              subValue="Upcoming"
              description="Birthdays, anniversaries, and milestones"
              color="amber"
              isLoading={isLoading}
              metrics={[
                { label: 'Birthdays', value: stats.celebrations.birthdays || 0 },
                { label: 'Anniversaries', value: stats.celebrations.anniversaries || 0 },
                { label: 'Memberships', value: stats.celebrations.memberships || 0 }
              ]}
              actionLabel="View All Celebrations"
              actionUrl="/alerts"
            />
          </PermissionFeature>
        </div>

        {/* Personal Tasks Section */}
        {personalTasks && personalTasks.length > 0 && (
          <PermissionFeature permission={PERMISSIONS.TASKS_VIEW}>
            <motion.div variants={itemVariants} className="mb-6 sm:mb-12">
              <StatCard
                title="My Tasks"
                icon={CheckSquare}
                value={personalTasks.length}
                subValue="Assigned to me"
                description="Tasks requiring your attention"
                color="purple"
                isLoading={isLoading}
                metrics={personalTasks.slice(0, 3).map(task => ({
                  label: task.title.length > 30 ? `${task.title.substring(0, 30)}...` : task.title,
                  value: task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'
                }))}
                actionLabel="View All My Tasks"
                actionUrl="/tasks"
              />
            </motion.div>
          </PermissionFeature>
        )}

        {/* Smart Insights */}
        {smartInsights.length > 0 && (
          <motion.div variants={itemVariants} className="mb-6 sm:mb-12">
            <InsightCard
              title="Smart Ministry Insights"
              icon={Activity}
              insights={smartInsights}
              color="blue"
              actions={[
                {
                  label: "View Reports",
                  onClick: () => navigate('/reports'),
                  icon: BarChart3,
                  variant: "outline"
                }
              ]}
            />
          </motion.div>
        )}

        {/* AI Ministry Insights */}
        <PermissionFeature permission={PERMISSIONS.MEMBERS_VIEW}>
          <UnifiedAIInsights organizationId={organizationId} />
        </PermissionFeature>

        {/* Attendance Analytics */}
        <PermissionFeature permission={PERMISSIONS.REPORTS_VIEW}>
          <motion.div variants={itemVariants} className="mb-6 sm:mb-12">
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
              <div className="relative backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border border-white/20 dark:border-slate-700/20 rounded-3xl p-3 sm:p-6 lg:p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
                
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Attendance Analytics</h3>
                    <p className="text-slate-600 dark:text-slate-400">Service participation insights</p>
                  </div>
                </div>
                
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-xl border border-blue-200 dark:border-blue-800">
                    <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {Math.round(stats.attendance.sundayServiceRate || 0)}%
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">Sunday Service Rate</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <Book className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                      {attendanceStats.serviceBreakdown?.find(s => s.name === 'Bible Study')?.value || 0}
                    </div>
                    <div className="text-sm text-emerald-600 dark:text-emerald-400">Bible Study Avg</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 rounded-xl border border-amber-200 dark:border-amber-800">
                    <Users className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                      {attendanceStats.serviceBreakdown?.find(s => s.name === 'Fellowship')?.value || 0}
                    </div>
                    <div className="text-sm text-amber-600 dark:text-amber-400">Fellowship Avg</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </PermissionFeature>

      </div>
    </motion.div>
  );
}
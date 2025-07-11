import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  Users, 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  PieChart, 
  FileText, 
  Download,
  Filter,
  Search,
  ArrowLeft,
  Eye,
  EyeOff,
  RefreshCw,
  MoreHorizontal,
  Settings,
  Target,
  Heart,
  Baby,
  Crown,
  MapPin,
  Mail,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Activity,
  UserCheck,
  UserX,
  UserPlus,
  Users2,
  Home,
  Building,
  Car,
  GraduationCap,
  Briefcase,
  Camera,
  Music,
  BookOpen,
  Shield,
  Gift,
  CreditCard,
  Receipt,
  PiggyBank,
  TrendingDown,
  Minus,
  Plus,
  Equal
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { AttendanceReports } from '@/components/reports/AttendanceReports';
import { FinancialReports } from '@/components/reports/FinancialReports';
import { MemberReports } from '@/components/reports/MemberReports';
import { FamilyReports } from '@/components/reports/FamilyReports';
import { EventReports } from '@/components/reports/EventReports';
import { DonationReports } from '@/components/reports/DonationReports';
import { useAuth } from '@/lib/authContext';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/lib/permissions.jsx';
import { supabase } from '@/lib/supabaseClient';

export function Reports() {
  const [activeReport, setActiveReport] = useState(null);
  const [selectedDateRange, setSelectedDateRange] = useState('month');
  const [isLoading, setIsLoading] = useState(false);
  const [quickStats, setQuickStats] = useState({});
  const [mainPageStats, setMainPageStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    monthlyGiving: 0,
    averageAttendance: 0
  });
  const [mainPageChanges, setMainPageChanges] = useState({
    totalMembers: 0,
    activeMembers: 0,
    monthlyGiving: 0,
    averageAttendance: 0
  });
  const [overviewChanges, setOverviewChanges] = useState({
    totalMembers: 0,
    activeMembers: 0,
    newMembers: 0,
    totalDonations: 0,
    averageAttendance: 0,
    totalEvents: 0,
    families: 0,
    volunteers: 0
  });
  const { toast } = useToast();
  const { user } = useAuth();

  // Load main page stats
  useEffect(() => {
    loadMainPageStats();
  }, []);

  const loadMainPageStats = async () => {
    try {
      // Get current user's organization ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: orgUser, error: orgError } = await supabase
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (orgError || !orgUser) throw new Error('Unable to determine organization');

      // Calculate date ranges
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Load current and previous month data
      const [
        { data: currentMembers },
        { data: previousMembers },
        { data: currentDonations },
        { data: previousDonations }
      ] = await Promise.all([
        supabase
          .from('members')
          .select('id, status, created_at')
          .eq('organization_id', orgUser.organization_id),
        supabase
          .from('members')
          .select('id, status, created_at')
          .eq('organization_id', orgUser.organization_id)
          .lt('created_at', currentMonthStart.toISOString()),
        supabase
          .from('donations')
          .select('amount, date')
          .eq('organization_id', orgUser.organization_id)
          .gte('date', currentMonthStart.toISOString().split('T')[0]),
        supabase
          .from('donations')
          .select('amount, date')
          .eq('organization_id', orgUser.organization_id)
          .gte('date', previousMonthStart.toISOString().split('T')[0])
          .lt('date', currentMonthStart.toISOString().split('T')[0])
      ]);

      const totalMembers = currentMembers?.length || 0;
      const previousTotalMembers = previousMembers?.length || 0;
      const activeMembers = currentMembers?.filter(m => m.status === 'active').length || 0;
      const previousActiveMembers = previousMembers?.filter(m => m.status === 'active').length || 0;
      const monthlyGiving = currentDonations?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;
      const previousMonthlyGiving = previousDonations?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;
      const averageAttendance = Math.round(totalMembers * 0.6);
      const previousAverageAttendance = Math.round(previousTotalMembers * 0.6);

      // Calculate percentage changes
      const calculateChange = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
      };

      setMainPageStats({
        totalMembers,
        activeMembers,
        monthlyGiving,
        averageAttendance
      });

      setMainPageChanges({
        totalMembers: calculateChange(totalMembers, previousTotalMembers),
        activeMembers: calculateChange(activeMembers, previousActiveMembers),
        monthlyGiving: calculateChange(monthlyGiving, previousMonthlyGiving),
        averageAttendance: calculateChange(averageAttendance, previousAverageAttendance)
      });
    } catch (error) {
      console.error('Error loading main page stats:', error);
    }
  };

  const reportTypes = [
    {
      id: 'overview',
      title: 'Overview Dashboard',
      description: 'Key metrics and insights',
      icon: TrendingUp,
      color: 'bg-gradient-to-r from-blue-500 to-purple-600',
      permissions: [PERMISSIONS.REPORTS_VIEW]
    },
    {
      id: 'attendance',
      title: 'Attendance Reports',
      description: 'Service attendance and trends',
      icon: Users,
      color: 'bg-gradient-to-r from-green-500 to-emerald-600',
      permissions: [PERMISSIONS.REPORTS_VIEW]
    },
    {
      id: 'financial',
      title: 'Financial Reports',
      description: 'Donations, budgets, and giving',
      icon: DollarSign,
      color: 'bg-gradient-to-r from-yellow-500 to-orange-600',
      permissions: [PERMISSIONS.REPORTS_VIEW]
    },
    {
      id: 'members',
      title: 'Member Analytics',
      description: 'Member growth and demographics',
      icon: UserCheck,
      color: 'bg-gradient-to-r from-indigo-500 to-blue-600',
      permissions: [PERMISSIONS.REPORTS_VIEW]
    },
    {
      id: 'families',
      title: 'Family Reports',
      description: 'Family composition and dynamics',
      icon: Users2,
      color: 'bg-gradient-to-r from-pink-500 to-rose-600',
      permissions: [PERMISSIONS.REPORTS_VIEW]
    },
    {
      id: 'events',
      title: 'Event Reports',
      description: 'Event performance and engagement',
      icon: Calendar,
      color: 'bg-gradient-to-r from-purple-500 to-violet-600',
      permissions: [PERMISSIONS.REPORTS_VIEW]
    },
    {
      id: 'donations',
      title: 'Donation Analytics',
      description: 'Giving patterns and campaigns',
      icon: Gift,
      color: 'bg-gradient-to-r from-emerald-500 to-teal-600',
      permissions: [PERMISSIONS.REPORTS_VIEW]
    }
  ];

  const QuickStatsCard = ({ title, value, change, icon: Icon, color = "bg-blue-500" }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change && (
              <div className="flex items-center mt-1">
                {change > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {Math.abs(change)}% from last month
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${color} text-white`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ReportCard = ({ report, onClick }) => (
    <PermissionGuard permissions={report.permissions}>
      <Card 
        className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 group"
        onClick={() => onClick(report.id)}
      >
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-xl ${report.color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
              <report.icon className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                {report.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {report.description}
              </p>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowLeft className="w-5 h-5 text-muted-foreground rotate-180" />
            </div>
          </div>
        </CardContent>
      </Card>
    </PermissionGuard>
  );

  const renderReportContent = () => {
    switch (activeReport) {
      case 'overview':
        return <OverviewDashboard />;
      case 'attendance':
        return <AttendanceReports />;
      case 'financial':
        return <FinancialReports />;
      case 'members':
        return <MemberReports />;
      case 'families':
        return <FamilyReports />;
      case 'events':
        return <EventReports />;
      case 'donations':
        return <DonationReports />;
      default:
        return null;
    }
  };

  const OverviewDashboard = () => {
    const [stats, setStats] = useState({
      totalMembers: 0,
      activeMembers: 0,
      newMembers: 0,
      totalDonations: 0,
      averageAttendance: 0,
      totalEvents: 0,
      families: 0,
      volunteers: 0
    });
    const [recentActivity, setRecentActivity] = useState([]);
    const [upcomingEvents, setUpcomingEvents] = useState([]);

    useEffect(() => {
      // Load overview stats
      loadOverviewStats();
      loadRecentActivity();
      loadUpcomingEvents();
    }, []);

    const loadOverviewStats = async () => {
      try {
        // Get current user's organization ID
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data: orgUser, error: orgError } = await supabase
          .from('organization_users')
          .select('organization_id')
          .eq('user_id', user.id)
          .single();

        if (orgError || !orgUser) throw new Error('Unable to determine organization');

        // Calculate date ranges
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        // Load current and previous month data
        const [
          { data: currentMembers },
          { data: previousMembers },
          { data: currentDonations },
          { data: previousDonations },
          { data: currentEvents },
          { data: previousEvents },
          { data: families }
        ] = await Promise.all([
          supabase
            .from('members')
            .select('id, status, created_at')
            .eq('organization_id', orgUser.organization_id),
          supabase
            .from('members')
            .select('id, status, created_at')
            .eq('organization_id', orgUser.organization_id)
            .lt('created_at', currentMonthStart.toISOString()),
          supabase
            .from('donations')
            .select('amount, date')
            .eq('organization_id', orgUser.organization_id)
            .gte('date', currentMonthStart.toISOString().split('T')[0]),
          supabase
            .from('donations')
            .select('amount, date')
            .eq('organization_id', orgUser.organization_id)
            .gte('date', previousMonthStart.toISOString().split('T')[0])
            .lt('date', currentMonthStart.toISOString().split('T')[0]),
          supabase
            .from('events')
            .select('id, start_date')
            .eq('organization_id', orgUser.organization_id)
            .gte('start_date', currentMonthStart.toISOString().split('T')[0]),
          supabase
            .from('events')
            .select('id, start_date')
            .eq('organization_id', orgUser.organization_id)
            .gte('start_date', previousMonthStart.toISOString().split('T')[0])
            .lt('start_date', currentMonthStart.toISOString().split('T')[0]),
          supabase
            .from('families')
            .select('id')
            .eq('organization_id', orgUser.organization_id)
        ]);

        // Calculate current stats
        const totalMembers = currentMembers?.length || 0;
        const previousTotalMembers = previousMembers?.length || 0;
        const activeMembers = currentMembers?.filter(m => m.status === 'active').length || 0;
        const previousActiveMembers = previousMembers?.filter(m => m.status === 'active').length || 0;
        const newMembers = currentMembers?.filter(m => {
          const createdDate = new Date(m.created_at);
          return createdDate >= currentMonthStart;
        }).length || 0;
        const previousNewMembers = previousMembers?.filter(m => {
          const createdDate = new Date(m.created_at);
          return createdDate >= previousMonthStart && createdDate < currentMonthStart;
        }).length || 0;
        const totalDonations = currentDonations?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;
        const previousTotalDonations = previousDonations?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;
        const totalEvents = currentEvents?.length || 0;
        const previousTotalEvents = previousEvents?.length || 0;
        const familiesCount = families?.length || 0;
        const averageAttendance = Math.round(totalMembers * 0.6);
        const previousAverageAttendance = Math.round(previousTotalMembers * 0.6);

        // Calculate percentage changes
        const calculateChange = (current, previous) => {
          if (previous === 0) return current > 0 ? 100 : 0;
          return Math.round(((current - previous) / previous) * 100);
        };

        setStats({
          totalMembers,
          activeMembers,
          newMembers,
          totalDonations,
          averageAttendance,
          totalEvents,
          families: familiesCount,
          volunteers: Math.round(totalMembers * 0.15)
        });

        setOverviewChanges({
          totalMembers: calculateChange(totalMembers, previousTotalMembers),
          activeMembers: calculateChange(activeMembers, previousActiveMembers),
          newMembers: calculateChange(newMembers, previousNewMembers),
          totalDonations: calculateChange(totalDonations, previousTotalDonations),
          averageAttendance: calculateChange(averageAttendance, previousAverageAttendance),
          totalEvents: calculateChange(totalEvents, previousTotalEvents),
          families: 0, // No change calculation for families yet
          volunteers: calculateChange(totalMembers, previousTotalMembers) // Rough estimate
        });
      } catch (error) {
        console.error('Error loading overview stats:', error);
        toast({
          title: 'Error',
          description: 'Failed to load overview statistics',
          variant: 'destructive'
        });
      }
    };

    const loadRecentActivity = async () => {
      try {
        // Get current user's organization ID
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data: orgUser, error: orgError } = await supabase
          .from('organization_users')
          .select('organization_id')
          .eq('user_id', user.id)
          .single();

        if (orgError || !orgUser) throw new Error('Unable to determine organization');

        // Load recent members, events, and donations
        const [
          { data: recentMembers },
          { data: recentEvents },
          { data: recentDonations }
        ] = await Promise.all([
          supabase
            .from('members')
            .select('firstname, lastname, created_at')
            .eq('organization_id', orgUser.organization_id)
            .order('created_at', { ascending: false })
            .limit(3),
          supabase
            .from('events')
            .select('title, start_date, created_at')
            .eq('organization_id', orgUser.organization_id)
            .order('created_at', { ascending: false })
            .limit(3),
          supabase
            .from('donations')
            .select('amount, date, created_at')
            .eq('organization_id', orgUser.organization_id)
            .order('created_at', { ascending: false })
            .limit(3)
        ]);

        const activities = [];

        // Add recent member activities
        recentMembers?.forEach(member => {
          activities.push({
            icon: UserPlus,
            text: `${member.firstname} ${member.lastname} joined the church`,
            time: formatTimeAgo(new Date(member.created_at)),
            color: "text-green-500"
          });
        });

        // Add recent event activities
        recentEvents?.forEach(event => {
          activities.push({
            icon: Calendar,
            text: `${event.title} scheduled`,
            time: formatTimeAgo(new Date(event.created_at)),
            color: "text-blue-500"
          });
        });

        // Add recent donation activities
        recentDonations?.forEach(donation => {
          activities.push({
            icon: DollarSign,
            text: `$${donation.amount.toLocaleString()} donation received`,
            time: formatTimeAgo(new Date(donation.created_at)),
            color: "text-yellow-500"
          });
        });

        // Sort by time and take the most recent 4
        activities.sort((a, b) => new Date(b.time) - new Date(a.time));
        setRecentActivity(activities.slice(0, 4));
      } catch (error) {
        console.error('Error loading recent activity:', error);
      }
    };

    const loadUpcomingEvents = async () => {
      try {
        // Get current user's organization ID
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data: orgUser, error: orgError } = await supabase
          .from('organization_users')
          .select('organization_id')
          .eq('user_id', user.id)
          .single();

        if (orgError || !orgUser) throw new Error('Unable to determine organization');

        // Load upcoming events
        const { data: events } = await supabase
          .from('events')
          .select('title, start_date, event_type')
          .eq('organization_id', orgUser.organization_id)
          .gte('start_date', new Date().toISOString().split('T')[0])
          .order('start_date', { ascending: true })
          .limit(4);

        const upcomingEvents = events?.map(event => ({
          title: event.title,
          date: formatEventDate(new Date(event.start_date)),
          attendees: Math.round(Math.random() * 50) + 10, // Placeholder - you might want to calculate real attendance
          type: event.event_type || 'event'
        })) || [];

        setUpcomingEvents(upcomingEvents);
      } catch (error) {
        console.error('Error loading upcoming events:', error);
      }
    };

    const formatTimeAgo = (date) => {
      const now = new Date();
      const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
      
      if (diffInHours < 1) return 'Just now';
      if (diffInHours < 24) return `${diffInHours} hours ago`;
      if (diffInHours < 48) return '1 day ago';
      return `${Math.floor(diffInHours / 24)} days ago`;
    };

    const formatEventDate = (date) => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (date.toDateString() === today.toDateString()) return 'Today';
      if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
      
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      });
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Overview Dashboard</h2>
            <p className="text-muted-foreground">Key metrics and insights for your church</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <QuickStatsCard
            title="Total Members"
            value={stats.totalMembers}
            change={overviewChanges.totalMembers}
            icon={Users}
            color="bg-gradient-to-r from-blue-500 to-cyan-500"
          />
          <QuickStatsCard
            title="Active Members"
            value={stats.activeMembers}
            change={overviewChanges.activeMembers}
            icon={UserCheck}
            color="bg-gradient-to-r from-green-500 to-emerald-500"
          />
          <QuickStatsCard
            title="New Members"
            value={stats.newMembers}
            change={overviewChanges.newMembers}
            icon={UserPlus}
            color="bg-gradient-to-r from-purple-500 to-pink-500"
          />
          <QuickStatsCard
            title="Total Donations"
            value={`$${stats.totalDonations.toLocaleString()}`}
            change={overviewChanges.totalDonations}
            icon={DollarSign}
            color="bg-gradient-to-r from-yellow-500 to-orange-500"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest church activities and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full bg-muted ${activity.color}`}>
                      <activity.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.text}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Events happening this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingEvents.map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground">{event.date}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{event.attendees} attending</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights and analytics for your church
          </p>
        </div>
        {activeReport && (
          <Button
            variant="outline"
            onClick={() => setActiveReport(null)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Reports
          </Button>
        )}
      </div>

      {!activeReport ? (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <QuickStatsCard
              title="Total Members"
              value={mainPageStats.totalMembers}
              change={mainPageChanges.totalMembers}
              icon={Users}
              color="bg-gradient-to-r from-blue-500 to-cyan-500"
            />
            <QuickStatsCard
              title="Active Members"
              value={mainPageStats.activeMembers}
              change={mainPageChanges.activeMembers}
              icon={UserCheck}
              color="bg-gradient-to-r from-green-500 to-emerald-500"
            />
            <QuickStatsCard
              title="This Month's Giving"
              value={`$${mainPageStats.monthlyGiving.toLocaleString()}`}
              change={mainPageChanges.monthlyGiving}
              icon={DollarSign}
              color="bg-gradient-to-r from-yellow-500 to-orange-500"
            />
            <QuickStatsCard
              title="Average Attendance"
              value={mainPageStats.averageAttendance}
              change={mainPageChanges.averageAttendance}
              icon={TrendingUp}
              color="bg-gradient-to-r from-purple-500 to-pink-500"
            />
          </div>

          {/* Report Categories */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Report Categories</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reportTypes.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onClick={setActiveReport}
                />
              ))}
            </div>
          </div>

          {/* Recent Reports */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Recent Reports</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                { title: "Monthly Attendance Report", date: "Dec 2024", type: "attendance" },
                { title: "Year-End Financial Summary", date: "Dec 2024", type: "financial" },
                { title: "Member Growth Analysis", date: "Nov 2024", type: "members" }
              ].map((report, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{report.title}</p>
                        <p className="text-sm text-muted-foreground">{report.date}</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {renderReportContent()}
        </div>
      )}
    </div>
  );
} 
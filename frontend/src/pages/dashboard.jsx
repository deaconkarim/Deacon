import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, parse, isAfter, isBefore, addDays, startOfDay, endOfDay, parseISO, isValid, startOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  UserPlus, 
  TrendingUp, 
  Clock, 
  ChevronRight,
  ArrowUpRight,
  Users2,
  RefreshCw,
  Search,
  HelpCircle,
  CheckCircle2,
  Activity,
  Pencil,
  Trash2,
  Handshake,
  BookOpen,
  Book,
  BarChart3,
  Trophy,
  FileText,
  Home,
  CheckSquare,
  Bell,
  MessageSquare,
  ArrowDownLeft,
  Baby,
  Send,
  MessageCircle,
  Phone,
  User,
  Sparkles,
  Cake,
  Heart,
  Crown,
  UserCheck,
  UserX,
  Hash,
  ArrowLeft,
  Star,
  Church,
  Reply,
  CheckCircle,
  Target,
  ListTodo,
  ClipboardList,
  Plus,
  Edit,
  Trash,
  User2,
  UserPlus2,
  AlertCircle,
  Clock4,
  Flag,
  Gift,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { addMember, updateMember, deleteMember, getMemberAttendance, updateDonation, deleteDonation, addEventAttendance, getEventAttendance, getVolunteerStats } from '../lib/data';
import { getAlertStats } from '../lib/alertsService';
import { smsService } from '../lib/smsService';
import { dashboardService, clearAllCaches } from '../lib/dashboardService';
import { userCacheService } from '../lib/userCache';
import { SmartInsightsQueries } from '../lib/aiInsightsService';

import { familyService } from '../lib/familyService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from '@/lib/authContext';
import { Label } from '@/components/ui/label';
import { formatName, getInitials } from '@/lib/utils/formatters';
import LeadershipVerse from '@/components/LeadershipVerse';
import { PermissionFeature } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/lib/permissions';
import { TaskCreationModal } from '@/components/TaskCreationModal';
// import AIInsightsPanel from '@/components/AIInsightsPanel';
// import DonationAIInsightsPanel from '@/components/DonationAIInsightsPanel';

// Function to check if user has access to any dashboard sections
const getUserAccessiblePages = (userPermissions) => {
  const accessiblePages = [];
  
  if (userPermissions.includes('members:view')) {
    accessiblePages.push({ name: 'Members', path: '/members', icon: Users2, color: 'blue' });
  }
  if (userPermissions.includes('donations:view')) {
    accessiblePages.push({ name: 'Donations', path: '/donations', icon: DollarSign, color: 'emerald' });
  }
  if (userPermissions.includes('events:view')) {
    accessiblePages.push({ name: 'Events', path: '/events', icon: Calendar, color: 'blue' });
  }
  if (userPermissions.includes('tasks:view')) {
    accessiblePages.push({ name: 'Tasks', path: '/tasks', icon: CheckSquare, color: 'orange' });
  }
  if (userPermissions.includes('children:view')) {
    accessiblePages.push({ name: 'Children', path: '/children', icon: Baby, color: 'pink' });
  }
  if (userPermissions.includes('settings:view')) {
    accessiblePages.push({ name: 'SMS', path: '/sms', icon: MessageSquare, color: 'teal' });
  }
  if (userPermissions.includes('reports:view')) {
    accessiblePages.push({ name: 'Reports', path: '/reports', icon: BarChart3, color: 'indigo' });
  }
  
  return accessiblePages;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
};

export function Dashboard() {
  const [stats, setStats] = useState({
    totalPeople: 0,
    activeMembers: 0,
    inactiveMembers: 0,
    visitors: 0,
    totalDonations: 0,
    monthlyDonations: 0,
    weeklyAverage: 0,
    monthlyAverage: 0,
    growthRate: 0,
    upcomingEvents: 0,
    totalEvents: 0,
    eventsThisWeek: 0,
    eventsThisMonth: 0,
    averageEventsPerMonth: 0,
    mostCommonEventType: 'None',
    sundayServiceRate: 0,
    totalVolunteers: 0,
    upcomingVolunteers: 0,
    recentVolunteers: 0,
    eventsNeedingVolunteers: 0,
    sundayServiceAttendance: 0,
    sundayServiceEvents: 0,
    bibleStudyAttendance: 0,
    bibleStudyEvents: 0,
    fellowshipAttendance: 0,
    fellowshipEvents: 0,
    eventsWithVolunteersEnabled: 0,
    totalVolunteersSignedUp: 0,
    eventsStillNeedingVolunteers: 0,
    totalFamilies: 0,
    membersInFamilies: 0,
    membersWithoutFamilies: 0,
    adults: 0,
    children: 0,
    lastMonthDonations: 0,
    twoMonthsAgoDonations: 0,
    lastWeekDonations: 0,
    lastSundayDonations: 0,
    totalTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,

    upcomingBirthdays: 0,
    upcomingAnniversaries: 0,
    upcomingMemberships: 0,
    totalUpcoming: 0,

    // SMS Statistics
    totalSMSMessages: 0,
    recentSMSMessages: 0,
    totalSMSConversations: 0,
    activeSMSConversations: 0,
    outboundSMSMessages: 0,
    inboundSMSMessages: 0,

    sundayServicePercentage: 0,
    bibleStudyPercentage: 0,
    fellowshipPercentage: 0,
  });
  const [recentPeople, setRecentPeople] = useState([]);
  const [people, setPeople] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [weeklyDonations, setWeeklyDonations] = useState([]);
  const [donations, setDonations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState({});
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isPersonDialogOpen, setIsPersonDialogOpen] = useState(false);
  const [selectedPeople, setSelectedPeople] = useState([]);
  const [personSearchQuery, setPersonSearchQuery] = useState('');
  const [allEvents, setAllEvents] = useState([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isEditDonationOpen, setIsEditDonationOpen] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [isDeleteDonationOpen, setIsDeleteDonationOpen] = useState(false);
  const [attendanceTimeRange, setAttendanceTimeRange] = useState('week'); // 'week' or 'month'
  const [recentSMSConversations, setRecentSMSConversations] = useState([]);
  const [personalTasks, setPersonalTasks] = useState([]);
  const [donationTrendAnalysis, setDonationTrendAnalysis] = useState({});
  const [weeklyDonationBreakdown, setWeeklyDonationBreakdown] = useState([]);
  const [organizationId, setOrganizationId] = useState(null);

  // SMS Conversation Dialog state
  const [selectedSMSConversation, setSelectedSMSConversation] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  
  // Advanced Analytics Card Dialog state
  const [selectedCardType, setSelectedCardType] = useState(null);
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);
  const [atRiskMembers, setAtRiskMembers] = useState([]);
  const [isLoadingAtRiskMembers, setIsLoadingAtRiskMembers] = useState(false);
  
  // Task Creation Modal state
  const [isTaskCreationModalOpen, setIsTaskCreationModalOpen] = useState(false);
  const [currentTaskSuggestion, setCurrentTaskSuggestion] = useState(null);
  
  // Member data for task creation
  const [inactiveMembers, setInactiveMembers] = useState([]);
  const [activeMembers, setActiveMembers] = useState([]);
  const [recentVisitors, setRecentVisitors] = useState([]);
  
  // Function to get card status and colors based on metrics
  const getCardStatus = (cardType) => {
    if (isLoading) return { status: 'loading', colors: { bg: 'from-slate-500 to-slate-600', border: 'border-slate-200/50', text: 'text-slate-600' } };
    
    switch (cardType) {
      case 'sunday-service-rate':
        if (stats.sundayServiceRate >= 80) return { status: 'excellent', colors: { bg: 'from-emerald-500 to-green-500', border: 'border-emerald-200/50', text: 'text-emerald-600' } };
        if (stats.sundayServiceRate >= 60) return { status: 'good', colors: { bg: 'from-blue-500 to-cyan-500', border: 'border-blue-200/50', text: 'text-blue-600' } };
        return { status: 'needs-attention', colors: { bg: 'from-amber-500 to-orange-500', border: 'border-amber-200/50', text: 'text-amber-600' } };
      
      case 'weekly-trend':
        if (donationTrendAnalysis.trend > 0) return { status: 'excellent', colors: { bg: 'from-emerald-500 to-green-500', border: 'border-emerald-200/50', text: 'text-emerald-600' } };
        if (donationTrendAnalysis.trend === 0) return { status: 'good', colors: { bg: 'from-blue-500 to-cyan-500', border: 'border-blue-200/50', text: 'text-blue-600' } };
        return { status: 'needs-attention', colors: { bg: 'from-red-500 to-rose-500', border: 'border-red-200/50', text: 'text-red-600' } };
      
      case 'event-activity':
        if (stats.eventsThisMonth >= stats.averageEventsPerMonth) return { status: 'excellent', colors: { bg: 'from-emerald-500 to-green-500', border: 'border-emerald-200/50', text: 'text-emerald-600' } };
        return { status: 'needs-attention', colors: { bg: 'from-amber-500 to-orange-500', border: 'border-amber-200/50', text: 'text-amber-600' } };
      
      case 'task-management':
        if (stats.overdueTasks === 0) return { status: 'excellent', colors: { bg: 'from-emerald-500 to-green-500', border: 'border-emerald-200/50', text: 'text-emerald-600' } };
        if (stats.overdueTasks <= 2) return { status: 'good', colors: { bg: 'from-blue-500 to-cyan-500', border: 'border-blue-200/50', text: 'text-blue-600' } };
        return { status: 'needs-attention', colors: { bg: 'from-red-500 to-rose-500', border: 'border-red-200/50', text: 'text-red-600' } };
      
      case 'volunteer-engagement':
        if (stats.eventsStillNeedingVolunteers === 0) return { status: 'excellent', colors: { bg: 'from-emerald-500 to-green-500', border: 'border-emerald-200/50', text: 'text-emerald-600' } };
        if (stats.eventsStillNeedingVolunteers <= 2) return { status: 'good', colors: { bg: 'from-blue-500 to-cyan-500', border: 'border-blue-200/50', text: 'text-blue-600' } };
        return { status: 'needs-attention', colors: { bg: 'from-red-500 to-rose-500', border: 'border-red-200/50', text: 'text-red-600' } };
      
      case 'recent-visitors':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentVisitors = people.filter(person => 
          person.status === 'visitor' && 
          new Date(person.createdAt) >= thirtyDaysAgo
        ).length;
        if (recentVisitors >= 3) return { status: 'excellent', colors: { bg: 'from-emerald-500 to-green-500', border: 'border-emerald-200/50', text: 'text-emerald-600' } };
        if (recentVisitors >= 1) return { status: 'good', colors: { bg: 'from-blue-500 to-cyan-500', border: 'border-blue-200/50', text: 'text-blue-600' } };
        return { status: 'needs-attention', colors: { bg: 'from-amber-500 to-orange-500', border: 'border-amber-200/50', text: 'text-amber-600' } };
      
      case 'community-health':
        if (stats.inactiveMembers === 0) return { status: 'excellent', colors: { bg: 'from-emerald-500 to-green-500', border: 'border-emerald-200/50', text: 'text-emerald-600' } };
        if (stats.inactiveMembers <= 2) return { status: 'good', colors: { bg: 'from-blue-500 to-cyan-500', border: 'border-blue-200/50', text: 'text-blue-600' } };
        return { status: 'needs-attention', colors: { bg: 'from-red-500 to-rose-500', border: 'border-red-200/50', text: 'text-red-600' } };
      
      case 'family-engagement':
        if (stats.membersWithoutFamilies === 0) return { status: 'excellent', colors: { bg: 'from-emerald-500 to-green-500', border: 'border-emerald-200/50', text: 'text-emerald-600' } };
        if (stats.membersWithoutFamilies <= 3) return { status: 'good', colors: { bg: 'from-blue-500 to-cyan-500', border: 'border-blue-200/50', text: 'text-blue-600' } };
        return { status: 'needs-attention', colors: { bg: 'from-amber-500 to-orange-500', border: 'border-amber-200/50', text: 'text-amber-600' } };
      
      case 'communication':
        if (stats.totalSMSConversations > 0) return { status: 'excellent', colors: { bg: 'from-emerald-500 to-green-500', border: 'border-emerald-200/50', text: 'text-emerald-600' } };
        return { status: 'good', colors: { bg: 'from-blue-500 to-cyan-500', border: 'border-blue-200/50', text: 'text-blue-600' } };
      
      case 'celebrations':
        if (stats.totalUpcoming > 0) return { status: 'excellent', colors: { bg: 'from-emerald-500 to-green-500', border: 'border-emerald-200/50', text: 'text-emerald-600' } };
        return { status: 'needs-attention', colors: { bg: 'from-amber-500 to-orange-500', border: 'border-amber-200/50', text: 'text-amber-600' } };
      
      case 'attendance-diversity':
        const eventTypes = [stats.sundayServiceEvents, stats.bibleStudyEvents, stats.fellowshipEvents].filter(count => count > 0);
        if (eventTypes.length >= 3) return { status: 'excellent', colors: { bg: 'from-emerald-500 to-green-500', border: 'border-emerald-200/50', text: 'text-emerald-600' } };
        if (eventTypes.length >= 2) return { status: 'good', colors: { bg: 'from-blue-500 to-cyan-500', border: 'border-blue-200/50', text: 'text-blue-600' } };
        return { status: 'needs-attention', colors: { bg: 'from-amber-500 to-orange-500', border: 'border-amber-200/50', text: 'text-amber-600' } };
      
      case 'at-risk-members':
        if (atRiskMembers.length === 0) return { status: 'excellent', colors: { bg: 'from-emerald-500 to-green-500', border: 'border-emerald-200/50', text: 'text-emerald-600' } };
        if (atRiskMembers.length <= 2) return { status: 'good', colors: { bg: 'from-blue-500 to-cyan-500', border: 'border-blue-200/50', text: 'text-blue-600' } };
        return { status: 'needs-attention', colors: { bg: 'from-red-500 to-rose-500', border: 'border-red-200/50', text: 'text-red-600' } };
      
      default:
        return { status: 'neutral', colors: { bg: 'from-slate-500 to-slate-600', border: 'border-slate-200/50', text: 'text-slate-600' } };
    }
  };

  // Memoize the date objects to prevent infinite re-renders




  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Use the consolidated dashboard service instead of multiple API calls
      const dashboardData = await dashboardService.getDashboardData();
      
      // Set organization ID for AI insights
      setOrganizationId(dashboardData.organizationId);
      
      // Extract data from the consolidated response
      const { members, donations: donationsData, events: eventsData, tasks, sms, celebrations, attendance, family } = dashboardData;
      
      // Load personal tasks for current user (only if user has task permissions)
      let personalTasksData = [];
      try {
        personalTasksData = await dashboardService.getPersonalTasks(dashboardData.organizationId);
      } catch (error) {
        console.warn('Could not load personal tasks:', error);
        // Don't fail the entire dashboard load for personal tasks
      }
      setPersonalTasks(personalTasksData);
      
      // Transform members data to match existing structure
      const transformedPeople = members.all?.map(person => ({
        ...person,
        firstName: person.firstname || '',
        lastName: person.lastname || '',
        joinDate: person.join_date || '',
        createdAt: person.created_at,
        updatedAt: person.updated_at
      })) || [];

      // Calculate member counts by status
      const activeMembers = transformedPeople.filter(person => person.status === 'active');
      const inactiveMembers = transformedPeople.filter(person => person.status === 'inactive');
      const visitors = transformedPeople.filter(person => person.status === 'visitor');
      const totalPeople = transformedPeople.length;

      // Get recent people (last 5 people regardless of status)
      const recentPeople = transformedPeople
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      // Use pre-calculated stats from the service
      const totalDonations = donationsData.stats.total;
      const monthlyDonations = donationsData.stats.monthly;
      const weeklyAverage = donationsData.stats.weeklyAverage;
      const monthlyAverage = donationsData.stats.monthlyAverage;
      const growthRate = donationsData.stats.growthRate;
      const lastMonthDonations = donationsData.stats.lastMonth;
      const twoMonthsAgoDonations = donationsData.stats.twoMonthsAgo;
      const thisWeekDonations = donationsData.stats.thisWeek;
      const lastWeekDonations = donationsData.stats.lastWeek;
      const lastSundayDonations = donationsData.stats.lastSunday;
      
      // Get sophisticated donation trend analysis
      const donationTrendAnalysis = donationsData.trendAnalysis;
      const weeklyDonationBreakdown = donationsData.weeklyBreakdown;

      // Use pre-calculated event stats
      const upcomingEvents = eventsData.upcoming;
      const totalUpcomingEvents = eventsData.stats.upcoming;
      const eventsThisWeek = eventsData.stats.thisWeek;
      const eventsThisMonth = eventsData.stats.thisMonth;
      const averageEventsPerMonth = eventsData.stats.averagePerMonth;
      const mostCommonEventType = eventsData.stats.mostCommonType;
      const eventsNeedingVolunteers = eventsData.stats.needingVolunteers;

      // Get weekly donations for chart
      const weeklyDonations = donationsData.recent;

      // Set all the stats using consolidated data
      setStats({
        totalPeople: members.counts.total,
        activeMembers: members.counts.active,
        inactiveMembers: members.counts.inactive,
        visitors: members.counts.visitors,
        totalDonations,
        monthlyDonations,
        weeklyAverage,
        monthlyAverage,
        growthRate,
        upcomingEvents: totalUpcomingEvents,
        totalEvents: eventsData.stats.total,
        eventsThisWeek,
        eventsThisMonth,
        averageEventsPerMonth,
        mostCommonEventType,
        sundayServiceRate: attendance.sundayServiceRate,
        totalVolunteers: 0, // Placeholder
        upcomingVolunteers: 0, // Placeholder
        recentVolunteers: 0, // Placeholder
        eventsNeedingVolunteers,
        sundayServiceAttendance: attendance.sundayServiceAttendance,
        sundayServiceEvents: attendance.sundayServiceEvents,
        bibleStudyAttendance: attendance.bibleStudyAttendance,
        bibleStudyEvents: attendance.bibleStudyEvents,
        fellowshipAttendance: attendance.fellowshipAttendance,
        fellowshipEvents: attendance.fellowshipEvents,
        eventsWithVolunteersEnabled: 0, // Placeholder
        totalVolunteersSignedUp: 0, // Placeholder
        eventsStillNeedingVolunteers: 0, // Placeholder
        totalFamilies: family.totalFamilies,
        membersInFamilies: family.membersInFamilies,
        membersWithoutFamilies: family.membersWithoutFamilies,
        adults: family.adults,
        children: family.children,
        lastMonthDonations,
        twoMonthsAgoDonations,
        thisWeekDonations,
        lastWeekDonations,
        lastSundayDonations,
        totalTasks: tasks.stats.total,
        pendingTasks: tasks.stats.pending,
        completedTasks: tasks.stats.completed,
        overdueTasks: tasks.stats.overdue,
        upcomingBirthdays: celebrations.upcomingBirthdays,
        upcomingAnniversaries: celebrations.upcomingAnniversaries,
        upcomingMemberships: celebrations.upcomingMemberships,
        totalUpcoming: celebrations.totalUpcoming,
        upcomingMembers: celebrations.upcomingMembers || [],

        // SMS Statistics
        totalSMSMessages: sms.totalMessages,
        recentSMSMessages: sms.recentMessages,
        totalSMSConversations: sms.totalConversations,
        activeSMSConversations: sms.activeConversations,
        outboundSMSMessages: sms.outboundMessages,
        inboundSMSMessages: sms.inboundMessages,

        sundayServicePercentage: attendance.sundayServicePercentage || 0,
        bibleStudyPercentage: attendance.bibleStudyPercentage || 0,
        fellowshipPercentage: attendance.fellowshipPercentage || 0,
      });

      setRecentPeople(members.recent);
      setPeople(transformedPeople);
      setUpcomingEvents(upcomingEvents);
      setWeeklyDonations(weeklyDonations);
      setDonations(donationsData.all);
      setRecentSMSConversations(sms.recentConversations || []);
      setDonationTrendAnalysis(donationTrendAnalysis || {});
      setWeeklyDonationBreakdown(weeklyDonationBreakdown || []);
      
      // Set member data for task creation
      setInactiveMembers(inactiveMembers);
      setActiveMembers(activeMembers);
      
      // Calculate recent visitors (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentVisitorsData = visitors.filter(person => 
        new Date(person.createdAt) >= thirtyDaysAgo
      );
      setRecentVisitors(recentVisitorsData);

      // Load at-risk members after main data is loaded
      if (dashboardData.organizationId) {
        try {
          const atRiskData = await SmartInsightsQueries.getAtRiskMembers(dashboardData.organizationId);
          setAtRiskMembers(atRiskData);
        } catch (error) {
          console.warn('Could not load at-risk members:', error);
          // Don't fail the entire dashboard load for at-risk members
        }
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try refreshing the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Clear cache when component unmounts or user changes
  useEffect(() => {
    return () => {
      // Clear cache when component unmounts to prevent stale data
      dashboardService.clearCache();
    };
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Badge activation sequence - activate badges after data loads
  useEffect(() => {

  }, [isLoading]);

  const handleOpenRSVPModal = async (eventId) => {
    setSelectedEvent({ id: eventId });
    setSelectedPeople([]);
    setPersonSearchQuery('');
    setIsPersonDialogOpen(true);
    
    try {
      const existingRecords = await getEventAttendance(eventId);
      
      if (existingRecords) {
        setSelectedPeople(existingRecords.map(record => record.member_id));
      }
    } catch (error) {
      console.error('Error fetching event attendance:', error);
    }
  };

  const handlePersonClick = async (person) => {
    try {
      await addEventAttendance(selectedEvent.id, person.id, 'attending');

      setSelectedPeople(prev => [...prev, person.id]);
      setPersonSearchQuery('');

      toast({
        title: "Success",
        description: "Person added to the event."
      });

      // Refresh the selected people list
      const existingRecords = await getEventAttendance(selectedEvent.id);

      if (existingRecords) {
        setSelectedPeople(existingRecords.map(record => record.member_id));
      }
    } catch (error) {
      console.error('Error adding person to event:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add person to the event. Please try again."
      });
    }
  };

  const handleMemberProfileClick = (memberId) => {
    if (memberId) {
      window.location.href = `/members/${memberId}`;
    }
  };

  const handleDone = () => {
    setIsPersonDialogOpen(false);
    setSelectedEvent(null);
    setSelectedPeople([]);
    setPersonSearchQuery('');
  };

  // Filter people based on search query and exclude already RSVP'd people
  const filteredPeople = people.filter(person => {
    const fullName = `${person.firstname} ${person.lastname}`.toLowerCase();
    const query = personSearchQuery.toLowerCase();
    const isSelected = selectedPeople.includes(person.id);
    return fullName.includes(query) && !isSelected;
  });

  const getSundayDate = (dateString) => {
    const date = parseISO(dateString);
    if (!isValid(date)) {
      console.error('Invalid date:', dateString);
      return null;
    }
    const sunday = startOfWeek(date, { weekStartsOn: 0 }); // 0 = Sunday
    return {
      sunday: format(sunday, 'yyyy-MM-dd'),
      displayDate: format(sunday, 'MMM d, yyyy')
    };
  };

  const handleEditDonation = async (donation) => {
    setSelectedDonation(donation);
    setIsEditDonationOpen(true);
  };

  const handleDeleteDonation = async (donation) => {
    setSelectedDonation(donation);
    setIsDeleteDonationOpen(true);
  };

  const handleUpdateDonation = async (updatedDonation) => {
    try {
      await updateDonation(selectedDonation.id, updatedDonation);

      toast({
        title: "Success",
        description: "Donation updated successfully."
      });

      setIsEditDonationOpen(false);
      setSelectedDonation(null);
      loadDashboardData(); // Refresh the data
    } catch (error) {
      console.error('Error updating donation:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update donation."
      });
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteDonation(selectedDonation.id);

      toast({
        title: "Success",
        description: "Donation deleted successfully."
      });

      setIsDeleteDonationOpen(false);
      setSelectedDonation(null);
      loadDashboardData(); // Refresh the data
    } catch (error) {
      console.error('Error deleting donation:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete donation."
      });
    }
  };

  const handleSMSConversationClick = async (conversation) => {
    try {
      const fullConversation = await smsService.getConversation(conversation.id);
      setSelectedSMSConversation(fullConversation);
    } catch (error) {
      console.error('Error fetching SMS conversation:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load conversation details."
      });
    }
  };

  const handleCloseSMSDialog = () => {
    setSelectedSMSConversation(null);
  };

  // Use sophisticated donation trend analysis from state
  const trendAnalysis = donationTrendAnalysis || {};
  const donationTrend = trendAnalysis.primaryTrend;
  const canCalculateTrend = trendAnalysis.canCalculateTrend || false;
  const trendDescription = trendAnalysis.trendDescription || '';
  const trendContext = trendAnalysis.trendContext || '';
  const currentWeekOfMonth = trendAnalysis.currentWeekOfMonth || 0;
  const weekAnalyzed = trendAnalysis.weekAnalyzed || currentWeekOfMonth;
  
  console.log('📊 [Dashboard] Sophisticated donation trend analysis:', trendAnalysis);

  // SMS Helper Functions
  const getUniqueMessageCount = (messages) => {
    if (!messages || messages.length === 0) return 0;
    
    const seenMessages = new Set();
    let uniqueCount = 0;
    
    messages.forEach((message) => {
      // For outbound messages, group by content only (ignore timestamp for grouping)
      // For inbound messages, keep them separate since they're from different people
      const messageKey = message.direction === 'outbound' 
        ? `${message.direction}-${message.body}`
        : `${message.direction}-${message.body}-${message.sent_at}-${message.member?.id || 'unknown'}`;
      
      if (!seenMessages.has(messageKey)) {
        seenMessages.add(messageKey);
        uniqueCount++;
      }
    });
    
    return uniqueCount;
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      toast({
        title: 'Missing Message',
        description: 'Please enter a reply message.',
        variant: 'destructive'
      });
      return;
    }

    if (!selectedSMSConversation) {
      toast({
        title: 'Error',
        description: 'No conversation selected.',
        variant: 'destructive'
      });
      return;
    }

    setIsSendingReply(true);
    try {
      // Find the phone number to reply to from the conversation
      const inboundMessage = selectedSMSConversation.sms_messages?.find(m => m.direction === 'inbound');
      if (!inboundMessage) {
        throw new Error('No inbound message found to reply to');
      }

      await smsService.sendMessage({
        conversation_id: selectedSMSConversation.id,
        to_number: inboundMessage.from_number,
        body: replyMessage,
        member_id: inboundMessage.member_id,
        template_id: null, // Replies don't use templates
        variables: {}
      });

      toast({
        title: 'Success',
        description: 'Reply sent successfully'
      });

      setReplyMessage('');
      
      // Refresh the conversation
      const updatedConversation = await smsService.getConversation(selectedSMSConversation.id);
      setSelectedSMSConversation(updatedConversation);
      
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to send reply: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setIsSendingReply(false);
    }
  };

  // Advanced Analytics Card Click Handler
  const handleCardClick = async (cardType) => {
    setSelectedCardType(cardType);
    setIsCardDialogOpen(true);
    
    // Load at-risk members if needed
    if (cardType === 'at-risk-members' && atRiskMembers.length === 0) {
      await loadAtRiskMembers();
    }
  };

  // Load At-Risk Members
  const loadAtRiskMembers = async () => {
    if (!organizationId) return;
    
    setIsLoadingAtRiskMembers(true);
    try {
      const atRiskData = await SmartInsightsQueries.getAtRiskMembers(organizationId);
      setAtRiskMembers(atRiskData);
    } catch (error) {
      console.error('Error loading at-risk members:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load at-risk members data."
      });
    } finally {
      setIsLoadingAtRiskMembers(false);
    }
  };

  // Task Creation Handler
  const handleCreateTask = (suggestion = null) => {
    // If suggestion is a string, convert it to a proper suggestion object
    let suggestionObject = suggestion;
    if (typeof suggestion === 'string') {
      suggestionObject = {
        title: suggestion,
        description: suggestion,
        content: suggestion
      };
    }
    setCurrentTaskSuggestion(suggestionObject);
    setIsTaskCreationModalOpen(true);
  };

  const handleTaskCreated = () => {
    setIsTaskCreationModalOpen(false);
    setCurrentTaskSuggestion(null);
    // Refresh dashboard data to show updated task counts
    refreshDashboard();
  };

  // Refresh function that clears cache and reloads data
  const refreshDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      clearAllCaches();
      // Also clear attendance cache if available
      if (window.clearAttendanceCache) {
        window.clearAttendanceCache();
      }
      // Clear user cache to ensure fresh data
      userCacheService.clearCache();
      await loadDashboardData();
      toast({
        title: "Success",
        description: "Dashboard data refreshed",
      });
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      toast({
        title: "Error",
        description: "Failed to refresh dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [loadDashboardData, toast]);

  return (
    <motion.div 
      className="min-h-screen w-full max-w-full overflow-x-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="w-full max-w-7xl mx-auto min-w-0 px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 overflow-x-hidden">
        {/* Header - Compact Design */}
        <motion.div className="mb-3 sm:mb-4 relative" variants={itemVariants}>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 blur-3xl rounded-3xl"></div>
          <div className="relative backdrop-blur-sm bg-white/90 dark:bg-slate-900/95 border border-white/30 dark:border-slate-700/50 rounded-2xl sm:rounded-3xl p-2 sm:p-4 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-3 lg:space-y-0">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent mb-1">
                  Command Center
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-base font-medium">
                  Intelligent Church Management System
                </p>
              </div>
              
              <div className="flex-shrink-0 max-w-md">
                <LeadershipVerse />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Check if user has access to any dashboard sections */}
        {(() => {
          const userPermissions = user?.user_metadata?.permissions || [];
          const accessiblePages = getUserAccessiblePages(userPermissions);
          
          // Check if any dashboard sections would be visible
          const hasDashboardAccess = 
            userPermissions.includes('members:view') ||
            userPermissions.includes('donations:view') ||
            userPermissions.includes('events:view') ||
            userPermissions.includes('tasks:view') ||
            userPermissions.includes('settings:view') ||
            userPermissions.includes('reports:view');
          
          if (!hasDashboardAccess && accessiblePages.length > 0) {
            return (
              <motion.div variants={itemVariants} className="mb-6 sm:mb-12">
                <div className="group relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-slate-500 to-slate-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
                  <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl">
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-slate-500 to-slate-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Home className="h-8 w-8 text-white" />
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                        Welcome to Your Dashboard
                      </h2>
                      <p className="text-slate-600 dark:text-slate-400 text-lg">
                        You have access to the following features:
                      </p>
                    </div>
                    
                    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {accessiblePages.map((page, index) => {
                        const IconComponent = page.icon;
                        const colorClasses = {
                          blue: 'from-blue-500 to-blue-600 text-blue-600',
                          emerald: 'from-emerald-500 to-emerald-600 text-emerald-600',
                          orange: 'from-orange-500 to-orange-600 text-orange-600',
                          pink: 'from-pink-500 to-pink-600 text-pink-600',
                          teal: 'from-teal-500 to-teal-600 text-teal-600',
                          indigo: 'from-indigo-500 to-indigo-600 text-indigo-600'
                        };
                        
                        return (
                          <motion.div 
                            key={page.path}
                            variants={itemVariants}
                            className="group/card relative"
                          >
                            <div className={`absolute -inset-0.5 bg-gradient-to-r ${colorClasses[page.color]}/20 rounded-2xl blur opacity-0 group-hover/card:opacity-100 transition duration-300`}></div>
                            <div className="relative backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                              <div className="flex items-center gap-4 mb-4">
                                <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[page.color]} rounded-xl flex items-center justify-center shadow-lg`}>
                                  <IconComponent className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                    {page.name}
                                  </h3>
                                </div>
                              </div>
                              
                              <Button 
                                className={`w-full bg-gradient-to-r ${colorClasses[page.color]} hover:opacity-90 transition-all duration-300`}
                                asChild
                              >
                                <a href={page.path} className="flex items-center justify-center space-x-2">
                                  <span>Access {page.name}</span>
                                  <ArrowUpRight className="h-4 w-4" />
                                </a>
                              </Button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 text-center">
                      <p className="text-slate-500 dark:text-slate-400 text-sm">
                        Contact your administrator if you need access to additional features.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          }
          
          return null;
        })()}

        {/* Main Analytics Grid - Next-Gen Design */}
        <div className="grid gap-3 sm:gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-3 mb-6 sm:mb-12">
          {/* People Analytics */}
          <PermissionFeature permission={PERMISSIONS.MEMBERS_VIEW}>
            <motion.div variants={itemVariants}>
              <div className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
                <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-3 sm:p-6 lg:p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Users2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">People</h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                      {isLoading ? '---' : stats.totalPeople}
                    </div>
                    <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Growing
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Active Members</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{stats.activeMembers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Visitors</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{stats.visitors}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Engagement Rate</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-700"
                          style={{ width: `${Math.round((stats.activeMembers / Math.max(stats.totalPeople, 1)) * 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{Math.round((stats.activeMembers / Math.max(stats.totalPeople, 1)) * 100)}%</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <Button 
                    variant="outline" 
                    className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-all duration-300" 
                    asChild
                  >
                    <a href="/members" className="flex items-center justify-center space-x-2">
                      <span>View All People</span>
                      <ChevronRight className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
          </PermissionFeature>

          {/* Financial Analytics */}
          <PermissionFeature permission={PERMISSIONS.DONATIONS_VIEW}>
            <motion.div variants={itemVariants}>
              <div className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
                <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-3 sm:p-6 lg:p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">Donations</h3>                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-emerald-600 mb-1">
                      {isLoading ? '---' : `$${Math.round(stats.monthlyDonations || stats.lastMonthDonations || 0).toLocaleString()}`}
                    </div>
                    <div className="flex items-center text-sm text-emerald-600">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Monthly
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Monthly Avg</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">${(stats.monthlyAverage || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Weekly Avg</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">${(stats.weeklyAverage || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Last Week</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">${(stats.lastWeekDonations || 0).toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <Button 
                    variant="outline" 
                    className="w-full bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800 hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-900/30 dark:hover:to-teal-900/30 transition-all duration-300" 
                    asChild
                  >
                    <a href="/donations" className="flex items-center justify-center space-x-2">
                      <span>View All Donations</span>
                      <ChevronRight className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
          </PermissionFeature>

        {/* Events & Activities */}
        <PermissionFeature permission={PERMISSIONS.EVENTS_VIEW}>
          <motion.div variants={itemVariants}>
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
              <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-3 sm:p-6 lg:p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Events</h3>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {isLoading ? '---' : stats.upcomingEvents || 0}
                  </div>
                  <div className="flex items-center text-sm text-blue-600">
                    <Clock className="h-4 w-4 mr-1" />
                    Upcoming
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Need Volunteers</span>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-semibold text-orange-600">{stats.eventsNeedingVolunteers || 0}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">This Week</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{stats.eventsThisWeek}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Most Common</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[120px]">
                    {stats.mostCommonEventType === 'Worship Service' ? 'Sunday' :
                     stats.mostCommonEventType === 'Bible Study' ? 'Bible Study' :
                     stats.mostCommonEventType === 'Fellowship' ? 'Fellowship' :
                     stats.mostCommonEventType === 'Other' ? 'Other' :
                     stats.mostCommonEventType === 'None' ? 'None' :
                     stats.mostCommonEventType}
                  </span>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button 
                  variant="outline" 
                  className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-all duration-300" 
                  asChild
                >
                  <a href="/events" className="flex items-center justify-center space-x-2">
                    <span>View All Events</span>
                    <ChevronRight className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
        </PermissionFeature>

        {/* Celebrations */}
        <PermissionFeature permission={PERMISSIONS.REPORTS_VIEW}>
          <motion.div variants={itemVariants}>
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
              <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-3 sm:p-6 lg:p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Bell className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Celebrations</h3>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-yellow-600 mb-1">
                    {isLoading ? '---' : stats.totalUpcoming || 0}
                  </div>
                  <div className="flex items-center text-sm text-yellow-600">
                    <Sparkles className="h-4 w-4 mr-1" />
                    Upcoming
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Birthdays</span>
                  <div className="flex items-center space-x-1">
                    <Cake className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-semibold text-yellow-600">{stats.upcomingBirthdays || 0}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Anniversaries</span>
                  <div className="flex items-center space-x-1">
                    <Heart className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-semibold text-red-600">{stats.upcomingAnniversaries || 0}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Memberships</span>
                  <div className="flex items-center space-x-1">
                    <Crown className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-semibold text-orange-600">{stats.upcomingMemberships || 0}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button 
                  variant="outline" 
                  className="w-full bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800 hover:from-yellow-100 hover:to-orange-100 dark:hover:from-yellow-900/30 dark:hover:to-orange-900/30 transition-all duration-300" 
                  asChild
                >
                  <a href="/alerts" className="flex items-center justify-center space-x-2">
                    <span>View All Celebrations</span>
                    <ChevronRight className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
        </PermissionFeature>

        {/* Tasks & Productivity */}
        <PermissionFeature permission={PERMISSIONS.TASKS_VIEW}>
          <motion.div variants={itemVariants}>
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
              <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-3 sm:p-6 lg:p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <CheckSquare className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Tasks</h3>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-orange-600 mb-1">
                    {isLoading ? '---' : stats.pendingTasks || 0}
                  </div>
                  <div className="flex items-center text-sm text-orange-600">
                    <Activity className="h-4 w-4 mr-1" />
                    Pending
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Total Tasks</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{stats.totalTasks || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Completed</span>
                  <div className="flex items-center space-x-1">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-600">{stats.completedTasks || 0}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Overdue</span>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-semibold text-red-600">{stats.overdueTasks || 0}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button 
                  variant="outline" 
                  className="w-full bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800 hover:from-orange-100 hover:to-red-100 dark:hover:from-orange-900/30 dark:hover:to-red-900/30 transition-all duration-300" 
                  asChild
                >
                  <a href="/tasks" className="flex items-center justify-center space-x-2">
                    <span>View All Tasks</span>
                    <ChevronRight className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
        </PermissionFeature>

        {/* Communications */}
        <PermissionFeature permission={PERMISSIONS.SETTINGS_VIEW}>
          <motion.div variants={itemVariants}>
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
              <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-3 sm:p-6 lg:p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">SMS</h3>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-teal-600 mb-1">
                    {isLoading ? '---' : stats.recentSMSMessages || 0}
                  </div>
                  <div className="flex items-center text-sm text-teal-600">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Recent
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Total Conversations</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{stats.totalSMSConversations || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Outbound</span>
                  <div className="flex items-center space-x-1">
                    <Send className="h-4 w-4 text-teal-600" />
                    <span className="text-sm font-semibold text-teal-600">{stats.outboundSMSMessages || 0}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Inbound</span>
                  <div className="flex items-center space-x-1">
                    <ArrowDownLeft className="h-4 w-4 text-cyan-600" />
                    <span className="text-sm font-semibold text-cyan-600">{stats.inboundSMSMessages || 0}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button 
                  variant="outline" 
                  className="w-full bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border-teal-200 dark:border-teal-800 hover:from-teal-100 hover:to-cyan-100 dark:hover:from-teal-900/30 dark:hover:to-cyan-900/30 transition-all duration-300" 
                  asChild
                >
                  <a href="/sms" className="flex items-center justify-center space-x-2">
                    <span>View All Messages</span>
                    <ChevronRight className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
        </PermissionFeature>
      </div>

      {/* Personal Tasks and Recent Communication Section */}
      <div className="grid gap-6 sm:gap-8 grid-cols-1 lg:grid-cols-2 mb-6 sm:mb-12">
        {/* Personal Tasks Section - Only show if user has assigned tasks */}
        {personalTasks && personalTasks.length > 0 && (
          <PermissionFeature permission={PERMISSIONS.TASKS_VIEW}>
            <motion.div variants={itemVariants}>
              <div className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-violet-500 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
                <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-3 sm:p-6 lg:p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <ClipboardList className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">My Tasks</h3>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {personalTasks.length}
                  </div>
                  <div className="flex items-center text-sm text-purple-600">
                    <Target className="h-4 w-4 mr-1" />
                    Assigned
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {personalTasks.slice(0, 3).map((task, index) => (
                  <motion.div 
                    key={task.id}
                    className="group/task relative"
                    variants={itemVariants}
                  >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-violet-500/20 rounded-2xl blur opacity-0 group-hover/task:opacity-100 transition duration-300"></div>
                    <div className="relative backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-900 dark:text-white truncate">
                            {task.title}
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            {task.description && task.description.length > 60 
                              ? `${task.description.substring(0, 60)}...` 
                              : task.description || 'No description'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 ml-3">
                          <div className={`w-2 h-2 rounded-full ${
                            task.priority === 'high' ? 'bg-red-500' :
                            task.priority === 'medium' ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}></div>
                          <div className={`w-2 h-2 rounded-full ${
                            task.status === 'pending' ? 'bg-gray-500' :
                            task.status === 'in_progress' ? 'bg-blue-500' :
                            'bg-green-500'
                          }`}></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center space-x-3">
                          {task.requestor && (
                            <div className="flex items-center space-x-1">
                              <User2 className="h-3 w-3" />
                              <span>From: {task.requestor.fullName}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <Flag className="h-3 w-3" />
                            <span className="capitalize">
                              {task.priority === 'high' ? 'High' :
                               task.priority === 'medium' ? 'Medium' :
                               'Low'} Priority
                            </span>
                          </div>
                        </div>
                        {task.due_date && (
                          <div className="flex items-center space-x-1">
                            <Clock4 className="h-3 w-3" />
                            <span>Due: {format(new Date(task.due_date), 'MMM d')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {personalTasks.length > 3 && (
                  <div className="text-center pt-2">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      +{personalTasks.length - 3} more tasks
                    </p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button 
                  variant="outline" 
                  className="w-full bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800 hover:from-purple-100 hover:to-violet-100 dark:hover:from-purple-900/30 dark:hover:to-violet-900/30 transition-all duration-300" 
                  asChild
                >
                  <a href="/tasks" className="flex items-center justify-center space-x-2">
                    <span>View All My Tasks</span>
                    <ChevronRight className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
        </PermissionFeature>
        )}

        {/* Recent Communication Section */}
        <motion.div variants={itemVariants}>
          <div className="group relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
            <div className="relative backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border border-white/20 dark:border-slate-700/20 rounded-3xl p-3 sm:p-6 lg:p-8 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Recent Communication</h3>
                    <p className="text-slate-600 dark:text-slate-400">Smart conversation tracking and engagement</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Live Feed</span>
                </div>
              </div>
              
              <div className="space-y-4 w-full">
                {recentSMSConversations && recentSMSConversations.length > 0 ? (
                  recentSMSConversations.slice(0, 3).map((conversation, index) => (
                    <motion.div 
                      key={conversation.id}
                      className="group/card relative"
                      variants={itemVariants}
                    >
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                      <div 
                        className="relative backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group/item w-full overflow-hidden"
                        onClick={() => handleSMSConversationClick(conversation)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                            conversation.conversation_type === 'prayer_request' ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white' :
                            conversation.conversation_type === 'emergency' ? 'bg-gradient-to-br from-red-500 to-red-600 text-white' :
                            conversation.conversation_type === 'event_reminder' ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' :
                            'bg-gradient-to-br from-slate-500 to-slate-600 text-white'
                          }`}>
                            <MessageSquare className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white truncate text-base">
                              {conversation.title || 'SMS Conversation'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${
                                conversation.conversation_type === 'prayer_request' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' :
                                conversation.conversation_type === 'emergency' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                                conversation.conversation_type === 'event_reminder' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                                'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300'
                              }`}>
                                {(() => {
                                  const type = conversation.conversation_type === 'prayer_request' ? 'Prayer' :
                                             conversation.conversation_type === 'emergency' ? 'Emergency' :
                                             conversation.conversation_type === 'event_reminder' ? 'Event' :
                                             conversation.conversation_type === 'pastoral_care' ? 'Pastoral' :
                                             'General';
                                  return type;
                                })()}
                              </span>
                              {conversation.updated_at && (
                                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                  {format(new Date(conversation.updated_at), 'MMM d')}
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0 ml-2 group-hover/item:text-slate-600 dark:group-hover/item:text-slate-300 transition-colors" />
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">No recent conversations</p>
                    <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">SMS activity will appear here</p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <Button 
                  variant="outline" 
                  className="w-full bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/30 border-indigo-200 dark:border-indigo-800 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900/30 dark:hover:to-purple-900/40 transition-all duration-300 h-12 text-base font-medium" 
                  asChild
                >
                  <a href="/sms" className="flex items-center justify-center space-x-2">
                    <span>View All Conversations</span>
                    <ArrowUpRight className="h-5 w-5" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>



        {/* AI Ministry Insights Panel - TEMPORARILY DISABLED */}
        {/* <PermissionFeature permission={PERMISSIONS.MEMBERS_VIEW}>
          <motion.div variants={itemVariants} className="mb-6 sm:mb-12">
            <AIInsightsPanel organizationId={organizationId} />
          </motion.div>
        </PermissionFeature> */}

              {/* Donation AI Insights Panel - TEMPORARILY DISABLED */}
      {/* <PermissionFeature permission={PERMISSIONS.DONATIONS_VIEW}>
        <motion.div variants={itemVariants} className="mb-6 sm:mb-12">
          <DonationAIInsightsPanel organizationId={organizationId} />
        </motion.div>
      {/* Advanced Analytics Section */}
      <PermissionFeature permission={PERMISSIONS.REPORTS_VIEW}>
        <motion.div variants={itemVariants} className="mb-6 sm:mb-12">
          <div className="group relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
            <div className="relative backdrop-blur-sm bg-white/90 dark:bg-slate-800/90 border border-white/30 dark:border-slate-700/30 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Advanced Analytics</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-lg">Intelligent insights and performance metrics</p>
                </div>
                          </div>
          </div>
          
            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
               {/* Sunday Service Attendance Rate */}
               <motion.div 
                 className="group/card relative cursor-pointer" 
                 variants={itemVariants}
                 onClick={() => handleCardClick('sunday-service-rate')}
               >
                 <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/30 to-teal-500/30 rounded-xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                 <div className="relative bg-white/95 dark:bg-slate-800/95 border border-emerald-200/50 dark:border-emerald-700/50 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-300">
                   <div className="flex items-center gap-3 mb-4">
                     <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md">
                       <BookOpen className="h-5 w-5 text-white" />
                    </div>
                     <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Sunday Service Rate</h4>
                  </div>
                   <div className="space-y-3">
                     <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                       {isLoading ? '...' : `${stats.sundayServiceRate.toFixed(0)}%`}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                       Active members who attend Sunday service
                    </p>
                     <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                       {stats.sundayServiceRate >= 70 ? 'Excellent engagement' : 
                        stats.sundayServiceRate >= 50 ? 'Good participation' : 'Focus on outreach'}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Donation Growth */}
              <motion.div 
                className="group/card relative cursor-pointer" 
                variants={itemVariants}
                onClick={() => handleCardClick('weekly-trend')}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 rounded-xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                <div className="relative bg-white/95 dark:bg-slate-800/95 border border-blue-200/50 dark:border-blue-700/50 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Weekly Trend</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                      {isLoading ? '...' : !canCalculateTrend ? `Week ${weekAnalyzed}` : (donationTrend > 0 ? '+' : '') + donationTrend.toFixed(1) + '%'}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {!canCalculateTrend ? trendContext : trendDescription}
                    </p>
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      {donationTrend > 0 ? 'Strong stewardship' : donationTrend < 0 ? 'Focus on giving' : 'Building momentum'}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Event Activity */}
              <motion.div 
                className="group/card relative cursor-pointer" 
                variants={itemVariants}
                onClick={() => handleCardClick('event-activity')}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                <div className="relative bg-white/95 dark:bg-slate-800/95 border border-purple-200/50 dark:border-purple-700/50 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Event Activity</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {isLoading ? '...' : stats.eventsThisMonth >= stats.averageEventsPerMonth ? 'At or Above' : 'Below'} Average
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {stats.eventsThisMonth} events this month vs {stats.averageEventsPerMonth} average
                    </p>
                    <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                      {stats.eventsNeedingVolunteers > 0 ? `${stats.eventsNeedingVolunteers} events need volunteers` : 'Strong event planning'}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Task Management */}
              <motion.div 
                className="group/card relative cursor-pointer" 
                variants={itemVariants}
                onClick={() => handleCardClick('task-management')}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/30 to-orange-500/30 rounded-xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                <div className="relative bg-white/95 dark:bg-slate-800/95 border border-amber-200/50 dark:border-amber-700/50 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
                      <CheckSquare className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">On-Time Completion</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                      {isLoading ? '...' : stats.totalTasks > 0 ? `${((stats.totalTasks - stats.overdueTasks) / stats.totalTasks * 100).toFixed(0)}%` : '0%'}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {stats.overdueTasks} overdue tasks need attention
                    </p>
                    <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                      {stats.overdueTasks > 0 ? 'Address overdue tasks first' : 'Maintain current workflow'}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Volunteer Engagement */}
              <motion.div 
                className="group/card relative cursor-pointer" 
                variants={itemVariants}
                onClick={() => handleCardClick('volunteer-engagement')}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500/30 to-fuchsia-500/30 rounded-xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                <div className="relative bg-white/95 dark:bg-slate-800/95 border border-violet-200/50 dark:border-violet-700/50 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-md">
                      <Users2 className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Volunteer Engagement</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                      {isLoading ? '...' : stats.eventsStillNeedingVolunteers === 0 ? 'Fully Staffed' : 'Needs Volunteers'}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {stats.eventsStillNeedingVolunteers} events need volunteers
                    </p>
                    <div className="text-xs text-violet-600 dark:text-violet-400 font-medium">
                      {stats.eventsStillNeedingVolunteers === 0 ? 'Excellent coverage' : 'Recruit more volunteers'}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Recent Visitors */}
              <motion.div 
                className="group/card relative cursor-pointer" 
                variants={itemVariants}
                onClick={() => handleCardClick('recent-visitors')}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500/30 to-pink-500/30 rounded-xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                <div className="relative bg-white/95 dark:bg-slate-800/95 border border-rose-200/50 dark:border-rose-700/50 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md">
                      <UserPlus className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Visitors</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                      {isLoading ? '...' : (() => {
                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        return people.filter(person => 
                          person.status === 'visitor' && 
                          new Date(person.createdAt) >= thirtyDaysAgo
                        ).length;
                      })()}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      New visitors in last 30 days
                    </p>
                    <div className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                      {(() => {
                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        const recentVisitors = people.filter(person => 
                          person.status === 'visitor' && 
                          new Date(person.createdAt) >= thirtyDaysAgo
                        ).length;
                        return recentVisitors >= 3 ? 'Strong outreach' : recentVisitors >= 1 ? 'Growing' : 'Focus on invitations';
                      })()}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Community Health */}
              <motion.div 
                className="group/card relative cursor-pointer" 
                variants={itemVariants}
                onClick={() => handleCardClick('community-health')}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/30 to-indigo-500/30 rounded-xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                <div className="relative bg-white/95 dark:bg-slate-800/95 border border-blue-200/50 dark:border-blue-700/50 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-md">
                      <Heart className="h-5 w-5 text-white" />
                </div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Community Health</h4>
                </div>
                  <div className="space-y-3">
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {isLoading ? '...' : stats.inactiveMembers === 0 ? 'Excellent' : stats.inactiveMembers < 5 ? 'Good' : 'Needs Attention'}
                     </div>
                     <p className="text-sm text-slate-600 dark:text-slate-400">
                      {stats.inactiveMembers === 0 ? 'All members engaged' : `${stats.inactiveMembers} members need pastoral care`}
                     </p>
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      {stats.inactiveMembers > 0 ? 'Schedule follow-up visits' : 'Maintain current connection level'}
                     </div>
                   </div>
                 </div>
               </motion.div>
                
              {/* Family Engagement */}
              <motion.div 
                className="group/card relative cursor-pointer" 
                variants={itemVariants}
                onClick={() => handleCardClick('family-engagement')}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500/30 to-emerald-500/30 rounded-xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                <div className="relative bg-white/95 dark:bg-slate-800/95 border border-green-200/50 dark:border-green-700/50 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-md">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Family Engagement</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {isLoading ? '...' : stats.totalFamilies > 0 ? `${Math.round((stats.membersInFamilies / Math.max(stats.totalPeople, 1)) * 100)}%` : '0%'}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {stats.totalFamilies} families • {stats.membersInFamilies} members connected
                    </p>
                    <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                      {stats.membersWithoutFamilies > 0 ? `${stats.membersWithoutFamilies} members need family assignment` : 'Strong family connections'}
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* Communication Effectiveness */}
              <motion.div 
                className="group/card relative cursor-pointer" 
                variants={itemVariants}
                onClick={() => handleCardClick('communication')}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500/30 to-purple-500/30 rounded-xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                <div className="relative bg-white/95 dark:bg-slate-800/95 border border-violet-200/50 dark:border-violet-700/50 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md">
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Communication</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                      {isLoading ? '...' : stats.totalSMSConversations > 0 ? 'Active' : 'Growing'}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {stats.totalSMSMessages || 0} messages • {stats.totalSMSConversations || 0} conversations
                    </p>
                    <div className="text-xs text-violet-600 dark:text-violet-400 font-medium">
                      {stats.totalSMSConversations > 0 ? 'Maintain pastoral responsiveness' : 'Encourage two-way communication'}
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* Celebration Engagement */}
              <motion.div 
                className="group/card relative cursor-pointer" 
                variants={itemVariants}
                onClick={() => handleCardClick('celebrations')}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500/30 to-amber-500/30 rounded-xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                <div className="relative bg-white/95 dark:bg-slate-800/95 border border-yellow-200/50 dark:border-yellow-700/50 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl flex items-center justify-center shadow-md">
                      <Gift className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Celebrations</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
                      {isLoading ? '...' : stats.totalUpcoming || 0}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Upcoming celebrations this month
                    </p>
                    <div className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                      {stats.totalUpcoming > 0 ? 'Plan celebration outreach' : 'No upcoming celebrations'}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Attendance Diversity */}
              <motion.div 
                className="group/card relative cursor-pointer" 
                variants={itemVariants}
                onClick={() => handleCardClick('attendance-diversity')}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/30 to-teal-500/30 rounded-xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                <div className="relative bg-white/95 dark:bg-slate-800/95 border border-cyan-200/50 dark:border-cyan-700/50 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md">
                      <Target className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Attendance Diversity</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                      {isLoading ? '...' : (() => {
                        const eventTypes = [stats.sundayServiceEvents, stats.bibleStudyEvents, stats.fellowshipEvents].filter(count => count > 0);
                        return eventTypes.length >= 3 ? 'Excellent' : eventTypes.length >= 2 ? 'Good' : 'Growing';
                      })()}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {stats.sundayServiceEvents || 0} Sunday • {stats.bibleStudyEvents || 0} Bible Study • {stats.fellowshipEvents || 0} Fellowship
                    </p>
                    <div className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">
                      {(() => {
                        const eventTypes = [stats.sundayServiceEvents, stats.bibleStudyEvents, stats.fellowshipEvents].filter(count => count > 0);
                        return eventTypes.length >= 3 ? 'Strong program diversity' : eventTypes.length >= 2 ? 'Good variety' : 'Expand program offerings';
                      })()}
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* At Risk Members */}
              <motion.div 
                className="group/card relative cursor-pointer" 
                variants={itemVariants}
                onClick={() => handleCardClick('at-risk-members')}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500/30 to-rose-500/30 rounded-xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                <div className="relative bg-white/95 dark:bg-slate-800/95 border border-red-200/50 dark:border-red-700/50 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center shadow-md">
                      <AlertTriangle className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">At Risk Members</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                      {isLoading ? '...' : atRiskMembers?.length || 0}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Members needing pastoral care
                    </p>
                    <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                      {atRiskMembers?.length > 0 ? 'Schedule follow-up visits' : 'All members engaged'}
                    </div>
                  </div>
                </div>
              </motion.div>
                </div>

            {/* Additional Insights Row */}
            <div className="mt-8 grid gap-4 sm:gap-6 md:grid-cols-2">
              {/* Top Performing Metric */}
              <motion.div className="group/card relative" variants={itemVariants}>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/30 to-teal-500/30 rounded-xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                <div className="relative bg-white/95 dark:bg-slate-800/95 border border-emerald-200/50 dark:border-emerald-700/50 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md">
                      <Trophy className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Top Performing Area</h4>
              </div>
                {isLoading ? (
                  <Skeleton className="h-4 w-48 mb-2" />
                ) : (
                  <div>
                    <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mb-1">
                      {(() => {
                        const metrics = [
                          { 
                            name: 'Member Engagement', 
                            value: stats.totalPeople > 0 ? (stats.activeMembers / stats.totalPeople) * 100 : 0,
                            condition: stats.totalPeople > 0,
                            recommendation: 'Keep fostering community connections and involvement.'
                          },
                          { 
                            name: 'Sunday Service Rate', 
                            value: stats.sundayServiceRate,
                            condition: stats.sundayServiceRate > 0,
                            recommendation: 'Continue building meaningful Sunday experiences.'
                          },
                          { 
                            name: 'Event Activity', 
                            value: stats.eventsThisMonth >= stats.averageEventsPerMonth ? 100 : 50,
                            condition: stats.eventsThisMonth > 0,
                            recommendation: 'Maintain this strong event planning momentum.'
                          },
                          { 
                            name: 'Donation Growth', 
                            value: donationTrend > 0 ? Math.abs(donationTrend) : 0,
                            condition: donationTrend > 0,
                            recommendation: 'Keep communicating the impact of giving.'
                          },
                          { 
                            name: 'Volunteer Coverage', 
                            value: stats.eventsStillNeedingVolunteers === 0 ? 100 : 0,
                            condition: stats.eventsStillNeedingVolunteers === 0,
                            recommendation: 'Excellent volunteer engagement - keep recognizing their efforts.'
                          },
                          { 
                            name: 'Visitor Growth', 
                            value: (() => {
                              const thirtyDaysAgo = new Date();
                              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                              const recentVisitors = people.filter(person => 
                                person.status === 'visitor' && 
                                new Date(person.createdAt) >= thirtyDaysAgo
                              ).length;
                              return recentVisitors > 0 ? 100 : 0;
                            })(),
                            condition: (() => {
                              const thirtyDaysAgo = new Date();
                              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                              return people.filter(person => 
                                person.status === 'visitor' && 
                                new Date(person.createdAt) >= thirtyDaysAgo
                              ).length > 0;
                            })(),
                            recommendation: 'Great visitor attraction - focus on follow-up and integration.'
                          },
                          { 
                            name: 'Task Management', 
                            value: stats.totalTasks > 0 ? ((stats.totalTasks - stats.overdueTasks) / stats.totalTasks) * 100 : 0,
                            condition: stats.totalTasks > 0 && (stats.totalTasks - stats.overdueTasks) / stats.totalTasks >= 0.8,
                            recommendation: 'Excellent task management - maintain this strong organizational discipline.'
                          },
                          { 
                            name: 'Community Health', 
                            value: stats.inactiveMembers === 0 ? 100 : stats.inactiveMembers < 5 ? 80 : 40,
                            condition: stats.inactiveMembers < 5,
                            recommendation: 'Strong community engagement - maintain pastoral care.'
                          },
                          { 
                            name: 'Family Engagement', 
                            value: stats.totalFamilies > 0 ? Math.round((stats.membersInFamilies / Math.max(stats.totalPeople, 1)) * 100) : 0,
                            condition: stats.totalFamilies > 0 && stats.membersWithoutFamilies === 0,
                            recommendation: 'Excellent family connections - keep building community.'
                          },
                          { 
                            name: 'Communication', 
                            value: stats.totalSMSConversations > 0 ? 100 : 0,
                            condition: stats.totalSMSConversations > 0,
                            recommendation: 'Great communication channels - maintain responsiveness.'
                          },
                          { 
                            name: 'Celebrations', 
                            value: stats.totalUpcoming > 0 ? 100 : 0,
                            condition: stats.totalUpcoming > 0,
                            recommendation: 'Active celebration engagement - keep recognizing milestones.'
                          },
                          { 
                            name: 'Attendance Diversity', 
                            value: (() => {
                              const eventTypes = [stats.sundayServiceEvents, stats.bibleStudyEvents, stats.fellowshipEvents].filter(count => count > 0);
                              return eventTypes.length >= 3 ? 100 : eventTypes.length >= 2 ? 70 : 40;
                            })(),
                            condition: (() => {
                              const eventTypes = [stats.sundayServiceEvents, stats.bibleStudyEvents, stats.fellowshipEvents].filter(count => count > 0);
                              return eventTypes.length >= 2;
                            })(),
                            recommendation: 'Good program diversity - continue expanding offerings.'
                          },
                          { 
                            name: 'At-Risk Members', 
                            value: atRiskMembers.length === 0 ? 100 : atRiskMembers.length < 3 ? 80 : 40,
                            condition: atRiskMembers.length < 3,
                            recommendation: 'Strong member engagement - maintain pastoral care.'
                          }
                        ].filter(m => m.condition && !isNaN(m.value) && isFinite(m.value));
                        
                        if (metrics.length === 0) return 'No data available';
                        
                        const topMetric = metrics.reduce((max, current) => 
                          current.value > max.value ? current : max
                        );
                        
                        return topMetric.name;
                      })()}
                    </p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 break-words">
                      {(() => {
                        const metrics = [
                          { 
                            name: 'Member Engagement', 
                            value: stats.totalPeople > 0 ? (stats.activeMembers / stats.totalPeople) * 100 : 0,
                            condition: stats.totalPeople > 0,
                            recommendation: 'Keep fostering community connections.'
                          },
                          { 
                            name: 'Sunday Service Rate', 
                            value: stats.sundayServiceRate,
                            condition: stats.sundayServiceRate > 0,
                            recommendation: 'Continue building Sunday experiences.'
                          },
                          { 
                            name: 'Event Activity', 
                            value: stats.eventsThisMonth >= stats.averageEventsPerMonth ? 100 : 50,
                            condition: stats.eventsThisMonth > 0,
                            recommendation: 'Maintain event planning momentum.'
                          },
                          { 
                            name: 'Donation Growth', 
                            value: stats.growthRate > 0 ? Math.abs(stats.growthRate) : 0,
                            condition: stats.growthRate > 0,
                            recommendation: 'Keep communicating giving impact.'
                          },
                          { 
                            name: 'Volunteer Coverage', 
                            value: stats.eventsStillNeedingVolunteers === 0 ? 100 : 0,
                            condition: stats.eventsStillNeedingVolunteers === 0,
                            recommendation: 'Great volunteer engagement.'
                          },
                          { 
                            name: 'Visitor Growth', 
                            value: (() => {
                              const thirtyDaysAgo = new Date();
                              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                              const recentVisitors = people.filter(person => 
                                person.status === 'visitor' && 
                                new Date(person.createdAt) >= thirtyDaysAgo
                              ).length;
                              return recentVisitors > 0 ? 100 : 0;
                            })(),
                            condition: (() => {
                              const thirtyDaysAgo = new Date();
                              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                              return people.filter(person => 
                                person.status === 'visitor' && 
                                new Date(person.createdAt) >= thirtyDaysAgo
                              ).length > 0;
                            })(),
                            recommendation: 'Focus on visitor follow-up.'
                          },
                          { 
                            name: 'Task Management', 
                            value: stats.totalTasks > 0 ? ((stats.totalTasks - stats.overdueTasks) / stats.totalTasks) * 100 : 0,
                            condition: stats.totalTasks > 0 && (stats.totalTasks - stats.overdueTasks) / stats.totalTasks >= 0.8,
                            recommendation: 'Maintain organizational discipline.'
                          },
                          { 
                            name: 'Community Health', 
                            value: stats.inactiveMembers === 0 ? 100 : stats.inactiveMembers < 5 ? 80 : 40,
                            condition: stats.inactiveMembers < 5,
                            recommendation: 'Strong community engagement.'
                          },
                          { 
                            name: 'Family Engagement', 
                            value: stats.totalFamilies > 0 ? Math.round((stats.membersInFamilies / Math.max(stats.totalPeople, 1)) * 100) : 0,
                            condition: stats.totalFamilies > 0 && stats.membersWithoutFamilies === 0,
                            recommendation: 'Excellent family connections.'
                          },
                          { 
                            name: 'Communication', 
                            value: stats.totalSMSConversations > 0 ? 100 : 0,
                            condition: stats.totalSMSConversations > 0,
                            recommendation: 'Great communication channels.'
                          },
                          { 
                            name: 'Celebrations', 
                            value: stats.totalUpcoming > 0 ? 100 : 0,
                            condition: stats.totalUpcoming > 0,
                            recommendation: 'Active celebration engagement.'
                          },
                          { 
                            name: 'Attendance Diversity', 
                            value: (() => {
                              const eventTypes = [stats.sundayServiceEvents, stats.bibleStudyEvents, stats.fellowshipEvents].filter(count => count > 0);
                              return eventTypes.length >= 3 ? 100 : eventTypes.length >= 2 ? 70 : 40;
                            })(),
                            condition: (() => {
                              const eventTypes = [stats.sundayServiceEvents, stats.bibleStudyEvents, stats.fellowshipEvents].filter(count => count > 0);
                              return eventTypes.length >= 2;
                            })(),
                            recommendation: 'Good program diversity.'
                          },
                          { 
                            name: 'At-Risk Members', 
                            value: atRiskMembers.length === 0 ? 100 : atRiskMembers.length < 3 ? 80 : 40,
                            condition: atRiskMembers.length < 3,
                            recommendation: 'Strong member engagement.'
                          }
                        ].filter(m => m.condition && !isNaN(m.value) && isFinite(m.value));
                        
                        if (metrics.length === 0) return 'Your strongest metric';
                        
                        const topMetric = metrics.reduce((max, current) => 
                          current.value > max.value ? current : max
                        );
                        
                        return topMetric.recommendation;
                      })()}
                    </p>
            </div>
                )}
          </div>
            </motion.div>

              {/* Growth Opportunity */}
              <motion.div className="group/card relative" variants={itemVariants}>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/30 to-orange-500/30 rounded-xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                <div className="relative bg-white/95 dark:bg-slate-800/95 border border-amber-200/50 dark:border-amber-700/50 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
                      <Activity className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Growth Opportunity</h4>
      </div>
                {isLoading ? (
                  <Skeleton className="h-4 w-48 mb-2" />
                ) : (
                    <div className="space-y-3">
                      <p className="text-lg font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                      {(() => {
                        // Priority 1: Immediate needs
                        if (stats.eventsStillNeedingVolunteers > 0) return 'Volunteer Recruitment';
                    
                        // Priority 2: Donation trends
                        if (donationTrend < 0) return 'Donation Growth';

                          // Priority 3: Community health
                          if (stats.inactiveMembers >= 5) return 'Community Health';

                        // Priority 4: Sunday service attendance
                        if (stats.sundayServiceRate < 50) return 'Sunday Service Attendance';
                        
                          // Priority 5: Event activity
                        if (stats.eventsThisMonth < stats.averageEventsPerMonth) return 'Event Planning';                        
                        
                          // Priority 6: Family engagement
                          if (stats.membersWithoutFamilies > 0) return 'Family Engagement';
                          
                          // Priority 7: Communication
                          if (stats.totalSMSConversations === 0) return 'Communication';
                          
                          // Priority 8: Celebrations
                          if (stats.totalUpcoming === 0) return 'Celebration Engagement';
                          
                          // Priority 9: Attendance diversity
                          const eventTypes = [stats.sundayServiceEvents, stats.bibleStudyEvents, stats.fellowshipEvents].filter(count => count > 0);
                          if (eventTypes.length < 2) return 'Program Diversity';
                          
                          // Priority 10: Visitor follow-up
                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        const recentVisitors = people.filter(person => 
                          person.status === 'visitor' && 
                          new Date(person.createdAt) >= thirtyDaysAgo
                        ).length;
                      
                        if (recentVisitors > 0) return 'Visitor Follow-up';
                          
                          // Priority 11: Member engagement issues
                        if (stats.totalPeople > 0 && (stats.activeMembers / stats.totalPeople) < 0.7) return 'Member Engagement';
                            
                        // Default: Member retention
                        return 'Member Retention';
                      })()}
                    </p>
                    <p className="text-sm text-amber-600 dark:text-amber-400 break-words">
                      {(() => {
                        // Priority 1: Immediate needs
                        if (stats.eventsStillNeedingVolunteers > 0) return 'Reach out for volunteer sign-ups.';
                   
                        // Priority 2: Donation trends
                        if (donationTrend < 0) return 'Share impact stories to encourage giving.';

                          // Priority 3: Community health
                          if (stats.inactiveMembers >= 5) return 'Schedule pastoral care visits.';
                        
                        // Priority 4: Sunday service attendance
                        if (stats.sundayServiceRate < 50) return 'Address attendance barriers.';
                        
                        // Priority 5: Event activity
                        if (stats.eventsThisMonth < stats.averageEventsPerMonth) return 'Plan more events for engagement.';
                        
                          // Priority 6: Family engagement
                          if (stats.membersWithoutFamilies > 0) return 'Assign members to families.';
                          
                          // Priority 7: Communication
                          if (stats.totalSMSConversations === 0) return 'Start SMS communication.';
                          
                          // Priority 8: Celebrations
                          if (stats.totalUpcoming === 0) return 'Plan celebration outreach.';
                          
                          // Priority 9: Attendance diversity
                          const eventTypes = [stats.sundayServiceEvents, stats.bibleStudyEvents, stats.fellowshipEvents].filter(count => count > 0);
                          if (eventTypes.length < 2) return 'Expand program offerings.';
                          
                          // Priority 10: Visitor follow-up
                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        const recentVisitors = people.filter(person => 
                          person.status === 'visitor' && 
                          new Date(person.createdAt) >= thirtyDaysAgo
                        ).length;
                        
                        if (recentVisitors > 0) return 'Follow up with recent visitors.';
                          
                          // Priority 11: Member engagement issues
                          if (stats.totalPeople > 0 && (stats.activeMembers / stats.totalPeople) < 0.7) return 'Focus on engaging inactive members.';
                        
                        // Default: Member retention
                        return 'Focus on member relationships.';
                      })()}
                    </p>
                  </div>
                )}
              </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
      </PermissionFeature>





      {/* Financial Intelligence */}
      <PermissionFeature permission={PERMISSIONS.DONATIONS_VIEW}>
        <motion.div variants={itemVariants} className="mb-6 sm:mb-12">
          <div className="group relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
            <div className="relative backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border border-white/20 dark:border-slate-700/20 rounded-3xl p-3 sm:p-6 lg:p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Donation Statistics</h3>
                  <p className="text-slate-600 dark:text-slate-400">Financial overview of your organization</p>
                </div>
              </div>
            </div>
            
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-8">
              {/* This Week */}
              <motion.div 
                className="group/card relative"
                variants={itemVariants}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-2xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                <div className="relative backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                  <h4 className="text-base font-semibold text-slate-900 dark:text-white mb-3">
                    This Week
                  </h4>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-purple-600 mb-2">
                      {isLoading ? '...' : `$${(stats.thisWeekDonations || 0).toFixed(2)}`}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Current week
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Last Week */}
              <motion.div 
                className="group/card relative"
                variants={itemVariants}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-indigo-600/20 rounded-2xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                <div className="relative backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                  <h4 className="text-base font-semibold text-slate-900 dark:text-white mb-3">
                    Last Week
                  </h4>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-indigo-600 mb-2">
                      {isLoading ? '...' : `$${(stats.lastWeekDonations || 0).toFixed(2)}`}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Previous week
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Weekly Average */}
              <motion.div 
                className="group/card relative"
                variants={itemVariants}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500/20 to-teal-600/20 rounded-2xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                <div className="relative backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                  <h4 className="text-base font-semibold text-slate-900 dark:text-white mb-3">
                    Weekly Average
                  </h4>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-teal-600 mb-2">
                      {isLoading ? '...' : `$${(stats.weeklyAverage || 0).toFixed(2)}`}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Weekly avg
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* This Month */}
              <motion.div 
                className="group/card relative"
                variants={itemVariants}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-2xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                <div className="relative backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                  <h4 className="text-base font-semibold text-slate-900 dark:text-white mb-3">
                    This Month
                  </h4>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-blue-600 mb-2">
                      {isLoading ? '...' : `$${(stats.monthlyDonations || 0).toFixed(2)}`}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {(() => {
                        const now = new Date();
                        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                        const dayOfMonth = now.getDate();
                        const percentComplete = ((dayOfMonth / daysInMonth) * 100).toFixed(1);
                        return `${percentComplete}% completed`;
                      })()}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Last Month */}
              <motion.div 
                className="group/card relative"
                variants={itemVariants}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 rounded-2xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                <div className="relative backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                  <h4 className="text-base font-semibold text-slate-900 dark:text-white mb-3">
                    Last Month
                  </h4>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-emerald-600 mb-2">
                      {isLoading ? '...' : `$${(stats.lastMonthDonations || 0).toFixed(2)}`}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Previous month
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Monthly Average */}
              <motion.div 
                className="group/card relative"
                variants={itemVariants}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 to-amber-600/20 rounded-2xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                <div className="relative backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                  <h4 className="text-base font-semibold text-slate-900 dark:text-white mb-3">
                    Monthly Average
                  </h4>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-amber-600 mb-2">
                      {isLoading ? '...' : `$${(stats.monthlyAverage || 0).toFixed(2)}`}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Monthly avg
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
        </PermissionFeature>

      {/* Event Intelligence */}
      <PermissionFeature permission={PERMISSIONS.EVENTS_VIEW}>
        <motion.div variants={itemVariants} className="mb-6 sm:mb-12">
          <div className="group relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
            <div className="relative backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border border-white/20 dark:border-slate-700/20 rounded-3xl p-3 sm:p-6 lg:p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Event Intelligence</h3>
                  <p className="text-slate-600 dark:text-slate-400">Event planning and engagement metrics</p>
                </div>
              </div>
            </div>
            
            <div className="grid gap-3 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-8">
              {/* Average Per Month */}
              <motion.div 
                className="group/card relative"
                variants={itemVariants}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-2xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                <div className="relative backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                  <h4 className="text-base font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Average Per Month
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Total Events</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {isLoading ? '...' : (stats.averageEventsPerMonth || 0).toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Most Popular</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {isLoading ? '...' : (stats.mostCommonEventType || 'N/A')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Trend</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {isLoading ? '...' : (stats.eventsThisMonth >= stats.averageEventsPerMonth ? 'At or Above' : 'Below')} Average
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* This Week */}
              <motion.div 
                className="group/card relative"
                variants={itemVariants}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 rounded-2xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                <div className="relative backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                  <h4 className="text-base font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-emerald-600" />
                    This Week
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Total Events</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {isLoading ? '...' : (stats.eventsThisWeek || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Need Volunteers</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {isLoading ? '...' : (stats.eventsNeedingVolunteers || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Upcoming</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {isLoading ? '...' : (stats.upcomingEvents || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* This Month */}
              <motion.div 
                className="group/card relative"
                variants={itemVariants}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 to-amber-600/20 rounded-2xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                <div className="relative backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                  <h4 className="text-base font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-amber-600" />
                    This Month
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Total Events</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {isLoading ? '...' : (stats.eventsThisMonth || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">vs Last Month</span>
                      <span className={`text-sm font-semibold ${(stats.eventsThisMonth || 0) >= (stats.eventsLastMonth || 0) ? 'text-emerald-600' : 'text-red-600'}`}>
                        {isLoading ? '...' : (stats.eventsThisMonth >= stats.eventsLastMonth ? '+' : '')}
                        {(stats.eventsThisMonth || 0) - (stats.eventsLastMonth || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Engagement</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {isLoading ? '...' : (stats.eventsThisMonth > 0 ? 'Active' : 'Low')}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
        </PermissionFeature>

      {/* Membership Intelligence */}
      <PermissionFeature permission={PERMISSIONS.MEMBERS_VIEW}>
        <motion.div variants={itemVariants} className="mb-6 sm:mb-12">
          <div className="group relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
            <div className="relative backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border border-white/20 dark:border-slate-700/20 rounded-3xl p-3 sm:p-6 lg:p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Users2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Membership Intelligence</h3>
                  <p className="text-slate-600 dark:text-slate-400">Member engagement and growth analysis</p>
                </div>
              </div>
            </div>
            
            <div className="grid gap-3 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-8">
              {/* Active Members */}
              <motion.div 
                className="group/card relative"
                variants={itemVariants}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 rounded-2xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                <div className="relative backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                  <h4 className="text-base font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-emerald-600" />
                    Active Members
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Total Active</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {isLoading ? '...' : (stats.activeMembers || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">% of Total</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {isLoading ? '...' : `${stats.totalPeople > 0 ? ((stats.activeMembers / stats.totalPeople) * 100).toFixed(1) : 0}%`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Engagement</span>
                      <span className="text-sm font-semibold text-emerald-600">
                        {isLoading ? '...' : (stats.activeMembers > stats.totalPeople * 0.7 ? 'High' : stats.activeMembers > stats.totalPeople * 0.5 ? 'Medium' : 'Low')}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Inactive Members */}
              <motion.div 
                className="group/card relative"
                variants={itemVariants}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 to-amber-600/20 rounded-2xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                <div className="relative backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                  <h4 className="text-base font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <UserX className="h-5 w-5 text-amber-600" />
                    Inactive Members
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Total Inactive</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {isLoading ? '...' : (stats.inactiveMembers || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">% of Total</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {isLoading ? '...' : `${stats.totalPeople > 0 ? ((stats.inactiveMembers / stats.totalPeople) * 100).toFixed(1) : 0}%`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Need Outreach</span>
                      <span className="text-sm font-semibold text-amber-600">
                        {isLoading ? '...' : (stats.inactiveMembers > 0 ? 'Yes' : 'No')}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Visitors */}
              <motion.div 
                className="group/card relative"
                variants={itemVariants}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-2xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                <div className="relative backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                  <h4 className="text-base font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-blue-600" />
                    Visitors
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Total Visitors</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {isLoading ? '...' : (stats.visitors || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">% of Total</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {isLoading ? '...' : `${stats.totalPeople > 0 ? ((stats.visitors / stats.totalPeople) * 100).toFixed(1) : 0}%`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Follow-up</span>
                      <span className="text-sm font-semibold text-blue-600">
                        {isLoading ? '...' : (stats.visitors > 0 ? 'Needed' : 'N/A')}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
        </PermissionFeature>

      {/* Demographics Intelligence */}
      <PermissionFeature permission={PERMISSIONS.MEMBERS_VIEW}>
        <motion.div variants={itemVariants} className="mb-6 sm:mb-12">
          <div className="group relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
            <div className="relative backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border border-white/20 dark:border-slate-700/20 rounded-3xl p-3 sm:p-6 lg:p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Demographics Intelligence</h3>
                  <p className="text-slate-600 dark:text-slate-400">Family structure and age distribution</p>
                </div>
              </div>
            </div>
            
            <div className="grid gap-3 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-8">
              {/* Family Statistics */}
              <motion.div 
                className="group/card relative"
                variants={itemVariants}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-2xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                <div className="relative backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                  <h4 className="text-base font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Family Statistics
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Total Families</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {isLoading ? '...' : (stats.totalFamilies || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Members in Families</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {isLoading ? '...' : (stats.membersInFamilies || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Individual Members</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {isLoading ? '...' : (stats.individualMembers || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Age Distribution */}
              <motion.div 
                className="group/card relative"
                variants={itemVariants}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 rounded-2xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                <div className="relative backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                  <h4 className="text-base font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <Hash className="h-5 w-5 text-emerald-600" />
                    Age Distribution
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Adults (18+)</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {isLoading ? '...' : (stats.adults || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Children (Under 18)</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {isLoading ? '...' : (stats.children || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Adult %</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {isLoading ? '...' : `${stats.totalPeople > 0 ? ((stats.adults / stats.totalPeople) * 100).toFixed(1) : 0}%`}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Gender Distribution */}
              <motion.div 
                className="group/card relative"
                variants={itemVariants}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-2xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                <div className="relative backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                  <h4 className="text-base font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    Gender Distribution
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Male</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {isLoading ? '...' : people.filter(person => 
                          person.gender && person.gender.toLowerCase() === 'male'
                        ).length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Female</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {isLoading ? '...' : people.filter(person => 
                          person.gender && person.gender.toLowerCase() === 'female'
                        ).length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Unspecified</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {isLoading ? '...' : people.filter(person => 
                          !person.gender || (person.gender.toLowerCase() !== 'male' && person.gender.toLowerCase() !== 'female')
                        ).length}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
        </PermissionFeature>

      {/* Person Selection Dialog */}
      <Dialog open={isPersonDialogOpen} onOpenChange={setIsPersonDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Select Person</DialogTitle>
            <DialogDescription>
              Choose people who will be attending this event.
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search people..."
              value={personSearchQuery}
              onChange={(e) => setPersonSearchQuery(e.target.value)}
              className="pl-8 mb-4"
            />
          </div>
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {filteredPeople.length > 0 ? (
              filteredPeople.map((person) => (
                <div 
                  key={person.id} 
                  className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                  onClick={() => handlePersonClick(person)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={person.image_url} />
                    <AvatarFallback>{getInitials(person.firstname, person.lastname)}</AvatarFallback>
                  </Avatar>
                  <span>{formatName(person.firstname, person.lastname)}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                {personSearchQuery ? "No people found matching your search." : "No more people to add."}
              </div>
            )}
          </div>

          {/* Already RSVP'd People Section */}
          {selectedEvent && selectedPeople.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="text-sm font-medium mb-2">Already RSVP'd</h4>
              <div className="space-y-2">
                {people.filter(person => selectedPeople.includes(person.id)).map((person) => (
                  <div 
                    key={person.id} 
                    className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={person.image_url} />
                      <AvatarFallback>{getInitials(person.firstname, person.lastname)}</AvatarFallback>
                    </Avatar>
                    <span>{formatName(person.firstname, person.lastname)}</span>
                    <CheckCircle2 className="ml-auto h-4 w-4 text-green-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={handleDone}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Donation Dialog */}
      <Dialog open={isEditDonationOpen} onOpenChange={setIsEditDonationOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Donation</DialogTitle>
            <DialogDescription>
              Update the donation details. The donation will be recorded for the Sunday of the selected week.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-amount">Amount ($) *</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={selectedDonation?.amount || ''}
                  onChange={(e) => setSelectedDonation({
                    ...selectedDonation,
                    amount: e.target.value
                  })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date *</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={selectedDonation?.date || ''}
                  onChange={(e) => setSelectedDonation({
                    ...selectedDonation,
                    date: e.target.value
                  })}
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-type">Type</Label>
                <select
                  id="edit-type"
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={selectedDonation?.type || 'weekly'}
                  onChange={(e) => setSelectedDonation({
                    ...selectedDonation,
                    type: e.target.value
                  })}
                >
                  <option value="weekly">Weekly</option>
                  <option value="special">Special</option>
                  <option value="building_fund">Building Fund</option>
                  <option value="missions">Missions</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-attendance">Attendance</Label>
                <Input
                  id="edit-attendance"
                  type="number"
                  min="0"
                  value={selectedDonation?.attendance || ''}
                  onChange={(e) => setSelectedDonation({
                    ...selectedDonation,
                    attendance: e.target.value
                  })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Input
                id="edit-notes"
                value={selectedDonation?.notes || ''}
                onChange={(e) => setSelectedDonation({
                  ...selectedDonation,
                  notes: e.target.value
                })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDonationOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateDonation}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDonationOpen} onOpenChange={setIsDeleteDonationOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Donation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this donation? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDonationOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SMS Conversation Dialog - Same as SMS page */}
      {selectedSMSConversation && (
        <Dialog open={!!selectedSMSConversation} onOpenChange={() => setSelectedSMSConversation(null)}>
          <DialogContent className="w-full max-w-4xl sm:max-w-4xl max-h-[80vh] flex flex-col mx-2 sm:mx-auto">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {(() => {
                    const inboundMessage = selectedSMSConversation.sms_messages?.find(m => m.direction === 'inbound');
                    if (inboundMessage?.member) {
                      return (
                        <>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={inboundMessage.member.image_url} />
                            <AvatarFallback className="text-sm">
                              {getInitials(inboundMessage.member.firstname, inboundMessage.member.lastname)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold">
                              {inboundMessage.member.firstname} {inboundMessage.member.lastname}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {inboundMessage.from_number}
                            </div>
                          </div>
                        </>
                      );
                    } else if (inboundMessage) {
                      return (
                        <>
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-sm">
                              <Phone className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold">Unknown Contact</div>
                            <div className="text-sm text-muted-foreground">
                              {inboundMessage.from_number}
                            </div>
                          </div>
                        </>
                      );
                    }
                    return <span>{selectedSMSConversation.title}</span>;
                  })()}
                </div>
              </DialogTitle>
              <DialogDescription>
                {getUniqueMessageCount(selectedSMSConversation.sms_messages)} messages • Last updated {format(new Date(selectedSMSConversation.updated_at), 'MMM d, yyyy HH:mm')}
              </DialogDescription>
            </DialogHeader>
            
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto space-y-4 p-4 border-t">
              {(() => {
                // Group messages by content and direction to avoid duplicates
                const groupedMessages = [];
                const seenMessages = new Set();
                
                selectedSMSConversation.sms_messages
                  ?.sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at))
                  .forEach((message) => {
                    // For outbound messages, group by content only (ignore timestamp for grouping)
                    // For inbound messages, keep them separate since they're from different people
                    const messageKey = message.direction === 'outbound' 
                      ? `${message.direction}-${message.body}`
                      : `${message.direction}-${message.body}-${message.sent_at}-${message.member?.id || 'unknown'}`;
                    
                    if (!seenMessages.has(messageKey)) {
                      seenMessages.add(messageKey);
                      
                      if (message.direction === 'outbound') {
                        // Find all outbound messages with the same content
                        const similarMessages = selectedSMSConversation.sms_messages.filter(m => 
                          m.direction === 'outbound' && 
                          m.body === message.body
                        );
                        
                        // Get unique recipients for this message
                        const recipients = similarMessages
                          .filter(m => m.member)
                          .map(m => m.member)
                          .filter((member, index, arr) => 
                            arr.findIndex(m => m.id === member.id) === index
                          );
                        
                        // Use the earliest timestamp for display
                        const earliestMessage = similarMessages.reduce((earliest, current) => 
                          new Date(current.sent_at) < new Date(earliest.sent_at) ? current : earliest
                        );
                        
                        groupedMessages.push({
                          ...earliestMessage,
                          recipients,
                          recipientCount: recipients.length
                        });
                      } else {
                        // For inbound messages, just add them as-is
                        groupedMessages.push(message);
                      }
                    }
                  });
                
                return groupedMessages.map((message) => (
                  <div key={`${message.direction}-${message.body}-${message.sent_at}-${message.member?.id || 'unknown'}`} className={`flex ${message.direction === 'inbound' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`flex max-w-[80%] ${message.direction === 'inbound' ? 'flex-row' : 'flex-row-reverse'}`}>
                      {/* Avatar */}
                      <div className={`flex-shrink-0 ${message.direction === 'inbound' ? 'mr-3' : 'ml-3'}`}>
                        {message.direction === 'inbound' ? (
                          message.member ? (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={message.member.image_url} />
                              <AvatarFallback className="text-sm">
                                {getInitials(message.member.firstname, message.member.lastname)}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-sm">
                                <Phone className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                          )
                        ) : (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-sm bg-primary text-primary-foreground">
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                      
                      {/* Message Bubble */}
                      <div className={`flex flex-col ${message.direction === 'inbound' ? 'items-start' : 'items-end'}`}>
                        <div className={`px-4 py-2 rounded-lg max-w-full ${
                          message.direction === 'inbound' 
                            ? 'bg-muted text-foreground' 
                            : 'bg-primary text-primary-foreground'
                        }`}>
                          <div className="text-sm whitespace-pre-wrap">{message.body}</div>
                        </div>
                        
                        {/* Message Info */}
                        <div className={`flex items-center space-x-2 mt-1 text-xs text-muted-foreground ${
                          message.direction === 'inbound' ? 'justify-start' : 'justify-end'
                        }`}>
                          <span>{format(new Date(message.sent_at), 'MMM d, HH:mm')}</span>
                          {message.direction === 'outbound' && (
                            <Badge variant="outline" className="text-xs">
                              {message.status}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Recipients Info (for outbound messages with multiple recipients) */}
                        {message.direction === 'outbound' && message.recipientCount > 1 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Sent to {message.recipientCount} recipient{message.recipientCount > 1 ? 's' : ''}
                          </div>
                        )}
                        
                        {/* Member Name (for inbound messages) */}
                        {message.direction === 'inbound' && message.member && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {message.member.firstname} {message.member.lastname}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
            
            {/* Reply Section */}
            {selectedSMSConversation.sms_messages?.some(m => m.direction === 'inbound') && (
              <div className="flex-shrink-0 border-t p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <Send className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Send Reply</span>
                </div>
                <div className="space-y-2">
                  <Textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply..."
                    rows={3}
                    className="resize-none"
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-form-type="other"
                    name="sms-reply-text"
                    id="sms-reply-text"
                  />
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-muted-foreground">
                      Characters: {replyMessage.length} • Messages: {Math.ceil(replyMessage.length / 160)}
                    </div>
                    <Button 
                      onClick={handleSendReply}
                      disabled={!replyMessage.trim() || isSendingReply}
                      size="sm"
                    >
                      {isSendingReply ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Reply
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Advanced Analytics Card Dialog */}
      <motion.div>
        <Dialog open={isCardDialogOpen} onOpenChange={setIsCardDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedCardType === 'sunday-service-rate' && 'Sunday Service Rate Analysis'}
                {selectedCardType === 'weekly-trend' && 'Weekly Donation Trend Analysis'}
                {selectedCardType === 'event-activity' && 'Event Activity Analysis'}
                {selectedCardType === 'task-management' && 'Task Management Analysis'}
                {selectedCardType === 'volunteer-engagement' && 'Volunteer Engagement Analysis'}
                {selectedCardType === 'recent-visitors' && 'Recent Visitors Analysis'}
                {selectedCardType === 'community-health' && 'Community Health Analysis'}
                {selectedCardType === 'family-engagement' && 'Family Engagement Analysis'}
                {selectedCardType === 'communication' && 'Communication Analysis'}
                {selectedCardType === 'celebrations' && 'Celebrations Analysis'}
                {selectedCardType === 'attendance-diversity' && 'Attendance Diversity Analysis'}
                {selectedCardType === 'at-risk-members' && 'At-Risk Members Analysis'}
              </DialogTitle>
              <DialogDescription>
                Detailed analysis and recommendations for this metric.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* At-Risk Members Analysis */}
              {selectedCardType === 'at-risk-members' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">At-Risk Members</h3>
                    <Badge variant="destructive">
                      {isLoadingAtRiskMembers ? 'Loading...' : atRiskMembers.length} members
                    </Badge>
                  </div>
                  
                  {isLoadingAtRiskMembers ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : atRiskMembers.length > 0 ? (
                    <div className="space-y-3">
                      {atRiskMembers.map((member) => (
                        <Card key={member.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback>
                                    {getInitials(member.firstname, member.lastname)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h4 className="font-semibold">
                                    {member.firstname} {member.lastname}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {member.email || member.phone || 'No contact info'}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMemberProfileClick(member.id)}
                              >
                                View Profile
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Heart className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-green-600">Excellent!</h3>
                      <p className="text-muted-foreground">
                        All members are actively engaged. No at-risk members found.
                      </p>
                    </div>
                  )}
                  
                                   <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                     <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">
                       Action Items
                     </h4>
                     <div className="text-sm text-blue-700 dark:text-blue-300 space-y-3">
                       {atRiskMembers.length > 0 ? (
                         <>
                           <div className="flex items-start justify-between">
                             <div className="flex items-start gap-2 flex-1">
                               <span className="text-blue-600 font-bold">1.</span>
                               <span>Schedule pastoral care visits for {atRiskMembers.length} at-risk members</span>
                             </div>
                             <Button 
                               size="sm" 
                               variant="outline" 
                               className="text-xs"
                               onClick={() => handleCreateTask({
                                 title: `Schedule pastoral care visits for ${atRiskMembers.length} at-risk members`,
                                 description: `Schedule pastoral care visits for ${atRiskMembers.length} at-risk members. This involves reaching out to members who may need additional support and care.`,
                                 content: `Schedule pastoral care visits for ${atRiskMembers.length} at-risk members`,
                                 relatedMembers: atRiskMembers,
                                 priority: 'high',
                                 category: 'Pastoral Care'
                               })}
                             >
                               Create Task
                             </Button>
                           </div>
                           <div className="flex items-start justify-between">
                             <div className="flex items-start gap-2 flex-1">
                               <span className="text-blue-600 font-bold">2.</span>
                               <span>Send personalized outreach messages to {atRiskMembers.length} at-risk members</span>
                             </div>
                             <Button 
                               size="sm" 
                               variant="outline" 
                               className="text-xs"
                               onClick={() => handleCreateTask({
                                 title: `Send personalized outreach messages to ${atRiskMembers.length} at-risk members`,
                                 description: `Send personalized outreach messages to ${atRiskMembers.length} at-risk members. Create meaningful, personalized communication to re-engage these members.`,
                                 content: `Send personalized outreach messages to ${atRiskMembers.length} at-risk members`,
                                 relatedMembers: atRiskMembers,
                                 priority: 'medium',
                                 category: 'Outreach'
                               })}
                             >
                               Create Task
                             </Button>
                           </div>
                           <div className="flex items-start justify-between">
                             <div className="flex items-start gap-2 flex-1">
                               <span className="text-blue-600 font-bold">3.</span>
                               <span>Invite {atRiskMembers.length} at-risk members to upcoming events</span>
                             </div>
                             <Button 
                               size="sm" 
                               variant="outline" 
                               className="text-xs"
                               onClick={() => handleCreateTask({
                                 title: `Invite ${atRiskMembers.length} at-risk members to upcoming events`,
                                 description: `Invite ${atRiskMembers.length} at-risk members to upcoming events. Personal invitations can help re-engage these members in church activities.`,
                                 content: `Invite ${atRiskMembers.length} at-risk members to upcoming events`,
                                 relatedMembers: atRiskMembers,
                                 priority: 'medium',
                                 category: 'Events'
                               })}
                             >
                               Create Task
                             </Button>
                           </div>
                         </>
                       ) : (
                         <>
                           <div className="flex items-start justify-between">
                             <div className="flex items-start gap-2 flex-1">
                               <span className="text-blue-600 font-bold">1.</span>
                               <span>Continue maintaining strong community connections</span>
                             </div>
                             <Button 
                               size="sm" 
                               variant="outline" 
                               className="text-xs"
                               onClick={() => handleCreateTask({
                                 title: 'Continue maintaining strong community connections',
                                 description: 'Continue maintaining strong community connections. Focus on building and sustaining meaningful relationships within the church community.',
                                 content: 'Continue maintaining strong community connections',
                                 priority: 'medium',
                                 category: 'Pastoral Care'
                               })}
                             >
                               Create Task
                             </Button>
                           </div>
                           <div className="flex items-start justify-between">
                             <div className="flex items-start gap-2 flex-1">
                               <span className="text-blue-600 font-bold">2.</span>
                               <span>Monitor engagement patterns regularly</span>
                             </div>
                             <Button 
                               size="sm" 
                               variant="outline" 
                               className="text-xs"
                               onClick={() => handleCreateTask({
                                 title: 'Monitor engagement patterns regularly',
                                 description: 'Monitor engagement patterns regularly. Track member participation and identify early signs of disengagement to maintain strong community health.',
                                 content: 'Monitor engagement patterns regularly',
                                 priority: 'low',
                                 category: 'Administration'
                               })}
                             >
                               Create Task
                             </Button>
                           </div>
                           <div className="flex items-start justify-between">
                             <div className="flex items-start gap-2 flex-1">
                               <span className="text-blue-600 font-bold">3.</span>
                               <span>Celebrate member involvement and milestones</span>
                             </div>
                             <Button 
                               size="sm" 
                               variant="outline" 
                               className="text-xs"
                               onClick={() => handleCreateTask({
                                 title: 'Celebrate member involvement and milestones',
                                 description: 'Celebrate member involvement and milestones. Recognize and appreciate member contributions and important life events to strengthen community bonds.',
                                 content: 'Celebrate member involvement and milestones',
                                 priority: 'medium',
                                 category: 'Pastoral Care'
                               })}
                             >
                               Create Task
                             </Button>
                           </div>
                         </>
                       )}
                     </div>
                   </div>
                </div>
              )}

              {/* Sunday Service Rate Analysis */}
              {selectedCardType === 'sunday-service-rate' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-emerald-600">
                            {stats.sundayServiceRate.toFixed(0)}%
                          </div>
                          <p className="text-sm text-muted-foreground">Current Rate</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {stats.totalPeople}
                          </div>
                          <p className="text-sm text-muted-foreground">Total Members</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {Math.round((stats.sundayServiceRate / 100) * stats.totalPeople)}
                          </div>
                          <p className="text-sm text-muted-foreground">Active Attendees</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-emerald-800 dark:text-emerald-200 mb-2">
                      Analysis
                    </h4>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">
                      {stats.sundayServiceRate >= 70 
                        ? 'Excellent attendance rate! Your congregation shows strong engagement with Sunday services.'
                        : stats.sundayServiceRate >= 50
                        ? 'Good attendance rate with room for improvement. Consider outreach to inactive members.'
                        : 'Attendance rate needs attention. Focus on re-engaging inactive members and improving service experiences.'
                      }
                    </p>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 dark:text-green-200 mb-3">
                      Action Items
                    </h4>
                    <div className="text-sm text-green-700 dark:text-green-300 space-y-3">
                      {stats.sundayServiceRate >= 70 ? (
                        <>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-green-600 font-bold">1.</span>
                              <span>Maintain engagement with {Math.round((stats.sundayServiceRate / 100) * stats.totalPeople)} active attendees</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: `Maintain engagement with ${Math.round((stats.sundayServiceRate / 100) * stats.totalPeople)} active attendees`,
                                description: `Maintain engagement with ${Math.round((stats.sundayServiceRate / 100) * stats.totalPeople)} active attendees. Continue building strong relationships and providing meaningful experiences.`,
                                content: `Maintain engagement with ${Math.round((stats.sundayServiceRate / 100) * stats.totalPeople)} active attendees`,
                                priority: 'medium',
                                category: 'Pastoral Care'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-green-600 font-bold">2.</span>
                              <span>Develop new ministry opportunities</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: 'Develop new ministry opportunities',
                                description: 'Develop new ministry opportunities. Create additional ways for members to get involved and stay engaged.',
                                content: 'Develop new ministry opportunities',
                                priority: 'medium',
                                category: 'Ministry'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-green-600 font-bold">3.</span>
                              <span>Plan special events and celebrations</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: 'Plan special events and celebrations',
                                description: 'Plan special events and celebrations. Create memorable experiences to strengthen community bonds.',
                                content: 'Plan special events and celebrations',
                                priority: 'medium',
                                category: 'Events'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                        </>
                      ) : stats.sundayServiceRate >= 50 ? (
                        <>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-green-600 font-bold">1.</span>
                              <span>Reach out to {stats.totalPeople - Math.round((stats.sundayServiceRate / 100) * stats.totalPeople)} inactive members</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: `Reach out to ${stats.totalPeople - Math.round((stats.sundayServiceRate / 100) * stats.totalPeople)} inactive members`,
                                description: `Reach out to ${stats.totalPeople - Math.round((stats.sundayServiceRate / 100) * stats.totalPeople)} inactive members. Personal outreach to reconnect with disengaged members.`,
                                content: `Reach out to ${stats.totalPeople - Math.round((stats.sundayServiceRate / 100) * stats.totalPeople)} inactive members`,
                                relatedMembers: inactiveMembers,
                                priority: 'high',
                                category: 'Pastoral Care'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-green-600 font-bold">2.</span>
                              <span>Improve service experiences</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: 'Improve service experiences',
                                description: 'Improve service experiences. Enhance worship services and programs to better engage members.',
                                content: 'Improve service experiences',
                                priority: 'medium',
                                category: 'Ministry'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-green-600 font-bold">3.</span>
                              <span>Create welcoming initiatives</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: 'Create welcoming initiatives',
                                description: 'Create welcoming initiatives. Develop programs to make services more accessible and inviting.',
                                content: 'Create welcoming initiatives',
                                priority: 'medium',
                                category: 'Outreach'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-green-600 font-bold">1.</span>
                              <span>Urgent outreach to {stats.totalPeople - Math.round((stats.sundayServiceRate / 100) * stats.totalPeople)} inactive members</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: `Urgent outreach to ${stats.totalPeople - Math.round((stats.sundayServiceRate / 100) * stats.totalPeople)} inactive members`,
                                description: `Urgent outreach to ${stats.totalPeople - Math.round((stats.sundayServiceRate / 100) * stats.totalPeople)} inactive members. Immediate personal contact to understand barriers and re-engage.`,
                                content: `Urgent outreach to ${stats.totalPeople - Math.round((stats.sundayServiceRate / 100) * stats.totalPeople)} inactive members`,
                                relatedMembers: inactiveMembers,
                                priority: 'high',
                                category: 'Pastoral Care'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-green-600 font-bold">2.</span>
                              <span>Revamp service programming</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: 'Revamp service programming',
                                description: 'Revamp service programming. Completely review and improve worship services and programs.',
                                content: 'Revamp service programming',
                                priority: 'high',
                                category: 'Ministry'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-green-600 font-bold">3.</span>
                              <span>Develop comprehensive engagement strategy</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: 'Develop comprehensive engagement strategy',
                                description: 'Develop comprehensive engagement strategy. Create a strategic plan to improve member engagement and attendance.',
                                content: 'Develop comprehensive engagement strategy',
                                priority: 'high',
                                category: 'Administration'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Weekly Trend Analysis */}
              {selectedCardType === 'weekly-trend' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {!canCalculateTrend ? `Week ${weekAnalyzed}` : (donationTrend > 0 ? '+' : '') + donationTrend.toFixed(1) + '%'}
                          </div>
                          <p className="text-sm text-muted-foreground">Weekly Trend</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            ${donationTrendAnalysis.currentWeekTotal?.toFixed(2) || '0.00'}
                          </div>
                          <p className="text-sm text-muted-foreground">This Week</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                      Trend Analysis
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {donationTrend > 0 
                        ? 'Positive giving trend! Your congregation is showing strong stewardship.'
                        : donationTrend < 0
                        ? 'Giving trend needs attention. Consider sharing impact stories and ministry updates.'
                        : 'Stable giving pattern. Continue building trust and transparency in financial stewardship.'
                      }
                    </p>
                  </div>

                  <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-indigo-800 dark:text-indigo-200 mb-3">
                      Action Items
                    </h4>
                    <div className="text-sm text-indigo-700 dark:text-indigo-300 space-y-3">
                      {donationTrend > 0 ? (
                        <>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-indigo-600 font-bold">1.</span>
                              <span>Share ministry impact stories with congregation</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: 'Share ministry impact stories with congregation',
                                description: 'Share ministry impact stories with congregation. Highlight how donations are making a difference in the community.',
                                content: 'Share ministry impact stories with congregation',
                                priority: 'medium',
                                category: 'Communication'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-indigo-600 font-bold">2.</span>
                              <span>Develop stewardship education programs</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: 'Develop stewardship education programs',
                                description: 'Develop stewardship education programs. Create programs to teach biblical principles of giving and stewardship.',
                                content: 'Develop stewardship education programs',
                                priority: 'medium',
                                category: 'Ministry'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-indigo-600 font-bold">3.</span>
                              <span>Plan giving campaigns and initiatives</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: 'Plan giving campaigns and initiatives',
                                description: 'Plan giving campaigns and initiatives. Develop strategic campaigns to maintain positive giving momentum.',
                                content: 'Plan giving campaigns and initiatives',
                                priority: 'medium',
                                category: 'Fundraising'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                        </>
                      ) : donationTrend < 0 ? (
                        <>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-indigo-600 font-bold">1.</span>
                              <span>Urgent financial transparency communication</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: 'Urgent financial transparency communication',
                                description: 'Urgent financial transparency communication. Immediately share detailed financial reports and ministry impact.',
                                content: 'Urgent financial transparency communication',
                                priority: 'high',
                                category: 'Communication'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-indigo-600 font-bold">2.</span>
                              <span>Develop crisis stewardship plan</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: 'Develop crisis stewardship plan',
                                description: 'Develop crisis stewardship plan. Create immediate strategies to address declining giving patterns.',
                                content: 'Develop crisis stewardship plan',
                                priority: 'high',
                                category: 'Administration'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-indigo-600 font-bold">3.</span>
                              <span>Personal outreach to major donors</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: 'Personal outreach to major donors',
                                description: 'Personal outreach to major donors. Direct contact to understand concerns and maintain relationships.',
                                content: 'Personal outreach to major donors',
                                priority: 'high',
                                category: 'Fundraising'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-indigo-600 font-bold">1.</span>
                              <span>Enhance financial reporting transparency</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: 'Enhance financial reporting transparency',
                                description: 'Enhance financial reporting transparency. Improve communication about how funds are used.',
                                content: 'Enhance financial reporting transparency',
                                priority: 'medium',
                                category: 'Communication'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-indigo-600 font-bold">2.</span>
                              <span>Develop stewardship education</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: 'Develop stewardship education',
                                description: 'Develop stewardship education. Create programs to teach biblical giving principles.',
                                content: 'Develop stewardship education',
                                priority: 'medium',
                                category: 'Ministry'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-indigo-600 font-bold">3.</span>
                              <span>Plan giving encouragement campaigns</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: 'Plan giving encouragement campaigns',
                                description: 'Plan giving encouragement campaigns. Develop initiatives to encourage consistent giving.',
                                content: 'Plan giving encouragement campaigns',
                                priority: 'medium',
                                category: 'Fundraising'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Event Activity Analysis */}
              {selectedCardType === 'event-activity' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {stats.eventsThisMonth}
                          </div>
                          <p className="text-sm text-muted-foreground">This Month</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-pink-600">
                            {stats.averageEventsPerMonth}
                          </div>
                          <p className="text-sm text-muted-foreground">Monthly Average</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">
                            {stats.eventsNeedingVolunteers}
                          </div>
                          <p className="text-sm text-muted-foreground">Need Volunteers</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                      Event Planning Analysis
                    </h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      {stats.eventsThisMonth >= stats.averageEventsPerMonth
                        ? 'Strong event planning! You\'re meeting or exceeding your monthly event targets.'
                        : 'Event activity is below average. Consider planning more events to engage your congregation.'
                      }
                    </p>
                  </div>

                  <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-pink-800 dark:text-pink-200 mb-3">
                      Action Items
                    </h4>
                    <div className="text-sm text-pink-700 dark:text-pink-300 space-y-3">
                      {stats.eventsThisMonth >= stats.averageEventsPerMonth ? (
                        <>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-pink-600 font-bold">1.</span>
                              <span>Maintain and enhance {stats.eventsThisMonth} current events</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: `Maintain and enhance ${stats.eventsThisMonth} current events`,
                                description: `Maintain and enhance ${stats.eventsThisMonth} current events. Continue improving existing events and programs.`,
                                content: `Maintain and enhance ${stats.eventsThisMonth} current events`,
                                priority: 'medium',
                                category: 'Events'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-pink-600 font-bold">2.</span>
                              <span>Plan additional special events</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: 'Plan additional special events',
                                description: 'Plan additional special events. Develop new events to further engage the congregation.',
                                content: 'Plan additional special events',
                                priority: 'medium',
                                category: 'Events'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-pink-600 font-bold">3.</span>
                              <span>Recruit volunteers for {stats.eventsNeedingVolunteers} events needing help</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: `Recruit volunteers for ${stats.eventsNeedingVolunteers} events needing help`,
                                description: `Recruit volunteers for ${stats.eventsNeedingVolunteers} events needing help. Find and train volunteers for upcoming events.`,
                                content: `Recruit volunteers for ${stats.eventsNeedingVolunteers} events needing help`,
                                priority: 'medium',
                                category: 'Volunteer Management'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-pink-600 font-bold">1.</span>
                              <span>Urgent event planning for engagement</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: 'Urgent event planning for engagement',
                                description: 'Urgent event planning for engagement. Immediately plan new events to increase member engagement.',
                                content: 'Urgent event planning for engagement',
                                priority: 'high',
                                category: 'Events'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-pink-600 font-bold">2.</span>
                              <span>Develop comprehensive event calendar</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: 'Develop comprehensive event calendar',
                                description: 'Develop comprehensive event calendar. Create a strategic plan for regular events throughout the year.',
                                content: 'Develop comprehensive event calendar',
                                priority: 'high',
                                category: 'Events'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-pink-600 font-bold">3.</span>
                              <span>Recruit and train event volunteers</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: 'Recruit and train event volunteers',
                                description: 'Recruit and train event volunteers. Build a team of volunteers to support upcoming events.',
                                content: 'Recruit and train event volunteers',
                                priority: 'high',
                                category: 'Volunteer Management'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Task Management Analysis */}
              {selectedCardType === 'task-management' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-amber-600">
                            {stats.totalTasks}
                          </div>
                          <p className="text-sm text-muted-foreground">Total Tasks</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {stats.completedTasks}
                          </div>
                          <p className="text-sm text-muted-foreground">Completed</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {stats.pendingTasks}
                          </div>
                          <p className="text-sm text-muted-foreground">Pending</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">
                            {stats.overdueTasks}
                          </div>
                          <p className="text-sm text-muted-foreground">Overdue</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                      Task Management Analysis
                    </h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      {stats.overdueTasks === 0
                        ? 'Excellent task management! All tasks are on track and being completed on time.'
                        : `There are ${stats.overdueTasks} overdue tasks that need immediate attention.`
                      }
                    </p>
                  </div>

                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-3">
                      Action Items
                    </h4>
                    <div className="text-sm text-orange-700 dark:text-orange-300 space-y-3">
                      {stats.overdueTasks === 0 ? (
                        <>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-orange-600 font-bold">1.</span>
                              <span>Maintain task management systems for {stats.totalTasks} total tasks</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: `Maintain task management systems for ${stats.totalTasks} total tasks`,
                                description: `Maintain task management systems for ${stats.totalTasks} total tasks. Continue effective task tracking and completion processes.`,
                                content: `Maintain task management systems for ${stats.totalTasks} total tasks`,
                                priority: 'medium',
                                category: 'Administration'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-orange-600 font-bold">2.</span>
                              <span>Develop task automation processes</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: 'Develop task automation processes',
                                description: 'Develop task automation processes. Create systems to streamline task management and reduce manual work.',
                                content: 'Develop task automation processes',
                                priority: 'medium',
                                category: 'Administration'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-orange-600 font-bold">3.</span>
                              <span>Plan task management training</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: 'Plan task management training',
                                description: 'Plan task management training. Develop training programs for effective task management.',
                                content: 'Plan task management training',
                                priority: 'medium',
                                category: 'Training'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-orange-600 font-bold">1.</span>
                              <span>Urgent attention to {stats.overdueTasks} overdue tasks</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: `Urgent attention to ${stats.overdueTasks} overdue tasks`,
                                description: `Urgent attention to ${stats.overdueTasks} overdue tasks. Immediately address and resolve all overdue tasks.`,
                                content: `Urgent attention to ${stats.overdueTasks} overdue tasks`,
                                priority: 'high',
                                category: 'Administration'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-orange-600 font-bold">2.</span>
                              <span>Implement task prioritization system</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: 'Implement task prioritization system',
                                description: 'Implement task prioritization system. Create systems to prevent future overdue tasks.',
                                content: 'Implement task prioritization system',
                                priority: 'high',
                                category: 'Administration'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-orange-600 font-bold">3.</span>
                              <span>Develop task follow-up procedures</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: 'Develop task follow-up procedures',
                                description: 'Develop task follow-up procedures. Create processes to ensure timely task completion.',
                                content: 'Develop task follow-up procedures',
                                priority: 'high',
                                category: 'Administration'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Volunteer Engagement Analysis */}
              {selectedCardType === 'volunteer-engagement' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-violet-600">
                            {stats.eventsStillNeedingVolunteers}
                          </div>
                          <p className="text-sm text-muted-foreground">Events Needing Volunteers</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-fuchsia-600">
                            {stats.totalEvents}
                          </div>
                          <p className="text-sm text-muted-foreground">Total Events</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {stats.totalEvents > 0 ? Math.round(((stats.totalEvents - stats.eventsStillNeedingVolunteers) / stats.totalEvents) * 100) : 0}%
                          </div>
                          <p className="text-sm text-muted-foreground">Volunteer Coverage</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="bg-violet-50 dark:bg-violet-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-violet-800 dark:text-violet-200 mb-3">
                      Quick Analysis
                    </h4>
                    <div className="text-sm text-violet-700 dark:text-violet-300">
                      {stats.eventsStillNeedingVolunteers === 0 
                        ? '✅ All events fully staffed - excellent volunteer engagement'
                        : `⚠️ ${stats.eventsStillNeedingVolunteers} events need volunteers (${Math.round((stats.eventsStillNeedingVolunteers / Math.max(stats.totalEvents, 1)) * 100)}% gap)`
                      }
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">
                      Action Items
                    </h4>
                    <div className="text-sm text-blue-700 dark:text-blue-300 space-y-3">
                      {stats.eventsStillNeedingVolunteers > 0 ? (
                        <>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-blue-600 font-bold">1.</span>
                              <span>Send targeted recruitment messages to {stats.activeMembers} active members</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: `Send targeted recruitment messages to ${stats.activeMembers} active members`,
                                description: `Send targeted recruitment messages to ${stats.activeMembers} active members. Identify potential volunteers and send personalized invitations to serve in various ministry areas.`,
                                content: `Send targeted recruitment messages to ${stats.activeMembers} active members`,
                                priority: 'medium',
                                category: 'Outreach'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-blue-600 font-bold">2.</span>
                              <span>Create volunteer appreciation program for current volunteers</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: 'Create volunteer appreciation program for current volunteers',
                                description: 'Create volunteer appreciation program for current volunteers. Develop a comprehensive program to recognize and reward the dedication of existing volunteers.',
                                content: 'Create volunteer appreciation program for current volunteers',
                                priority: 'medium',
                                category: 'Pastoral Care'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-blue-600 font-bold">3.</span>
                              <span>Develop volunteer training program</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: 'Develop volunteer training program',
                                description: 'Develop volunteer training program. Create comprehensive training materials and programs to equip volunteers with necessary skills and knowledge.',
                                content: 'Develop volunteer training program',
                                priority: 'medium',
                                category: 'Education'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-blue-600 font-bold">1.</span>
                              <span>Expand volunteer opportunities for {stats.activeMembers} members</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: `Expand volunteer opportunities for ${stats.activeMembers} members`,
                                description: `Expand volunteer opportunities for ${stats.activeMembers} members. Create diverse ministry opportunities to engage more members in service.`,
                                content: `Expand volunteer opportunities for ${stats.activeMembers} members`,
                                priority: 'medium',
                                category: 'Outreach'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-blue-600 font-bold">2.</span>
                              <span>Create leadership development programs</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: 'Create leadership development programs',
                                description: 'Create leadership development programs. Develop programs to identify and train potential leaders within the congregation.',
                                content: 'Create leadership development programs',
                                priority: 'medium',
                                category: 'Education'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-blue-600 font-bold">3.</span>
                              <span>Implement volunteer recognition events</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: 'Implement volunteer recognition events',
                                description: 'Implement volunteer recognition events. Plan and execute events to celebrate and honor volunteer contributions.',
                                content: 'Implement volunteer recognition events',
                                priority: 'medium',
                                category: 'Events'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Visitors Analysis */}
              {selectedCardType === 'recent-visitors' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-rose-600">
                            {(() => {
                              const thirtyDaysAgo = new Date();
                              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                              return people.filter(person => 
                                person.status === 'visitor' && 
                                new Date(person.createdAt) >= thirtyDaysAgo
                              ).length;
                            })()}
                          </div>
                          <p className="text-sm text-muted-foreground">Recent Visitors (30 days)</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-pink-600">
                            {people.filter(person => person.status === 'visitor').length}
                          </div>
                          <p className="text-sm text-muted-foreground">Total Visitors</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {(() => {
                              const thirtyDaysAgo = new Date();
                              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                              const recentVisitors = people.filter(person => 
                                person.status === 'visitor' && 
                                new Date(person.createdAt) >= thirtyDaysAgo
                              ).length;
                              return recentVisitors >= 3 ? 'Strong' : recentVisitors >= 1 ? 'Growing' : 'Needs Focus';
                            })()}
                          </div>
                          <p className="text-sm text-muted-foreground">Outreach Health</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-rose-800 dark:text-rose-200 mb-3">
                      Quick Analysis
                    </h4>
                    <div className="text-sm text-rose-700 dark:text-rose-300">
                      {(() => {
                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        const recentVisitors = people.filter(person => 
                          person.status === 'visitor' && 
                          new Date(person.createdAt) >= thirtyDaysAgo
                        ).length;
                        
                        if (recentVisitors >= 3) {
                          return '✅ Strong visitor outreach - excellent invitation culture';
                        } else if (recentVisitors >= 1) {
                          return `📈 Good visitor activity - ${recentVisitors} new visitor${recentVisitors > 1 ? 's' : ''} this month`;
                        } else {
                          return '⚠️ Visitor outreach needs attention - no recent visitors';
                        }
                      })()}
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">
                      Action Items
                    </h4>
                    <div className="text-sm text-blue-700 dark:text-blue-300 space-y-3">
                      {(() => {
                        if (recentVisitors.length >= 3) {
                          return (
                            <>
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-2 flex-1">
                                  <span className="text-blue-600 font-bold">1.</span>
                                  <span>Follow up with {recentVisitors.length} recent visitors</span>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-xs"
                                  onClick={() => handleCreateTask({
                                    title: `Follow up with ${recentVisitors.length} recent visitors`,
                                    description: `Follow up with ${recentVisitors.length} recent visitors. Personal follow-up calls or messages to encourage continued engagement and church involvement.`,
                                    content: `Follow up with ${recentVisitors.length} recent visitors`,
                                    relatedMembers: recentVisitors,
                                    priority: 'high',
                                    category: 'Outreach'
                                  })}
                                >
                                  Create Task
                                </Button>
                              </div>
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-2 flex-1">
                                  <span className="text-blue-600 font-bold">2.</span>
                                  <span>Create visitor integration strategies</span>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-xs"
                                  onClick={() => handleCreateTask({
                                    title: 'Create visitor integration strategies',
                                    description: 'Create visitor integration strategies. Develop comprehensive plans to help new visitors feel welcome and become active members.',
                                    content: 'Create visitor integration strategies',
                                    priority: 'medium',
                                    category: 'Outreach'
                                  })}
                                >
                                  Create Task
                                </Button>
                              </div>
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-2 flex-1">
                                  <span className="text-blue-600 font-bold">3.</span>
                                  <span>Track conversion rates</span>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-xs"
                                  onClick={() => handleCreateTask({
                                    title: 'Track conversion rates',
                                    description: 'Track conversion rates. Monitor and analyze visitor-to-member conversion rates to improve outreach effectiveness.',
                                    content: 'Track conversion rates',
                                    priority: 'low',
                                    category: 'Administration'
                                  })}
                                >
                                  Create Task
                                </Button>
                              </div>
                            </>
                          );
                        } else if (recentVisitors.length >= 1) {
                          return (
                            <>
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-2 flex-1">
                                  <span className="text-blue-600 font-bold">1.</span>
                                  <span>Encourage {activeMembers.length} active members to invite friends</span>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-xs"
                                  onClick={() => handleCreateTask({
                                    title: `Encourage ${activeMembers.length} active members to invite friends`,
                                    description: `Encourage ${activeMembers.length} active members to invite friends. Mobilize the congregation to extend personal invitations to their networks.`,
                                    content: `Encourage ${activeMembers.length} active members to invite friends`,
                                    relatedMembers: activeMembers,
                                    priority: 'medium',
                                    category: 'Outreach'
                                  })}
                                >
                                  Create Task
                                </Button>
                              </div>
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-2 flex-1">
                                  <span className="text-blue-600 font-bold">2.</span>
                                  <span>Create compelling invitation materials</span>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-xs"
                                  onClick={() => handleCreateTask({
                                    title: 'Create compelling invitation materials',
                                    description: 'Create compelling invitation materials. Develop attractive and informative materials to help members invite others effectively.',
                                    content: 'Create compelling invitation materials',
                                    priority: 'medium',
                                    category: 'Outreach'
                                  })}
                                >
                                  Create Task
                                </Button>
                              </div>
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-2 flex-1">
                                  <span className="text-blue-600 font-bold">3.</span>
                                  <span>Develop community outreach programs</span>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-xs"
                                  onClick={() => handleCreateTask({
                                    title: 'Develop community outreach programs',
                                    description: 'Develop community outreach programs. Create programs that serve the community and attract new visitors.',
                                    content: 'Develop community outreach programs',
                                    priority: 'medium',
                                    category: 'Outreach'
                                  })}
                                >
                                  Create Task
                                </Button>
                              </div>
                            </>
                          );
                        } else {
                          return (
                            <>
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-2 flex-1">
                                  <span className="text-blue-600 font-bold">1.</span>
                                  <span>Launch invitation campaign with {activeMembers.length} active members</span>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-xs"
                                  onClick={() => handleCreateTask({
                                    title: `Launch invitation campaign with ${activeMembers.length} active members`,
                                    description: `Launch invitation campaign with ${activeMembers.length} active members. Create a coordinated campaign to encourage personal invitations.`,
                                    content: `Launch invitation campaign with ${activeMembers.length} active members`,
                                    relatedMembers: activeMembers,
                                    priority: 'high',
                                    category: 'Outreach'
                                  })}
                                >
                                  Create Task
                                </Button>
                              </div>
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-2 flex-1">
                                  <span className="text-blue-600 font-bold">2.</span>
                                  <span>Create visitor-friendly experiences</span>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-xs"
                                  onClick={() => handleCreateTask({
                                    title: 'Create visitor-friendly experiences',
                                    description: 'Create visitor-friendly experiences. Ensure all aspects of church life are welcoming and accessible to newcomers.',
                                    content: 'Create visitor-friendly experiences',
                                    priority: 'medium',
                                    category: 'Outreach'
                                  })}
                                >
                                  Create Task
                                </Button>
                              </div>
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-2 flex-1">
                                  <span className="text-blue-600 font-bold">3.</span>
                                  <span>Develop community partnerships</span>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-xs"
                                  onClick={() => handleCreateTask({
                                    title: 'Develop community partnerships',
                                    description: 'Develop community partnerships. Build relationships with local organizations to increase church visibility and outreach.',
                                    content: 'Develop community partnerships',
                                    priority: 'medium',
                                    category: 'Outreach'
                                  })}
                                >
                                  Create Task
                                </Button>
                              </div>
                            </>
                          );
                        }
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Community Health Analysis */}
              {selectedCardType === 'community-health' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {stats.inactiveMembers}
                          </div>
                          <p className="text-sm text-muted-foreground">Inactive Members</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {stats.activeMembers}
                          </div>
                          <p className="text-sm text-muted-foreground">Active Members</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-emerald-600">
                            {stats.totalPeople > 0 ? Math.round((stats.activeMembers / stats.totalPeople) * 100) : 0}%
                          </div>
                          <p className="text-sm text-muted-foreground">Engagement Rate</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">
                      Quick Analysis
                    </h4>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      {stats.inactiveMembers === 0 ? (
                        '✅ Exceptional community health - all members engaged'
                      ) : stats.inactiveMembers < 5 ? (
                        `📊 Good health - ${stats.inactiveMembers} inactive (${Math.round((stats.inactiveMembers / Math.max(stats.totalPeople, 1)) * 100)}%)`
                      ) : (
                        `⚠️ Needs attention - ${stats.inactiveMembers} inactive (${Math.round((stats.inactiveMembers / Math.max(stats.totalPeople, 1)) * 100)}%)`
                      )}
                    </div>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 dark:text-green-200 mb-3">
                      Action Items
                    </h4>
                    <div className="text-sm text-green-700 dark:text-green-300 space-y-3">
                      {stats.inactiveMembers === 0 ? (
                        <>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-green-600 font-bold">1.</span>
                              <span>Maintain strong pastoral care relationships with {stats.activeMembers} active members</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: `Maintain strong pastoral care relationships with ${stats.activeMembers} active members`,
                                description: `Maintain strong pastoral care relationships with ${stats.activeMembers} active members. Continue nurturing existing relationships to prevent disengagement.`,
                                content: `Maintain strong pastoral care relationships with ${stats.activeMembers} active members`,
                                priority: 'medium',
                                category: 'Pastoral Care'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-green-600 font-bold">2.</span>
                              <span>Develop preventive care programs</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: 'Develop preventive care programs',
                                description: 'Develop preventive care programs. Create programs that proactively support member well-being and prevent disengagement.',
                                content: 'Develop preventive care programs',
                                priority: 'medium',
                                category: 'Pastoral Care'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-green-600 font-bold">3.</span>
                              <span>Create milestone celebration programs</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: 'Create milestone celebration programs',
                                description: 'Create milestone celebration programs. Develop programs to recognize and celebrate important life events and achievements.',
                                content: 'Create milestone celebration programs',
                                priority: 'medium',
                                category: 'Pastoral Care'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                        </>
                      ) : stats.inactiveMembers < 5 ? (
                        <>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-green-600 font-bold">1.</span>
                              <span>Schedule personal visits with {stats.inactiveMembers} inactive members</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                                                              onClick={() => handleCreateTask({
                                  title: `Schedule personal visits with ${stats.inactiveMembers} inactive members`,
                                  description: `Schedule personal visits with ${stats.inactiveMembers} inactive members. Personal outreach to reconnect with disengaged members.`,
                                  content: `Schedule personal visits with ${stats.inactiveMembers} inactive members`,
                                  relatedMembers: inactiveMembers,
                                  priority: 'high',
                                  category: 'Pastoral Care'
                                })}
                            >
                              Create Task
                            </Button>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-green-600 font-bold">2.</span>
                              <span>Send personalized outreach messages to {stats.inactiveMembers} inactive members</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                                                              onClick={() => handleCreateTask({
                                  title: `Send personalized outreach messages to ${stats.inactiveMembers} inactive members`,
                                  description: `Send personalized outreach messages to ${stats.inactiveMembers} inactive members. Targeted communication to re-engage disengaged members.`,
                                  content: `Send personalized outreach messages to ${stats.inactiveMembers} inactive members`,
                                  relatedMembers: inactiveMembers,
                                  priority: 'medium',
                                  category: 'Outreach'
                                })}
                            >
                              Create Task
                            </Button>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-green-600 font-bold">3.</span>
                              <span>Invite {stats.inactiveMembers} inactive members to upcoming events</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                                                              onClick={() => handleCreateTask({
                                  title: `Invite ${stats.inactiveMembers} inactive members to upcoming events`,
                                  description: `Invite ${stats.inactiveMembers} inactive members to upcoming events. Extend personal invitations to re-engage members through events.`,
                                  content: `Invite ${stats.inactiveMembers} inactive members to upcoming events`,
                                  relatedMembers: inactiveMembers,
                                  priority: 'medium',
                                  category: 'Events'
                                })}
                            >
                              Create Task
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-green-600 font-bold">1.</span>
                              <span>Implement comprehensive pastoral care outreach for {stats.inactiveMembers} inactive members</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                                                              onClick={() => handleCreateTask({
                                  title: `Implement comprehensive pastoral care outreach for ${stats.inactiveMembers} inactive members`,
                                  description: `Implement comprehensive pastoral care outreach for ${stats.inactiveMembers} inactive members. Develop a systematic approach to reconnect with all disengaged members.`,
                                  content: `Implement comprehensive pastoral care outreach for ${stats.inactiveMembers} inactive members`,
                                  relatedMembers: inactiveMembers,
                                  priority: 'high',
                                  category: 'Pastoral Care'
                                })}
                            >
                              Create Task
                            </Button>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-green-600 font-bold">2.</span>
                              <span>Develop personalized re-engagement strategies for {stats.inactiveMembers} members</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                                                              onClick={() => handleCreateTask({
                                  title: `Develop personalized re-engagement strategies for ${stats.inactiveMembers} members`,
                                  description: `Develop personalized re-engagement strategies for ${stats.inactiveMembers} members. Create tailored approaches to reconnect with each disengaged member.`,
                                  content: `Develop personalized re-engagement strategies for ${stats.inactiveMembers} members`,
                                  relatedMembers: inactiveMembers,
                                  priority: 'high',
                                  category: 'Pastoral Care'
                                })}
                            >
                              Create Task
                            </Button>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-green-600 font-bold">3.</span>
                              <span>Create support groups for {stats.inactiveMembers} struggling members</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                                                              onClick={() => handleCreateTask({
                                  title: `Create support groups for ${stats.inactiveMembers} struggling members`,
                                  description: `Create support groups for ${stats.inactiveMembers} struggling members. Develop supportive community structures to help members through difficult times.`,
                                  content: `Create support groups for ${stats.inactiveMembers} struggling members`,
                                  relatedMembers: inactiveMembers,
                                  priority: 'high',
                                  category: 'Pastoral Care'
                                })}
                            >
                              Create Task
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Family Engagement Analysis */}
              {selectedCardType === 'family-engagement' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {stats.totalFamilies}
                          </div>
                          <p className="text-sm text-muted-foreground">Total Families</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-emerald-600">
                            {stats.membersInFamilies}
                          </div>
                          <p className="text-sm text-muted-foreground">Members in Families</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">
                            {stats.membersWithoutFamilies}
                          </div>
                          <p className="text-sm text-muted-foreground">Unassigned Members</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {stats.totalFamilies > 0 ? Math.round((stats.membersInFamilies / Math.max(stats.totalPeople, 1)) * 100) : 0}%
                          </div>
                          <p className="text-sm text-muted-foreground">Family Connection Rate</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 dark:text-green-200 mb-3">
                      Quick Analysis
                    </h4>
                    <div className="text-sm text-green-700 dark:text-green-300">
                      {stats.totalFamilies > 0 ? (
                        `${stats.totalFamilies} family unit${stats.totalFamilies > 1 ? 's' : ''} • ${Math.round((stats.membersInFamilies / Math.max(stats.totalPeople, 1)) * 100)}% connected${stats.membersWithoutFamilies > 0 ? ` • ${stats.membersWithoutFamilies} unassigned` : ''}`
                      ) : (
                        'No family units established - opportunity for community building'
                      )}
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">
                      Action Items
                    </h4>
                    <div className="text-sm text-blue-700 dark:text-blue-300 space-y-3">
                      {stats.membersWithoutFamilies > 0 ? (
                        <>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-blue-600 font-bold">1.</span>
                              <span>Assign {stats.membersWithoutFamilies} unassigned members to family groups</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: `Assign ${stats.membersWithoutFamilies} unassigned members to family groups`,
                                description: `Assign ${stats.membersWithoutFamilies} unassigned members to family groups. Connect individual members with appropriate family units for better community integration.`,
                                content: `Assign ${stats.membersWithoutFamilies} unassigned members to family groups`,
                                priority: 'medium',
                                category: 'Administration'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-blue-600 font-bold">2.</span>
                              <span>Create family-based ministry programs for {stats.totalFamilies} families</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: `Create family-based ministry programs for ${stats.totalFamilies} families`,
                                description: `Create family-based ministry programs for ${stats.totalFamilies} families. Develop programs that engage entire families in ministry activities.`,
                                content: `Create family-based ministry programs for ${stats.totalFamilies} families`,
                                priority: 'medium',
                                category: 'Ministry'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-blue-600 font-bold">3.</span>
                              <span>Develop family support systems</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: 'Develop family support systems',
                                description: 'Develop family support systems. Create structures to support families through various life challenges and transitions.',
                                content: 'Develop family support systems',
                                priority: 'medium',
                                category: 'Pastoral Care'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-blue-600 font-bold">1.</span>
                              <span>Strengthen existing family connections for {stats.totalFamilies} families</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: `Strengthen existing family connections for ${stats.totalFamilies} families`,
                                description: `Strengthen existing family connections for ${stats.totalFamilies} families. Deepen relationships and support within existing family units.`,
                                content: `Strengthen existing family connections for ${stats.totalFamilies} families`,
                                priority: 'medium',
                                category: 'Pastoral Care'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-blue-600 font-bold">2.</span>
                              <span>Create family-based ministry opportunities</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: 'Create family-based ministry opportunities',
                                description: 'Create family-based ministry opportunities. Develop programs that allow families to serve together in ministry.',
                                content: 'Create family-based ministry opportunities',
                                priority: 'medium',
                                category: 'Ministry'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-blue-600 font-bold">3.</span>
                              <span>Implement family celebration programs</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: 'Implement family celebration programs',
                                description: 'Implement family celebration programs. Create events and programs that celebrate family milestones and achievements.',
                                content: 'Implement family celebration programs',
                                priority: 'medium',
                                category: 'Events'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Communication Analysis */}
              {selectedCardType === 'communication' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-violet-600">
                            {stats.totalSMSMessages || 0}
                          </div>
                          <p className="text-sm text-muted-foreground">Total SMS Messages</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {stats.totalSMSConversations || 0}
                          </div>
                          <p className="text-sm text-muted-foreground">Active Conversations</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {stats.totalSMSConversations > 0 ? 'Active' : 'Growing'}
                          </div>
                          <p className="text-sm text-muted-foreground">Communication Health</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="bg-violet-50 dark:bg-violet-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-violet-800 dark:text-violet-200 mb-3">
                      Quick Analysis
                    </h4>
                    <div className="text-sm text-violet-700 dark:text-violet-300">
                      {stats.totalSMSConversations > 0 ? (
                        `✅ Strong communication - ${stats.totalSMSConversations} active conversations`
                      ) : (
                        `📱 Established channels - ${stats.totalSMSMessages} messages sent`
                      )}
                    </div>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-3">
                      Action Items
                    </h4>
                    <div className="text-sm text-purple-700 dark:text-purple-300 space-y-3">
                      {stats.totalSMSConversations > 0 ? (
                        <>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-purple-600 font-bold">1.</span>
                              <span>Maintain responsive pastoral protocols for {stats.totalSMSConversations} active conversations</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: `Maintain responsive pastoral protocols for ${stats.totalSMSConversations} active conversations`,
                                description: `Maintain responsive pastoral protocols for ${stats.totalSMSConversations} active conversations. Ensure timely responses and follow-up for ongoing pastoral care conversations.`,
                                content: `Maintain responsive pastoral protocols for ${stats.totalSMSConversations} active conversations`,
                                priority: 'high',
                                category: 'Pastoral Care'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-purple-600 font-bold">2.</span>
                              <span>Develop communication templates</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: 'Develop communication templates',
                                description: 'Develop communication templates. Create standardized templates for common pastoral care and outreach communications.',
                                content: 'Develop communication templates',
                                priority: 'medium',
                                category: 'Administration'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-purple-600 font-bold">3.</span>
                              <span>Create automated follow-up systems</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: 'Create automated follow-up systems',
                                description: 'Create automated follow-up systems. Implement systems to ensure consistent follow-up for pastoral care and outreach efforts.',
                                content: 'Create automated follow-up systems',
                                priority: 'medium',
                                category: 'Technology'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-purple-600 font-bold">1.</span>
                              <span>Encourage two-way communication with {stats.activeMembers} active members</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: `Encourage two-way communication with ${stats.activeMembers} active members`,
                                description: `Encourage two-way communication with ${stats.activeMembers} active members. Foster open communication channels for pastoral care and support.`,
                                content: `Encourage two-way communication with ${stats.activeMembers} active members`,
                                relatedMembers: activeMembers,
                                priority: 'medium',
                                category: 'Pastoral Care'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-purple-600 font-bold">2.</span>
                              <span>Create pastoral care protocols</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: 'Create pastoral care protocols',
                                description: 'Create pastoral care protocols. Develop standardized procedures for pastoral care and support communications.',
                                content: 'Create pastoral care protocols',
                                priority: 'medium',
                                category: 'Pastoral Care'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-purple-600 font-bold">3.</span>
                              <span>Develop communication templates</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: 'Develop communication templates',
                                description: 'Develop communication templates. Create standardized templates for common pastoral care and outreach communications.',
                                content: 'Develop communication templates',
                                priority: 'medium',
                                category: 'Administration'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Celebrations Analysis */}
              {selectedCardType === 'celebrations' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-600">
                            {stats.totalUpcoming || 0}
                          </div>
                          <p className="text-sm text-muted-foreground">Upcoming Celebrations</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-amber-600">
                            {stats.upcomingBirthdays || 0}
                          </div>
                          <p className="text-sm text-muted-foreground">Birthdays This Month</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">
                            {stats.upcomingAnniversaries || 0}
                          </div>
                          <p className="text-sm text-muted-foreground">Anniversaries This Month</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-3">
                      Quick Analysis
                    </h4>
                    <div className="text-sm text-yellow-700 dark:text-yellow-300">
                      {stats.totalUpcoming > 0 ? (
                        `🎉 Active tracking - ${stats.totalUpcoming} celebrations this month`
                      ) : (
                        '📅 No celebrations tracked - opportunity for milestone programs'
                      )}
                    </div>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-3">
                      Action Items
                    </h4>
                    <div className="text-sm text-amber-700 dark:text-amber-300 space-y-3">
                      {stats.totalUpcoming > 0 ? (
                        <>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-amber-600 font-bold">1.</span>
                              <span>Plan personalized celebration outreach for {stats.totalUpcoming} upcoming celebrations</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => {
                                const memberDetails = stats.upcomingMembers?.map(member => {
                                  const celebrationType = member.celebrationType === 'birthday' ? 'Birthday' : 
                                                       member.celebrationType === 'anniversary' ? 'Anniversary' : 'Membership';
                                  const celebrationDate = new Date(member.celebrationDate).toLocaleDateString();
                                  return `${member.firstname} ${member.lastname} (${celebrationType} on ${celebrationDate})`;
                                }).join(', ') || 'No upcoming celebrations';
                                
                                handleCreateTask({
                                  title: `Plan personalized celebration outreach for ${stats.totalUpcoming} upcoming celebrations`,
                                  description: `Plan personalized celebration outreach for ${stats.totalUpcoming} upcoming celebrations. Create personalized plans to celebrate member milestones and achievements.\n\nUpcoming celebrations: ${memberDetails}`,
                                  content: `Plan personalized celebration outreach for ${stats.totalUpcoming} upcoming celebrations`,
                                  relatedMembers: stats.upcomingMembers || [],
                                  priority: 'medium',
                                  category: 'Pastoral Care'
                                });
                              }}
                            >
                              Create Task
                            </Button>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-amber-600 font-bold">2.</span>
                              <span>Create celebration cards and gifts</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: 'Create celebration cards and gifts',
                                description: 'Create celebration cards and gifts. Develop personalized cards and gifts for member celebrations and milestones.',
                                content: 'Create celebration cards and gifts',
                                priority: 'medium',
                                category: 'Pastoral Care'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-amber-600 font-bold">3.</span>
                              <span>Implement celebration announcements</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: 'Implement celebration announcements',
                                description: 'Implement celebration announcements. Create systems to announce and celebrate member milestones and achievements.',
                                content: 'Implement celebration announcements',
                                priority: 'medium',
                                category: 'Pastoral Care'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-amber-600 font-bold">1.</span>
                              <span>Implement milestone tracking system for {stats.activeMembers} active members</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: `Implement milestone tracking system for ${stats.activeMembers} active members`,
                                description: `Implement milestone tracking system for ${stats.activeMembers} active members. Create systems to track and celebrate member milestones and achievements.`,
                                content: `Implement milestone tracking system for ${stats.activeMembers} active members`,
                                relatedMembers: activeMembers,
                                priority: 'medium',
                                category: 'Administration'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-amber-600 font-bold">2.</span>
                              <span>Create celebration outreach programs</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: 'Create celebration outreach programs',
                                description: 'Create celebration outreach programs. Develop programs to celebrate member milestones and achievements.',
                                content: 'Create celebration outreach programs',
                                priority: 'medium',
                                category: 'Pastoral Care'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-amber-600 font-bold">3.</span>
                              <span>Develop celebration ministries</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => handleCreateTask({
                                title: 'Develop celebration ministries',
                                description: 'Develop celebration ministries. Create dedicated ministries focused on celebrating member milestones and achievements.',
                                content: 'Develop celebration ministries',
                                priority: 'medium',
                                category: 'Ministry'
                              })}
                            >
                              Create Task
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Attendance Diversity Analysis */}
              {selectedCardType === 'attendance-diversity' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-cyan-600">
                            {stats.sundayServiceEvents || 0}
                          </div>
                          <p className="text-sm text-muted-foreground">Sunday Services</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-teal-600">
                            {stats.bibleStudyEvents || 0}
                          </div>
                          <p className="text-sm text-muted-foreground">Bible Studies</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {stats.fellowshipEvents || 0}
                          </div>
                          <p className="text-sm text-muted-foreground">Fellowship Events</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="bg-cyan-50 dark:bg-cyan-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-cyan-800 dark:text-cyan-200 mb-3">
                      Quick Analysis
                    </h4>
                    <div className="text-sm text-cyan-700 dark:text-cyan-300">
                      {(() => {
                        const eventTypes = [stats.sundayServiceEvents, stats.bibleStudyEvents, stats.fellowshipEvents].filter(count => count > 0);
                        const totalEvents = stats.sundayServiceEvents + stats.bibleStudyEvents + stats.fellowshipEvents;
                        
                        if (eventTypes.length >= 3) {
                          return `✅ Excellent diversity - ${totalEvents} events across ${eventTypes.length} categories`;
                        } else if (eventTypes.length >= 2) {
                          return `📊 Good variety - ${totalEvents} events across ${eventTypes.length} categories`;
                        } else {
                          return `⚠️ Limited diversity - ${totalEvents} events in ${eventTypes.length} category${eventTypes.length > 1 ? 'ies' : ''}`;
                        }
                      })()}
                    </div>
                  </div>

                  <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-teal-800 dark:text-teal-200 mb-3">
                      Action Items
                    </h4>
                    <div className="text-sm text-teal-700 dark:text-teal-300 space-y-3">
                      {(() => {
                        const eventTypes = [stats.sundayServiceEvents, stats.bibleStudyEvents, stats.fellowshipEvents].filter(count => count > 0);
                        const totalEvents = stats.sundayServiceEvents + stats.bibleStudyEvents + stats.fellowshipEvents;
                        
                        if (eventTypes.length >= 3) {
                          return (
                            <>
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-2 flex-1">
                                  <span className="text-teal-600 font-bold">1.</span>
                                  <span>Maintain and strengthen {totalEvents} existing programs</span>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-xs"
                                  onClick={() => handleCreateTask({
                                    title: `Maintain and strengthen ${totalEvents} existing programs`,
                                    description: `Maintain and strengthen ${totalEvents} existing programs. Focus on sustaining and improving current ministry offerings across multiple categories.`,
                                    content: `Maintain and strengthen ${totalEvents} existing programs`,
                                    priority: 'medium',
                                    category: 'Ministry'
                                  })}
                                >
                                  Create Task
                                </Button>
                              </div>
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-2 flex-1">
                                  <span className="text-teal-600 font-bold">2.</span>
                                  <span>Develop specialized age group ministries</span>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-xs"
                                  onClick={() => handleCreateTask({
                                    title: 'Develop specialized age group ministries',
                                    description: 'Develop specialized age group ministries. Create targeted programs for different age groups and demographics.',
                                    content: 'Develop specialized age group ministries',
                                    priority: 'medium',
                                    category: 'Ministry'
                                  })}
                                >
                                  Create Task
                                </Button>
                              </div>
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-2 flex-1">
                                  <span className="text-teal-600 font-bold">3.</span>
                                  <span>Create seasonal and special events</span>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-xs"
                                  onClick={() => handleCreateTask({
                                    title: 'Create seasonal and special events',
                                    description: 'Create seasonal and special events. Develop events and programs for different seasons and special occasions.',
                                    content: 'Create seasonal and special events',
                                    priority: 'medium',
                                    category: 'Events'
                                  })}
                                >
                                  Create Task
                                </Button>
                              </div>
                            </>
                          );
                        } else if (eventTypes.length >= 2) {
                          return (
                            <>
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-2 flex-1">
                                  <span className="text-teal-600 font-bold">1.</span>
                                  <span>Expand to include missing categories</span>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-xs"
                                  onClick={() => handleCreateTask({
                                    title: 'Expand to include missing categories',
                                    description: 'Expand to include missing categories. Develop programs in areas that are currently underrepresented in ministry offerings.',
                                    content: 'Expand to include missing categories',
                                    priority: 'medium',
                                    category: 'Ministry'
                                  })}
                                >
                                  Create Task
                                </Button>
                              </div>
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-2 flex-1">
                                  <span className="text-teal-600 font-bold">2.</span>
                                  <span>Develop specialized programs</span>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-xs"
                                  onClick={() => handleCreateTask({
                                    title: 'Develop specialized programs',
                                    description: 'Develop specialized programs. Create targeted programs for specific needs and demographics.',
                                    content: 'Develop specialized programs',
                                    priority: 'medium',
                                    category: 'Ministry'
                                  })}
                                >
                                  Create Task
                                </Button>
                              </div>
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-2 flex-1">
                                  <span className="text-teal-600 font-bold">3.</span>
                                  <span>Create seasonal opportunities</span>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-xs"
                                  onClick={() => handleCreateTask({
                                    title: 'Create seasonal opportunities',
                                    description: 'Create seasonal opportunities. Develop events and programs for different seasons and special occasions.',
                                    content: 'Create seasonal opportunities',
                                    priority: 'medium',
                                    category: 'Events'
                                  })}
                                >
                                  Create Task
                                </Button>
                              </div>
                            </>
                          );
                        } else {
                          return (
                            <>
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-2 flex-1">
                                  <span className="text-teal-600 font-bold">1.</span>
                                  <span>Develop comprehensive ministry planning</span>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-xs"
                                  onClick={() => handleCreateTask({
                                    title: 'Develop comprehensive ministry planning',
                                    description: 'Develop comprehensive ministry planning. Create a strategic plan to expand ministry offerings across multiple categories.',
                                    content: 'Develop comprehensive ministry planning',
                                    priority: 'high',
                                    category: 'Ministry'
                                  })}
                                >
                                  Create Task
                                </Button>
                              </div>
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-2 flex-1">
                                  <span className="text-teal-600 font-bold">2.</span>
                                  <span>Create diverse ministry opportunities</span>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-xs"
                                  onClick={() => handleCreateTask({
                                    title: 'Create diverse ministry opportunities',
                                    description: 'Create diverse ministry opportunities. Develop programs that serve different needs and demographics.',
                                    content: 'Create diverse ministry opportunities',
                                    priority: 'high',
                                    category: 'Ministry'
                                  })}
                                >
                                  Create Task
                                </Button>
                              </div>
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-2 flex-1">
                                  <span className="text-teal-600 font-bold">3.</span>
                                  <span>Implement specialized programs</span>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-xs"
                                  onClick={() => handleCreateTask({
                                    title: 'Implement specialized programs',
                                    description: 'Implement specialized programs. Create targeted programs for specific needs and demographics.',
                                    content: 'Implement specialized programs',
                                    priority: 'high',
                                    category: 'Ministry'
                                  })}
                                >
                                  Create Task
                                </Button>
                              </div>
                            </>
                          );
                        }
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Add more card type analyses as needed */}
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Task Creation Modal */}
      <TaskCreationModal
        isOpen={isTaskCreationModalOpen}
        onClose={() => setIsTaskCreationModalOpen(false)}
        suggestion={currentTaskSuggestion}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  </motion.div>
  );
}

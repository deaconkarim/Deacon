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
  Flag
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
import { useAttendanceStats } from '../lib/data/attendanceStats';
import LeadershipVerse from '@/components/LeadershipVerse';
import { PermissionFeature } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/lib/permissions';

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

  // SMS Conversation Dialog state
  const [selectedSMSConversation, setSelectedSMSConversation] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  
  // Badge activation states
  const [badgeStates, setBadgeStates] = useState({
    liveData: false,
    analyticsActive: false,
    aiIntelligence: false
  });

  // Memoize the date objects to prevent infinite re-renders
  const attendanceDateRange = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    return {
      startDate: thirtyDaysAgo,
      endDate: now
    };
  }, []); // Empty dependency array - only calculate once

  // Attendance stats for last 30 days - only load if user has permission
  const { isLoading: attendanceLoading, serviceBreakdown, memberStats, dailyData, eventDetails, error, clearCache: clearAttendanceCache } = useAttendanceStats(
    attendanceDateRange.startDate, 
    attendanceDateRange.endDate
  );

  // Make attendance cache clearing function available globally
  useEffect(() => {
    window.clearAttendanceCache = clearAttendanceCache;
    return () => {
      delete window.clearAttendanceCache;
    };
  }, [clearAttendanceCache]);

  if (error) {
    console.error('Attendance stats error:', error);
  }

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Use the consolidated dashboard service instead of multiple API calls
      const dashboardData = await dashboardService.getDashboardData();
      
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
    if (!isLoading) {
      // Reset badges first
      setBadgeStates({
        liveData: false,
        analyticsActive: false,
        aiIntelligence: false
      });
      
      // Start badge activation sequence after data loads
      const activateBadges = async () => {
        // 1. Activate Live Data badge (500ms delay)
        setTimeout(() => {
          setBadgeStates(prev => ({ ...prev, liveData: true }));
        }, 500);
        
        // 2. Activate Analytics Active badge (1.5s delay)
        setTimeout(() => {
          setBadgeStates(prev => ({ ...prev, analyticsActive: true }));
        }, 1500);
        
        // 3. Activate AI Intelligence badge (2.5s delay)
        setTimeout(() => {
          setBadgeStates(prev => ({ ...prev, aiIntelligence: true }));
        }, 2500);
      };
      
      activateBadges();
    } else {
      // Reset badges when loading
      setBadgeStates({
        liveData: false,
        analyticsActive: false,
        aiIntelligence: false
      });
    }
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
        {/* Header - Next-Gen Design */}
        <motion.div className="mb-4 sm:mb-8 relative" variants={itemVariants}>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 blur-3xl rounded-3xl"></div>
          <div className="relative backdrop-blur-sm bg-white/90 dark:bg-slate-900/95 border border-white/30 dark:border-slate-700/50 rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-6 lg:space-y-0">
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent mb-2">
                  Command Center
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-lg font-medium">
                  Intelligent Church Management System
                </p>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-4">
                  <div className={`flex items-center space-x-2 transition-all duration-500 ${badgeStates.liveData ? 'opacity-100 scale-100' : 'opacity-50 scale-95'}`}>
                    <div className={`w-3 h-3 bg-emerald-500 rounded-full transition-all duration-500 ${badgeStates.liveData ? 'animate-pulse shadow-lg shadow-emerald-500/50' : ''}`}></div>
                    <span className={`text-sm transition-all duration-500 ${badgeStates.liveData ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>Live Data</span>
                  </div>
                  <div className={`flex items-center space-x-2 transition-all duration-500 ${badgeStates.analyticsActive ? 'opacity-100 scale-100' : 'opacity-50 scale-95'}`}>
                    <div className={`w-3 h-3 bg-blue-500 rounded-full transition-all duration-500 ${badgeStates.analyticsActive ? 'animate-pulse shadow-lg shadow-blue-500/50' : ''}`}></div>
                    <span className={`text-sm transition-all duration-500 ${badgeStates.analyticsActive ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>Analytics Active</span>
                  </div>
                  <div className={`flex items-center space-x-2 transition-all duration-500 ${badgeStates.aiIntelligence ? 'opacity-100 scale-100' : 'opacity-50 scale-95'}`}>
                    <div className={`w-3 h-3 bg-purple-500 rounded-full transition-all duration-500 ${badgeStates.aiIntelligence ? 'animate-pulse shadow-lg shadow-purple-500/50' : ''}`}></div>
                    <span className={`text-sm transition-all duration-500 ${badgeStates.aiIntelligence ? 'text-purple-600 dark:text-purple-400 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>AI Intelligence</span>
                  </div>
                </div>
              </div>
              
              <div className="flex-shrink-0 max-w-md">
                <div className="relative backdrop-blur-sm bg-white/60 dark:bg-slate-800/90 border border-white/40 dark:border-slate-700/60 rounded-2xl p-4 shadow-lg">
                  <LeadershipVerse />
                </div>
                <Button
                  onClick={refreshDashboard}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full bg-white/60 dark:bg-slate-800/60 border-white/40 dark:border-slate-700/60 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-300"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh Data
                </Button>
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
                    {stats.mostCommonEventType === 'Sunday Worship Service' ? 'Sunday' :
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

      {/* Personal Tasks Section - Only show if user has assigned tasks */}
      {personalTasks && personalTasks.length > 0 && (
        <PermissionFeature permission={PERMISSIONS.TASKS_VIEW}>
          <motion.div variants={itemVariants} className="mb-6 sm:mb-12">
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

 {/* Church Intelligence - Deep Insights */}
      <PermissionFeature permission={PERMISSIONS.REPORTS_VIEW}>
        <motion.div variants={itemVariants} className="mb-6 sm:mb-12">
          <div className="group relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
            <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-3 sm:p-6 lg:p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Church Intelligence</h3>
                  <p className="text-slate-600 dark:text-slate-400">AI-powered insights and recommendations</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">AI Intelligence</span>
              </div>
            </div>
            
            {/* Deep Intelligence Grid */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {/* Growth Trajectory Analysis */}
              <motion.div className="group/card relative" variants={itemVariants}>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Growth Trend</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-green-600">
                      {isLoading ? '...' : stats.visitors > 0 ? 'Expanding' : 'Stable'}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {stats.visitors > 0 ? `${stats.visitors} new visitors this month` : 'Focus on visitor outreach'}
                    </p>
                    <div className="text-xs text-slate-500 dark:text-slate-500">
                      Recommendation: {stats.visitors > 0 ? 'Follow up with recent visitors' : 'Launch invitation campaign'}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Financial Health Score */}
              <motion.div className="group/card relative" variants={itemVariants}>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 rounded-xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Weekly Giving</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-emerald-600">
                      {isLoading ? '...' : canCalculateTrend ? (donationTrend > 0 ? 'Improving' : 'Declining') : 'Week ' + currentWeekOfMonth}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {canCalculateTrend ? `${Math.abs(donationTrend).toFixed(1)}% vs previous pattern` : trendContext}
                    </p>
                    <div className="text-xs text-slate-500 dark:text-slate-500">
                      {currentWeekOfMonth === 1 ? 'First week typically highest' : 
                       currentWeekOfMonth === 2 ? 'Second week pattern' :
                       currentWeekOfMonth === 3 ? 'Mid-month giving' :
                       currentWeekOfMonth === 4 ? 'Late month pattern' : 'Final week'}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Engagement Health */}
              <motion.div className="group/card relative" variants={itemVariants}>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <Activity className="h-4 w-4 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Community Health</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-blue-600">
                      {isLoading ? '...' : stats.inactiveMembers === 0 ? 'Excellent' : stats.inactiveMembers < 5 ? 'Good' : 'Needs Attention'}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {stats.inactiveMembers === 0 ? 'All members engaged' : `${stats.inactiveMembers} members need pastoral care`}
                    </p>
                    <div className="text-xs text-slate-500 dark:text-slate-500">
                      Action: {stats.inactiveMembers > 0 ? 'Schedule follow-up visits' : 'Maintain current connection level'}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Event Success Prediction */}
              <motion.div className="group/card relative" variants={itemVariants}>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-indigo-600/20 rounded-xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Event Momentum</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-indigo-600">
                      {isLoading ? '...' : stats.eventsThisMonth > stats.averageEventsPerMonth ? 'Strong' : 'Building'}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {stats.eventsThisMonth} events vs {stats.averageEventsPerMonth} monthly average
                    </p>
                    <div className="text-xs text-slate-500 dark:text-slate-500">
                      Opportunity: {stats.eventsNeedingVolunteers > 0 ? `Recruit volunteers for ${stats.eventsNeedingVolunteers} events` : 'Plan next special event'}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Communication Effectiveness */}
              <motion.div className="group/card relative" variants={itemVariants}>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500/20 to-violet-600/20 rounded-xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Connection Quality</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-violet-600">
                      {isLoading ? '...' : recentSMSConversations && recentSMSConversations.length > 0 ? 'Active' : 'Growing'}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {recentSMSConversations ? `${recentSMSConversations.filter(c => c.conversation_type === 'prayer_request').length} prayer requests` : 'Building communication channels'}
                    </p>
                    <div className="text-xs text-slate-500 dark:text-slate-500">
                      Focus: {recentSMSConversations && recentSMSConversations.length > 0 ? 'Maintain pastoral responsiveness' : 'Encourage two-way communication'}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Productivity Insights */}
              <motion.div className="group/card relative" variants={itemVariants}>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                      <CheckSquare className="h-4 w-4 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Ministry Efficiency</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-orange-600">
                      {isLoading ? '...' : stats.overdueTasks === 0 ? 'Excellent' : stats.overdueTasks < 3 ? 'Good' : 'Needs Focus'}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {stats.overdueTasks === 0 ? 'All tasks on track' : `${stats.overdueTasks} overdue items need attention`}
                    </p>
                    <div className="text-xs text-slate-500 dark:text-slate-500">
                      Priority: {stats.overdueTasks > 0 ? 'Address overdue tasks first' : 'Maintain current workflow'}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
        </PermissionFeature>
      {/* Recent Activity Feed & Attendance by Event Type */}
      <PermissionFeature permission={PERMISSIONS.SETTINGS_VIEW}>
        <motion.div variants={itemVariants} className="mb-6 sm:mb-12">
          <div className="grid gap-3 sm:gap-6 grid-cols-1 lg:grid-cols-2">
            {/* Recent Activity Feed */}
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

          {/* Attendance by Event Type */}
          <div className="group relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
            <div className="relative backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border border-white/20 dark:border-slate-700/20 rounded-3xl p-3 sm:p-6 lg:p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Attendance by Event Type</h3>
                  <p className="text-slate-600 dark:text-slate-400">Average attendance per event (last 6 months)</p>
                </div>
              </div>
              
              <div className="grid gap-4 grid-cols-1">
                {/* Sunday Service */}
                <motion.div 
                  className="group/card relative"
                  variants={itemVariants}
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-2xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                  <div className="relative backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="text-base font-semibold text-slate-900 dark:text-white">Sunday Service</h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {isLoading ? '...' : `${stats.sundayServiceEvents || 0} events • ${stats.sundayServiceAttendance || 0} total`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {isLoading ? '...' : Math.round((stats.sundayServiceAttendance || 0) / Math.max(stats.sundayServiceEvents || 1, 1))}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-500">avg attendance</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Bible Study */}
                <motion.div 
                  className="group/card relative"
                  variants={itemVariants}
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 rounded-2xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                  <div className="relative backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                          <Book className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="text-base font-semibold text-slate-900 dark:text-white">Bible Study</h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {isLoading ? '...' : `${stats.bibleStudyEvents || 0} events • ${stats.bibleStudyAttendance || 0} total`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-emerald-600">
                          {isLoading ? '...' : Math.round((stats.bibleStudyAttendance || 0) / Math.max(stats.bibleStudyEvents || 1, 1))}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-500">avg attendance</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Fellowship */}
                <motion.div 
                  className="group/card relative"
                  variants={itemVariants}
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 to-amber-600/20 rounded-2xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                  <div className="relative backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="text-base font-semibold text-slate-900 dark:text-white">Fellowship</h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {isLoading ? '...' : `${stats.fellowshipEvents || 0} events • ${stats.fellowshipAttendance || 0} total`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-amber-600">
                          {isLoading ? '...' : Math.round((stats.fellowshipAttendance || 0) / Math.max(stats.fellowshipEvents || 1, 1))}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-500">avg attendance</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <Button 
                  variant="outline" 
                  className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-all duration-300 h-12 text-base font-medium" 
                  asChild
                >
                  <a href="/events" className="flex items-center justify-center space-x-2">
                    <span>View All Events</span>
                    <ArrowUpRight className="h-5 w-5" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
        </PermissionFeature>
              
      {/* Advanced Analytics Section */}
      <PermissionFeature permission={PERMISSIONS.REPORTS_VIEW}>
        <motion.div variants={itemVariants} className="mb-6 sm:mb-12">
          <div className="group relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-slate-500 to-slate-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
            <div className="relative backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border border-white/20 dark:border-slate-700/20 rounded-3xl p-3 sm:p-6 lg:p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-500 to-slate-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Advanced Analytics</h3>
                  <p className="text-slate-600 dark:text-slate-400">Intelligent insights and performance metrics</p>
                </div>
              </div>
            </div>
            
            <div className="grid gap-3 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
               {/* Sunday Service Attendance Rate */}
               <div className={`p-3 sm:p-4 rounded-lg border ${
                stats.sundayServiceRate >= 70 ? 
                  'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800' :
                stats.sundayServiceRate >= 50 ? 
                  'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200 dark:border-yellow-800' :
                  'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className={`h-4 w-4 sm:h-5 sm:w-5 ${
                    stats.sundayServiceRate >= 70 ? 'text-green-600' :
                    stats.sundayServiceRate >= 50 ? 'text-yellow-600' :
                    'text-red-600'
                  }`} />
                  <h4 className={`font-semibold text-sm sm:text-base ${
                    stats.sundayServiceRate >= 70 ? 'text-green-900 dark:text-green-100' :
                    stats.sundayServiceRate >= 50 ? 'text-yellow-900 dark:text-yellow-100' :
                    'text-red-900 dark:text-red-100'
                  }`}>Sunday Service Rate</h4>
                </div>
                {isLoading ? (
                  <Skeleton className="h-4 w-32 mb-2" />
                ) : (
                  <p className={`text-xl sm:text-2xl font-bold mb-1 ${
                    stats.sundayServiceRate >= 70 ? 'text-green-700 dark:text-green-300' :
                    stats.sundayServiceRate >= 50 ? 'text-yellow-700 dark:text-yellow-300' :
                    'text-red-700 dark:text-red-300'
                  }`}>
                    {stats.sundayServiceRate.toFixed(0)}%
                  </p>
                )}
                <p className={`text-xs sm:text-sm ${
                  stats.sundayServiceRate >= 70 ? 'text-green-600 dark:text-green-400' :
                  stats.sundayServiceRate >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  Active members who attend Sunday service (last 90 days)
                </p>
                </div>
                
              {/* Donation Growth */}
              <div className={`p-3 sm:p-4 rounded-lg border ${
                !canCalculateTrend ? 
                  'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800' :
                donationTrend > 5 ? 
                  'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800' :
                donationTrend > 0 ? 
                  'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200 dark:border-yellow-800' :
                  'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className={`h-4 w-4 sm:h-5 sm:w-5 ${
                    !canCalculateTrend ? 'text-blue-600' :
                    donationTrend > 5 ? 'text-green-600' :
                    donationTrend > 0 ? 'text-yellow-600' :
                    'text-red-600'
                  }`} />
                  <h4 className={`font-semibold text-sm sm:text-base ${
                    !canCalculateTrend ? 'text-blue-900 dark:text-blue-100' :
                    donationTrend > 5 ? 'text-green-900 dark:text-green-100' :
                    donationTrend > 0 ? 'text-yellow-900 dark:text-yellow-100' :
                    'text-red-900 dark:text-red-100'
                  }`}>Weekly Trend</h4>
                </div>
                {isLoading ? (
                  <Skeleton className="h-4 w-32 mb-2" />
                ) : !canCalculateTrend ? (
                  <p className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-300 mb-1">
                    Week {currentWeekOfMonth}
                  </p>
                ) : (
                  <p className={`text-xl sm:text-2xl font-bold mb-1 ${
                    donationTrend > 5 ? 'text-green-700 dark:text-green-300' :
                    donationTrend > 0 ? 'text-yellow-700 dark:text-yellow-300' :
                    'text-red-700 dark:text-red-300'
                  }`}>
                    {donationTrend > 0 ? '+' : ''}{donationTrend.toFixed(1)}%
                    {donationTrend > 0 ? (
                      <ArrowUpRight className="inline h-5 w-5 text-green-500 ml-1" />
                    ) : (
                      <ArrowUpRight className="inline h-5 w-5 text-red-500 ml-1 rotate-180" />
                    )}
                  </p>
                )}
                <p className={`text-xs sm:text-sm ${
                  !canCalculateTrend ? 'text-blue-600 dark:text-blue-400' :
                  donationTrend > 5 ? 'text-green-600 dark:text-green-400' :
                  donationTrend > 0 ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {!canCalculateTrend ? 
                    `Week ${currentWeekOfMonth} - ${trendContext}` :
                    trendDescription
                  }
                </p>
              </div>
              
              {/* Event Activity */}
              <div className={`p-3 sm:p-4 rounded-lg border ${
                stats.eventsThisMonth > stats.averageEventsPerMonth * 1.2 ? 
                  'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800' :
                stats.eventsThisMonth > stats.averageEventsPerMonth ? 
                  'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200 dark:border-yellow-800' :
                  'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className={`h-4 w-4 sm:h-5 sm:w-5 ${
                    stats.eventsThisMonth > stats.averageEventsPerMonth * 1.2 ? 'text-green-600' :
                    stats.eventsThisMonth > stats.averageEventsPerMonth ? 'text-yellow-600' :
                    'text-red-600'
                  }`} />
                  <h4 className={`font-semibold text-sm sm:text-base ${
                    stats.eventsThisMonth > stats.averageEventsPerMonth * 1.2 ? 'text-green-900 dark:text-green-100' :
                    stats.eventsThisMonth > stats.averageEventsPerMonth ? 'text-yellow-900 dark:text-yellow-100' :
                    'text-red-900 dark:text-red-100'
                  }`}>Event Activity</h4>
            </div>
                {isLoading ? (
                  <Skeleton className="h-4 w-32 mb-2" />
                ) : (
                  <p className={`text-xl sm:text-2xl font-bold mb-1 ${
                    stats.eventsThisMonth > stats.averageEventsPerMonth * 1.2 ? 'text-green-700 dark:text-green-300' :
                    stats.eventsThisMonth > stats.averageEventsPerMonth ? 'text-yellow-700 dark:text-yellow-300' :
                    'text-red-700 dark:text-red-300'
                  }`}>
                    {stats.eventsThisMonth > stats.averageEventsPerMonth ? 'Above' : 'Below'} Average
                  </p>
                )}
                <p className={`text-xs sm:text-sm ${
                  stats.eventsThisMonth > stats.averageEventsPerMonth * 1.2 ? 'text-green-600 dark:text-green-400' :
                  stats.eventsThisMonth > stats.averageEventsPerMonth ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {stats.eventsThisMonth} events this month vs {stats.averageEventsPerMonth} average
                </p>
          </div>
              
 {/* Task Management */}
 <div className={`p-3 sm:p-4 rounded-lg border ${
                stats.totalTasks > 0 ? 
                  (stats.overdueTasks / stats.totalTasks) <= 0.1 ? 
                    'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800' :
                  (stats.overdueTasks / stats.totalTasks) <= 0.3 ? 
                    'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200 dark:border-yellow-800' :
                    'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800'
                : 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <CheckSquare className={`h-4 w-4 sm:h-5 sm:w-5 ${
                    stats.totalTasks > 0 ? 
                      (stats.overdueTasks / stats.totalTasks) <= 0.1 ? 'text-green-600' :
                      (stats.overdueTasks / stats.totalTasks) <= 0.3 ? 'text-yellow-600' :
                      'text-red-600'
                    : 'text-blue-600'
                  }`} />
                  <h4 className={`font-semibold text-sm sm:text-base ${
                    stats.totalTasks > 0 ? 
                      (stats.overdueTasks / stats.totalTasks) <= 0.1 ? 'text-green-900 dark:text-green-100' :
                      (stats.overdueTasks / stats.totalTasks) <= 0.3 ? 'text-yellow-900 dark:text-yellow-100' :
                      'text-red-900 dark:text-red-100'
                    : 'text-blue-900 dark:text-blue-100'
                  }`}>On-Time Completion</h4>
                </div>
                {isLoading ? (
                  <Skeleton className="h-4 w-32 mb-2" />
                ) : (
                  <p className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-300 mb-1">
                    {stats.totalTasks > 0 ? `${((stats.totalTasks - stats.overdueTasks) / stats.totalTasks * 100).toFixed(0)}%` : '0%'}
                  </p>
                )}
                <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">
                  {stats.overdueTasks} overdue tasks need attention
                </p>
                  </div>

              {/* Volunteer Engagement */}
              <div className={`p-3 sm:p-4 rounded-lg border ${
                stats.eventsStillNeedingVolunteers === 0 ? 
                  'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800' :
                stats.eventsStillNeedingVolunteers <= stats.eventsWithVolunteersEnabled * 0.3 ? 
                  'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200 dark:border-yellow-800' :
                  'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Users2 className={`h-4 w-4 sm:h-5 sm:w-5 ${
                    stats.eventsStillNeedingVolunteers === 0 ? 'text-green-600' :
                    stats.eventsStillNeedingVolunteers <= stats.eventsWithVolunteersEnabled * 0.3 ? 'text-yellow-600' :
                    'text-red-600'
                  }`} />
                  <h4 className={`font-semibold text-sm sm:text-base ${
                    stats.eventsStillNeedingVolunteers === 0 ? 'text-green-900 dark:text-green-100' :
                    stats.eventsStillNeedingVolunteers <= stats.eventsWithVolunteersEnabled * 0.3 ? 'text-yellow-900 dark:text-yellow-100' :
                    'text-red-900 dark:text-red-100'
                  }`}>Volunteer Engagement</h4>
                </div>
                {isLoading ? (
                  <Skeleton className="h-4 w-32 mb-2" />
                ) : (
                  <p className={`text-xl sm:text-2xl font-bold mb-1 ${
                    stats.eventsStillNeedingVolunteers === 0 ? 'text-green-700 dark:text-green-300' :
                    stats.eventsStillNeedingVolunteers <= stats.eventsWithVolunteersEnabled * 0.3 ? 'text-yellow-700 dark:text-yellow-300' :
                    'text-red-700 dark:text-red-300'
                  }`}>
                    {stats.eventsStillNeedingVolunteers === 0 ? 'Fully Staffed' :
                     stats.eventsStillNeedingVolunteers <= stats.eventsWithVolunteersEnabled * 0.3 ? 'Good Coverage' :
                     'Needs Volunteers'}
                  </p>
                )}
                <p className={`text-xs sm:text-sm ${
                  stats.eventsStillNeedingVolunteers === 0 ? 'text-green-600 dark:text-green-400' :
                  stats.eventsStillNeedingVolunteers <= stats.eventsWithVolunteersEnabled * 0.3 ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {stats.eventsStillNeedingVolunteers} events need volunteers
                </p>
              </div>
              
              {/* Recent Visitors */}
              <div className={`p-3 sm:p-4 rounded-lg border ${
                (() => {
                  const thirtyDaysAgo = new Date();
                  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                  const recentVisitors = people.filter(person => 
                    person.status === 'visitor' && 
                    new Date(person.createdAt) >= thirtyDaysAgo
                  ).length;
                  return recentVisitors >= 3 ? 
                    'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800' :
                  recentVisitors >= 1 ? 
                    'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200 dark:border-yellow-800' :
                    'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800';
                })()
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <UserPlus className={`h-4 w-4 sm:h-5 sm:w-5 ${
                    (() => {
                      const thirtyDaysAgo = new Date();
                      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                      const recentVisitors = people.filter(person => 
                        person.status === 'visitor' && 
                        new Date(person.createdAt) >= thirtyDaysAgo
                      ).length;
                      return recentVisitors >= 3 ? 'text-green-600' :
                             recentVisitors >= 1 ? 'text-yellow-600' :
                             'text-red-600';
                    })()
                  }`} />
                  <h4 className={`font-semibold text-sm sm:text-base ${
                    (() => {
                      const thirtyDaysAgo = new Date();
                      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                      const recentVisitors = people.filter(person => 
                        person.status === 'visitor' && 
                        new Date(person.createdAt) >= thirtyDaysAgo
                      ).length;
                      return recentVisitors >= 3 ? 'text-green-900 dark:text-green-100' :
                             recentVisitors >= 1 ? 'text-yellow-900 dark:text-yellow-100' :
                             'text-red-900 dark:text-red-100';
                    })()
                  }`}>Recent Visitors</h4>
                </div>
                {isLoading ? (
                  <Skeleton className="h-4 w-32 mb-2" />
                ) : (
                  <p className={`text-xl sm:text-2xl font-bold mb-1 ${
                    (() => {
                      const thirtyDaysAgo = new Date();
                      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                      const recentVisitors = people.filter(person => 
                        person.status === 'visitor' && 
                        new Date(person.createdAt) >= thirtyDaysAgo
                      ).length;
                      return recentVisitors >= 3 ? 'text-green-700 dark:text-green-300' :
                             recentVisitors >= 1 ? 'text-yellow-700 dark:text-yellow-300' :
                             'text-red-700 dark:text-red-300';
                    })()
                  }`}>
                    {(() => {
                      const thirtyDaysAgo = new Date();
                      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                      
                      // Count visitors added in the last 30 days
                      const recentVisitors = people.filter(person => 
                        person.status === 'visitor' && 
                        new Date(person.createdAt) >= thirtyDaysAgo
                      ).length;
                      
                      return recentVisitors;
                    })()}
                  </p>
                )}
                <p className={`text-xs sm:text-sm ${
                  (() => {
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    const recentVisitors = people.filter(person => 
                      person.status === 'visitor' && 
                      new Date(person.createdAt) >= thirtyDaysAgo
                    ).length;
                    return recentVisitors >= 3 ? 'text-green-600 dark:text-green-400' :
                           recentVisitors >= 1 ? 'text-yellow-600 dark:text-yellow-400' :
                           'text-red-600 dark:text-red-400';
                  })()
                }`}>
                  New visitors added in the last 30 days
                </p>
                </div>
                </div>

            {/* Additional Insights Row */}
            <div className="mt-6 grid gap-3 sm:gap-4 md:grid-cols-2">
              {/* Top Performing Metric */}
              <div className="p-3 sm:p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                  <h4 className="font-semibold text-emerald-900 dark:text-emerald-100">Top Performing Area</h4>
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
                            value: stats.eventsThisMonth > stats.averageEventsPerMonth ? 100 : 50,
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
                            value: stats.eventsThisMonth > stats.averageEventsPerMonth ? 100 : 50,
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

              {/* Growth Opportunity */}
              <div className="p-3 sm:p-4 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                  <h4 className="font-semibold text-amber-900 dark:text-amber-100">Growth Opportunity</h4>
      </div>
                {isLoading ? (
                  <Skeleton className="h-4 w-48 mb-2" />
                ) : (
                  <div>
                    <p className="text-lg font-bold text-amber-700 dark:text-amber-300 mb-1">
                      {(() => {
                        // Priority 1: Immediate needs
                        if (stats.eventsStillNeedingVolunteers > 0) return 'Volunteer Recruitment';
                    
                        // Priority 2: Donation trends
                        if (donationTrend < 0) return 'Donation Growth';

                        // Priority 4: Sunday service attendance
                        if (stats.sundayServiceRate < 50) return 'Sunday Service Attendance';
                        
                        // Priority 4: Event activity
                        if (stats.eventsThisMonth < stats.averageEventsPerMonth) return 'Event Planning';                        
                        
                        // Priority 7: Visitor follow-up
                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        const recentVisitors = people.filter(person => 
                          person.status === 'visitor' && 
                          new Date(person.createdAt) >= thirtyDaysAgo
                        ).length;
                      
                        if (recentVisitors > 0) return 'Visitor Follow-up';
                        // Priority 3: Member engagement issues
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

                        // Priority 3: Member engagement issues
                        if (stats.totalPeople > 0 && (stats.activeMembers / stats.totalPeople) < 0.7) return 'Focus on engaging inactive members.';
                        
                        // Priority 4: Sunday service attendance
                        if (stats.sundayServiceRate < 50) return 'Address attendance barriers.';
                        
                        // Priority 5: Event activity
                        if (stats.eventsThisMonth < stats.averageEventsPerMonth) return 'Plan more events for engagement.';
                        
                        // Priority 6: Visitor follow-up
                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        const recentVisitors = people.filter(person => 
                          person.status === 'visitor' && 
                          new Date(person.createdAt) >= thirtyDaysAgo
                        ).length;
                        
                        if (recentVisitors > 0) return 'Follow up with recent visitors.';
                        
                        // Default: Member retention
                        return 'Focus on member relationships.';
                      })()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>



      {/* Detailed Attendance Statistics */}
      <motion.div variants={itemVariants} className="mb-6 sm:mb-12">
        <div className="group relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
          <div className="relative backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border border-white/20 dark:border-slate-700/20 rounded-3xl p-3 sm:p-6 lg:p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Attendance Statistics</h3>
                  <p className="text-slate-600 dark:text-slate-400">Last 30 days overview</p>
                </div>
              </div>
            </div>
            
            <div className="grid gap-3 sm:gap-6 grid-cols-1 lg:grid-cols-2">
              {/* Service Breakdown */}
              <motion.div 
                className="group/card relative"
                variants={itemVariants}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-2xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                <div className="relative backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300">
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Service Breakdown
                  </h4>
                  <div className="space-y-3">
                    {attendanceLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="flex items-center justify-between">
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-8"></div>
                          </div>
                        </div>
                      ))
                    ) : serviceBreakdown && serviceBreakdown.length > 0 ? (
                      serviceBreakdown.map((service, index) => (
                        <div key={service.name} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {service.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-blue-600">{service.value}</span>
                            {index === 0 && <Trophy className="h-4 w-4 text-yellow-600" />}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                        No attendance data available for the last 30 days
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Event Attendance */}
              <motion.div 
                className="group/card relative"
                variants={itemVariants}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 rounded-2xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                <div className="relative backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300">
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-emerald-600" />
                    Event Attendance
                  </h4>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {attendanceLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2"></div>
                          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                        </div>
                      ))
                    ) : eventDetails && eventDetails.length > 0 ? (
                      eventDetails.slice(0, 5).map((event) => (
                        <div key={event.id} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate pr-2">
                              {event.title}
                            </span>
                            <span className="text-sm font-bold text-emerald-600 flex-shrink-0">
                              {event.attendees} attendees
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {format(parseISO(event.date), 'M/d/yyyy')}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                        No events found for the last 30 days
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Top Attendees */}
            <motion.div 
              className="group/card relative mt-6"
              variants={itemVariants}
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 to-amber-600/20 rounded-2xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
              <div className="relative backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300">
                <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-600" />
                  Top Attendees
                </h4>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {attendanceLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="animate-pulse flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full mb-1"></div>
                          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
                        </div>
                      </div>
                    ))
                  ) : memberStats && memberStats.length > 0 ? (
                    memberStats.slice(0, 6).map((member, index) => (
                      <div 
                        key={member.name} 
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                        onClick={() => handleMemberProfileClick(member.id)}
                      >
                        <div className="relative">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={member.image} alt={member.name} />
                            <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                              {getInitials(member.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                            {member.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {member.count} events
                          </p>
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm font-bold text-amber-600">{member.count}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-4">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        No attendance data available for the last 30 days
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
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
                        {isLoading ? '...' : (stats.eventsThisMonth >= stats.averageEventsPerMonth ? 'Above' : 'Below')} Average
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
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">AI Intelligence</span>
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
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">AI Intelligence</span>
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
      </div>
    </motion.div>
  );
}

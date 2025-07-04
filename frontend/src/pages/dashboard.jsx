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
import { dashboardService } from '../lib/dashboardService';

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

  // SMS Conversation Dialog state
  const [selectedSMSConversation, setSelectedSMSConversation] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Memoize the date objects to prevent infinite re-renders
  const attendanceDateRange = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    return {
      startDate: thirtyDaysAgo,
      endDate: now
    };
  }, []); // Empty dependency array - only calculate once

  // Attendance stats for last 30 days
  const { isLoading: attendanceLoading, serviceBreakdown, memberStats, dailyData, eventDetails, error } = useAttendanceStats(
    attendanceDateRange.startDate, 
    attendanceDateRange.endDate
  );

  if (error) {
    console.error('Attendance stats error:', error);
  }

  const loadDashboardData = useCallback(async () => {
    try {
      // Use the consolidated dashboard service instead of multiple API calls
      const dashboardData = await dashboardService.getDashboardData();
      
      // Extract data from the consolidated response
      const { members, donations: donationsData, events: eventsData, tasks, sms, celebrations, attendance, family } = dashboardData;
      
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

      // Debug: Log a few sample donations to see the data structure
      console.log('Sample donations:', donationsData.all.slice(0, 3).map(d => ({
        id: d.id,
        date: d.date,
        amount: d.amount,
        dateType: typeof d.date
      })));

      // Use pre-calculated stats from the service
      const totalDonations = donationsData.stats.total;
      const monthlyDonations = donationsData.stats.monthly;
      const weeklyAverage = donationsData.stats.weeklyAverage;
      const monthlyAverage = donationsData.stats.monthlyAverage;
      const growthRate = donationsData.stats.growthRate;
      const lastMonthDonations = donationsData.stats.lastMonth;
      const twoMonthsAgoDonations = donationsData.stats.twoMonthsAgo;
      const lastSundayDonations = donationsData.stats.lastSunday;

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
        lastWeekDonations: weeklyAverage, // Using weekly average as approximation
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

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
     }, [toast]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

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

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const percentMonth = dayOfMonth / daysInMonth;
  const projectedDonations = percentMonth > 0 ? (stats.monthlyDonations / percentMonth) : 0;
  const lastMonthDonations = stats.lastMonthDonations || 0; // You may need to fetch/calculate this if not present
  const twoMonthsAgoDonations = stats.twoMonthsAgoDonations || 0;
  
  // Calculate donation trend, but handle cases where we can't calculate it
  let donationTrend = null;
  let canCalculateTrend = false;
  let trendDescription = '';
  
  console.log('Donation trend debug:', {
    lastMonthDonations,
    twoMonthsAgoDonations,
    monthlyDonations: stats.monthlyDonations,
    projectedDonations,
    percentMonth
  });
  
  if (lastMonthDonations > 0 && stats.monthlyDonations > 0) {
    // Calculate trend between current month (projected) and last month
    donationTrend = ((projectedDonations - lastMonthDonations) / lastMonthDonations) * 100;
    canCalculateTrend = true;
    trendDescription = `Projected: $${projectedDonations.toLocaleString(undefined, {maximumFractionDigits: 0})} vs Last Month: $${lastMonthDonations.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
    console.log('Calculated trend (current vs last month):', donationTrend);
  } else if (lastMonthDonations === 0 && stats.monthlyDonations > 0) {
    // If we have donations this month but none last month, it's a positive trend
    donationTrend = 100;
    canCalculateTrend = true;
    trendDescription = `This Month: $${stats.monthlyDonations.toLocaleString(undefined, {maximumFractionDigits: 0})} vs Last Month: $0`;
    console.log('No last month donations, but current month has donations. Trend set to 100%');
  } else if (lastMonthDonations > 0 && stats.monthlyDonations === 0 && twoMonthsAgoDonations > 0) {
    // If no current month donations, compare last month vs two months ago
    donationTrend = ((lastMonthDonations - twoMonthsAgoDonations) / twoMonthsAgoDonations) * 100;
    canCalculateTrend = true;
    trendDescription = `Last Month: $${lastMonthDonations.toLocaleString(undefined, {maximumFractionDigits: 0})} vs Two Months Ago: $${twoMonthsAgoDonations.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
    console.log('Calculated trend (last month vs two months ago):', donationTrend);
  } else if (lastMonthDonations > 0 && stats.monthlyDonations === 0 && twoMonthsAgoDonations === 0) {
    // If we have last month donations but no current month or two months ago donations, show waiting message
    console.log('Last month had donations but no current month or two months ago donations, showing waiting message');
  } else {
    console.log('No donations in any of the last 3 months, cannot calculate trend');
  }
  
  console.log('Final values:', { donationTrend, canCalculateTrend, trendDescription });

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

  return (
    <div className="space-y-6 sm:space-y-8 px-4 sm:px-0 w-full max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Command Center</h1>
      </div>
      
      {/* Leadership Verse - Inspirational component */}
      <motion.div variants={itemVariants}>
        <LeadershipVerse />
      </motion.div>

      {/* Main Stats Grid - Optimized for Mobile */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-5 sm:p-6">
              <CardTitle className="flex items-center text-xl sm:text-2xl">
                <Users2 className="mr-3 h-6 w-6 sm:h-7 sm:w-7" />
                People
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-6">
              {isLoading ? (
                <Skeleton className="h-10 w-20 mb-2" />
              ) : (
                <div className="text-3xl sm:text-4xl font-bold">{stats.totalPeople}</div>
              )}
              <p className="text-base sm:text-lg text-muted-foreground mt-2">Total People</p>
              
              {/* Member type breakdown */}
              <div className="mt-4 sm:mt-5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base text-green-600 font-medium">Active</span>
                  {isLoading ? (
                    <Skeleton className="h-5 w-10" />
                  ) : (
                    <span className="text-sm sm:text-base font-semibold">{stats.activeMembers}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base text-orange-600 font-medium">Inactive</span>
                  {isLoading ? (
                    <Skeleton className="h-5 w-10" />
                  ) : (
                    <span className="text-sm sm:text-base font-semibold">{stats.inactiveMembers}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base text-blue-600 font-medium">Visitors</span>
                  {isLoading ? (
                    <Skeleton className="h-5 w-10" />
                  ) : (
                    <span className="text-sm sm:text-base font-semibold">{stats.visitors}</span>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted py-3 px-5 sm:px-6 border-t">
              <Button variant="outline" className="w-full text-sm sm:text-base h-10 sm:h-11" asChild>
                <a href="/members">View All People</a>
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white p-5 sm:p-6">
              <CardTitle className="flex items-center text-xl sm:text-2xl">
                <DollarSign className="mr-3 h-6 w-6 sm:h-7 sm:w-7" />
                Donations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-6">
              {isLoading ? (
                <Skeleton className="h-10 w-24 mb-2" />
              ) : (
                <div className="text-3xl sm:text-4xl font-bold">
                  {stats.monthlyDonations > 0 ?
                    `$${(stats.monthlyDonations || 0).toFixed(0)}` :
                    `$${(stats.lastMonthDonations || 0).toFixed(0)}`
                  }
                </div>
              )}
              <p className="text-base sm:text-lg text-muted-foreground mt-2">
                {stats.monthlyDonations > 0 ? 'This month' : 'Last month'}
              </p>
              
              {/* Donation breakdown */}
              <div className="mt-4 sm:mt-5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base text-green-600 font-medium">Monthly Avg</span>
                  {isLoading ? (
                    <Skeleton className="h-5 w-16" />
                  ) : (
                    <span className="text-sm sm:text-base font-semibold">${(stats.monthlyAverage || 0).toFixed(0)}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base text-green-600 font-medium">Weekly Avg</span>
                  {isLoading ? (
                    <Skeleton className="h-5 w-16" />
                  ) : (
                    <span className="text-sm sm:text-base font-semibold">${(stats.weeklyAverage || 0).toFixed(0)}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base text-green-600 font-medium">Last Week</span>
                  {isLoading ? (
                    <Skeleton className="h-5 w-16" />
                  ) : (
                    <span className="text-sm sm:text-base font-semibold">${(stats.lastSundayDonations || 0).toFixed(0)}</span>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted py-3 px-5 sm:px-6 border-t">
              <Button variant="outline" className="w-full text-sm sm:text-base h-10 sm:h-11" asChild>
                <a href="/donations">View All Donations</a>
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-5 sm:p-6">
              <CardTitle className="flex items-center text-xl sm:text-2xl">
                <Calendar className="mr-3 h-6 w-6 sm:h-7 sm:w-7" />
                Events
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-6">
              {isLoading ? (
                <Skeleton className="h-10 w-20 mb-2" />
              ) : (
                <div className="text-3xl sm:text-4xl font-bold">{stats.upcomingEvents || 0}</div>
              )}
              <p className="text-base sm:text-lg text-muted-foreground mt-2">Upcoming events</p>
              
              {/* Events breakdown */}
              <div className="mt-4 sm:mt-5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base text-purple-600 font-medium">Need Volunteers</span>
                  {isLoading ? (
                    <Skeleton className="h-5 w-10" />
                  ) : (
                    <span className="text-sm sm:text-base font-semibold">{stats.eventsNeedingVolunteers || 0}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base text-purple-600 font-medium">This Week</span>
                  {isLoading ? (
                    <Skeleton className="h-5 w-10" />
                  ) : (
                    <span className="text-sm sm:text-base font-semibold">{stats.eventsThisWeek}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base text-purple-600 font-medium">Most Common</span>
                  {isLoading ? (
                    <Skeleton className="h-5 w-16" />
                  ) : (
                    <span className="text-sm sm:text-base font-semibold truncate max-w-[120px]">
                      {stats.mostCommonEventType === 'Sunday Worship Service' ? 'Sunday' :
                       stats.mostCommonEventType === 'Bible Study' ? 'Bible Study' :
                       stats.mostCommonEventType === 'Fellowship' ? 'Fellowship' :
                       stats.mostCommonEventType === 'Other' ? 'Other' :
                       stats.mostCommonEventType === 'None' ? 'None' :
                       stats.mostCommonEventType}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted py-3 px-5 sm:px-6 border-t">
              <Button variant="outline" className="w-full text-sm sm:text-base h-10 sm:h-11" asChild>
                <a href="/events">View All Events</a>
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-5 sm:p-6">
              <CardTitle className="flex items-center text-xl sm:text-2xl">
                <Bell className="mr-3 h-6 w-6 sm:h-7 sm:w-7" />
                Celebrations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-6">
              {isLoading ? (
                <Skeleton className="h-10 w-20 mb-2" />
              ) : (
                <div className="text-3xl sm:text-4xl font-bold">{stats.totalUpcoming || 0}</div>
              )}
              <p className="text-base sm:text-lg text-muted-foreground mt-2">Upcoming celebrations</p>
              
              {/* Celebrations breakdown */}
              <div className="mt-4 sm:mt-5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base text-blue-600 font-medium">Birthdays</span>
                  {isLoading ? (
                    <Skeleton className="h-5 w-10" />
                  ) : (
                    <span className="text-sm sm:text-base font-semibold">{stats.upcomingBirthdays || 0}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base text-blue-600 font-medium">Anniversaries</span>
                  {isLoading ? (
                    <Skeleton className="h-5 w-10" />
                  ) : (
                    <span className="text-sm sm:text-base font-semibold">{stats.upcomingAnniversaries || 0}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base text-blue-600 font-medium">Memberships</span>
                  {isLoading ? (
                    <Skeleton className="h-5 w-10" />
                  ) : (
                    <span className="text-sm sm:text-base font-semibold">{stats.upcomingMemberships || 0}</span>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted py-3 px-5 sm:px-6 border-t">
              <Button variant="outline" className="w-full text-sm sm:text-base h-10 sm:h-11" asChild>
                <a href="/alerts">View All Celebrations</a>
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-5 sm:p-6">
              <CardTitle className="flex items-center text-xl sm:text-2xl">
                <CheckSquare className="mr-3 h-6 w-6 sm:h-7 sm:w-7" />
                Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-6">
              {isLoading ? (
                <Skeleton className="h-10 w-20 mb-2" />
              ) : (
                <div className="text-3xl sm:text-4xl font-bold">{stats.pendingTasks || 0}</div>
              )}
              <p className="text-base sm:text-lg text-muted-foreground mt-2">Pending tasks</p>
              
              {/* Tasks breakdown */}
              <div className="mt-4 sm:mt-5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base text-orange-600 font-medium">Total Tasks</span>
                  {isLoading ? (
                    <Skeleton className="h-5 w-10" />
                  ) : (
                    <span className="text-sm sm:text-base font-semibold">{stats.totalTasks || 0}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base text-orange-600 font-medium">Completed</span>
                  {isLoading ? (
                    <Skeleton className="h-5 w-10" />
                  ) : (
                    <span className="text-sm sm:text-base font-semibold">{stats.completedTasks || 0}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base text-orange-600 font-medium">Overdue</span>
                  {isLoading ? (
                    <Skeleton className="h-5 w-10" />
                  ) : (
                    <span className="text-sm sm:text-base font-semibold">{stats.overdueTasks || 0}</span>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted py-3 px-5 sm:px-6 border-t">
              <Button variant="outline" className="w-full text-sm sm:text-base h-10 sm:h-11" asChild>
                <a href="/tasks">View All Tasks</a>
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-teal-500 to-teal-600 text-white p-5 sm:p-6">
              <CardTitle className="flex items-center text-xl sm:text-2xl">
                <MessageSquare className="mr-3 h-6 w-6 sm:h-7 sm:w-7" />
                SMS
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-6">
              {isLoading ? (
                <Skeleton className="h-10 w-20 mb-2" />
              ) : (
                <div className="text-3xl sm:text-4xl font-bold">{stats.recentSMSMessages || 0}</div>
              )}
              <p className="text-base sm:text-lg text-muted-foreground mt-2">Recent (30 days)</p>
              
              {/* SMS breakdown */}
              <div className="mt-4 sm:mt-5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base text-teal-600 font-medium">Total Conversations</span>
                  {isLoading ? (
                    <Skeleton className="h-5 w-10" />
                  ) : (
                    <span className="text-sm sm:text-base font-semibold">{stats.totalSMSConversations || 0}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base text-teal-600 font-medium">Outbound</span>
                  {isLoading ? (
                    <Skeleton className="h-5 w-10" />
                  ) : (
                    <span className="text-sm sm:text-base font-semibold">{stats.outboundSMSMessages || 0}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base text-teal-600 font-medium">Inbound</span>
                  {isLoading ? (
                    <Skeleton className="h-5 w-10" />
                  ) : (
                    <span className="text-sm sm:text-base font-semibold">{stats.inboundSMSMessages || 0}</span>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted py-3 px-5 sm:px-6 border-t">
              <Button variant="outline" className="w-full text-sm sm:text-base h-10 sm:h-11" asChild>
                <a href="/sms">View All Messages</a>
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>

      {/* Recent SMS Conversations */}
      <motion.div variants={itemVariants} className="w-full max-w-full">
        <Card className="w-full max-w-full overflow-hidden">
          <CardHeader className="p-5 sm:p-6">
            <CardTitle className="flex items-center text-xl sm:text-2xl">
              <MessageSquare className="mr-3 h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0" />
              <span className="truncate">Recent SMS</span>
            </CardTitle>
            <CardDescription className="text-base sm:text-lg">Latest conversations</CardDescription>
          </CardHeader>
          <CardContent className="p-5 sm:p-6 w-full max-w-full">
            <div className="space-y-4 sm:space-y-5 w-full max-w-full">
              {recentSMSConversations && recentSMSConversations.length > 0 ? (
                recentSMSConversations.slice(0, 5).map(conversation => (
                  <div 
                    key={conversation.id} 
                    className="flex items-center border-b pb-3 sm:pb-4 cursor-pointer hover:bg-muted/50 rounded-lg p-3 sm:p-4 transition-colors w-full max-w-full overflow-hidden"
                    onClick={() => handleSMSConversationClick(conversation)}
                    style={{ maxWidth: '100%' }}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0 overflow-hidden" style={{ maxWidth: '100%' }}>
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        conversation.conversation_type === 'prayer_request' ? 'bg-purple-100 text-purple-600' :
                        conversation.conversation_type === 'emergency' ? 'bg-red-100 text-red-600' :
                        conversation.conversation_type === 'event_reminder' ? 'bg-blue-100 text-blue-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden" style={{ maxWidth: 'calc(100% - 4rem)' }}>
                        <p className="font-medium text-base sm:text-lg truncate" style={{ maxWidth: '100%', wordBreak: 'break-all' }}>
                          {(conversation.title || 'SMS Conversation').substring(0, 25)}
                          {(conversation.title || 'SMS Conversation').length > 25 ? '...' : ''}
                        </p>
                        <div className="space-y-1 w-full">
                          <p className="text-sm sm:text-base text-muted-foreground truncate" style={{ maxWidth: '100%' }}>
                            {(() => {
                              const type = conversation.conversation_type === 'prayer_request' ? 'Prayer' :
                                         conversation.conversation_type === 'emergency' ? 'Emergency' :
                                         conversation.conversation_type === 'event_reminder' ? 'Event' :
                                         conversation.conversation_type === 'pastoral_care' ? 'Pastoral' :
                                         'General';
                              return type;
                            })()}
                          </p>
                          {conversation.updated_at && (
                            <p className="text-sm text-muted-foreground truncate" style={{ maxWidth: '100%' }}>
                              {format(new Date(conversation.updated_at), 'MMM d')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground flex-shrink-0 ml-2" />
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-base sm:text-lg w-full">No recent SMS conversations.</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="p-5 sm:p-6">
            <Button variant="outline" className="w-full text-sm sm:text-base h-10 sm:h-11" asChild>
              <a href="/sms">View All</a>
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
              
      {/* Insights Section */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="p-5 sm:p-6">
            <CardTitle className="flex items-center text-xl sm:text-2xl">
              <BarChart3 className="mr-3 h-6 w-6 sm:h-7 sm:w-7" />
              Key Insights
            </CardTitle>
            <CardDescription className="text-base sm:text-lg">Interesting patterns and trends from your data</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
                  Active members who attend Sunday service (last 30 days)
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
                  }`}>Donation Trend</h4>
                </div>
                {isLoading ? (
                  <Skeleton className="h-4 w-32 mb-2" />
                ) : !canCalculateTrend ? (
                  <p className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-300 mb-1">
                    Waiting for data
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
                    'Waiting for first donation of the month to calculate trend' :
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
                            value: stats.growthRate > 0 ? Math.abs(stats.growthRate) : 0,
                            condition: stats.growthRate > 0,
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
                        if (stats.growthRate < 0) return 'Donation Growth';

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
                        if (stats.growthRate < 0) return 'Share impact stories to encourage giving.';

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
          </CardContent>
        </Card>
      </motion.div>

      {/* Average Attendance by Event Type Section */}
        <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="p-5 sm:p-6">
            <CardTitle className="flex items-center text-xl sm:text-2xl">
              <Users2 className="mr-3 h-6 w-6 sm:h-7 sm:w-7" />
              Attendance by Event Type
            </CardTitle>
            <CardDescription className="text-base sm:text-lg">Average attendance per event for different event types (last 6 months)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Sunday Service */}
              <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg border">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-foreground">Sunday Service</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-12 mb-1" />
                  ) : (
                    <p className="text-2xl font-bold text-primary">
                      {stats.sundayServicePercentage || 0}
                    </p>
                  )}
                  {isLoading ? (
                    <Skeleton className="h-4 w-32" />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {stats.sundayServiceEvents} events • {stats.sundayServiceAttendance} total
                    </p>
                  )}
            </div>
          </div>

              {/* Bible Study */}
              <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg border">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-foreground">Bible Study</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-12 mb-1" />
                  ) : (
                    <p className="text-2xl font-bold text-primary">
                      {stats.bibleStudyPercentage || 0}
                    </p>
                  )}
                  {isLoading ? (
                    <Skeleton className="h-4 w-32" />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {stats.bibleStudyEvents} events • {stats.bibleStudyAttendance} total
                    </p>
                  )}
            </div>
          </div>

              {/* Fellowship */}
              <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg border">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    <Users2 className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-foreground">Fellowship</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-12 mb-1" />
                  ) : (
                    <p className="text-2xl font-bold text-primary">
                      {stats.fellowshipPercentage || 0}
                    </p>
                  )}
                  {isLoading ? (
                    <Skeleton className="h-4 w-32" />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {stats.fellowshipEvents} events • {stats.fellowshipAttendance} total
                    </p>
                  )}
            </div>
          </div>
        </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <a href="/reports">View Detailed Reports</a>
            </Button>
          </CardFooter>
        </Card>
      </motion.div>

      {/* Attendance Statistics Section */}
        <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="p-5 sm:p-6">
            <CardTitle className="flex items-center text-xl sm:text-2xl">
              <Users className="mr-3 h-6 w-6 sm:h-7 sm:w-7" />
              Attendance Statistics
              </CardTitle>
            <CardDescription className="text-base sm:text-lg">Last 30 days overview</CardDescription>
            </CardHeader>
          
          <CardContent>
            {attendanceLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                  <span className="text-muted-foreground text-base">Loading attendance data...</span>
                </div>
                  </div>
            ) : error ? (
              <div className="text-center py-6">
                <div className="text-red-500 mb-2 text-2xl">⚠️</div>
                <p className="text-base text-muted-foreground">Failed to load attendance data</p>
                </div>
            ) : (
              <div className="space-y-6">
                {/* Service Breakdown and Event Attendance Side by Side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Service Breakdown */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-muted rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-primary" />
                      </div>
                      <h4 className="font-semibold text-base text-foreground">Service Breakdown</h4>
              </div>
              
                    {serviceBreakdown.length === 0 ? (
                      <div className="text-center py-4 bg-muted rounded-lg">
                        <div className="text-muted-foreground mb-1 text-xl">📊</div>
                        <p className="text-sm text-muted-foreground">No service data</p>
                </div>
                    ) : (
                      <div className="space-y-2">
                        {serviceBreakdown.map((service, index) => (
                          <div key={service.name} className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${
                                index === 0 ? 'bg-primary' :
                                index === 1 ? 'bg-muted-foreground' :
                                index === 2 ? 'bg-amber-600' : 'bg-primary'
                              }`}></div>
                              <div className="font-medium text-foreground text-base truncate">{service.name}</div>
                              <div className="text-sm text-muted-foreground">{service.value} attendees</div>
                      </div>
                            <div className="text-base font-bold text-primary">{service.value}</div>
                    </div>
                  ))}
                </div>
                    )}
              </div>
              
                  {/* Event Attendance */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-muted rounded-lg flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-primary" />
                      </div>
                      <h4 className="font-semibold text-base text-foreground">Event Attendance</h4>
      </div>

                    {eventDetails?.filter(event => event.attendees > 0).length === 0 ? (
                      <div className="text-center py-4 bg-muted rounded-lg">
                        <div className="text-muted-foreground mb-1 text-xl">📅</div>
                        <p className="text-sm text-muted-foreground">No event data</p>
        </div>
                    ) : (
                      <div className="space-y-2">
                        {eventDetails
                          ?.filter(event => event.attendees > 0)
                          .sort((a, b) => new Date(b.date) - new Date(a.date))
                          .slice(0, 3)
                          .map(event => (
                          <div key={event.id} className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="min-w-0">
                              <div className="font-medium text-foreground text-base truncate">{event.title}</div>
                              <div className="text-sm text-muted-foreground mt-0.5">
                                {new Date(event.date).toLocaleDateString()} • {event.attendees} attendees
              </div>
            </div>
                    </div>
                  ))}
          </div>
                    )}
              </div>
            </div>

                {/* Top Attendees */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-muted rounded-lg flex items-center justify-center">
                      <Trophy className="w-4 h-4 text-primary" />
            </div>
                    <h4 className="font-semibold text-base text-foreground">Top Attendees</h4>
          </div>

                  {memberStats.length === 0 ? (
                    <div className="text-center py-4 bg-muted rounded-lg">
                      <div className="text-muted-foreground mb-1 text-xl">🏆</div>
                      <p className="text-sm text-muted-foreground">No attendance data</p>
                </div>
              ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {memberStats.slice(0, 6).map((member, index) => {
                        // Find the member data to get their image - improved lookup
                        const memberData = people.find(p => {
                          const fullName = `${p.firstname} ${p.lastname}`.trim();
                          const memberName = member.name.trim();
                          
                          // Try exact match first
                          if (fullName.toLowerCase() === memberName.toLowerCase()) {
                            return true;
                          }
                          
                          // Try partial match (in case of middle names, etc.)
                          const fullNameParts = fullName.toLowerCase().split(' ');
                          const memberNameParts = memberName.toLowerCase().split(' ');
                          
                          // Check if first and last names match
                          if (fullNameParts.length >= 2 && memberNameParts.length >= 2) {
                            return fullNameParts[0] === memberNameParts[0] && 
                                   fullNameParts[fullNameParts.length - 1] === memberNameParts[memberNameParts.length - 1];
                          }
                          
                          return false;
                        });
                        
                        return (
                          <div 
                            key={member.name} 
                            className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-gray-50 transition-colors cursor-pointer w-full max-w-full overflow-hidden"
                            onClick={() => handleMemberProfileClick(memberData?.id)}
                            title={`Click to view ${member.name}'s profile`}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0 overflow-hidden">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                                index === 0 ? 'bg-primary' :
                                index === 1 ? 'bg-muted-foreground' :
                                index === 2 ? 'bg-amber-600' : 'bg-primary'
                              }`}>
                                {index + 1}
                              </div>
                              <div className="flex items-center gap-3 flex-1 min-w-0 overflow-hidden">
                                <Avatar className="h-8 w-8 flex-shrink-0">
                                  {memberData?.image_url ? (
                                    <AvatarImage 
                                      src={memberData.image_url} 
                                      alt={`${member.name}'s profile picture`}
                                      onError={(e) => {
                                        console.log('Image failed to load:', memberData.image_url);
                                        e.target.style.display = 'none';
                                      }}
                                    />
                                  ) : null}
                                  <AvatarFallback className="bg-gray-200 text-gray-700">
                                    {memberData ? getInitials(memberData.firstname || '', memberData.lastname || '') : 
                                     getInitials(member.name.split(' ')[0] || '', member.name.split(' ')[1] || '')}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1 overflow-hidden">
                                  <div className="font-medium text-foreground text-sm truncate">{member.name}</div>
                                  <div className="text-xs text-muted-foreground">{member.count} events</div>
                                </div>
                              </div>
                            </div>
                            <div className="text-sm font-bold text-primary flex-shrink-0">{member.count}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

      {/* Donation Statistics Section */}
        <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="p-5 sm:p-6">
            <CardTitle className="flex items-center text-xl sm:text-2xl">
              <DollarSign className="mr-3 h-6 w-6 sm:h-7 sm:w-7" />
              Donation Statistics
              </CardTitle>
            <CardDescription className="text-base sm:text-lg">Financial overview of your organization</CardDescription>
            </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Monthly Donations */}
              <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg border">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-white" />
                      </div>
                    </div>
                      <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-foreground">This Month</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">${(stats.monthlyDonations || 0).toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">
                    {(() => {
                      const now = new Date();
                      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                      const dayOfMonth = now.getDate();
                      const monthProgress = ((dayOfMonth / daysInMonth) * 100).toFixed(1);
                      return `${monthProgress}% of month completed`;
                    })()}
                        </p>
                </div>
                    </div>
              {/* Last Month's Donations */}
              <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg border">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-white" />
                </div>
                      </div>
                      <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-foreground">Last Month</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">${(stats.lastMonthDonations || 0).toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Previous month's total</p>
                      </div>
                    </div>
              {/* Monthly Average */}
              <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg border">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-white" />
                </div>
                  </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-foreground">Monthly Average</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">${(stats.monthlyAverage || 0).toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Per month</p>
                </div>
              </div>
            </div>

            {/* Weekly Stats Row */}
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {/* Last Week's Donations */}
              <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg border">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-foreground">Last Week</p>
                  <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">${(stats.lastSundayDonations || 0).toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Previous week's total</p>
                </div>
              </div>
              {/* Weekly Average */}
              <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg border">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-foreground">Weekly Average</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">${(stats.weeklyAverage || 0).toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Per week</p>
                </div>
              </div>
            </div>
            </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <a href="/donations">View All Donations</a>
            </Button>
          </CardFooter>
          </Card>
        </motion.div>

      {/* Event Statistics Section */}
        <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="p-5 sm:p-6">
            <CardTitle className="flex items-center text-xl sm:text-2xl">
              <Calendar className="mr-3 h-6 w-6 sm:h-7 sm:w-7" />
              Event Statistics
              </CardTitle>
            <CardDescription className="text-base sm:text-lg">Overview of your organization's events</CardDescription>
            </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Average Events Per Month */}
              <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg border">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-white" />
                      </div>
                    </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-foreground">Average Per Month</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.averageEventsPerMonth}</p>
                  <p className="text-sm text-muted-foreground">Last 6 months average</p>
                </div>
      </div>

              {/* This Week */}
              <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg border">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-primary-foreground" />
                  </div>
                      </div>
                      <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-foreground">This Week</p>
                  <p className="text-2xl font-bold text-primary">{stats.eventsThisWeek}</p>
                  <p className="text-sm text-muted-foreground">Next 7 days</p>
                      </div>
                    </div>

              {/* This Month */}
              <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg border">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-white" />
                </div>
                  </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-foreground">This Month</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.eventsThisMonth}</p>
                  <p className="text-sm text-muted-foreground">Next 30 days</p>
                </div>
              </div>
            </div>
            </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <a href="/events">View Events</a>
            </Button>
          </CardFooter>
          </Card>
        </motion.div>
      {/* Member Statistics Section */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="p-5 sm:p-6">
            <CardTitle className="flex items-center text-xl sm:text-2xl">
              <Users2 className="mr-3 h-6 w-6 sm:h-7 sm:w-7" />
              Member Statistics
            </CardTitle>
            <CardDescription className="text-base sm:text-lg">Detailed breakdown of your organization's membership</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Active Members */}
              <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg border">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <Users2 className="h-6 w-6 text-white" />
              </div>
                    </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-foreground">Active Members</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.activeMembers}</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.totalPeople > 0 ? `${((stats.activeMembers / stats.totalPeople) * 100).toFixed(1)}%` : '0%'} of total
                  </p>
                    </div>
                    </div>

              {/* Inactive Members */}
              <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg border">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                    <Users2 className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-foreground">Inactive Members</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.inactiveMembers}</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.totalPeople > 0 ? `${((stats.inactiveMembers / stats.totalPeople) * 100).toFixed(1)}%` : '0%'} of total
                  </p>
                  </div>
                </div>

              {/* Visitors */}
              <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg border">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    <UserPlus className="h-6 w-6 text-primary-foreground" />
                    </div>
                    </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-foreground">Visitors</p>
                  <p className="text-2xl font-bold text-primary">{stats.visitors}</p>
                  <p className="text-sm text-muted-foreground">
                    <span className="text-primary font-medium">Visitors</span>
                  </p>
                  </div>
                </div>
              </div>

            {/* Summary Stats */}
            <div className="mt-6 grid gap-4 md:grid-cols-1">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-base text-muted-foreground">Total People</p>
                <p className="text-3xl font-bold text-foreground">{stats.totalPeople}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <a href="/members">Manage Members</a>
            </Button>
          </CardFooter>
        </Card>
      </motion.div>

      {/* Family Overview Section */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="p-5 sm:p-6">
            <CardTitle className="flex items-center text-xl sm:text-2xl">
              <Home className="mr-3 h-6 w-6 sm:h-7 sm:w-7" />
              Member Demographics
            </CardTitle>
            <CardDescription className="text-base sm:text-lg">Age and family structure overview</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.totalFamilies > 0 ? (
              // Show family stats if families are being used
              <div className="grid gap-4 md:grid-cols-3">
                {/* Total Families */}
                <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg border">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                      <Home className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium text-foreground">Total Families</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.totalFamilies}</p>
                    <p className="text-sm text-muted-foreground">Organized family units</p>
                  </div>
                </div>

                {/* Members in Families */}
                <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg border">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <Users2 className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium text-foreground">Members in Families</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.membersInFamilies}</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.activeMembers > 0 ? `${((stats.membersInFamilies / stats.activeMembers) * 100).toFixed(1)}%` : '0%'} of active members
                    </p>
                  </div>
                </div>

                {/* Individual Members */}
                <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg border">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center">
                      <UserPlus className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium text-foreground">Individual Members</p>
                    <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.membersWithoutFamilies}</p>
                    <p className="text-sm text-muted-foreground">Not in family units</p>
                  </div>
                </div>
              </div>
            ) : (
              // Show simplified view when families aren't being used
              <div className="text-center p-6 bg-muted rounded-lg">
                <Home className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-lg font-medium text-foreground mb-2">Family System Not Active</p>
                <p className="text-sm text-muted-foreground">
                  Members are tracked individually. You can set up family relationships in member profiles if needed.
                </p>
              </div>
            )}

            {/* Age Distribution */}
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {/* Adults */}
              <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg border">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-foreground">Adults</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.adults}</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.activeMembers > 0 ? `${((stats.adults / stats.activeMembers) * 100).toFixed(1)}%` : '0%'} of active members
                  </p>
                </div>
              </div>

              {/* Children */}
              <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg border">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                    <Baby className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-foreground">Children</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.children}</p>
                  <p className="text-sm text-muted-foreground">
                    Total children registered
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <a href="/members">Manage Families</a>
                  </Button>
          </CardFooter>
        </Card>
      </motion.div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Recent People</CardTitle>
              <CardDescription className="text-base">Latest active members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentPeople.length > 0 ? (
                  recentPeople.map(person => (
                    <div key={person.id} className="flex items-center justify-between border-b pb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={person.image_url} />
                          <AvatarFallback>{getInitials(person.firstname, person.lastname)}</AvatarFallback>
                        </Avatar>
                        <div className="text-base">{formatName(person.firstname, person.lastname)}</div>
                </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/members/${person.id}`)}
                      >
                        View
                      </Button>
            </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-base">No recent people to display.</p>
              )}
              </div>
          </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <a href="/members">View All People</a>
              </Button>
            </CardFooter>
        </Card>
      </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Recent Donations</CardTitle>
              <CardDescription className="text-base">Latest donations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {donations.slice(0, 5).map(donation => (
                  <div key={donation.id} className="flex items-start justify-between border-b pb-3 gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-base">${parseFloat(donation.amount).toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(donation.date + 'T12:00:00'), 'MMM d, yyyy')}
                        {donation.attendance && ` • ${donation.attendance} people`}
                      </p>
                    </div>
                    <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-xs sm:text-sm px-2 sm:px-3"
                        onClick={() => handleEditDonation(donation)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-xs sm:text-sm px-2 sm:px-3"
                        onClick={() => handleDeleteDonation(donation)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <a href="/donations">View All Donations</a>
              </Button>
            </CardFooter>
          </Card>
    </motion.div>
      </div>

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
  );
}

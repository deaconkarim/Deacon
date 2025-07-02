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
import { getMembers, getEvents, getDonations, getRecentDonationsForDashboard, getAllEvents, addMember, updateMember, deleteMember, getMemberAttendance, updateDonation, deleteDonation, addEventAttendance, getEventAttendance, getVolunteerStats } from '../lib/data';
import { getAlertStats } from '../lib/alertsService';

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
    upcomingAnniversaries: 0
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
      // Fetch people using the filtered getMembers function
      const people = await getMembers();

      // Transform snake_case to camelCase
      const transformedPeople = people?.map(person => ({
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

      // Fetch donations using the optimized function for dashboard
      const donations = await getRecentDonationsForDashboard();

      // Debug: Log a few sample donations to see the data structure
      console.log('Sample donations:', donations.slice(0, 3).map(d => ({
        id: d.id,
        date: d.date,
        amount: d.amount,
        dateType: typeof d.date
      })));

      // Calculate total donations
      const totalDonations = donations?.reduce((sum, donation) => {
        const amount = parseFloat(donation.amount) || 0;
        return sum + amount;
      }, 0) || 0;


      // Calculate monthly donations
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth(); // getMonth() returns 0-11
      
      
      const monthlyDonations = donations?.filter(donation => {
        try {
          // Handle different date formats
          let donationDate;
          if (typeof donation.date === 'string') {
            donationDate = new Date(donation.date);
          } else if (donation.date instanceof Date) {
            donationDate = donation.date;
          } else {
            console.warn('Invalid donation date format:', donation.date);
            return false;
          }
          
          // Check if the date is valid
          if (isNaN(donationDate.getTime())) {
            console.warn('Invalid donation date:', donation.date);
            return false;
          }
          
          const donationYear = donationDate.getFullYear();
          const donationMonth = donationDate.getMonth();
          const donationMonthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][donationMonth];
          
          // Fix timezone issue by comparing date strings directly
          const donationDateStr = donation.date; // Use original date string
          const currentDateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}`;
          const isCurrentMonth = donationDateStr.startsWith(currentDateStr);
                    
          if (isCurrentMonth) {
          }
          
          return isCurrentMonth;
        } catch (error) {
          console.error('Error processing donation date:', donation.date, error);
          return false;
        }
      }).reduce((sum, donation) => {
        const amount = parseFloat(donation.amount) || 0;
        return sum + amount;
      }, 0) || 0;


      // Calculate weekly average (average weekly donation total)
      const weeklyDonationTotals = {};
      
      donations?.forEach(donation => {
        try {
          const date = new Date(donation.date);
          
          // Skip invalid dates
          if (isNaN(date.getTime())) {
            console.warn('Invalid donation date:', donation.date);
            return;
          }
          
          // Get the start of the week (Sunday) for this date
          const startOfWeek = new Date(date);
          const dayOfWeek = date.getDay();
          startOfWeek.setDate(date.getDate() - dayOfWeek);
          startOfWeek.setHours(0, 0, 0, 0);
          
          const weekKey = startOfWeek.toISOString().split('T')[0];
          const amount = parseFloat(donation.amount) || 0;
          
          if (!weeklyDonationTotals[weekKey]) {
            weeklyDonationTotals[weekKey] = 0;
          }
          weeklyDonationTotals[weekKey] += amount;
        } catch (error) {
          console.error('Error processing donation for weekly average:', donation, error);
        }
      });
      
      const weeklyTotals = Object.values(weeklyDonationTotals);
      const weeklyAverage = weeklyTotals.length > 0 ? 
        weeklyTotals.reduce((sum, total) => sum + total, 0) / weeklyTotals.length : 0;

      // Calculate monthly average (total donations divided by actual months with data, excluding current month)
      const donationDates = donations?.map(d => d.date) || [];
      const uniqueMonths = new Set();
      const avgCurrentYear = new Date().getFullYear();
      const avgCurrentMonth = new Date().getMonth();
      
      // Calculate total donations excluding current month
      const totalDonationsExcludingCurrent = donations?.reduce((sum, donation) => {
        try {
          const donationDate = new Date(donation.date + 'T00:00:00');
          // Exclude current month from the calculation
          if (donationDate.getFullYear() !== avgCurrentYear || donationDate.getMonth() !== avgCurrentMonth) {
            const amount = parseFloat(donation.amount) || 0;
            return sum + amount;
          }
          return sum;
        } catch (error) {
          console.error('Error processing donation for monthly average:', donation.date, error);
          return sum;
        }
      }, 0) || 0;
      
      donationDates.forEach(dateStr => {
        const date = new Date(dateStr);
        const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        // Exclude current month from the calculation
        if (date.getFullYear() !== avgCurrentYear || date.getMonth() !== avgCurrentMonth) {
          uniqueMonths.add(yearMonth);
        }
      });
      
      const actualMonthsWithData = uniqueMonths.size;
      const monthlyAverage = actualMonthsWithData > 0 ? totalDonationsExcludingCurrent / actualMonthsWithData : 0;

      // Calculate growth rate
      const growthRate = monthlyAverage > 0 ? 
        ((monthlyDonations - monthlyAverage) / monthlyAverage) * 100 : 0;

      // Fetch upcoming events using the filtered getEvents function
      const events = await getEvents();
      const upcomingEvents = events?.filter(event => 
        new Date(event.start_date) >= new Date()
      ).sort((a, b) => new Date(a.start_date) - new Date(b.start_date)).slice(0, 5) || [];

      // Get all events for statistics
      const allEvents = await getAllEvents();
      
      // Calculate total upcoming events
      const totalUpcomingEvents = upcomingEvents.length;

      // Get weekly donations for chart
      const weeklyDonations = donations?.slice(0, 7) || [];

      // Calculate events statistics using all events
      const today = new Date();
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      const monthFromNow = new Date();
      monthFromNow.setMonth(monthFromNow.getMonth() + 1);

      const eventsThisWeek = allEvents.filter(event => {
        const eventDate = new Date(event.start_date);
        return eventDate >= today && eventDate <= weekFromNow;
      }).length;

      const eventsThisMonth = allEvents.filter(event => {
        const eventDate = new Date(event.start_date);
        return eventDate >= today && eventDate <= monthFromNow;
      }).length;

      // Calculate average events per month based on last 6 months
      const sixMonthsAgoForAvg = new Date();
      sixMonthsAgoForAvg.setMonth(sixMonthsAgoForAvg.getMonth() - 6);
      
      const eventsLast6Months = allEvents.filter(event => {
        const eventDate = new Date(event.start_date);
        return eventDate >= sixMonthsAgoForAvg && eventDate <= today;
      });
      
      // Calculate average with better handling of edge cases
      let averageEventsPerMonth = 0;
      
      if (eventsLast6Months.length > 0) {
        // Group events by month to count actual months with events
        const monthsWithEvents = new Set();
        eventsLast6Months.forEach(event => {
          const eventDate = new Date(event.start_date);
          const monthKey = `${eventDate.getFullYear()}-${eventDate.getMonth()}`;
          monthsWithEvents.add(monthKey);
        });
        
        const actualMonthsWithEvents = monthsWithEvents.size;
        averageEventsPerMonth = Math.round(eventsLast6Months.length / actualMonthsWithEvents);
      } else {
        // If no events in last 6 months, show 0 or use total events as fallback
        averageEventsPerMonth = allEvents?.length > 0 ? Math.round(allEvents.length / 12) : 0;
      }
      
      
      // Fetch volunteer statistics
      const volunteerStats = await getVolunteerStats();
     
      
      // Get current user's organization ID
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      let organizationId = null;
      
      if (currentUser) {
        const { data: orgUser, error: orgError } = await supabase
          .from('organization_users')
          .select('organization_id')
          .eq('user_id', currentUser.id)
          .eq('status', 'active')
          .eq('approval_status', 'approved')
          .single();
        
        if (!orgError && orgUser) {
          organizationId = orgUser.organization_id;
        }
      }
      
      // Get all events with attendance data for the last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const { data: eventsWithAttendance, error: attendanceError } = await supabase
        .from('events')
        .select(`
          id,
          title,
          event_type,
          start_date,
          event_attendance (
            id,
            status
          )
        `)
        .eq('organization_id', organizationId)
        .gte('start_date', sixMonthsAgo.toISOString())
        .order('start_date', { ascending: false });

      if (attendanceError) {
        console.error('Error fetching events with attendance:', attendanceError);
      }


      // Group events by type and calculate averages
      const eventTypeStats = {};
      let eventsWithRecords = 0;
      let eventsWithoutRecords = 0;
      
      eventsWithAttendance?.forEach(event => {
        const eventType = event.event_type || 'Other';
        const attendingCount = event.event_attendance?.filter(a => 
          a.status === 'attending' || a.status === 'checked-in'
        ).length || 0;
        
        // Only count events that have attendance records
        if (event.event_attendance && event.event_attendance.length > 0) {
          eventsWithRecords++;
          if (!eventTypeStats[eventType]) {
            eventTypeStats[eventType] = {
              totalAttendance: 0,
              eventCount: 0,
              averageAttendance: 0
            };
          }
          
          eventTypeStats[eventType].totalAttendance += attendingCount;
          eventTypeStats[eventType].eventCount += 1;
          
        } else {
          eventsWithoutRecords++;
        }
      });
      

      // Calculate averages
      Object.keys(eventTypeStats).forEach(eventType => {
        const stats = eventTypeStats[eventType];
        stats.averageAttendance = stats.eventCount > 0 ? 
          Math.round(stats.totalAttendance / stats.eventCount) : 0;
      });


      // Map to the existing stats structure
      const sundayServiceStats = eventTypeStats['Sunday Worship Service'] || { averageAttendance: 0, eventCount: 0 };
      const bibleStudyStats = eventTypeStats['Bible Study'] || { averageAttendance: 0, eventCount: 0 };
      const fellowshipStats = eventTypeStats['Fellowship Activity'] || { averageAttendance: 0, eventCount: 0 };


      // Load family statistics
      let familyStats = {
        totalFamilies: 0,
        membersInFamilies: 0,
        membersWithoutFamilies: 0,
        adults: 0,
        children: 0
      };
      
      try {
        familyStats = await familyService.getFamilyStats();
      } catch (error) {
        console.error('Error loading family stats:', error);
      }

      // Calculate Sunday Service Rate (last 30 days)
      let sundayServiceRate = 0;
      if (organizationId && activeMembers.length > 0) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { data: sundayEvents } = await supabase
          .from('events')
          .select(`
            id,
            event_attendance (
              id,
              status,
              members (firstname, lastname, status)
            )
          `)
          .eq('organization_id', organizationId)
          .eq('event_type', 'Sunday Worship Service')
          .gte('start_date', thirtyDaysAgo.toISOString())
          .lte('start_date', new Date().toISOString());
        
        if (sundayEvents && sundayEvents.length > 0) {
          // Get unique active members who attended Sunday service
          const activeAttendees = new Set();
          sundayEvents.forEach(event => {
            event.event_attendance?.forEach(attendance => {
              if ((attendance.status === 'attending' || attendance.status === 'checked-in') &&
                  attendance.members?.status === 'active') {
                const memberName = `${attendance.members.firstname} ${attendance.members.lastname}`;
                activeAttendees.add(memberName);
              }
            });
          });
          
          const uniqueAttendees = activeAttendees.size;
          sundayServiceRate = Math.min((uniqueAttendees / activeMembers.length) * 100, 100);
        }
      }

      // Calculate last month's donations
      const lastMonth = new Date(currentYear, currentMonth - 1, 1);
      const lastMonthEnd = new Date(currentYear, currentMonth, 0);
      
      console.log('Last month calculation:', {
        currentYear,
        currentMonth,
        lastMonth: lastMonth.toISOString(),
        lastMonthEnd: lastMonthEnd.toISOString(),
        totalDonations: donations.length
      });
      
      const lastMonthDonations = donations
        .filter(donation => {
          // Handle date string comparison instead of Date object comparison
          const donationDateStr = donation.date; // This is likely "YYYY-MM-DD"
          const lastMonthStr = lastMonth.toISOString().split('T')[0]; // "YYYY-MM-DD"
          const lastMonthEndStr = lastMonthEnd.toISOString().split('T')[0]; // "YYYY-MM-DD"
          
          const isInLastMonth = donationDateStr >= lastMonthStr && donationDateStr <= lastMonthEndStr;
          
          if (isInLastMonth) {
            console.log('Found last month donation:', {
              date: donation.date,
              amount: donation.amount,
              lastMonthStr,
              lastMonthEndStr
            });
          }
          
          return isInLastMonth;
        })
        .reduce((sum, donation) => sum + (parseFloat(donation.amount) || 0), 0);
      
      console.log('Last month donations total:', lastMonthDonations);

      // Calculate two months ago donations for comparison
      const twoMonthsAgo = new Date(currentYear, currentMonth - 2, 1);
      const twoMonthsAgoEnd = new Date(currentYear, currentMonth - 1, 0);
      const twoMonthsAgoDonations = donations
        .filter(donation => {
          // Handle date string comparison instead of Date object comparison
          const donationDateStr = donation.date; // This is likely "YYYY-MM-DD"
          const twoMonthsAgoStr = twoMonthsAgo.toISOString().split('T')[0]; // "YYYY-MM-DD"
          const twoMonthsAgoEndStr = twoMonthsAgoEnd.toISOString().split('T')[0]; // "YYYY-MM-DD"
          
          const isInTwoMonthsAgo = donationDateStr >= twoMonthsAgoStr && donationDateStr <= twoMonthsAgoEndStr;
          
          if (isInTwoMonthsAgo) {
            console.log('Found two months ago donation:', {
              date: donation.date,
              amount: donation.amount,
              twoMonthsAgoStr,
              twoMonthsAgoEndStr
            });
          }
          
          return isInTwoMonthsAgo;
        })
        .reduce((sum, donation) => sum + (parseFloat(donation.amount) || 0), 0);
      
      console.log('Two months ago donations total:', twoMonthsAgoDonations);

      // Calculate last Sunday's donations
      const lastSunday = new Date();
      const dayOfWeek = lastSunday.getDay();
      const daysToSubtract = dayOfWeek === 0 ? 7 : dayOfWeek; // If today is Sunday, go back 7 days
      lastSunday.setDate(lastSunday.getDate() - daysToSubtract);
      lastSunday.setHours(0, 0, 0, 0);
      
      const lastSundayDonations = donations?.filter(donation => {
        try {
          // Parse the donation date more carefully to avoid timezone issues
          const donationDate = new Date(donation.date + 'T00:00:00');
          
          // Use the same logic as getSundayDate to find the Sunday of the donation's week
          const donationSunday = new Date(donationDate);
          const donationDayOfWeek = donationDate.getDay();
          donationSunday.setDate(donationDate.getDate() - donationDayOfWeek);
          donationSunday.setHours(0, 0, 0, 0);
          
          // Check if this donation belongs to the last Sunday's week
          return donationSunday.toDateString() === lastSunday.toDateString();
        } catch (error) {
          console.error('Error processing donation date for last Sunday:', donation.date, error);
          return false;
        }
      }).reduce((sum, donation) => {
        const amount = parseFloat(donation.amount) || 0;
        return sum + amount;
      }, 0) || 0;
      
      console.log('Last Sunday donations total:', lastSundayDonations);

      // Calculate event types breakdown for upcoming events
      const eventTypesBreakdown = {};
      upcomingEvents.forEach(event => {
        const eventType = event.event_type || 'Other';
        eventTypesBreakdown[eventType] = (eventTypesBreakdown[eventType] || 0) + 1;
      });
      
      // Get the most common upcoming event type
      const mostCommonEventType = Object.keys(eventTypesBreakdown).length > 0 
        ? Object.keys(eventTypesBreakdown).reduce((a, b) => 
            eventTypesBreakdown[a] > eventTypesBreakdown[b] ? a : b
          )
        : 'None';
      
      // Calculate events needing volunteers (events with needs_volunteers = true)
      const eventsNeedingVolunteers = upcomingEvents.filter(event => event.needs_volunteers === true).length;

      // Fetch task statistics
      let taskStats = {
        totalTasks: 0,
        pendingTasks: 0,
        completedTasks: 0,
        overdueTasks: 0
      };

      try {
        // Get current user's organization ID
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        let organizationId = null;
        
        if (currentUser) {
          const { data: orgUser, error: orgError } = await supabase
            .from('organization_users')
            .select('organization_id')
            .eq('user_id', currentUser.id)
            .eq('status', 'active')
            .eq('approval_status', 'approved')
            .single();
          
          if (!orgError && orgUser) {
            organizationId = orgUser.organization_id;
          }
        }

        if (organizationId) {
          // Fetch all tasks for the organization
          const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select('*')
            .eq('organization_id', organizationId);

          if (!tasksError && tasks) {
            const now = new Date();
            taskStats = {
              totalTasks: tasks.length,
              pendingTasks: tasks.filter(task => task.status === 'pending').length,
              completedTasks: tasks.filter(task => task.status === 'completed').length,
              overdueTasks: tasks.filter(task => 
                task.status !== 'completed' && 
                task.due_date && 
                new Date(task.due_date) < now
              ).length
            };
          }
        }
      } catch (error) {
        console.error('Error fetching task statistics:', error);
      }

      // Load alerts statistics
      let alertsStats = {
        totalUpcoming: 0,
        birthdays: 0,
        anniversaries: 0,
        memberships: 0,
        thisWeek: 0,
        today: 0,
        tomorrow: 0
      };
      try {
        alertsStats = await getAlertStats();
      } catch (error) {
        console.error('Error fetching alerts statistics:', error);
      }

      setStats({
        totalPeople,
        activeMembers: activeMembers.length,
        inactiveMembers: inactiveMembers.length,
        visitors: visitors.length,
        totalDonations,
        monthlyDonations,
        weeklyAverage,
        monthlyAverage,
        growthRate,
        upcomingEvents: totalUpcomingEvents,
        totalEvents: allEvents?.length || 0,
        eventsThisWeek,
        eventsThisMonth,
        averageEventsPerMonth,
        mostCommonEventType,
        sundayServiceRate,
        totalVolunteers: volunteerStats.totalVolunteers,
        upcomingVolunteers: volunteerStats.upcomingVolunteers,
        recentVolunteers: volunteerStats.recentVolunteers,
        eventsNeedingVolunteers,
        sundayServiceAttendance: sundayServiceStats.totalAttendance,
        sundayServiceEvents: sundayServiceStats.eventCount,
        bibleStudyAttendance: bibleStudyStats.totalAttendance,
        bibleStudyEvents: bibleStudyStats.eventCount,
        fellowshipAttendance: fellowshipStats.totalAttendance,
        fellowshipEvents: fellowshipStats.eventCount,
        eventsWithVolunteersEnabled: volunteerStats.eventsWithVolunteersEnabled,
        totalVolunteersSignedUp: volunteerStats.totalVolunteersSignedUp,
        eventsStillNeedingVolunteers: volunteerStats.eventsStillNeedingVolunteers,
        totalFamilies: familyStats.totalFamilies,
        membersInFamilies: familyStats.membersInFamilies,
        membersWithoutFamilies: familyStats.membersWithoutFamilies,
        adults: familyStats.adults,
        children: familyStats.children,
        lastMonthDonations,
        twoMonthsAgoDonations,
        lastWeekDonations: weeklyTotals[weeklyTotals.length - 1] || 0,
        lastSundayDonations,
        totalTasks: taskStats.totalTasks,
        pendingTasks: taskStats.pendingTasks,
        completedTasks: taskStats.completedTasks,
        overdueTasks: taskStats.overdueTasks,
        upcomingBirthdays: alertsStats.birthdays || 0,
        upcomingAnniversaries: alertsStats.anniversaries || 0,
        upcomingMemberships: alertsStats.memberships || 0,
        totalUpcoming: alertsStats.totalUpcoming || 0
      });
      setRecentPeople(recentPeople);
      setPeople(transformedPeople);
      setUpcomingEvents(upcomingEvents);
      setWeeklyDonations(weeklyDonations);
      setDonations(donations || []);

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

  return (
    <div className="space-y-6">
          <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
        </div>
        
      {/* Leadership Verse - Inspirational component */}
      <motion.div variants={itemVariants}>
          <LeadershipVerse />
      </motion.div>

      <div className="grid gap-4 tablet-portrait:grid-cols-2 tablet-landscape:grid-cols-2 md:grid-cols-2 lg:grid-cols-5">
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardTitle className="flex items-center text-xl">
                <Users2 className="mr-2 h-5 w-5" />
                People
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <Skeleton className="h-8 w-16 mb-1" />
              ) : (
                <div className="text-3xl font-bold">{stats.totalPeople}</div>
              )}
              <p className="text-sm text-muted-foreground mt-1">Total People</p>
              
              {/* Member type breakdown */}
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-600 font-medium">Active</span>
                  {isLoading ? (
                    <Skeleton className="h-4 w-8" />
                  ) : (
                    <span className="text-sm font-semibold">{stats.activeMembers}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-orange-600 font-medium">Inactive</span>
                  {isLoading ? (
                    <Skeleton className="h-4 w-8" />
                  ) : (
                    <span className="text-sm font-semibold">{stats.inactiveMembers}</span>
                  )}
                  </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-600 font-medium">Visitors</span>
                  {isLoading ? (
                    <Skeleton className="h-4 w-8" />
                  ) : (
                    <span className="text-sm font-semibold">{stats.visitors}</span>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted py-2 px-6 border-t">
              <Button variant="outline" className="w-full" asChild>
                <a href="/members">View All People</a>
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardTitle className="flex items-center text-xl">
                <DollarSign className="mr-2 h-5 w-5" />
                Donations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <Skeleton className="h-8 w-20 mb-1" />
              ) : (
                <div className="text-3xl font-bold">
                  {stats.monthlyDonations > 0 ?
                    `$${(stats.monthlyDonations || 0).toFixed(2)}` :
                    `$${(stats.lastMonthDonations || 0).toFixed(2)}`
                  }
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                {stats.monthlyDonations > 0 ? 'This month' : 'Last month'}
              </p>
              
              {/* Donation breakdown */}
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-600 font-medium">Monthly Average</span>
                  {isLoading ? (
                    <Skeleton className="h-4 w-16" />
                  ) : (
                    <span className="text-sm font-semibold">${(stats.monthlyAverage || 0).toFixed(2)}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-600 font-medium">Weekly Average</span>
                  {isLoading ? (
                    <Skeleton className="h-4 w-16" />
                  ) : (
                    <span className="text-sm font-semibold">${(stats.weeklyAverage || 0).toFixed(2)}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-600 font-medium">Last Week's Donations</span>
                  {isLoading ? (
                    <Skeleton className="h-4 w-16" />
                  ) : (
                    <span className="text-sm font-semibold">${(stats.lastSundayDonations || 0).toFixed(2)}</span>
                  )}
              </div>
            </div>
            </CardContent>
            <CardFooter className="bg-muted py-2 px-6 border-t">
              <Button variant="outline" className="w-full" asChild>
                <a href="/donations">View All Donations</a>
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardTitle className="flex items-center text-xl">
                <Calendar className="mr-2 h-5 w-5" />
                Events
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <Skeleton className="h-8 w-16 mb-1" />
              ) : (
                <div className="text-3xl font-bold">{stats.upcomingEvents || 0}</div>
              )}
              <p className="text-sm text-muted-foreground mt-1">Upcoming events</p>
              
              {/* Events breakdown */}
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-purple-600 font-medium">Need Volunteers</span>
                  {isLoading ? (
                    <Skeleton className="h-4 w-8" />
                  ) : (
                    <span className="text-sm font-semibold">{stats.eventsNeedingVolunteers || 0}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-purple-600 font-medium">This Week</span>
                  {isLoading ? (
                    <Skeleton className="h-4 w-8" />
                  ) : (
                    <span className="text-sm font-semibold">{stats.eventsThisWeek}</span>
                  )}
                  </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-purple-600 font-medium">Most Common</span>
                  {isLoading ? (
                    <Skeleton className="h-4 w-8" />
                  ) : (
                    <span className="text-sm font-semibold">
                      {stats.mostCommonEventType === 'Sunday Worship Service' ? 'Sunday Service' :
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
            <CardFooter className="bg-muted py-2 px-6 border-t">
              <Button variant="outline" className="w-full" asChild>
                <a href="/events">View All Events</a>
              </Button>
            </CardFooter>
          </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardTitle className="flex items-center text-xl">
                <Bell className="mr-2 h-5 w-5" />
                Celebrations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <Skeleton className="h-8 w-16 mb-1" />
              ) : (
                <div className="text-3xl font-bold">{stats.totalUpcoming || 0}</div>
              )}
              <p className="text-sm text-muted-foreground mt-1">Upcoming celebrations</p>
              
              {/* Celebrations breakdown */}
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-600 font-medium">Birthdays</span>
                  {isLoading ? (
                    <Skeleton className="h-4 w-8" />
                  ) : (
                    <span className="text-sm font-semibold">{stats.upcomingBirthdays || 0}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-600 font-medium">Anniversaries</span>
                  {isLoading ? (
                    <Skeleton className="h-4 w-8" />
                  ) : (
                    <span className="text-sm font-semibold">{stats.upcomingAnniversaries || 0}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-600 font-medium">Memberships</span>
                  {isLoading ? (
                    <Skeleton className="h-4 w-8" />
                  ) : (
                    <span className="text-sm font-semibold">{stats.upcomingMemberships || 0}</span>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted py-2 px-6 border-t">
              <Button variant="outline" className="w-full" asChild>
                <a href="/alerts">View All Celebrations</a>
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardTitle className="flex items-center text-xl">
                <CheckSquare className="mr-2 h-5 w-5" />
                Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <Skeleton className="h-8 w-16 mb-1" />
              ) : (
                <div className="text-3xl font-bold">{stats.pendingTasks || 0}</div>
              )}
              <p className="text-sm text-muted-foreground mt-1">Pending tasks</p>
              
              {/* Tasks breakdown */}
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-orange-600 font-medium">Total Tasks</span>
                  {isLoading ? (
                    <Skeleton className="h-4 w-8" />
                  ) : (
                    <span className="text-sm font-semibold">{stats.totalTasks || 0}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-orange-600 font-medium">Completed</span>
                  {isLoading ? (
                    <Skeleton className="h-4 w-8" />
                  ) : (
                    <span className="text-sm font-semibold">{stats.completedTasks || 0}</span>
                  )}
                  </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-orange-600 font-medium">Overdue</span>
                  {isLoading ? (
                    <Skeleton className="h-4 w-8" />
                  ) : (
                    <span className="text-sm font-semibold">{stats.overdueTasks || 0}</span>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted py-2 px-6 border-t">
              <Button variant="outline" className="w-full" asChild>
                <a href="/tasks">View All Tasks</a>
              </Button>
            </CardFooter>
          </Card>
        </motion.div>


                </div>
              
      {/* Insights Section */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <BarChart3 className="mr-2 h-6 w-6" />
              Key Insights
            </CardTitle>
            <CardDescription className="text-base">Interesting patterns and trends from your data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
               {/* Sunday Service Attendance Rate */}
               <div className={`p-4 rounded-lg border ${
                stats.sundayServiceRate >= 70 ? 
                  'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800' :
                stats.sundayServiceRate >= 50 ? 
                  'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200 dark:border-yellow-800' :
                  'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className={`h-5 w-5 ${
                    stats.sundayServiceRate >= 70 ? 'text-green-600' :
                    stats.sundayServiceRate >= 50 ? 'text-yellow-600' :
                    'text-red-600'
                  }`} />
                  <h4 className={`font-semibold ${
                    stats.sundayServiceRate >= 70 ? 'text-green-900 dark:text-green-100' :
                    stats.sundayServiceRate >= 50 ? 'text-yellow-900 dark:text-yellow-100' :
                    'text-red-900 dark:text-red-100'
                  }`}>Sunday Service Rate</h4>
                </div>
                {isLoading ? (
                  <Skeleton className="h-4 w-32 mb-2" />
                ) : (
                  <p className={`text-2xl font-bold mb-1 ${
                    stats.sundayServiceRate >= 70 ? 'text-green-700 dark:text-green-300' :
                    stats.sundayServiceRate >= 50 ? 'text-yellow-700 dark:text-yellow-300' :
                    'text-red-700 dark:text-red-300'
                  }`}>
                    {stats.sundayServiceRate.toFixed(0)}%
                  </p>
                )}
                <p className={`text-sm ${
                  stats.sundayServiceRate >= 70 ? 'text-green-600 dark:text-green-400' :
                  stats.sundayServiceRate >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  Active members who attend Sunday service (last 30 days)
                </p>
                </div>
                
              {/* Donation Growth */}
              <div className={`p-4 rounded-lg border ${
                !canCalculateTrend ? 
                  'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800' :
                donationTrend > 5 ? 
                  'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800' :
                donationTrend > 0 ? 
                  'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200 dark:border-yellow-800' :
                  'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className={`h-5 w-5 ${
                    !canCalculateTrend ? 'text-blue-600' :
                    donationTrend > 5 ? 'text-green-600' :
                    donationTrend > 0 ? 'text-yellow-600' :
                    'text-red-600'
                  }`} />
                  <h4 className={`font-semibold ${
                    !canCalculateTrend ? 'text-blue-900 dark:text-blue-100' :
                    donationTrend > 5 ? 'text-green-900 dark:text-green-100' :
                    donationTrend > 0 ? 'text-yellow-900 dark:text-yellow-100' :
                    'text-red-900 dark:text-red-100'
                  }`}>Donation Trend</h4>
                </div>
                {isLoading ? (
                  <Skeleton className="h-4 w-32 mb-2" />
                ) : !canCalculateTrend ? (
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mb-1">
                    Waiting for data
                  </p>
                ) : (
                  <p className={`text-2xl font-bold mb-1 ${
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
                <p className={`text-sm ${
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
              <div className={`p-4 rounded-lg border ${
                stats.eventsThisMonth > stats.averageEventsPerMonth * 1.2 ? 
                  'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800' :
                stats.eventsThisMonth > stats.averageEventsPerMonth ? 
                  'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200 dark:border-yellow-800' :
                  'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className={`h-5 w-5 ${
                    stats.eventsThisMonth > stats.averageEventsPerMonth * 1.2 ? 'text-green-600' :
                    stats.eventsThisMonth > stats.averageEventsPerMonth ? 'text-yellow-600' :
                    'text-red-600'
                  }`} />
                  <h4 className={`font-semibold ${
                    stats.eventsThisMonth > stats.averageEventsPerMonth * 1.2 ? 'text-green-900 dark:text-green-100' :
                    stats.eventsThisMonth > stats.averageEventsPerMonth ? 'text-yellow-900 dark:text-yellow-100' :
                    'text-red-900 dark:text-red-100'
                  }`}>Event Activity</h4>
            </div>
                {isLoading ? (
                  <Skeleton className="h-4 w-32 mb-2" />
                ) : (
                  <p className={`text-2xl font-bold mb-1 ${
                    stats.eventsThisMonth > stats.averageEventsPerMonth * 1.2 ? 'text-green-700 dark:text-green-300' :
                    stats.eventsThisMonth > stats.averageEventsPerMonth ? 'text-yellow-700 dark:text-yellow-300' :
                    'text-red-700 dark:text-red-300'
                  }`}>
                    {stats.eventsThisMonth > stats.averageEventsPerMonth ? 'Above' : 'Below'} Average
                  </p>
                )}
                <p className={`text-sm ${
                  stats.eventsThisMonth > stats.averageEventsPerMonth * 1.2 ? 'text-green-600 dark:text-green-400' :
                  stats.eventsThisMonth > stats.averageEventsPerMonth ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {stats.eventsThisMonth} events this month vs {stats.averageEventsPerMonth} average
                </p>
          </div>
              
 {/* Task Management */}
 <div className={`p-4 rounded-lg border ${
                stats.totalTasks > 0 ? 
                  (stats.overdueTasks / stats.totalTasks) <= 0.1 ? 
                    'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800' :
                  (stats.overdueTasks / stats.totalTasks) <= 0.3 ? 
                    'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200 dark:border-yellow-800' :
                    'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800'
                : 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <CheckSquare className={`h-5 w-5 ${
                    stats.totalTasks > 0 ? 
                      (stats.overdueTasks / stats.totalTasks) <= 0.1 ? 'text-green-600' :
                      (stats.overdueTasks / stats.totalTasks) <= 0.3 ? 'text-yellow-600' :
                      'text-red-600'
                    : 'text-blue-600'
                  }`} />
                  <h4 className={`font-semibold ${
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
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mb-1">
                    {stats.totalTasks > 0 ? `${((stats.totalTasks - stats.overdueTasks) / stats.totalTasks * 100).toFixed(0)}%` : '0%'}
                  </p>
                )}
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  {stats.overdueTasks} overdue tasks need attention
                </p>
                  </div>

              {/* Volunteer Engagement */}
              <div className={`p-4 rounded-lg border ${
                stats.eventsStillNeedingVolunteers === 0 ? 
                  'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800' :
                stats.eventsStillNeedingVolunteers <= stats.eventsWithVolunteersEnabled * 0.3 ? 
                  'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200 dark:border-yellow-800' :
                  'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Users2 className={`h-5 w-5 ${
                    stats.eventsStillNeedingVolunteers === 0 ? 'text-green-600' :
                    stats.eventsStillNeedingVolunteers <= stats.eventsWithVolunteersEnabled * 0.3 ? 'text-yellow-600' :
                    'text-red-600'
                  }`} />
                  <h4 className={`font-semibold ${
                    stats.eventsStillNeedingVolunteers === 0 ? 'text-green-900 dark:text-green-100' :
                    stats.eventsStillNeedingVolunteers <= stats.eventsWithVolunteersEnabled * 0.3 ? 'text-yellow-900 dark:text-yellow-100' :
                    'text-red-900 dark:text-red-100'
                  }`}>Volunteer Engagement</h4>
                </div>
                {isLoading ? (
                  <Skeleton className="h-4 w-32 mb-2" />
                ) : (
                  <p className={`text-2xl font-bold mb-1 ${
                    stats.eventsStillNeedingVolunteers === 0 ? 'text-green-700 dark:text-green-300' :
                    stats.eventsStillNeedingVolunteers <= stats.eventsWithVolunteersEnabled * 0.3 ? 'text-yellow-700 dark:text-yellow-300' :
                    'text-red-700 dark:text-red-300'
                  }`}>
                    {stats.eventsStillNeedingVolunteers === 0 ? 'Fully Staffed' :
                     stats.eventsStillNeedingVolunteers <= stats.eventsWithVolunteersEnabled * 0.3 ? 'Good Coverage' :
                     'Needs Volunteers'}
                  </p>
                )}
                <p className={`text-sm ${
                  stats.eventsStillNeedingVolunteers === 0 ? 'text-green-600 dark:text-green-400' :
                  stats.eventsStillNeedingVolunteers <= stats.eventsWithVolunteersEnabled * 0.3 ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {stats.eventsStillNeedingVolunteers} events need volunteers
                </p>
              </div>
              
              {/* Recent Visitors */}
              <div className={`p-4 rounded-lg border ${
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
                  <UserPlus className={`h-5 w-5 ${
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
                  <h4 className={`font-semibold ${
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
                  <p className={`text-2xl font-bold mb-1 ${
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
                <p className={`text-sm ${
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
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {/* Top Performing Metric */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="h-5 w-5 text-emerald-600" />
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
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
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
                        
                        if (metrics.length === 0) return 'Your strongest organizational metric';
                        
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
              <div className="p-4 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="h-5 w-5 text-amber-600" />
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
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      {(() => {
                        // Priority 1: Immediate needs
                        if (stats.eventsStillNeedingVolunteers > 0) return 'Reach out to members and encourage volunteer sign-ups for upcoming events.';
                   
                        // Priority 2: Donation trends
                        if (stats.growthRate < 0) return 'Share stories of impact and consider different giving opportunities to encourage donations.';

                        // Priority 3: Member engagement issues
                        if (stats.totalPeople > 0 && (stats.activeMembers / stats.totalPeople) < 0.7) return 'Focus on engaging visitors and inactive members through personal outreach and meaningful activities.';
                        
                        // Priority 4: Sunday service attendance
                        if (stats.sundayServiceRate < 50) return 'Consider what might be preventing members from attending and address those barriers.';
                        
                        // Priority 5: Event activity
                        if (stats.eventsThisMonth < stats.averageEventsPerMonth) return 'Plan more events or activities to increase member engagement and community building.';
                        
                        // Priority 6: Visitor follow-up
                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        const recentVisitors = people.filter(person => 
                          person.status === 'visitor' && 
                          new Date(person.createdAt) >= thirtyDaysAgo
                        ).length;
                        
                        if (recentVisitors > 0) return 'Follow up with recent visitors to help them feel welcome and connected.';
                        
                        // Default: Member retention
                        return 'Focus on maintaining strong relationships and preventing member turnover.';
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
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Users2 className="mr-2 h-6 w-6" />
              Average Attendance by Event Type
            </CardTitle>
            <CardDescription className="text-base">Average attendance for different event types (last 6 months)</CardDescription>
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
                      {stats.sundayServiceEvents > 0 ? 
                        Math.round(stats.sundayServiceAttendance / stats.sundayServiceEvents) : 0}
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
                      {stats.bibleStudyEvents > 0 ? 
                        Math.round(stats.bibleStudyAttendance / stats.bibleStudyEvents) : 0}
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
                      {stats.fellowshipEvents > 0 ? 
                        Math.round(stats.fellowshipAttendance / stats.fellowshipEvents) : 0}
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
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Users className="mr-2 h-6 w-6" />
              Attendance Statistics
              </CardTitle>
            <CardDescription className="text-base">Last 30 days overview</CardDescription>
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
                          <div key={member.name} className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                index === 0 ? 'bg-primary' :
                                index === 1 ? 'bg-muted-foreground' :
                                index === 2 ? 'bg-amber-600' : 'bg-primary'
                              }`}>
                                {index + 1}
            </div>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
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
                                <div className="min-w-0">
                                  <div className="font-medium text-foreground text-sm truncate">{member.name}</div>
                                  <div className="text-xs text-muted-foreground">{member.count} events</div>
            </div>
          </div>
        </div>
                            <div className="text-sm font-bold text-primary">{member.count}</div>
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
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <DollarSign className="mr-2 h-6 w-6" />
              Donation Statistics
              </CardTitle>
            <CardDescription className="text-base">Financial overview of your organization</CardDescription>
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
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Calendar className="mr-2 h-6 w-6" />
              Event Statistics
              </CardTitle>
            <CardDescription className="text-base">Overview of your organization's events</CardDescription>
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
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Users2 className="mr-2 h-6 w-6" />
              Member Statistics
            </CardTitle>
            <CardDescription className="text-base">Detailed breakdown of your organization's membership</CardDescription>
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
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Home className="mr-2 h-6 w-6" />
              Family Overview
            </CardTitle>
            <CardDescription className="text-base">Family structure and member distribution</CardDescription>
          </CardHeader>
          <CardContent>
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
                  <p className="text-sm text-muted-foreground">
                    Organized family units
                  </p>
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
                    {stats.totalPeople > 0 ? `${((stats.membersInFamilies / stats.totalPeople) * 100).toFixed(1)}%` : '0%'} of total
                  </p>
                </div>
              </div>

              {/* Members Without Families */}
              <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg border">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center">
                    <UserPlus className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-foreground">Unassigned Members</p>
                  <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.membersWithoutFamilies}</p>
                  <p className="text-sm text-muted-foreground">
                    Need family assignment
                        </p>
                      </div>
                    </div>
            </div>

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
                    {stats.totalPeople > 0 ? `${((stats.adults / stats.totalPeople) * 100).toFixed(1)}%` : '0%'} of total
                  </p>
                </div>
              </div>

              {/* Children */}
              <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg border">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                    <Users2 className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-foreground">Children</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.children}</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.totalPeople > 0 ? `${((stats.children / stats.totalPeople) * 100).toFixed(1)}%` : '0%'} of total
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

      <div className="grid gap-6 tablet:grid-cols-2 md:grid-cols-2">
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
                  <div key={donation.id} className="flex items-center justify-between border-b pb-3">
                    <div>
                      <p className="font-medium text-base">${parseFloat(donation.amount).toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(donation.date + 'T12:00:00'), 'MMM d, yyyy')}
                        {donation.attendance && ` • ${donation.attendance} people`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditDonation(donation)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
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
            <div className="grid grid-cols-2 gap-4">
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
            <div className="grid grid-cols-2 gap-4">
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
    </div>
  );
}

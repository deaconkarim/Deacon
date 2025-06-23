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
  Home
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { getMembers, getEvents, getDonations, getAllEvents, addMember, updateMember, deleteMember, getMemberAttendance, updateDonation, deleteDonation, addEventAttendance, getEventAttendance, getVolunteerStats } from '../lib/data';
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
    children: 0
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
    return {
      startDate: startOfMonth(now),
      endDate: endOfMonth(now)
    };
  }, []); // Empty dependency array - only calculate once

  // Attendance stats for current month
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
        firstName: person.firstName || person.firstname || '',
        lastName: person.lastName || person.lastname || '',
        joinDate: person.joinDate || person.joindate,
        createdAt: person.createdAt || person.created_at,
        updatedAt: person.updatedAt || person.updated_at
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

      // Fetch donations using the filtered getDonations function
      const donations = await getDonations();

      // Debug: Log donation data to understand the structure
      console.log('=== DONATION DEBUGGING ===');
      console.log('Donations data:', donations);
      console.log('Donations length:', donations?.length);
      console.log('Current date:', new Date().toISOString());
      console.log('Current date object:', new Date());

      // Calculate total donations
      const totalDonations = donations?.reduce((sum, donation) => {
        const amount = parseFloat(donation.amount) || 0;
        console.log('Processing donation:', donation, 'Amount:', amount);
        return sum + amount;
      }, 0) || 0;

      console.log('Total donations calculated:', totalDonations);

      // Calculate monthly donations
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth(); // getMonth() returns 0-11
      
      console.log('Current year:', currentYear, 'Current month:', currentMonth);
      console.log('Current month name:', ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][currentMonth]);
      
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
          
          console.log(`Donation date: ${donation.date} -> Parsed: ${donationDate.toISOString()} (${donationMonthName} ${donationYear}) - Current month: ${isCurrentMonth}`);
          console.log(`Comparing: ${donationDateStr} starts with ${currentDateStr} = ${isCurrentMonth}`);
          
          if (isCurrentMonth) {
            console.log('✓ Found donation for current month:', donation);
          }
          
          return isCurrentMonth;
        } catch (error) {
          console.error('Error processing donation date:', donation.date, error);
          return false;
        }
      }).reduce((sum, donation) => {
        const amount = parseFloat(donation.amount) || 0;
        console.log('Adding to monthly total:', amount);
        return sum + amount;
      }, 0) || 0;

      console.log('Monthly donations calculated:', monthlyDonations);
      console.log('=== END DONATION DEBUGGING ===');

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

      // Calculate monthly average (total donations divided by actual months with data)
      const donationDates = donations?.map(d => d.date) || [];
      const uniqueMonths = new Set();
      
      donationDates.forEach(dateStr => {
        const date = new Date(dateStr);
        const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        uniqueMonths.add(yearMonth);
      });
      
      const actualMonthsWithData = uniqueMonths.size;
      const monthlyAverage = actualMonthsWithData > 0 ? totalDonations / actualMonthsWithData : 0;

      // Calculate growth rate
      const growthRate = monthlyAverage > 0 ? 
        ((monthlyDonations - monthlyAverage) / monthlyAverage) * 100 : 0;

      console.log('=== CALCULATION DEBUG ===');
      console.log('Total donations:', totalDonations);
      console.log('Monthly donations:', monthlyDonations);
      console.log('Weekly donation totals:', weeklyDonationTotals);
      console.log('Weekly totals array:', weeklyTotals);
      console.log('Number of weeks with donations:', weeklyTotals.length);
      console.log('Unique months with data:', Array.from(uniqueMonths));
      console.log('Actual months with data:', actualMonthsWithData);
      console.log('Weekly average (avg of weekly totals):', weeklyAverage);
      console.log('Monthly average (total/actual months):', monthlyAverage);
      console.log('Growth rate:', growthRate);
      console.log('=== END CALCULATION DEBUG ===');

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

      console.log('=== EVENTS DEBUG ===');
      console.log('Total events:', allEvents.length);
      console.log('Upcoming events:', upcomingEvents.length);
      console.log('Events this week:', eventsThisWeek);
      console.log('Events this month:', eventsThisMonth);
      console.log('Current date:', today.toISOString());
      console.log('Week from now:', weekFromNow.toISOString());
      console.log('Month from now:', monthFromNow.toISOString());
      console.log('=== END EVENTS DEBUG ===');

      // Fetch volunteer statistics
      const volunteerStats = await getVolunteerStats();
      console.log('=== VOLUNTEER DEBUG ===');
      console.log('Volunteer stats:', volunteerStats);
      console.log('=== END VOLUNTEER DEBUG ===');

      // Calculate average attendance by event type
      console.log('=== ATTENDANCE BY EVENT TYPE DEBUG ===');
      
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

      console.log('Events with attendance data:', eventsWithAttendance?.length || 0);

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
          
          console.log(`Event: ${event.title} (${eventType}) - Attendance: ${attendingCount}/${event.event_attendance.length} records`);
        } else {
          eventsWithoutRecords++;
          console.log(`Event: ${event.title} (${eventType}) - No attendance records`);
        }
      });
      
      console.log(`Summary: ${eventsWithRecords} events with attendance records, ${eventsWithoutRecords} events without records`);

      // Calculate averages
      Object.keys(eventTypeStats).forEach(eventType => {
        const stats = eventTypeStats[eventType];
        stats.averageAttendance = stats.eventCount > 0 ? 
          Math.round(stats.totalAttendance / stats.eventCount) : 0;
      });

      console.log('Event type statistics:', eventTypeStats);

      // Map to the existing stats structure
      const sundayServiceStats = eventTypeStats['Sunday Worship Service'] || { averageAttendance: 0, eventCount: 0 };
      const bibleStudyStats = eventTypeStats['Bible Study'] || { averageAttendance: 0, eventCount: 0 };
      const fellowshipStats = eventTypeStats['Fellowship Activity'] || { averageAttendance: 0, eventCount: 0 };

      console.log('=== END ATTENDANCE BY EVENT TYPE DEBUG ===');

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
        console.log('Family stats loaded:', familyStats);
      } catch (error) {
        console.error('Error loading family stats:', error);
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
        totalVolunteers: volunteerStats.totalVolunteers,
        upcomingVolunteers: volunteerStats.upcomingVolunteers,
        recentVolunteers: volunteerStats.recentVolunteers,
        eventsNeedingVolunteers: volunteerStats.eventsNeedingVolunteers,
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
        children: familyStats.children
      });
      setRecentPeople(recentPeople);
      setPeople(transformedPeople);
      setUpcomingEvents(upcomingEvents);
      setWeeklyDonations(weeklyDonations);
      setDonations(donations || []);

      // Debug: Check people data for images
      console.log('People data debug:', {
        totalPeople: transformedPeople.length,
        peopleWithImages: transformedPeople.filter(p => p.image_url).length,
        samplePeople: transformedPeople.slice(0, 3).map(p => ({
          name: `${p.firstName} ${p.lastName}`,
          image_url: p.image_url,
          hasImage: !!p.image_url
        }))
      });
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
    const fullName = `${person.firstName} ${person.lastName}`.toLowerCase();
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
      </div>

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
              <div className="text-3xl font-bold">{stats.totalPeople}</div>
              <p className="text-sm text-muted-foreground mt-1">Total People</p>
              
              {/* Member type breakdown */}
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-600 font-medium">Active</span>
                  <span className="text-sm font-semibold">{stats.activeMembers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-orange-600 font-medium">Inactive</span>
                  <span className="text-sm font-semibold">{stats.inactiveMembers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-600 font-medium">Visitors</span>
                  <span className="text-sm font-semibold">{stats.visitors}</span>
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
              <div className="text-3xl font-bold">${(stats.monthlyDonations || 0).toFixed(2)}</div>
              <p className="text-sm text-muted-foreground mt-1">This month</p>
              
              {/* Donation breakdown */}
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-600 font-medium">Total Donations</span>
                  <span className="text-sm font-semibold">${(stats.totalDonations || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-600 font-medium">Monthly Average</span>
                  <span className="text-sm font-semibold">${(stats.monthlyAverage || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-600 font-medium">Weekly Average</span>
                  <span className="text-sm font-semibold">${(stats.weeklyAverage || 0).toFixed(2)}</span>
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
              <div className="text-3xl font-bold">{stats.upcomingEvents}</div>
              <p className="text-sm text-muted-foreground mt-1">Upcoming events</p>
              
              {/* Events breakdown */}
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-purple-600 font-medium">Total Events</span>
                  <span className="text-sm font-semibold">{stats.totalEvents}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-purple-600 font-medium">This Week</span>
                  <span className="text-sm font-semibold">{stats.eventsThisWeek}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-purple-600 font-medium">This Month</span>
                  <span className="text-sm font-semibold">{stats.eventsThisMonth}</span>
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
            <CardHeader className="bg-gradient-to-r from-teal-500 to-teal-600 text-white">
              <CardTitle className="flex items-center text-xl">
                <Handshake className="mr-2 h-5 w-5" />
                Volunteers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-3xl font-bold">{stats.eventsWithVolunteersEnabled || 0}</div>
              <p className="text-sm text-muted-foreground mt-1">Events with volunteers enabled (next 30 days)</p>
              
              {/* Volunteers breakdown */}
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-teal-600 font-medium">Total Volunteers Signed Up</span>
                  <span className="text-sm font-semibold">{stats.totalVolunteersSignedUp || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-teal-600 font-medium">Events Still Needing Help</span>
                  <span className="text-sm font-semibold">{stats.eventsStillNeedingVolunteers || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-teal-600 font-medium">Active Volunteers</span>
                  <span className="text-sm font-semibold">{stats.totalVolunteers || 0}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted py-2 px-6 border-t">
              <Button variant="outline" className="w-full" asChild>
                <a href="/events">Manage Volunteers</a>
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardTitle className="flex items-center text-xl">
                <Home className="mr-2 h-5 w-5" />
                Families
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-3xl font-bold">{stats.totalFamilies}</div>
              <p className="text-sm text-muted-foreground mt-1">Total Families</p>
              
              {/* Family breakdown */}
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-orange-600 font-medium">Members in Families</span>
                  <span className="text-sm font-semibold">{stats.membersInFamilies}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-orange-600 font-medium">Adults</span>
                  <span className="text-sm font-semibold">{stats.adults}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-orange-600 font-medium">Children</span>
                  <span className="text-sm font-semibold">{stats.children}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted py-2 px-6 border-t">
              <Button variant="outline" className="w-full" asChild>
                <a href="/members">Manage Families</a>
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>

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
                  <p className="text-2xl font-bold text-primary">
                    {stats.sundayServiceEvents > 0 ? 
                      Math.round(stats.sundayServiceAttendance / stats.sundayServiceEvents) : 0}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {stats.sundayServiceEvents} events • {stats.sundayServiceAttendance} total
                  </p>
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
                  <p className="text-2xl font-bold text-primary">
                    {stats.bibleStudyEvents > 0 ? 
                      Math.round(stats.bibleStudyAttendance / stats.bibleStudyEvents) : 0}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {stats.bibleStudyEvents} events • {stats.bibleStudyAttendance} total
                  </p>
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
                  <p className="text-2xl font-bold text-primary">
                    {stats.fellowshipEvents > 0 ? 
                      Math.round(stats.fellowshipAttendance / stats.fellowshipEvents) : 0}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {stats.fellowshipEvents} events • {stats.fellowshipAttendance} total
                  </p>
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
                            <div className="text-sm text-muted-foreground">attendees</div>
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
                          const fullName = `${p.firstName} ${p.lastName}`.trim();
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

                        // Debug: Log image data
                        console.log('Member image debug:', {
                          memberName: member.name,
                          memberData: memberData ? {
                            firstName: memberData.firstName,
                            lastName: memberData.lastName,
                            image_url: memberData.image_url,
                            hasImage: !!memberData.image_url
                          } : 'No member data found'
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
                                      onLoad={() => {
                                        console.log('Image loaded successfully:', memberData.image_url);
                                      }}
                                    />
                                  ) : null}
                                  <AvatarFallback className="bg-gray-200 text-gray-700">
                                    {memberData ? getInitials(memberData.firstName || '', memberData.lastName || '') : 
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
            <div className="grid gap-4 md:grid-cols-2">
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
                    {stats.totalDonations > 0 ? `${(((stats.monthlyDonations || 0) / stats.totalDonations) * 100).toFixed(1)}%` : '0%'} of total
                  </p>
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

            {/* Summary Stats */}
            <div className="mt-6 grid gap-4 md:grid-cols-1">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-base text-muted-foreground">Weekly Average</p>
                <p className="text-3xl font-bold text-foreground">${(stats.weeklyAverage || 0).toFixed(2)}</p>
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
              {/* Upcoming Events */}
              <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg border">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-foreground">Upcoming</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.upcomingEvents}</p>
                  <p className="text-sm text-muted-foreground">Future events</p>
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
                          <AvatarFallback>{getInitials(person.firstName, person.lastName)}</AvatarFallback>
                        </Avatar>
                        <div className="text-base">{formatName(person.firstName, person.lastName)}</div>
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
                    <AvatarFallback>{getInitials(person.firstName, person.lastName)}</AvatarFallback>
                  </Avatar>
                  <span>{formatName(person.firstName, person.lastName)}</span>
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
                      <AvatarFallback>{getInitials(person.firstName, person.lastName)}</AvatarFallback>
                    </Avatar>
                    <span>{formatName(person.firstName, person.lastName)}</span>
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

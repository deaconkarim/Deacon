import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { format, parse, isAfter, isBefore, addDays, startOfDay, endOfDay, parseISO, isValid, startOfWeek } from 'date-fns';
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
  Handshake
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
import { getMembers, getGroups, getEvents, getDonations, getAllEvents, addMember, updateMember, deleteMember, getMemberAttendance, updateDonation, deleteDonation, addEventAttendance, getEventAttendance, getVolunteerStats } from '../lib/data';
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
    totalGroups: 0,
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
    eventsNeedingVolunteers: 0
  });
  const [recentPeople, setRecentPeople] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [weeklyDonations, setWeeklyDonations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState({});
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isPersonDialogOpen, setIsPersonDialogOpen] = useState(false);
  const [selectedPeople, setSelectedPeople] = useState([]);
  const [personSearchQuery, setPersonSearchQuery] = useState('');
  const [people, setPeople] = useState([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isEditDonationOpen, setIsEditDonationOpen] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [isDeleteDonationOpen, setIsDeleteDonationOpen] = useState(false);
  const [donations, setDonations] = useState([]);
  const [recentGroups, setRecentGroups] = useState([]);

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

      // Fetch groups using the filtered getGroups function
      const groups = await getGroups();

      // Calculate total active groups
      const totalGroups = groups?.length || 0;

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

      // Calculate weekly average (based on actual weeks with donation data)
      const donationWeeks = donations?.map(d => {
        const date = new Date(d.date);
        const yearWeek = `${date.getFullYear()}-W${Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7)}`;
        return yearWeek;
      }) || [];
      
      const uniqueWeeks = new Set(donationWeeks);
      const actualWeeksWithData = uniqueWeeks.size;
      const weeklyAverage = actualWeeksWithData > 0 ? totalDonations / actualWeeksWithData : 0;

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
      console.log('Unique weeks with data:', Array.from(uniqueWeeks));
      console.log('Actual weeks with data:', actualWeeksWithData);
      console.log('Unique months with data:', Array.from(uniqueMonths));
      console.log('Actual months with data:', actualMonthsWithData);
      console.log('Weekly average (total/actual weeks):', weeklyAverage);
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

      // Get recent groups (last 3 groups)
      const recentGroups = groups?.slice(0, 3) || [];

      // Get weekly donations for chart
      const weeklyDonations = donations?.slice(0, 7) || [];

      // Calculate events statistics using all events
      const currentDate = new Date();
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      const monthFromNow = new Date();
      monthFromNow.setMonth(monthFromNow.getMonth() + 1);

      const eventsThisWeek = allEvents.filter(event => {
        const eventDate = new Date(event.start_date);
        return eventDate >= currentDate && eventDate <= weekFromNow;
      }).length;

      const eventsThisMonth = allEvents.filter(event => {
        const eventDate = new Date(event.start_date);
        return eventDate >= currentDate && eventDate <= monthFromNow;
      }).length;

      console.log('=== EVENTS DEBUG ===');
      console.log('Total events:', allEvents.length);
      console.log('Upcoming events:', upcomingEvents.length);
      console.log('Events this week:', eventsThisWeek);
      console.log('Events this month:', eventsThisMonth);
      console.log('Current date:', currentDate.toISOString());
      console.log('Week from now:', weekFromNow.toISOString());
      console.log('Month from now:', monthFromNow.toISOString());
      console.log('=== END EVENTS DEBUG ===');

      // Fetch volunteer statistics
      const volunteerStats = await getVolunteerStats();
      console.log('=== VOLUNTEER DEBUG ===');
      console.log('Volunteer stats:', volunteerStats);
      console.log('=== END VOLUNTEER DEBUG ===');

      setStats({
        totalPeople,
        activeMembers: activeMembers.length,
        inactiveMembers: inactiveMembers.length,
        visitors: visitors.length,
        totalGroups,
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
        eventsNeedingVolunteers: volunteerStats.eventsNeedingVolunteers
      });
      setRecentPeople(recentPeople);
      setUpcomingEvents(upcomingEvents);
      setWeeklyDonations(weeklyDonations);
      setRecentGroups(recentGroups);
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
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      <div className="grid gap-4 tablet-portrait:grid-cols-2 tablet-landscape:grid-cols-3 md:grid-cols-2 lg:grid-cols-5">
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
            <CardFooter className="bg-gray-50 py-2 px-6 border-t">
              <Button variant="ghost" size="sm" className="ml-auto" asChild>
                <a href="/members">
                  View all <ChevronRight className="ml-1 h-4 w-4" />
                </a>
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
            <CardFooter className="bg-gray-50 py-2 px-6 border-t">
              <Button variant="ghost" size="sm" className="ml-auto" asChild>
                <a href="/donations">
                  View all <ChevronRight className="ml-1 h-4 w-4" />
                </a>
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
            <CardFooter className="bg-gray-50 py-2 px-6 border-t">
              <Button variant="ghost" size="sm" className="ml-auto" asChild>
                <a href="/events">
                  View all <ChevronRight className="ml-1 h-4 w-4" />
                </a>
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-amber-500 to-amber-600 text-white">
              <CardTitle className="flex items-center text-xl">
                <Users2 className="mr-2 h-5 w-5" />
                Groups
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-3xl font-bold">{stats.totalGroups}</div>
              <p className="text-sm text-muted-foreground mt-1">Active groups</p>
              
              {/* Groups breakdown */}
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-amber-600 font-medium">Total Groups</span>
                  <span className="text-sm font-semibold">{stats.totalGroups}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-amber-600 font-medium">Active Groups</span>
                  <span className="text-sm font-semibold">{recentGroups.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-amber-600 font-medium">Avg. Group Size</span>
                  <span className="text-sm font-semibold">{stats.totalGroups > 0 ? Math.round(stats.activeMembers / stats.totalGroups) : 0}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 py-2 px-6 border-t">
              <Button variant="ghost" size="sm" className="ml-auto" asChild>
                <a href="/groups">
                  View all <ChevronRight className="ml-1 h-4 w-4" />
                </a>
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
              <div className="text-3xl font-bold">{stats.totalVolunteers}</div>
              <p className="text-sm text-muted-foreground mt-1">Active volunteers</p>
              
              {/* Volunteers breakdown */}
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-teal-600 font-medium">Upcoming Assignments</span>
                  <span className="text-sm font-semibold">{stats.upcomingVolunteers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-teal-600 font-medium">Recent Activity</span>
                  <span className="text-sm font-semibold">{stats.recentVolunteers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-teal-600 font-medium">Events Needing Help</span>
                  <span className="text-sm font-semibold">{stats.eventsNeedingVolunteers}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 py-2 px-6 border-t">
              <Button variant="ghost" size="sm" className="ml-auto" asChild>
                <a href="/events">
                  Manage volunteers <ChevronRight className="ml-1 h-4 w-4" />
                </a>
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>

      {/* Member Statistics Section */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users2 className="mr-2 h-5 w-5" />
              Member Statistics
            </CardTitle>
            <CardDescription>Detailed breakdown of your organization's membership</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Active Members */}
              <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <Users2 className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-800">Active Members</p>
                  <p className="text-2xl font-bold text-green-900">{stats.activeMembers}</p>
                  <p className="text-xs text-green-600">
                    {stats.totalPeople > 0 ? `${((stats.activeMembers / stats.totalPeople) * 100).toFixed(1)}%` : '0%'} of total
                  </p>
                </div>
              </div>

              {/* Inactive Members */}
              <div className="flex items-center space-x-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                    <Users2 className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-orange-800">Inactive Members</p>
                  <p className="text-2xl font-bold text-orange-900">{stats.inactiveMembers}</p>
                  <p className="text-xs text-orange-600">
                    {stats.totalPeople > 0 ? `${((stats.inactiveMembers / stats.totalPeople) * 100).toFixed(1)}%` : '0%'} of total
                  </p>
                </div>
              </div>

              {/* Visitors */}
              <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <Users2 className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-800">Visitors</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.visitors}</p>
                  <p className="text-xs text-blue-600">
                    {stats.totalPeople > 0 ? `${((stats.visitors / stats.totalPeople) * 100).toFixed(1)}%` : '0%'} of total
                  </p>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="mt-6 pt-6 border-t">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total People</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalPeople}</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Active Rate</p>
                  <p className="text-3xl font-bold text-green-600">
                    {stats.totalPeople > 0 ? `${((stats.activeMembers / stats.totalPeople) * 100).toFixed(1)}%` : '0%'}
                  </p>
                </div>
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

      {/* Donation Statistics Section */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="mr-2 h-5 w-5" />
              Donation Statistics
            </CardTitle>
            <CardDescription>Financial overview of your organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Monthly Donations */}
              <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-800">This Month</p>
                  <p className="text-2xl font-bold text-green-900">${(stats.monthlyDonations || 0).toFixed(2)}</p>
                  <p className="text-xs text-green-600">
                    {stats.totalDonations > 0 ? `${(((stats.monthlyDonations || 0) / stats.totalDonations) * 100).toFixed(1)}%` : '0%'} of total
                  </p>
                </div>
              </div>

              {/* Total Donations */}
              <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-800">Total Donations</p>
                  <p className="text-2xl font-bold text-blue-900">${stats.totalDonations.toFixed(2)}</p>
                  <p className="text-xs text-blue-600">All time</p>
                </div>
              </div>

              {/* Monthly Average */}
              <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-purple-800">Monthly Average</p>
                  <p className="text-2xl font-bold text-purple-900">${(stats.monthlyAverage || 0).toFixed(2)}</p>
                  <p className="text-xs text-purple-600">Per month</p>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="mt-6 pt-6 border-t">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Weekly Average</p>
                  <p className="text-3xl font-bold text-gray-900">${(stats.weeklyAverage || 0).toFixed(2)}</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Growth Rate</p>
                  <p className="text-3xl font-bold text-green-600">
                    {(stats.growthRate || 0) > 0 ? '+' : ''}{(stats.growthRate || 0).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <a href="/donations">View Donations</a>
            </Button>
          </CardFooter>
        </Card>
      </motion.div>

      {/* Event Statistics Section */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Event Statistics
            </CardTitle>
            <CardDescription>Overview of your organization's events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Upcoming Events */}
              <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-purple-800">Upcoming</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.upcomingEvents}</p>
                  <p className="text-xs text-purple-600">Future events</p>
                </div>
              </div>

              {/* This Week */}
              <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-800">This Week</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.eventsThisWeek}</p>
                  <p className="text-xs text-blue-600">Next 7 days</p>
                </div>
              </div>

              {/* This Month */}
              <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-800">This Month</p>
                  <p className="text-2xl font-bold text-green-900">{stats.eventsThisMonth}</p>
                  <p className="text-xs text-green-600">Next 30 days</p>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="mt-6 pt-6 border-t">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Events</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalEvents}</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Event Frequency</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {stats.totalEvents > 0 ? (stats.totalEvents / 12).toFixed(1) : '0'} per month
                  </p>
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

      {/* Group Statistics Section */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users2 className="mr-2 h-5 w-5" />
              Group Statistics
            </CardTitle>
            <CardDescription>Overview of your organization's groups</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Total Groups */}
              <div className="flex items-center space-x-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center">
                    <Users2 className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-800">Total Groups</p>
                  <p className="text-2xl font-bold text-amber-900">{stats.totalGroups}</p>
                  <p className="text-xs text-amber-600">All groups</p>
                </div>
              </div>

              {/* Active Groups */}
              <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-800">Active Groups</p>
                  <p className="text-2xl font-bold text-green-900">{recentGroups.length}</p>
                  <p className="text-xs text-green-600">Currently active</p>
                </div>
              </div>

              {/* Average Group Size */}
              <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-800">Average Group Size</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {stats.totalGroups > 0 ? Math.round(stats.activeMembers / stats.totalGroups) : 0}
                  </p>
                  <p className="text-xs text-blue-600">Members per group</p>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="mt-6 pt-6 border-t">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Average Group Size</p>
                  <p className="text-3xl font-bold text-amber-600">
                    {stats.totalGroups > 0 ? Math.round(stats.activeMembers / stats.totalGroups) : '0'}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Ungrouped Members</p>
                  <p className="text-3xl font-bold text-amber-600">
                    {Math.max(0, stats.activeMembers - (stats.totalGroups * 5))}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <a href="/groups">View Groups</a>
            </Button>
          </CardFooter>
        </Card>
      </motion.div>

      <div className="grid gap-6 tablet:grid-cols-2 md:grid-cols-2">
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Recent People</CardTitle>
              <CardDescription>Latest active members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentPeople.length > 0 ? (
                  recentPeople.map(person => (
                    <div key={person.id} className="flex items-center justify-between border-b pb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={person.image_url} />
                          <AvatarFallback>{getInitials(person.firstName, person.lastName)}</AvatarFallback>
                        </Avatar>
                        <div>{formatName(person.firstName, person.lastName)}</div>
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
                  <p className="text-muted-foreground">No recent people to display.</p>
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
              <CardTitle>Recent Donations</CardTitle>
              <CardDescription>Latest donations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {donations.slice(0, 5).map(donation => (
                  <div key={donation.id} className="flex items-center justify-between border-b pb-3">
                    <div>
                      <p className="font-medium">${parseFloat(donation.amount).toFixed(2)}</p>
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
                  className="flex items-center space-x-2 p-2 hover:bg-muted rounded-lg cursor-pointer"
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
                    className="flex items-center space-x-2 p-2 bg-muted/50 rounded-lg"
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

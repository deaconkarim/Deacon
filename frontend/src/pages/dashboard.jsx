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
  Trash2
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
import { getMembers, getGroups } from '../lib/data';
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
    totalGroups: 0,
    totalDonations: 0,
    monthlyDonations: 0,
    upcomingEvents: 0
  });
  const [recentPeople, setRecentPeople] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
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

  // Load people when component mounts
  useEffect(() => {
    const loadPeople = async () => {
      try {
        const data = await getMembers();
        setPeople(data);
      } catch (error) {
        console.error('Error loading people:', error);
        toast({
          title: "Error",
          description: "Failed to load people",
          variant: "destructive",
        });
      }
    };
    loadPeople();
  }, [toast]);

  const handleOpenRSVPModal = async (eventId) => {
    setSelectedEvent({ id: eventId });
    setSelectedPeople([]);
    setPersonSearchQuery('');
    setIsPersonDialogOpen(true);
    
    try {
      const { data: existingRecords, error: fetchError } = await supabase
        .from('event_attendance')
        .select('*')
        .eq('event_id', eventId);

      if (fetchError) throw fetchError;

      if (existingRecords && existingRecords.length > 0) {
        const personIds = existingRecords.map(record => record.person_id);
        setSelectedPeople(personIds);
      }
    } catch (error) {
      console.error('Error loading existing RSVPs:', error);
      setSelectedPeople([]);
    }
  };

  const handlePersonClick = async (person) => {
    try {
      const { error } = await supabase
        .from('event_attendance')
        .upsert({
          event_id: selectedEvent.id,
          member_id: person.id,
          status: 'attending'
        });

      if (error) throw error;

      setSelectedPeople(prev => [...prev, person.id]);
      setPersonSearchQuery('');

      toast({
        title: "Success",
        description: "Person added to the event."
      });

      // Refresh the selected people list
      const { data: existingRecords, error: fetchError } = await supabase
        .from('event_attendance')
        .select('*')
        .eq('event_id', selectedEvent.id);

      if (!fetchError && existingRecords) {
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

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch people
      const { data: people, error: peopleError } = await supabase
        .from('members')
        .select('*')
        .eq('status', 'active');

      if (peopleError) throw peopleError;

      // Transform snake_case to camelCase
      const transformedPeople = people?.map(person => ({
        ...person,
        firstName: person.firstname || '',
        lastName: person.lastname || '',
        joinDate: person.joindate,
        createdAt: person.created_at,
        updatedAt: person.updated_at
      })) || [];

      // Calculate total active people
      const totalPeople = transformedPeople.length;

      // Get recent people (last 5 active members)
      const recentPeople = transformedPeople
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      // Fetch groups
      const { data: groups, error: groupsError } = await supabase
        .from('groups')
        .select('*');

      if (groupsError) throw groupsError;

      // Calculate total active groups
      const totalGroups = groups?.length || 0;

      // Fetch donations
      const { data: donations, error: donationsError } = await supabase
        .from('donations')
        .select('*')
        .order('date', { ascending: false });

      if (donationsError) throw donationsError;

      // Calculate total donations
      const totalDonations = donations?.reduce((sum, donation) => sum + parseFloat(donation.amount), 0) || 0;

      // Calculate monthly donations
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11, we need 1-12
      
      const monthlyDonations = donations
        ?.filter(donation => {
          // Parse date as YYYY-MM-DD string to avoid timezone issues
          const donationDate = donation.date; // Should be in format YYYY-MM-DD
          const [year, month] = donationDate.split('-').map(Number);
          return year === currentYear && month === currentMonth;
        })
        .reduce((sum, donation) => sum + parseFloat(donation.amount), 0) || 0;

      // Fetch upcoming events
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true });

      if (eventsError) throw eventsError;

      // Filter events for current month
      const currentMonthEvents = events?.filter(event => {
        // Parse event start_date to avoid timezone issues
        const eventDate = event.start_date; // Should be in format YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
        const [year, month] = eventDate.split('-').map(Number);
        return year === currentYear && month === currentMonth;
      }) || [];

      // Update state with fetched data
      setStats({
        totalPeople,
        totalGroups,
        totalDonations,
        monthlyDonations,
        upcomingEvents: currentMonthEvents.length
      });
      setRecentPeople(recentPeople);
      setUpcomingEvents(events || []);
      setDonations(donations || []);
      setRecentGroups(groups?.slice(0, 5) || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
    fetchDashboardData();
  }, [fetchDashboardData]);

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
      const { error } = await supabase
        .from('donations')
        .update(updatedDonation)
        .eq('id', selectedDonation.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Donation updated successfully."
      });

      setIsEditDonationOpen(false);
      setSelectedDonation(null);
      fetchDashboardData(); // Refresh the data
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
      const { error } = await supabase
        .from('donations')
        .delete()
        .eq('id', selectedDonation.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Donation deleted successfully."
      });

      setIsDeleteDonationOpen(false);
      setSelectedDonation(null);
      fetchDashboardData(); // Refresh the data
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

      <div className="grid gap-4 tablet-portrait:grid-cols-2 tablet-landscape:grid-cols-4 md:grid-cols-2 lg:grid-cols-4">
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
              <p className="text-sm text-muted-foreground mt-1">Active members</p>
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
              <div className="text-3xl font-bold">${stats.monthlyDonations.toFixed(2)}</div>
              <p className="text-sm text-muted-foreground mt-1">This month</p>
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
      </div>

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

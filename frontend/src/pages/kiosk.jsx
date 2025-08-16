import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { format, parse, isAfter, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { 
  Calendar as CalendarIcon, 
  Search, 
  RefreshCw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  UserPlus,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  ExternalLink,
  CheckCircle,
  Utensils,
  Users,
  Calendar,
  Clock,
  X,
  Handshake,
  Star,
  Filter,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  Eye,
  BarChart3,
  Zap,
  Target,
  Heart,
  Crown,
  Shield,
  BookOpen,
  Building,
  GraduationCap,
  PieChart,
  LineChart,
  Settings,
  Download,
  Share2,
  Bell,
  MessageSquare,
  Phone,
  Mail,
  Globe,
  Coffee,
  MoreHorizontal,
  Church,
  Copy,
  FileText,
  DollarSign,
  Tag,
  Tent,
  Baby,
  User,
  Music,
  Droplets,
  Wine,
  Gift,
  Monitor,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { getMembers, getCurrentUserOrganizationId } from '../lib/data';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/lib/authContext';
import { getInitials } from '@/lib/utils/formatters';

export default function KioskPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // State
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [isCreateMemberOpen, setIsCreateMemberOpen] = useState(false);
  const [isAnonymousCheckinOpen, setIsAnonymousCheckinOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [suggestedMembers, setSuggestedMembers] = useState([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [alreadyRSVPMembers, setAlreadyRSVPMembers] = useState([]);
  const [newMember, setNewMember] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    notes: ''
  });
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [sessionStartTime] = useState(new Date());

  // Load events
  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const organizationId = await getCurrentUserOrganizationId();
      
      const { data: eventsData, error } = await supabase
        .from('events')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .limit(10);

      if (error) throw error;
      setEvents(eventsData || []);
    } catch (error) {
      console.error('Error loading events:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load events."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEventClick = async (event) => {
    setSelectedEvent(event);
    setIsMemberDialogOpen(true);
    await loadMembersForEvent(event);
  };

  const loadMembersForEvent = async (event) => {
    try {
      const organizationId = await getCurrentUserOrganizationId();
      
      // Get all members
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('*')
        .eq('organization_id', organizationId)
        .order('firstname', { ascending: true });

      if (membersError) throw membersError;
      setMembers(membersData || []);

      // Get already attending members
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('event_attendance')
        .select(`
          member_id,
          status,
          members (
            id,
            firstname,
            lastname,
            email,
            image_url
          )
        `)
        .eq('event_id', event.id)
        .eq('status', 'attending');

      if (attendanceError) throw attendanceError;
      
      const attendingMembers = attendanceData
        .filter(record => record.members)
        .map(record => record.members);
      
      setAlreadyRSVPMembers(attendingMembers);

      // Get suggested members based on previous attendance
      if (event.is_recurring || event.recurrence_pattern) {
        const { data: previousAttendance, error: prevError } = await supabase
          .from('event_attendance')
          .select(`
            member_id,
            status,
            events!inner (
              id,
              title,
              event_type,
              start_date,
              is_recurring,
              recurrence_pattern
            )
          `)
          .eq('events.event_type', event.event_type)
          .eq('events.is_recurring', true)
          .gte('events.start_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

        if (!prevError && previousAttendance) {
          const attendanceCounts = {};
          previousAttendance.forEach(record => {
            const memberId = record.member_id;
            attendanceCounts[memberId] = (attendanceCounts[memberId] || 0) + 1;
          });

          const sortedMemberIds = Object.keys(attendanceCounts)
            .sort((a, b) => attendanceCounts[b] - attendanceCounts[a]);

          const topAttendees = sortedMemberIds
            .slice(0, 10)
            .map(memberId => membersData.find(m => m.id === memberId))
            .filter(Boolean);

          setSuggestedMembers(topAttendees);
        }
      }
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const handleMemberClick = async (member) => {
    try {
      const { error } = await supabase
        .from('event_attendance')
        .upsert({
          event_id: selectedEvent.id,
          member_id: member.id,
          status: 'attending'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `${member.firstname} ${member.lastname} has been checked in!`
      });

      // Refresh the member lists
      await loadMembersForEvent(selectedEvent);
    } catch (error) {
      console.error('Error adding member to event:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to check in member."
      });
    }
  };

  const handleCreateMember = async () => {
    try {
      const organizationId = await getCurrentUserOrganizationId();
      
      // Create the member
      const { data: newMemberData, error: memberError } = await supabase
        .from('members')
        .insert({
          ...newMember,
          organization_id: organizationId
        })
        .select()
        .single();

      if (memberError) throw memberError;

      // Add to event attendance
      const { error: attendanceError } = await supabase
        .from('event_attendance')
        .insert({
          event_id: selectedEvent.id,
          member_id: newMemberData.id,
          status: 'attending'
        });

      if (attendanceError) throw attendanceError;

      toast({
        title: "Success",
        description: `${newMember.firstname} ${newMember.lastname} has been created and checked in!`
      });

      // Reset form and close dialog
      setNewMember({
        firstname: '',
        lastname: '',
        email: '',
        phone: '',
        notes: ''
      });
      setIsCreateMemberOpen(false);

      // Refresh the member lists
      await loadMembersForEvent(selectedEvent);
    } catch (error) {
      console.error('Error creating member:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create member."
      });
    }
  };

  const handleAnonymousCheckin = async () => {
    try {
      const { error } = await supabase
        .from('event_attendance')
        .insert({
          event_id: selectedEvent.id,
          member_id: null,
          anonymous_name: 'Anonymous',
          status: 'attending'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Anonymous attendee has been checked in!"
      });

      setIsAnonymousCheckinOpen(false);

      // Refresh the member lists
      await loadMembersForEvent(selectedEvent);
    } catch (error) {
      console.error('Error adding anonymous attendee:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to check in anonymous attendee."
      });
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      const { error } = await supabase
        .from('event_attendance')
        .delete()
        .eq('event_id', selectedEvent.id)
        .eq('member_id', memberId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Member has been removed from the event."
      });

      // Refresh the member lists
      await loadMembersForEvent(selectedEvent);
      setShowRemoveConfirm(false);
      setMemberToRemove(null);
    } catch (error) {
      console.error('Error removing member from event:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove member from event."
      });
    }
  };

  const confirmRemoveMember = (member) => {
    setMemberToRemove(member);
    setShowRemoveConfirm(true);
  };

  const handleCloseDialog = () => {
    setIsMemberDialogOpen(false);
    setIsCreateMemberOpen(false);
    setIsAnonymousCheckinOpen(false);
    setSelectedEvent(null);
    setMembers([]);
    setSuggestedMembers([]);
    setAlreadyRSVPMembers([]);
    setMemberSearchQuery('');
  };

  return (
    <div className="fixed inset-0 bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Check-In Kiosk</h1>
            <p className="text-blue-100 text-lg mt-2">Select an event to check in attendees</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-blue-100 text-sm">Session Active</p>
              <p className="text-white text-xs">
                {Math.floor((new Date() - sessionStartTime) / 1000 / 60)}m {Math.floor((new Date() - sessionStartTime) / 1000) % 60}s
              </p>
            </div>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowExitConfirm(true)}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <X className="mr-2 h-5 w-5" />
              Exit Kiosk
            </Button>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="max-w-6xl mx-auto p-6 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card 
                key={event.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow p-6"
                onClick={() => handleEventClick(event)}
              >
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="text-xl font-bold text-gray-900">
                    {event.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {format(new Date(event.start_date), 'EEEE, MMMM d, yyyy')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <Clock className="h-4 w-4" />
                    {format(new Date(event.start_date), 'h:mm a')}
                    {event.end_date && (
                      <>
                        {' - '}
                        {format(new Date(event.end_date), 'h:mm a')}
                      </>
                    )}
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                      <MapPin className="h-4 w-4" />
                      {event.location}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge variant={event.attendance_type === 'check-in' ? 'default' : 'secondary'}>
                      {event.attendance_type === 'check-in' ? 'Check-In' : 'RSVP'}
                    </Badge>
                    {event.event_type && (
                      <Badge variant="outline">
                        {event.event_type}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No upcoming events</h3>
            <p className="text-gray-500">No events available for check-in at this time.</p>
          </div>
        )}
      </div>

      {/* Member Selection Dialog */}
      <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
        <DialogContent className="w-[95vw] max-w-full h-[90vh] md:h-auto md:max-w-4xl p-0 z-50">
          <DialogHeader className="p-4 md:p-6 border-b">
            <div className="space-y-2">
              <DialogTitle className="text-xl md:text-2xl lg:text-3xl">
                Check In People - {selectedEvent?.title}
              </DialogTitle>
              {suggestedMembers.length > 0 && (
                <div className="flex items-center gap-3">
                  <Star className="h-6 w-6 md:h-7 md:w-7 text-green-600" />
                  <span className="text-lg md:text-xl text-green-600 font-normal">
                    Smart suggestions available
                  </span>
                </div>
              )}
            </div>
            <DialogDescription className="text-lg md:text-xl mt-4">
              Check In People for the event
            </DialogDescription>
            {suggestedMembers.length > 0 && (
              <div className="mt-3 text-sm md:text-base text-green-600">
                Members who frequently attend similar events are highlighted below
              </div>
            )}
          </DialogHeader>

          <div className="p-6 md:p-8 flex-1 overflow-hidden">
            <Tabs defaultValue="available" className="w-full h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2 h-14 md:h-16">
                <TabsTrigger value="available" className="text-lg md:text-xl">
                  Available People
                </TabsTrigger>
                <TabsTrigger value="checked-in" className="text-lg md:text-xl">
                  Checked In
                </TabsTrigger>
              </TabsList>

              <TabsContent value="available" className="mt-6 md:mt-8 flex-1 overflow-y-auto">
                <div className="space-y-6 md:space-y-8">
                  <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                    <div className="flex-1">
                      <Input
                        placeholder="Search people..."
                        value={memberSearchQuery}
                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                        className="w-full h-16 md:h-20 text-lg md:text-xl"
                      />
                    </div>
                    <Button
                      onClick={() => setIsCreateMemberOpen(true)}
                      className="w-full md:w-auto h-16 md:h-20 text-lg md:text-xl bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="mr-2 md:mr-3 h-5 w-5 md:h-6 md:w-6" />
                      Add New Person
                    </Button>
                    {selectedEvent?.attendance_type === 'check-in' && (
                      <Button
                        onClick={() => setIsAnonymousCheckinOpen(true)}
                        className="w-full md:w-auto h-16 md:h-20 text-lg md:text-xl bg-orange-600 hover:bg-orange-700"
                      >
                        <UserPlus className="mr-2 md:mr-3 h-5 w-5 md:h-6 md:w-6" />
                        Anonymous Check-in
                      </Button>
                    )}
                  </div>

                  {/* Suggested Members */}
                  {suggestedMembers.length > 0 && (
                    <div className="mb-6 md:mb-8">
                      <h3 className="text-xl md:text-2xl font-bold text-green-700 mb-4 flex items-center gap-3">
                        <Star className="h-6 w-6 md:h-7 md:w-7" />
                        Suggested Based on Previous Attendance
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {suggestedMembers
                          .filter(member => 
                            member.firstname?.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                            member.lastname?.toLowerCase().includes(memberSearchQuery.toLowerCase())
                          )
                          .map((member) => (
                            <Button
                              key={member.id}
                              variant="outline"
                              onClick={() => handleMemberClick(member)}
                              className="h-20 md:h-24 text-left p-4 border-2 border-green-200 bg-green-50 hover:bg-green-100"
                            >
                              <div className="flex items-center space-x-3 w-full">
                                <Avatar className="h-12 w-12 flex-shrink-0">
                                  <AvatarImage src={member.image_url} />
                                  <AvatarFallback className="text-lg">
                                    {getInitials(member.firstname, member.lastname)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 text-left">
                                  <p className="text-lg font-bold">
                                    {member.firstname} {member.lastname}
                                  </p>
                                  <p className="text-sm text-green-600">
                                    Frequent attendee
                                  </p>
                                </div>
                                <Star className="h-5 w-5 text-green-600 flex-shrink-0" />
                              </div>
                            </Button>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* All Members */}
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold mb-4">All People</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {members
                        .filter(member => 
                          !suggestedMembers.find(s => s.id === member.id) &&
                          (member.firstname?.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                           member.lastname?.toLowerCase().includes(memberSearchQuery.toLowerCase()))
                        )
                        .map((member) => (
                          <Button
                            key={member.id}
                            variant="outline"
                            onClick={() => handleMemberClick(member)}
                            className="h-20 md:h-24 text-left p-4"
                          >
                            <div className="flex items-center space-x-3 w-full">
                              <Avatar className="h-12 w-12 flex-shrink-0">
                                <AvatarImage src={member.image_url} />
                                <AvatarFallback className="text-lg">
                                  {getInitials(member.firstname, member.lastname)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 text-left">
                                <p className="text-lg font-bold">
                                  {member.firstname} {member.lastname}
                                </p>
                              </div>
                            </div>
                          </Button>
                        ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="checked-in" className="mt-6 md:mt-8 flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {alreadyRSVPMembers.map((member) => (
                    <div
                      key={member.id}
                      className="h-20 md:h-24 p-4 border-2 border-green-200 bg-green-50 rounded-lg flex items-center space-x-3 relative"
                    >
                      <Avatar className="h-12 w-12 flex-shrink-0">
                        <AvatarImage src={member.image_url} />
                        <AvatarFallback className="text-lg">
                          {getInitials(member.firstname, member.lastname)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-lg font-bold">
                          {member.firstname} {member.lastname}
                        </p>
                        <p className="text-sm text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          Checked In
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => confirmRemoveMember(member)}
                        className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 absolute top-2 right-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="p-4 md:p-6 border-t">
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              className="w-full md:w-auto h-12 text-lg"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Member Dialog */}
      <Dialog open={isCreateMemberOpen} onOpenChange={setIsCreateMemberOpen}>
        <DialogContent className="w-[95vw] max-w-full h-[90vh] md:h-auto md:max-w-2xl p-0">
          <DialogHeader className="p-4 md:p-6 border-b">
            <DialogTitle className="text-xl md:text-2xl lg:text-3xl">Create New Person</DialogTitle>
            <DialogDescription className="text-lg mt-2">
              Add a new person and automatically check them in to this event.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 md:p-6 flex-1 overflow-y-auto">
            <form onSubmit={handleCreateMember} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstname" className="text-lg">First Name</Label>
                  <Input
                    id="firstname"
                    name="firstname"
                    value={newMember.firstname}
                    onChange={(e) => setNewMember({...newMember, firstname: e.target.value})}
                    className="h-12 text-lg"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastname" className="text-lg">Last Name</Label>
                  <Input
                    id="lastname"
                    name="lastname"
                    value={newMember.lastname}
                    onChange={(e) => setNewMember({...newMember, lastname: e.target.value})}
                    className="h-12 text-lg"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-lg">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                  className="h-12 text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-lg">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={newMember.phone}
                  onChange={(e) => setNewMember({...newMember, phone: e.target.value})}
                  className="h-12 text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-lg">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={newMember.notes}
                  onChange={(e) => setNewMember({...newMember, notes: e.target.value})}
                  className="h-24 text-lg"
                />
              </div>
            </form>
          </div>

          <DialogFooter className="p-4 md:p-6 border-t">
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                onClick={() => setIsCreateMemberOpen(false)}
                className="flex-1 h-12 text-lg"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateMember}
                className="flex-1 h-12 text-lg"
              >
                Create and Check In
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Anonymous Check-in Dialog */}
      <Dialog open={isAnonymousCheckinOpen} onOpenChange={setIsAnonymousCheckinOpen}>
        <DialogContent className="w-[95vw] max-w-full h-[90vh] md:h-auto md:max-w-md p-0">
          <DialogHeader className="p-4 md:p-6 border-b">
            <DialogTitle className="text-xl md:text-2xl lg:text-3xl">Anonymous Check-in</DialogTitle>
            <DialogDescription className="text-lg mt-2">
              Check in an anonymous attendee to {selectedEvent?.title}. This will update the event attendance count but won't create a member record.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 md:p-6 flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center w-16 h-16 mx-auto bg-orange-100 rounded-full">
                <UserPlus className="h-8 w-8 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Add Anonymous Attendee
                </h3>
                <p className="text-base text-gray-600">
                  This will add one anonymous attendee to the event attendance count.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 md:p-6 border-t">
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                onClick={() => setIsAnonymousCheckinOpen(false)}
                className="flex-1 h-12 text-lg"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAnonymousCheckin}
                className="flex-1 h-12 text-lg bg-orange-600 hover:bg-orange-700"
              >
                <UserPlus className="mr-2 h-5 w-5" />
                Add Anonymous Attendee
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exit Confirmation Dialog */}
      <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <DialogContent className="w-[90vw] max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-xl">Exit Kiosk Mode?</DialogTitle>
            <DialogDescription className="text-base mt-2">
              Are you sure you want to exit kiosk mode? This will return you to the main application.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                onClick={() => setShowExitConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => navigate('/events')}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Exit Kiosk
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation Dialog */}
      <Dialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
        <DialogContent className="w-[90vw] max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-xl">Remove from Event?</DialogTitle>
            <DialogDescription className="text-base mt-2">
              Are you sure you want to remove {memberToRemove?.firstname} {memberToRemove?.lastname} from this event? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRemoveConfirm(false);
                  setMemberToRemove(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleRemoveMember(memberToRemove?.id)}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Remove
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
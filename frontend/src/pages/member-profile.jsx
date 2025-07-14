import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Edit, 
  ArrowLeft,
  Users,
  Clock,
  Church,
  User,
  Baby,
  Trash2,
  Plus,
  Calendar as CalendarIcon,
  Crown,
  Heart,
  Shield,
  FileText,
  CheckCircle,
  XCircle,
  DollarSign,
  MessageSquare,
  Hash,
  Handshake
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getMembers, getMemberAttendance, getMemberGroups, getMemberVolunteers, updateMember, deleteMember } from '../lib/data';
import { familyService } from '../lib/familyService';
import MemberForm from '@/components/members/MemberForm';
import { formatName, getInitials, formatPhoneNumber } from '@/lib/utils/formatters';
import { supabase } from '@/lib/supabase';
import { getDonations } from '@/lib/donationService';

// Animation variants
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

export default function MemberProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [member, setMember] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(true);
  const [isGroupsLoading, setIsGroupsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRetroCheckInOpen, setIsRetroCheckInOpen] = useState(false);
  const [pastEvents, setPastEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEventsLoading, setIsEventsLoading] = useState(false);
  const [familyInfo, setFamilyInfo] = useState(null);
  const [isFamilyLoading, setIsFamilyLoading] = useState(true);
  const [guardians, setGuardians] = useState([]);
  const [isGuardiansLoading, setIsGuardiansLoading] = useState(false);
  const [volunteers, setVolunteers] = useState([]);
  const [isVolunteersLoading, setIsVolunteersLoading] = useState(true);
  const [donations, setDonations] = useState([]);
  const [isDonationsLoading, setIsDonationsLoading] = useState(true);

  useEffect(() => {
    loadMemberData();
  }, [id]);

  const loadMemberData = async () => {
    try {
      const members = await getMembers();
      const foundMember = members.find(m => m.id === id);
      if (foundMember) {
        setMember(foundMember);
        loadAttendance(foundMember.id);
        loadGroups(foundMember.id);
        loadFamilyInfo(foundMember.id);
        loadVolunteers(foundMember.id);
        loadDonations(foundMember.id);
        if (foundMember.member_type === 'child') {
          loadGuardians(foundMember.id);
        }
      } else {
        toast({
          title: "Error",
          description: "Person not found",
          variant: "destructive",
        });
        navigate('/members');
      }
    } catch (error) {
      console.error('Error loading person:', error);
      toast({
        title: "Error",
        description: "Failed to load person data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAttendance = async (memberId) => {
    setIsAttendanceLoading(true);
    try {
      const data = await getMemberAttendance(memberId);
      setAttendance(data);
    } catch (error) {
      console.error('Error loading attendance:', error);
      toast({
        title: "Error",
        description: "Failed to load attendance history",
        variant: "destructive",
      });
    } finally {
      setIsAttendanceLoading(false);
    }
  };

  const loadGroups = async (memberId) => {
    setIsGroupsLoading(true);
    try {
      const data = await getMemberGroups(memberId);
      setGroups(data);
    } catch (error) {
      console.error('Error loading groups:', error);
      toast({
        title: "Error",
        description: "Failed to load group memberships",
        variant: "destructive",
      });
    } finally {
      setIsGroupsLoading(false);
    }
  };

  const loadVolunteers = async (memberId) => {
    setIsVolunteersLoading(true);
    try {
      const data = await getMemberVolunteers(memberId);
      setVolunteers(data);
    } catch (error) {
      console.error('Error loading volunteers:', error);
      toast({
        title: "Error",
        description: "Failed to load volunteer history",
        variant: "destructive",
      });
    } finally {
      setIsVolunteersLoading(false);
    }
  };

  const loadDonations = async (memberId) => {
    setIsDonationsLoading(true);
    try {
      const data = await getDonations({ donorId: memberId });
      setDonations(data);
    } catch (error) {
      console.error('Error loading donations:', error);
      toast({
        title: "Error",
        description: "Failed to load donation history",
        variant: "destructive",
      });
    } finally {
      setIsDonationsLoading(false);
    }
  };

  const loadFamilyInfo = async (memberId) => {
    setIsFamilyLoading(true);
    try {
      // Get all families and find which one contains this member
      const families = await familyService.getFamilies();
      const memberFamily = families.find(family => 
        family.members.some(member => member.id === memberId)
      );
      setFamilyInfo(memberFamily);
    } catch (error) {
      console.error('Error loading family info:', error);
      toast({
        title: "Error",
        description: "Failed to load family information",
        variant: "destructive",
      });
    } finally {
      setIsFamilyLoading(false);
    }
  };

  const loadGuardians = async (childId) => {
    setIsGuardiansLoading(true);
    try {
      const { data: guardianRelationships, error } = await supabase
        .from('child_guardians')
        .select(`
          guardian_id,
          relationship,
          is_primary,
          guardians:guardian_id (
            id,
            firstname,
            lastname,
            email,
            phone,
            image_url
          )
        `)
        .eq('child_id', childId);

      if (error) throw error;

      const guardianData = guardianRelationships.map(rel => ({
        id: rel.guardians.id,
        firstname: rel.guardians.firstname,
        lastname: rel.guardians.lastname,
        email: rel.guardians.email,
        phone: rel.guardians.phone,
        image_url: rel.guardians.image_url,
        relationship: rel.relationship,
        is_primary: rel.is_primary
      }));

      setGuardians(guardianData);
    } catch (error) {
      console.error('Error loading guardians:', error);
      toast({
        title: "Error",
        description: "Failed to load guardian information",
        variant: "destructive",
      });
    } finally {
      setIsGuardiansLoading(false);
    }
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const loadPastEvents = async () => {
    setIsEventsLoading(true);
    try {
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .lt('start_date', new Date().toISOString())
        .eq('attendance_type', 'check-in')
        .order('start_date', { ascending: false });

      if (error) throw error;

      // Filter out events the member has already attended
      const attendedEventIds = attendance.map(a => a.events.id);
      const availableEvents = events.filter(event => !attendedEventIds.includes(event.id));
      setPastEvents(availableEvents);
    } catch (error) {
      console.error('Error loading past events:', error);
      toast({
        title: "Error",
        description: "Failed to load past events",
        variant: "destructive",
      });
    } finally {
      setIsEventsLoading(false);
    }
  };

  const handleRetroCheckIn = async () => {
    if (!selectedEvent || !member) return;

    try {
      const { error } = await supabase
        .from('event_attendance')
        .insert({
          event_id: selectedEvent.id,
          member_id: member.id,
          status: 'checked-in'
        });

      if (error) throw error;

      // Refresh attendance data
      await loadAttendance(member.id);
      
      // Remove the event from available past events
      setPastEvents(prev => prev.filter(e => e.id !== selectedEvent.id));
      
      // Close dialog and reset selection
      setIsRetroCheckInOpen(false);
      setSelectedEvent(null);

      toast({
        title: "Success",
        description: `Successfully checked in to ${selectedEvent.title}`
      });
    } catch (error) {
      console.error('Error checking in:', error);
      toast({
        title: "Error",
        description: "Failed to check in to event",
        variant: "destructive",
      });
    }
  };

  const handleEditMember = async (memberData) => {
    try {
      const updatedMember = await updateMember(member.id, memberData);
      setMember(updatedMember);
      setIsEditDialogOpen(false);
      toast({
        title: "Success",
        description: "Member updated successfully"
      });
    } catch (error) {
      console.error('Error updating member:', error);
      toast({
        title: "Error",
        description: "Failed to update member",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMember = async () => {
    try {
      await deleteMember(member.id);
      setIsDeleteDialogOpen(false);
      toast({
        title: "Success",
        description: "Member deleted successfully"
      });
      navigate('/members');
    } catch (error) {
      console.error('Error deleting member:', error);
      toast({
        title: "Error",
        description: "Failed to delete member",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!member) {
    return null;
  }

  return (
    <motion.div 
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero Header Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-background"></div>
        <div className="relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/members')}
                className="hover:bg-muted/50 transition-colors flex-shrink-0"
          >
                <ArrowLeft className="h-5 w-5" />
          </Button>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent truncate">
                  {formatName(member.firstname, member.lastname)}
                </h1>
                <p className="text-muted-foreground mt-2 text-base sm:text-lg">
                  Member Profile & Information
            </p>
          </div>
        </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => setIsEditDialogOpen(true)}
                className="shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex-1 sm:flex-none"
          >
            <Edit className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Edit Profile</span>
                <span className="sm:hidden">Edit</span>
          </Button>
          <Button
            variant="outline"
                className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex-1 sm:flex-none"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Delete</span>
                <span className="sm:hidden">Delete</span>
          </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview Cards */}
      <motion.div 
        className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        variants={itemVariants}
      >
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800 shadow-lg hover:shadow-xl transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Attendance</CardTitle>
            <div className="h-8 w-8 bg-green-500 rounded-lg flex items-center justify-center">
              <Church className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {attendance.length}
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              Events attended
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800 shadow-lg hover:shadow-xl transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Giving</CardTitle>
            <div className="h-8 w-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
              {donations.length}
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
              Total gifts
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800 shadow-lg hover:shadow-xl transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Groups</CardTitle>
            <div className="h-8 w-8 bg-purple-500 rounded-lg flex items-center justify-center">
              <Users className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {groups.length}
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              Group memberships
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800 shadow-lg hover:shadow-xl transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">Volunteering</CardTitle>
            <div className="h-8 w-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Handshake className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {volunteers.length}
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
              Volunteer roles
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-background via-background to-muted/20">
              <div className="relative h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent"></div>
              </div>
              <CardHeader className="pb-6 relative">
                <div className="flex flex-col items-center text-center -mt-16">
                  <div className="relative mb-6">
                    <div className="relative">
                      <Avatar className="h-32 w-32 ring-8 ring-background shadow-2xl">
                  <AvatarImage src={member.image_url} />
                        <AvatarFallback className="text-4xl font-bold bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                    {getInitials(member.firstname, member.lastname)}
                  </AvatarFallback>
                </Avatar>
                      <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-background flex items-center justify-center shadow-lg">
                        <div className="w-4 h-4 bg-white rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
                    {formatName(member.firstname, member.lastname)}
                  </CardTitle>
                  <div className="flex flex-wrap gap-2 justify-center mb-4">
                    <Badge 
                      variant={member.status === 'active' ? 'default' : 'secondary'} 
                      className="font-semibold shadow-sm text-sm px-3 py-1"
                    >
                    {member.status}
                  </Badge>
                  {member.member_type === 'child' ? (
                      <Badge variant="secondary" className="text-xs font-semibold shadow-sm px-3 py-1">
                        <Baby className="w-3 h-3 mr-1" />
                        Child
                      </Badge>
                  ) : (
                      <Badge variant="outline" className="text-xs font-semibold shadow-sm px-3 py-1">
                        <User className="w-3 h-3 mr-1" />
                        Adult
                      </Badge>
                  )}
                  {member.role !== 'member' && (
                      <Badge variant="outline" className="text-xs capitalize font-semibold shadow-sm px-3 py-1">
                        <Crown className="w-3 h-3 mr-1" />
                        {member.role}
                      </Badge>
                  )}
                </div>
                {member.occupation && (
                    <div className="bg-muted/50 px-4 py-2 rounded-full">
                      <p className="text-sm text-muted-foreground font-medium">
                        {member.occupation}
                      </p>
                    </div>
                )}
              </div>
            </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                {/* Contact Information */}
                {(member.email || member.phone) && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Contact Information
                    </h4>
                    <div className="space-y-3">
                {member.email && (
                        <div className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 hover:shadow-md transition-all duration-200">
                          <Mail className="mr-3 h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-900 dark:text-blue-100">{member.email}</span>
                  </div>
                )}
                {member.phone && (
                        <div className="flex items-center p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 rounded-xl border border-green-200 dark:border-green-800 hover:shadow-md transition-all duration-200">
                          <Phone className="mr-3 h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-900 dark:text-green-100">{formatPhoneNumber(member.phone)}</span>
                  </div>
                )}
                    </div>
                  </div>
                )}

                {/* Personal Information */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Personal Information
                  </h4>
                  <div className="space-y-3">
                  {member.gender && (
                      <div className="flex items-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                        <User className="mr-3 h-4 w-4 text-purple-600" />
                        <span className="font-medium text-purple-900 dark:text-purple-100 capitalize">{member.gender}</span>
                    </div>
                  )}
                  {member.birth_date && (
                      <div className="flex items-center p-4 bg-gradient-to-r from-pink-50 to-pink-100 dark:from-pink-950/20 dark:to-pink-900/20 rounded-xl border border-pink-200 dark:border-pink-800">
                        <CalendarIcon className="mr-3 h-4 w-4 text-pink-600" />
                        <div>
                          <span className="font-medium text-pink-900 dark:text-pink-100">Birth: {format(new Date(member.birth_date), 'MMM d, yyyy')}</span>
                          {calculateAge(member.birth_date) && (
                            <div className="text-sm text-pink-600 dark:text-pink-400">({calculateAge(member.birth_date)} years old)</div>
                          )}
                        </div>
                    </div>
                  )}
                  {member.join_date && (
                      <div className="flex items-center p-4 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                        <Calendar className="mr-3 h-4 w-4 text-orange-600" />
                        <span className="font-medium text-orange-900 dark:text-orange-100">Joined: {format(new Date(member.join_date), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  </div>
                </div>

                {/* Address Information */}
                {member.address && member.address.street && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Address
                    </h4>
                    <div className="p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-950/20 dark:to-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
                      <div className="flex items-start">
                        <MapPin className="mr-3 h-4 w-4 text-indigo-600 mt-0.5" />
                        <div className="space-y-1">
                          <div className="font-medium text-indigo-900 dark:text-indigo-100">{member.address.street}</div>
                          <div className="text-indigo-600 dark:text-indigo-400">
                          {[
                        member.address.city,
                        member.address.state,
                        member.address.zip
                      ].filter(Boolean).join(', ')}
                  </div>
                        {member.address.country && (
                            <div className="text-indigo-600 dark:text-indigo-400">{member.address.country}</div>
                )}
                        </div>
                </div>
              </div>
                  </div>
                )}

                {/* Communication Preferences */}
                {member.communication_preferences && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Communication Preferences
                    </h4>
                    <div className="p-4 bg-gradient-to-r from-teal-50 to-teal-100 dark:from-teal-950/20 dark:to-teal-900/20 rounded-xl border border-teal-200 dark:border-teal-800">
                    <div className="flex flex-wrap gap-2">
                      {member.communication_preferences.sms && (
                          <Badge variant="default" className="text-xs font-medium shadow-sm bg-teal-500 hover:bg-teal-600">
                            <MessageSquare className="w-3 h-3 mr-1" />
                            SMS
                          </Badge>
                      )}
                      {member.communication_preferences.email && (
                          <Badge variant="default" className="text-xs font-medium shadow-sm bg-blue-500 hover:bg-blue-600">
                            <Mail className="w-3 h-3 mr-1" />
                            Email
                          </Badge>
                      )}
                      {member.communication_preferences.mail && (
                          <Badge variant="default" className="text-xs font-medium shadow-sm bg-gray-500 hover:bg-gray-600">
                            <FileText className="w-3 h-3 mr-1" />
                            Mail
                          </Badge>
                      )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Ministry Involvement */}
                {member.ministry_involvement && member.ministry_involvement.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                      <Church className="h-4 w-4" />
                      Ministry Involvement
                    </h4>
                    <div className="p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-950/20 dark:to-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                    <div className="flex flex-wrap gap-2">
                      {member.ministry_involvement.map((ministry, index) => (
                          <Badge key={index} variant="secondary" className="text-xs font-medium shadow-sm bg-yellow-500 text-yellow-900">
                            {ministry}
                          </Badge>
                      ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tags */}
                {member.tags && member.tags.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      Tags
                    </h4>
                    <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-950/20 dark:to-gray-900/20 rounded-xl border border-gray-200 dark:border-gray-800">
                    <div className="flex flex-wrap gap-2">
                      {member.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs font-medium shadow-sm">
                            {tag}
                          </Badge>
                      ))}
                      </div>
                    </div>
                  </div>
                )}

              {/* Family Information for Adults */}
              {member.member_type === 'adult' && (member.marital_status || member.spouse_name || member.anniversary_date) && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Family Information
                    </h4>
                    <div className="p-4 bg-gradient-to-r from-pink-50 to-pink-100 dark:from-pink-950/20 dark:to-pink-900/20 rounded-xl border border-pink-200 dark:border-pink-800">
                      <div className="space-y-3">
                    {member.marital_status && (
                          <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-pink-900/20 rounded-lg">
                            <Heart className="h-4 w-4 text-pink-600" />
                            <span className="font-medium text-pink-900 dark:text-pink-100 capitalize">{member.marital_status}</span>
                      </div>
                    )}
                    {member.spouse_name && (
                          <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-pink-900/20 rounded-lg">
                            <User className="h-4 w-4 text-pink-600" />
                            <span className="font-medium text-pink-900 dark:text-pink-100">Spouse: {member.spouse_name}</span>
                      </div>
                    )}
                    {member.anniversary_date && (
                          <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-pink-900/20 rounded-lg">
                            <Calendar className="h-4 w-4 text-pink-600" />
                            <span className="font-medium text-pink-900 dark:text-pink-100">Anniversary: {format(new Date(member.anniversary_date), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                    {member.has_children && (
                          <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-pink-900/20 rounded-lg">
                            <Users className="h-4 w-4 text-pink-600" />
                            <span className="font-medium text-pink-900 dark:text-pink-100">Has Children</span>
                      </div>
                    )}
                      </div>
                  </div>
                </div>
              )}

              {/* Emergency Contact */}
              {member.emergency_contact && (member.emergency_contact.name || member.emergency_contact.phone) && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Emergency Contact
                    </h4>
                    <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                      <div className="space-y-3">
                    {member.emergency_contact.name && (
                          <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-red-900/20 rounded-lg">
                            <Shield className="h-4 w-4 text-red-600" />
                            <span className="font-medium text-red-900 dark:text-red-100">{member.emergency_contact.name}</span>
                      </div>
                    )}
                    {member.emergency_contact.phone && (
                          <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-red-900/20 rounded-lg">
                            <Phone className="h-4 w-4 text-red-600" />
                            <span className="font-medium text-red-900 dark:text-red-100">{formatPhoneNumber(member.emergency_contact.phone)}</span>
                      </div>
                    )}
                    {member.emergency_contact.relationship && (
                          <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-red-900/20 rounded-lg">
                            <User className="h-4 w-4 text-red-600" />
                            <span className="font-medium text-red-900 dark:text-red-100 capitalize">{member.emergency_contact.relationship}</span>
                      </div>
                    )}
                      </div>
                  </div>
                </div>
              )}

              {/* Guardian Information for Children */}
              {member.member_type === 'child' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Guardians
                    </h4>
                    <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                  {isGuardiansLoading ? (
                        <div className="text-sm text-orange-700 dark:text-orange-300">Loading guardians...</div>
                  ) : guardians.length > 0 ? (
                    <div className="space-y-3">
                      {guardians.map((guardian, index) => (
                            <div key={guardian.id} className="flex items-start gap-3 p-3 bg-white/50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={guardian.image_url} />
                            <AvatarFallback className="text-xs">
                              {getInitials(guardian.firstname, guardian.lastname)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <button
                                onClick={() => navigate(`/members/${guardian.id}`)}
                                className="font-medium text-orange-900 dark:text-orange-100 hover:text-orange-700 dark:hover:text-orange-300 text-sm transition-colors"
                              >
                                {guardian.firstname} {guardian.lastname}
                              </button>
                              {guardian.is_primary && (
                                <Badge variant="outline" className="text-xs">Primary</Badge>
                              )}
                            </div>
                            <div className="space-y-1 text-xs text-orange-700 dark:text-orange-300">
                              <div className="flex items-center gap-2">
                                <User className="h-3 w-3" />
                                <span className="capitalize">{guardian.relationship}</span>
                              </div>
                              {guardian.email && (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-3 w-3" />
                                  <span className="truncate">{guardian.email}</span>
                                </div>
                              )}
                              {guardian.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3 w-3" />
                                  <span>{formatPhoneNumber(guardian.phone)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                        <div className="text-sm text-orange-700 dark:text-orange-300">No guardians assigned</div>
                  )}
                    </div>
                </div>
              )}

              {/* Notes */}
              {member.notes && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Notes
                    </h4>
                    <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-950/20 dark:to-gray-900/20 rounded-xl border border-gray-200 dark:border-gray-800">
                      <p className="text-sm text-gray-700 dark:text-gray-300">{member.notes}</p>
                    </div>
                </div>
              )}
            </CardContent>
          </Card>
          </motion.div>
        </div>

        {/* Content Tabs */}
        <div className="lg:col-span-2">
          <motion.div variants={itemVariants}>
            <Tabs defaultValue="attendance" className="w-full">
              <TabsList className="mb-4 w-full h-auto min-h-[48px] bg-muted p-1 rounded-lg">
                <TabsTrigger
                  value="details"
                  className="flex-1 h-10 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">All Details</span>
                  <span className="sm:hidden">Details</span>
                </TabsTrigger>
                <TabsTrigger
                  value="attendance"
                  className="flex-1 h-10 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  <Church className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Attendance</span>
                  <span className="sm:hidden">Attend</span>
              </TabsTrigger>
                <TabsTrigger
                  value="giving"
                  className="flex-1 h-10 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Giving</span>
                  <span className="sm:hidden">Giving</span>
              </TabsTrigger>
                <TabsTrigger
                  value="groups"
                  className="flex-1 h-10 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Groups</span>
                  <span className="sm:hidden">Groups</span>
              </TabsTrigger>
                <TabsTrigger
                  value="family"
                  className="flex-1 h-10 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  <Heart className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Family</span>
                  <span className="sm:hidden">Family</span>
              </TabsTrigger>
                <TabsTrigger
                  value="volunteering"
                  className="flex-1 h-10 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  <Handshake className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Volunteering</span>
                  <span className="sm:hidden">Volunteer</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-muted/20 print:bg-white print:shadow-none">
                <CardHeader className="pb-6 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-b border-blue-200 dark:border-blue-800 print:bg-white print:border-none">
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent print:text-black">
                    All Member Details
                  </CardTitle>
                  <CardDescription className="text-blue-600 dark:text-blue-400 mt-1 print:text-black">
                    Complete information for {formatName(member.firstname, member.lastname)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-8 print:p-4">
                  {/* Basic Information */}
                  <section>
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-2 text-blue-900 dark:text-blue-100 print:text-black">
                      <User className="h-5 w-5" /> Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground print:text-black">Full Name:</div>
                        <div className="font-medium text-base print:font-normal">{formatName(member.firstname, member.lastname)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground print:text-black">Member Type:</div>
                        <div className="font-medium text-base print:font-normal capitalize">{member.member_type}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground print:text-black">Status:</div>
                        <div className="font-medium text-base print:font-normal capitalize">{member.status}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground print:text-black">Role:</div>
                        <div className="font-medium text-base print:font-normal capitalize">{member.role}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground print:text-black">Gender:</div>
                        <div className="font-medium text-base print:font-normal capitalize">{member.gender}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground print:text-black">Occupation:</div>
                        <div className="font-medium text-base print:font-normal">{member.occupation || '—'}</div>
                      </div>
                    </div>
                  </section>
                  {/* Important Dates */}
                  <section>
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-2 text-green-900 dark:text-green-100 print:text-black">
                      <Calendar className="h-5 w-5" /> Important Dates
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground print:text-black">Birth Date:</div>
                        <div className="font-medium text-base print:font-normal">
                          {member.birth_date ? `${format(new Date(member.birth_date), 'MMM d, yyyy')} (${calculateAge(member.birth_date)} years old)` : '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground print:text-black">Join Date:</div>
                        <div className="font-medium text-base print:font-normal">
                          {member.join_date ? format(new Date(member.join_date), 'MMM d, yyyy') : member.created_at ? format(new Date(member.created_at), 'MMM d, yyyy') : '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground print:text-black">Anniversary:</div>
                        <div className="font-medium text-base print:font-normal">
                          {member.anniversary_date ? format(new Date(member.anniversary_date), 'MMM d, yyyy') : '—'}
                        </div>
                      </div>
                    </div>
                  </section>
                  {/* Contact Information */}
                  <section>
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-2 text-green-900 dark:text-green-100 print:text-black">
                      <Mail className="h-5 w-5" /> Contact Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground print:text-black">Email:</div>
                        <div className="font-medium text-base print:font-normal">{member.email || '—'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground print:text-black">Phone:</div>
                        <div className="font-medium text-base print:font-normal">{member.phone ? formatPhoneNumber(member.phone) : '—'}</div>
                      </div>
                    </div>
                  </section>
                  {/* Address */}
                  <section>
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-2 text-purple-900 dark:text-purple-100 print:text-black">
                      <MapPin className="h-5 w-5" /> Address
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground print:text-black">Street:</div>
                        <div className="font-medium text-base print:font-normal">{member.address?.street || '—'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground print:text-black">City:</div>
                        <div className="font-medium text-base print:font-normal">{member.address?.city || '—'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground print:text-black">State:</div>
                        <div className="font-medium text-base print:font-normal">{member.address?.state || '—'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground print:text-black">ZIP:</div>
                        <div className="font-medium text-base print:font-normal">{member.address?.zip || '—'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground print:text-black">Country:</div>
                        <div className="font-medium text-base print:font-normal">{member.address?.country || '—'}</div>
                      </div>
                    </div>
                  </section>
                  {/* Family Information */}
                  <section>
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-2 text-pink-900 dark:text-pink-100 print:text-black">
                      <Heart className="h-5 w-5" /> Family Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground print:text-black">Marital Status:</div>
                        <div className="font-medium text-base print:font-normal capitalize">{member.marital_status || '—'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground print:text-black">Spouse:</div>
                        <div className="font-medium text-base print:font-normal">{member.spouse_name || '—'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground print:text-black">Has Children:</div>
                        <div className="font-medium text-base print:font-normal">{member.has_children ? 'Yes' : 'No'}</div>
                      </div>
                    </div>
                  </section>
                  {/* Communication Preferences */}
                  <section>
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-2 text-indigo-900 dark:text-indigo-100 print:text-black">
                      <MessageSquare className="h-5 w-5" /> Communication Preferences
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground print:text-black">SMS:</div>
                        <div className="font-medium text-base print:font-normal">{member.communication_preferences?.sms ? 'Enabled' : 'Disabled'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground print:text-black">Email:</div>
                        <div className="font-medium text-base print:font-normal">{member.communication_preferences?.email ? 'Enabled' : 'Disabled'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground print:text-black">Mail:</div>
                        <div className="font-medium text-base print:font-normal">{member.communication_preferences?.mail ? 'Enabled' : 'Disabled'}</div>
                      </div>
                    </div>
                  </section>
                  {/* Notes */}
                  {member.notes && (
                    <section>
                      <h3 className="text-lg font-semibold flex items-center gap-2 mb-2 text-gray-900 dark:text-gray-100 print:text-black">
                        <FileText className="h-5 w-5" /> Notes
                      </h3>
                      <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-950/20 dark:to-gray-900/20 rounded-xl border border-gray-200 dark:border-gray-800 print:bg-white print:border print:border-gray-300">
                        <p className="text-sm text-gray-700 dark:text-gray-300 print:text-black">{member.notes}</p>
                      </div>
                    </section>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-muted/20">
                <CardHeader className="pb-6 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-b border-green-200 dark:border-green-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0">
                      <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                        Attendance History
                      </CardTitle>
                      <CardDescription className="text-green-600 dark:text-green-400 mt-1">
                        View {member?.firstname}'s attendance records and engagement statistics
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      loadPastEvents();
                      setIsRetroCheckInOpen(true);
                    }}
                      className="bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Check In to Past Event</span>
                      <span className="sm:hidden">Check In</span>
                  </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {isAttendanceLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                      <p className="text-green-600 dark:text-green-400">Loading attendance history...</p>
                    </div>
                  ) : attendance.length > 0 ? (
                    <div className="space-y-8">
                      {/* Attendance by Event Type */}
                      <div>
                        <h3 className="text-xl font-semibold mb-6 text-green-900 dark:text-green-100 flex items-center gap-2">
                          <Church className="h-5 w-5" />
                          Attendance by Event Type
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {(() => {
                            const eventTypeStats = {};
                            attendance.forEach(record => {
                              const eventType = record.events.event_type || 'Other';
                              if (!eventTypeStats[eventType]) {
                                eventTypeStats[eventType] = {
                                  total: 0,
                                  attended: 0
                                };
                              }
                              eventTypeStats[eventType].total++;
                              if (record.status === 'attended' || record.status === 'checked-in') {
                                eventTypeStats[eventType].attended++;
                              }
                            });

                            return Object.entries(eventTypeStats).map(([eventType, stats]) => (
                              <Card key={eventType} className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800 shadow-lg hover:shadow-xl transition-all duration-200">
                                <CardContent className="p-6">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h4 className="font-semibold text-green-900 dark:text-green-100 capitalize text-lg">{eventType}</h4>
                                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                                        {stats.attended} of {stats.total} events
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <CheckCircle className="h-6 w-6 text-green-600" />
                                      <span className="text-2xl font-bold text-green-600">{stats.attended}</span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ));
                          })()}
                        </div>
                      </div>

                      {/* Volunteer Statistics */}
                      {volunteers.length > 0 && (
                        <div>
                          <h3 className="text-xl font-semibold mb-6 text-orange-900 dark:text-orange-100 flex items-center gap-2">
                            <Heart className="h-5 w-5" />
                            Volunteer History
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(() => {
                              const volunteerTypeStats = {};
                              volunteers.forEach(record => {
                                const eventType = record.events.event_type || 'Other';
                                if (!volunteerTypeStats[eventType]) {
                                  volunteerTypeStats[eventType] = {
                                    total: 0,
                                    roles: {}
                                  };
                                }
                                volunteerTypeStats[eventType].total++;
                                if (record.role) {
                                  volunteerTypeStats[eventType].roles[record.role] = 
                                    (volunteerTypeStats[eventType].roles[record.role] || 0) + 1;
                                }
                              });

                              return Object.entries(volunteerTypeStats).map(([eventType, stats]) => (
                                <Card key={eventType} className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800 shadow-lg hover:shadow-xl transition-all duration-200">
                                  <CardContent className="p-6">
                                    <div className="space-y-4">
                                      <div className="flex items-center justify-between">
                                        <h4 className="font-semibold text-orange-900 dark:text-orange-100 capitalize text-lg">{eventType}</h4>
                                        <div className="flex items-center gap-2">
                                          <Heart className="h-6 w-6 text-orange-600" />
                                          <span className="text-2xl font-bold text-orange-600">{stats.total}</span>
                                        </div>
                                      </div>
                                      
                                      {Object.keys(stats.roles).length > 0 && (
                                        <div className="space-y-1">
                                          {Object.entries(stats.roles).map(([role, count]) => (
                                            <div key={role} className="flex items-center justify-between text-sm">
                                              <span className="text-muted-foreground capitalize">{role}</span>
                                              <span className="font-medium">{count}</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              ));
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Recent Attendance */}
                      <div>
                        <h3 className="text-xl font-semibold mb-6 text-green-900 dark:text-green-100 flex items-center gap-2">
                          <Clock className="h-5 w-5" />
                          Recent Attendance
                        </h3>
                    <div className="space-y-4">
                          {attendance.slice(0, 10).map((record) => (
                            <Card key={record.id} className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-200">
                              <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                  <div className="space-y-2">
                                    <p className="font-semibold text-green-900 dark:text-green-100 text-lg">{record.events.title}</p>
                                    <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                                  <Calendar className="h-4 w-4 mr-2" />
                                  {format(new Date(record.events.start_date), 'MMM d, yyyy • h:mm a')}
                                </div>
                                {record.events.location && (
                                      <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                                    <MapPin className="h-4 w-4 mr-2" />
                                    {record.events.location}
                                  </div>
                                )}
                              </div>
                                  {volunteers.some(v => v.event_id === record.events.id) && (
                                    <Badge className="bg-orange-500 hover:bg-orange-600 text-white shadow-sm">
                                      <Heart className="h-3 w-3 mr-1" />
                                      Volunteered
                              </Badge>
                                  )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                        </div>
                        {attendance.length > 10 && (
                          <div className="text-center mt-6">
                            <p className="text-sm text-green-600 dark:text-green-400">
                              Showing 10 of {attendance.length} events
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="h-16 w-16 text-green-400 mx-auto mb-4" />
                      <p className="text-green-900 dark:text-green-100 text-lg font-semibold mb-2">No attendance records found</p>
                      <p className="text-green-600 dark:text-green-400">
                        {member?.firstname} hasn't attended any events yet.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="giving">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-muted/20">
                <CardHeader className="pb-6 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 border-b border-emerald-200 dark:border-emerald-800">
                  <div>
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
                      Giving History
                    </CardTitle>
                    <CardDescription className="text-emerald-600 dark:text-emerald-400 mt-1">
                      View {member?.firstname}'s donation records and financial engagement
                  </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {isDonationsLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                      <p className="text-emerald-600 dark:text-emerald-400">Loading giving history...</p>
                    </div>
                  ) : donations.length > 0 ? (
                    <div className="space-y-8">
                      {/* Giving Statistics */}
                      <div>
                        <h3 className="text-xl font-semibold mb-6 text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
                          <DollarSign className="h-5 w-5" />
                          Giving Statistics
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          {(() => {
                            const totalAmount = donations.reduce((sum, donation) => sum + (donation.amount || 0), 0);
                            const thisYear = new Date().getFullYear();
                            const thisYearDonations = donations.filter(d => 
                              new Date(d.date).getFullYear() === thisYear
                            );
                            const thisYearAmount = thisYearDonations.reduce((sum, donation) => sum + (donation.amount || 0), 0);
                            const averageDonation = donations.length > 0 ? totalAmount / donations.length : 0;
                            const fundDesignations = [...new Set(donations.map(d => d.fund_designation).filter(Boolean))];

                            return (
                              <>
                                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800 shadow-lg hover:shadow-xl transition-all duration-200">
                                  <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Total Given</p>
                                        <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                                          ${totalAmount.toLocaleString()}
                                        </p>
                                      </div>
                                      <DollarSign className="h-8 w-8 text-emerald-600" />
                                    </div>
                                  </CardContent>
                                </Card>
                                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800 shadow-lg hover:shadow-xl transition-all duration-200">
                                  <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">This Year</p>
                                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                          ${thisYearAmount.toLocaleString()}
                                        </p>
                                      </div>
                                      <Calendar className="h-8 w-8 text-blue-600" />
                                    </div>
                                  </CardContent>
                                </Card>
                                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800 shadow-lg hover:shadow-xl transition-all duration-200">
                                  <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Average Gift</p>
                                        <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                                          ${averageDonation.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                        </p>
                                      </div>
                                      <Heart className="h-8 w-8 text-purple-600" />
                                    </div>
                                  </CardContent>
                                </Card>
                                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800 shadow-lg hover:shadow-xl transition-all duration-200">
                                  <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Total Gifts</p>
                                        <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                                          {donations.length}
                                        </p>
                                      </div>
                                      <FileText className="h-8 w-8 text-orange-600" />
                                    </div>
                                  </CardContent>
                                </Card>
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Giving by Fund Designation */}
                      {(() => {
                        const fundStats = {};
                        donations.forEach(donation => {
                          const fund = donation.fund_designation || 'General';
                          if (!fundStats[fund]) {
                            fundStats[fund] = { total: 0, count: 0 };
                          }
                          fundStats[fund].total += donation.amount || 0;
                          fundStats[fund].count += 1;
                        });

                        return Object.keys(fundStats).length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold mb-4">Giving by Fund</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {Object.entries(fundStats).map(([fund, stats]) => (
                                <Card key={fund}>
                                  <CardContent className="p-4">
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <h4 className="font-medium">{fund}</h4>
                                        <DollarSign className="h-4 w-4 text-green-600" />
                                      </div>
                                      <div className="text-2xl font-bold text-green-600">
                                        ${stats.total.toLocaleString()}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        {stats.count} gift{stats.count !== 1 ? 's' : ''}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Recent Donations */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Recent Donations</h3>
                        <div className="space-y-4">
                          {donations.slice(0, 10).map((donation) => (
                            <Card key={donation.id}>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium">
                                        ${donation.amount?.toLocaleString()}
                                      </p>
                                      {donation.fund_designation && (
                                        <Badge variant="outline" className="text-xs">
                                          {donation.fund_designation}
                                        </Badge>
                                      )}
                                      {donation.campaign && (
                                        <Badge variant="secondary" className="text-xs">
                                          {donation.campaign.name}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center text-sm text-muted-foreground">
                                      <Calendar className="h-4 w-4 mr-2" />
                                      {format(new Date(donation.date), 'MMM d, yyyy')}
                                    </div>
                                    {donation.payment_method && (
                                      <div className="flex items-center text-sm text-muted-foreground">
                                        <DollarSign className="h-4 w-4 mr-2" />
                                        {donation.payment_method}
                                      </div>
                                    )}
                                    {donation.notes && (
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {donation.notes}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {donation.payment_method === 'Check' && donation.check_number && (
                                      <Badge variant="outline" className="text-xs">
                                        #{donation.check_number}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                        {donations.length > 10 && (
                          <div className="text-center mt-4">
                            <p className="text-sm text-muted-foreground">
                              Showing 10 of {donations.length} donations
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-2">No donation records found</p>
                      <p className="text-sm text-muted-foreground">
                        {member?.firstname} {member?.lastname} hasn't made any donations yet.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="groups">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-muted/20">
                <CardHeader className="pb-6 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-b border-purple-200 dark:border-purple-800">
                  <div>
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
                      Group Memberships
                    </CardTitle>
                    <CardDescription className="text-purple-600 dark:text-purple-400 mt-1">
                      View {member?.firstname}'s group involvement and community connections
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {isGroupsLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                      <p className="text-purple-600 dark:text-purple-400">Loading group memberships...</p>
                    </div>
                  ) : groups.length > 0 ? (
                    <div className="space-y-6">
                      {/* Group Statistics */}
                      <div>
                        <h3 className="text-xl font-semibold mb-6 text-purple-900 dark:text-purple-100 flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Group Overview
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800 shadow-lg hover:shadow-xl transition-all duration-200">
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Total Groups</p>
                                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                                    {groups.length}
                                  </p>
                                </div>
                                <Users className="h-8 w-8 text-purple-600" />
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800 shadow-lg hover:shadow-xl transition-all duration-200">
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Active Groups</p>
                                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                    {groups.filter(g => g.group.status === 'active').length}
                                  </p>
                                </div>
                                <CheckCircle className="h-8 w-8 text-blue-600" />
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800 shadow-lg hover:shadow-xl transition-all duration-200">
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">Leadership Roles</p>
                                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                                    {groups.filter(g => g.role === 'leader').length}
                                  </p>
                                </div>
                                <Crown className="h-8 w-8 text-green-600" />
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                      {/* Group Memberships */}
                      <div>
                        <h3 className="text-xl font-semibold mb-6 text-purple-900 dark:text-purple-100 flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Group Memberships
                        </h3>
                        <div className="space-y-4">
                          {groups.map((groupMembership) => (
                            <Card key={groupMembership.id} className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-200">
                              <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                      <h4 className="font-semibold text-purple-900 dark:text-purple-100 text-lg">
                                        {groupMembership.group.name}
                                      </h4>
                                      <Badge 
                                        variant={groupMembership.group.status === 'active' ? 'default' : 'secondary'}
                                        className="bg-purple-500 hover:bg-purple-600 text-white"
                                      >
                                        {groupMembership.group.status}
                                      </Badge>
                                    </div>
                                    {groupMembership.group.description && (
                                      <p className="text-sm text-purple-600 dark:text-purple-400">
                                        {groupMembership.group.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-4 text-sm text-purple-600 dark:text-purple-400">
                                      <div className="flex items-center gap-1">
                                        <User className="h-4 w-4" />
                                        <span className="capitalize">{groupMembership.role}</span>
                                      </div>
                                      {groupMembership.group.leader && (
                                        <div className="flex items-center gap-1">
                                          <Crown className="h-4 w-4" />
                                          <span>Led by {groupMembership.group.leader.firstname} {groupMembership.group.leader.lastname}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {groupMembership.role === 'leader' && (
                                      <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm">
                                        <Crown className="w-3 h-3 mr-1" />
                                        Leader
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Users className="h-16 w-16 text-purple-400 mx-auto mb-4" />
                      <p className="text-purple-900 dark:text-purple-100 text-lg font-semibold mb-2">No group memberships found</p>
                      <p className="text-purple-600 dark:text-purple-400">
                        {member?.firstname} isn't a member of any groups yet.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="family">
              <Card>
                <CardHeader>
                  <CardTitle>Family Information</CardTitle>
                  <CardDescription>
                    {member?.firstname} {member?.lastname}'s family details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isFamilyLoading ? (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">Loading family information...</p>
                    </div>
                  ) : familyInfo ? (
                    <div className="space-y-6">
                      {/* Family Header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-semibold">{familyInfo.family_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {familyInfo.members.length} member{familyInfo.members.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => navigate('/members?tab=families')}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          View Family
                        </Button>
                      </div>

                      {/* Family Members */}
                      <div className="space-y-3">
                        <h4 className="text-lg font-medium">Family Members</h4>
                        {familyInfo.members.map((familyMember) => (
                          <Card key={familyMember.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={familyMember.image_url} />
                                    <AvatarFallback className="text-sm">
                                      {getInitials(familyMember.firstname, familyMember.lastname)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">
                                      {familyMember.firstname} {familyMember.lastname}
                                    </div>
                                    <div className="text-sm text-muted-foreground space-x-2">
                                      <span className="capitalize">{familyMember.member_type}</span>
                                      <span>•</span>
                                      <span className="capitalize">{familyMember.relationship_type}</span>
                                      {familyMember.birth_date && (
                                        <>
                                          <span>•</span>
                                          <span>{calculateAge(familyMember.birth_date)} years old</span>
                                        </>
                                      )}
                                    </div>
                                    {(familyMember.email || familyMember.phone) && (
                                      <div className="text-sm text-muted-foreground mt-1">
                                        {familyMember.email && (
                                          <div className="flex items-center gap-1">
                                            <Mail className="w-3 h-3" />
                                            {familyMember.email}
                                          </div>
                                        )}
                                        {familyMember.phone && (
                                          <div className="flex items-center gap-1">
                                            <Phone className="w-3 h-3" />
                                            {familyMember.phone}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {familyMember.is_primary && (
                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                      <Crown className="w-3 h-3 mr-1" />
                                      Primary
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Not in a family</h3>
                      <p className="text-muted-foreground mb-4">
                        {member?.firstname} {member?.lastname} is not currently assigned to any family.
                      </p>
                      <Button
                        onClick={() => navigate('/members?tab=families')}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Manage Families
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="volunteering">
              <Card>
                <CardHeader>
                  <CardTitle>Volunteering History</CardTitle>
                  <CardDescription>
                    View {member?.firstname} {member?.lastname}'s volunteering roles and statistics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isVolunteersLoading ? (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">Loading volunteering history...</p>
                    </div>
                  ) : volunteers.length > 0 ? (
                    <div className="space-y-6">
                      {/* Volunteer Statistics */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Volunteer Statistics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {(() => {
                            const volunteerTypeStats = {};
                            volunteers.forEach(record => {
                              const eventType = record.events.event_type || 'Other';
                              if (!volunteerTypeStats[eventType]) {
                                volunteerTypeStats[eventType] = {
                                  total: 0,
                                  roles: {}
                                };
                              }
                              volunteerTypeStats[eventType].total++;
                              if (record.role) {
                                volunteerTypeStats[eventType].roles[record.role] = 
                                  (volunteerTypeStats[eventType].roles[record.role] || 0) + 1;
                              }
                            });

                            return Object.entries(volunteerTypeStats).map(([eventType, stats]) => (
                              <Card key={eventType}>
                          <CardContent className="p-4">
                                  <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                      <h4 className="font-medium capitalize">{eventType}</h4>
                                      <div className="flex items-center gap-2">
                                        <Heart className="h-4 w-4 text-red-600" />
                                        <span className="text-lg font-bold text-red-600">{stats.total}</span>
                                </div>
                              </div>
                                    
                                    {Object.keys(stats.roles).length > 0 && (
                                      <div className="space-y-1">
                                        {Object.entries(stats.roles).map(([role, count]) => (
                                          <div key={role} className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground capitalize">{role}</span>
                                            <span className="font-medium">{count}</span>
                            </div>
                      ))}
                    </div>
                  )}
                                  </div>
                </CardContent>
              </Card>
                            ));
                          })()}
                      </div>
                    </div>

                      {/* Recent Volunteering */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Recent Volunteering</h3>
                    <div className="space-y-4">
                          {volunteers.slice(0, 10).map((volunteer) => (
                            <Card key={volunteer.id}>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="space-y-1">
                                    <p className="font-medium">{volunteer.events.title}</p>
                                    <div className="flex items-center text-sm text-muted-foreground">
                                      <Handshake className="h-4 w-4 mr-2" />
                                      {format(new Date(volunteer.events.start_date), 'MMM d, yyyy • h:mm a')}
                          </div>
                                    {volunteer.events.location && (
                                      <div className="flex items-center text-sm text-muted-foreground">
                                        <MapPin className="h-4 w-4 mr-2" />
                                        {volunteer.events.location}
                          </div>
                        )}
                          </div>
                          </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                        {volunteers.length > 10 && (
                          <div className="text-center mt-4">
                            <p className="text-sm text-muted-foreground">
                              Showing 10 of {volunteers.length} volunteering roles
                            </p>
                            </div>
                          )}
                            </div>
                          </div>
                        ) : (
                    <div className="text-center py-8">
                      <Handshake className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-2">No volunteering history found</p>
                      <p className="text-sm text-muted-foreground">
                        {member?.firstname} {member?.lastname} hasn't volunteered yet.
                      </p>
                      </div>
                    )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
            </motion.div>
        </div>
      </div>

      {/* Edit Member Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[95vw] lg:max-w-[1200px] max-h-[90vh] overflow-hidden">
          <DialogHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-primary/20">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Edit {member.firstname} {member.lastname}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Update the member's information below. All changes will be saved when you click "Save Changes".
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[70vh] pr-2">
          <MemberForm
            initialData={{
                id: member.id,
              firstname: member.firstname,
              lastname: member.lastname,
              email: member.email,
              phone: member.phone,
              status: member.status,
                image_url: member.image_url,
                member_type: member.member_type,
                birth_date: member.birth_date,
                gender: member.gender,
                join_date: member.join_date,
                anniversary_date: member.anniversary_date,
                spouse_name: member.spouse_name,
                has_children: member.has_children,
                marital_status: member.marital_status,
                occupation: member.occupation,
                address: member.address,
                emergency_contact: member.emergency_contact,
                notes: member.notes,
                last_attendance_date: member.last_attendance_date,
                attendance_frequency: member.attendance_frequency,
                ministry_involvement: member.ministry_involvement,
                communication_preferences: member.communication_preferences,
                tags: member.tags
            }}
            onSave={handleEditMember}
            onCancel={() => setIsEditDialogOpen(false)}
          />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Person</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this person? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteMember}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Retroactive Check-in Dialog */}
      <Dialog open={isRetroCheckInOpen} onOpenChange={setIsRetroCheckInOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check In to Past Event</DialogTitle>
            <DialogDescription>
              Select a past event to check in {member?.firstname} {member?.lastname}
            </DialogDescription>
          </DialogHeader>
          
          {isEventsLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : pastEvents.length > 0 ? (
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {pastEvents.map((event) => (
                <div
                  key={event.id}
                  className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer hover:bg-muted/50 ${
                    selectedEvent?.id === event.id ? 'border-primary bg-muted/50' : ''
                  }`}
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="space-y-1">
                    <p className="font-medium">{event.title}</p>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      {format(new Date(event.start_date), 'MMM d, yyyy • h:mm a')}
                    </div>
                    {event.location && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-2" />
                        {event.location}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No past events available for check-in.</p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRetroCheckInOpen(false);
                setSelectedEvent(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRetroCheckIn}
              disabled={!selectedEvent}
            >
              Check In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
} 
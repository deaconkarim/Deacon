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
  Handshake,
  ChevronRight,
  Star,
  Activity,
  Gift,
  Award,
  PieChart
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { getMembers, getMemberAttendance, getMemberGroups, getMemberVolunteers, updateMember, deleteMember } from '../lib/data';
import { familyService } from '../lib/familyService';
import MemberForm from '@/components/members/MemberForm';
import FamilyAssignment from '@/components/members/FamilyAssignment';
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

// Helper function to validate dates
const isValidDate = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

export default function MemberProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [member, setMember] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({ totalCount: 0, eventTypeBreakdown: {} });
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
  const [activeTab, setActiveTab] = useState('overview');
  const [familyDonations, setFamilyDonations] = useState([]);
  const [isFamilyDonationsLoading, setIsFamilyDonationsLoading] = useState(false);

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
      // Use unified attendance service for consistent calculations
      const { unifiedAttendanceService } = await import('../lib/unifiedAttendanceService');
      const attendanceData = await unifiedAttendanceService.getMemberAttendanceCount(memberId, {
        useLast30Days: true, // Use last 30 days for consistency with dashboard and events page
        includeFutureEvents: false,
        includeDeclined: false
      });
      
      setAttendance(attendanceData.records || []);
      setAttendanceStats({
        totalCount: attendanceData.totalCount || 0,
        eventTypeBreakdown: attendanceData.eventTypeBreakdown || {}
      });
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      setIsAttendanceLoading(false);
    }
  };

  const loadGroups = async (memberId) => {
    setIsGroupsLoading(true);
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          *,
          groups (
            *,
            leader:members!groups_leader_id_fkey(firstname, lastname)
          )
        `)
        .eq('member_id', memberId);
      
      if (error) throw error;
      
      // Process the data to determine actual roles
      const processedGroups = (data || []).map(groupMembership => {
        const group = groupMembership.groups;
        
        // Check if this member is the leader of the group
        const isLeader = group?.leader_id === memberId;
        
        return {
          ...groupMembership,
          role: isLeader ? 'leader' : (groupMembership.role || 'member'),
          groups: {
            ...group,
            leader_name: group?.leader ? 
              `${group.leader.firstname} ${group.leader.lastname}` : 
              'No leader assigned'
          }
        };
      });
      
      setGroups(processedGroups);
    } catch (error) {
      console.error('Error loading groups:', error);
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
      
      if (memberFamily) {
        setFamilyInfo(memberFamily);
      }
    } catch (error) {
      console.error('Error loading family info:', error);
    } finally {
      setIsFamilyLoading(false);
    }
  };

  const loadGuardians = async (childId) => {
    setIsGuardiansLoading(true);
    try {
      const { data, error } = await supabase
        .from('child_guardians')
        .select(`
          *,
          guardian:members!child_guardians_guardian_id_fkey(*)
        `)
        .eq('child_id', childId);
      
      if (error) throw error;
      setGuardians(data || []);
    } catch (error) {
      console.error('Error loading guardians:', error);
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
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .lt('start_date', new Date().toISOString())
        .order('start_date', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      setPastEvents(data || []);
    } catch (error) {
      console.error('Error loading past events:', error);
    } finally {
      setIsEventsLoading(false);
    }
  };

  const handleRetroCheckIn = async () => {
    if (!selectedEvent) return;
    
    try {
      const { error } = await supabase
        .from('event_attendance')
        .insert({
          event_id: selectedEvent.id,
          member_id: member.id,
          status: 'checked-in'  // Valid status values: 'attending', 'checked-in', 'declined'
        });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Marked as attended for ${selectedEvent.title}`,
      });
      
      setIsRetroCheckInOpen(false);
      setSelectedEvent(null);
      loadAttendance(member.id);
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast({
        title: "Error",
        description: "Failed to mark attendance",
        variant: "destructive",
      });
    }
  };

  const handleEditMember = async (memberData) => {
    try {
      await updateMember(member.id, memberData);
      setMember({ ...member, ...memberData });
      setIsEditDialogOpen(false);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error('Error updating member:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMember = async () => {
    try {
      await deleteMember(member.id);
      toast({
        title: "Success",
        description: "Member deleted successfully",
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

  // Load family donations when family info is available
  useEffect(() => {
    if (familyInfo && donations.length === 0) {
      loadFamilyDonations();
    }
  }, [familyInfo, donations]);

  const loadFamilyDonations = async () => {
    if (!familyInfo || !familyInfo.members) return;
    
    setIsFamilyDonationsLoading(true);
    try {
      // Get all family member IDs
      const familyMemberIds = familyInfo.members.map(member => member.id);
      
      // First, let's check what columns exist in the donations table
      const { data: donationsData, error } = await supabase
        .from('donations')
        .select('*')
        .limit(1);
      
      if (error) {
        console.error('Error checking donations table structure:', error);
        return;
      }
      
      // If we have data, let's see what columns are available
      if (donationsData && donationsData.length > 0) {
      }
      
      // Try different possible column names for member relationship
      let familyDonationsData = [];
      
      // Try 'donor_id' first (common naming convention)
      try {
        const { data, error: donorError } = await supabase
          .from('donations')
          .select('*')
          .in('donor_id', familyMemberIds)
          .order('date', { ascending: false });
        
        if (!donorError && data) {
          familyDonationsData = data;
        }
      } catch (e) {

      }
      
      // If no data found with donor_id, try 'user_id'
      if (familyDonationsData.length === 0) {
        try {
          const { data, error: userError } = await supabase
            .from('donations')
            .select('*')
            .in('user_id', familyMemberIds)
            .order('date', { ascending: false });
          
          if (!userError && data) {
            familyDonationsData = data;
          }
        } catch (e) {

        }
      }
      
      // If still no data, try 'member_id' (original attempt)
      if (familyDonationsData.length === 0) {
        try {
          const { data, error: memberError } = await supabase
            .from('donations')
            .select('*')
            .in('member_id', familyMemberIds)
            .order('date', { ascending: false });
          
          if (!memberError && data) {
            familyDonationsData = data;
          }
        } catch (e) {

        }
      }
      
      // If still no data, try without any member filter to see what's available
      if (familyDonationsData.length === 0) {
        const { data: allDonations, error: allError } = await supabase
          .from('donations')
          .select('*')
          .limit(5);
        
        if (!allError && allDonations && allDonations.length > 0) {

        }
      }
      
      setFamilyDonations(familyDonationsData || []);
    } catch (error) {
      console.error('Error loading family donations:', error);
    } finally {
      setIsFamilyDonationsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <div className="max-w-md mx-auto space-y-4">
          <div className="animate-pulse">
            <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg mb-4"></div>
            <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-4"></div>
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
            <div className="space-y-2">
              <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
              <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
              <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Member Not Found</h1>
          <Button onClick={() => navigate('/members')}>Back to Members</Button>
        </div>
      </div>
    );
  }

  // Helper function to get donation display data
  const getDonationDisplayData = () => {
    if (donations.length > 0) {
      return {
        donations: donations,
        isLoading: isDonationsLoading,
        isFamilyData: false,
        title: "Giving Overview",
        description: `${member?.firstname || 'Member'}'s donation records and statistics`
      };
    } else if (familyDonations.length > 0) {
      return {
        donations: familyDonations,
        isLoading: isFamilyDonationsLoading,
        isFamilyData: true,
        title: "Family Giving Overview",
        description: `${familyInfo?.name || 'Family'} donation records and statistics`
      };
    } else {
      return {
        donations: [],
        isLoading: isDonationsLoading,
        isFamilyData: false,
        title: "Giving Overview",
        description: "No donation records found"
      };
    }
  };

  return (
    <motion.div 
      className="min-h-screen bg-white dark:bg-slate-900"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Mobile Header - Hidden on Desktop */}
      <div className="lg:hidden sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/members')}
            className="hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white truncate">
              {member ? formatName(member.firstname, member.lastname) : 'Loading...'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Member Profile</p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => member && setIsEditDialogOpen(true)}
              disabled={!member}
              className="hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => member && setIsDeleteDialogOpen(true)}
              disabled={!member}
              className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Header - Hidden on Mobile */}
      <div className="hidden lg:block bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/members')}
                className="hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Members
              </Button>
              <div className="h-6 w-px bg-slate-300 dark:bg-slate-600"></div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {member ? formatName(member.firstname, member.lastname) : 'Loading...'}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Member Profile</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => member && setIsEditDialogOpen(true)}
                disabled={!member}
                className="hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Button
                variant="outline"
                onClick={() => member && setIsDeleteDialogOpen(true)}
                disabled={!member}
                className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Content */}
      <div className="lg:hidden p-4 space-y-6">
        {/* Profile Card */}
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden border-0 shadow-lg bg-white dark:bg-slate-800">
            <div className="relative h-32 bg-gradient-to-r from-blue-500 to-indigo-600">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20"></div>
            </div>
            <CardContent className="p-6 -mt-16">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <Avatar className="h-28 w-28 ring-4 ring-white dark:ring-slate-800 shadow-lg">
                    <AvatarImage src={member.image_url} />
                    <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      {getInitials(member.firstname, member.lastname)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                  </div>
                </div>
                
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  {formatName(member.firstname, member.lastname)}
                </h2>
                
                <div className="flex flex-wrap gap-2 justify-center mb-3">
                  <Badge 
                    variant={member.status === 'active' ? 'default' : 'secondary'} 
                    className="text-sm"
                  >
                    {member.status}
                  </Badge>
                  {member.member_type === 'child' ? (
                    <Badge variant="secondary" className="text-sm">
                      <Baby className="w-3 h-3 mr-1" />
                      Child
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-sm">
                      <User className="w-3 h-3 mr-1" />
                      Adult
                    </Badge>
                  )}
                  {member.role !== 'member' && (
                    <Badge variant="outline" className="text-sm capitalize">
                      <Crown className="w-3 h-3 mr-1" />
                      {member.role}
                    </Badge>
                  )}
                </div>
                
                {member.occupation && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
                    {member.occupation}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Activity Stats */}
        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Church className="h-5 w-5 text-white" />
                </div>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {attendanceStats.totalCount}
                </div>
                <p className="text-xs text-green-600 dark:text-green-400">Events attended</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                  {(() => {
                    const donationData = getDonationDisplayData();
                    return donationData.donations.length;
                  })()}
                </div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">Total gifts</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {groups.length}
                </div>
                <p className="text-xs text-purple-600 dark:text-purple-400">Group memberships</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Handshake className="h-5 w-5 text-white" />
                </div>
                <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {volunteers.length}
                </div>
                <p className="text-xs text-orange-600 dark:text-orange-400">Volunteer roles</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Contact Information */}
        {(member.email || member.phone) && (
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {member.email && (
                  <div className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Mail className="mr-3 h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{member.email}</span>
                  </div>
                )}
                {member.phone && (
                  <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <Phone className="mr-3 h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{formatPhoneNumber(member.phone)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Personal Information */}
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-purple-500" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {member.gender && (
                <div className="flex items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <User className="mr-3 h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium text-slate-900 dark:text-white capitalize">{member.gender}</span>
                </div>
              )}
              {member.birth_date && (
                <div className="flex items-center p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                  <Calendar className="mr-3 h-4 w-4 text-pink-500" />
                  <div>
                    <div className="text-sm font-medium text-pink-900 dark:text-pink-100">
                      Birthday: {isValidDate(member.birth_date) 
                        ? format(new Date(member.birth_date), 'MMM d, yyyy')
                        : 'Date not available'
                      }
                    </div>
                    {isValidDate(member.birth_date) && calculateAge(member.birth_date) && (
                      <div className="text-xs text-pink-500 dark:text-pink-400">
                        {calculateAge(member.birth_date)} years old
                      </div>
                    )}
                  </div>
                </div>
              )}
              {member.join_date && (
                <div className="flex items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <Calendar className="mr-3 h-4 w-4 text-orange-500" />
                  <div>
                    <div className="text-sm font-medium text-orange-900 dark:text-orange-100">
                      Join Date: {isValidDate(member.join_date) 
                        ? format(new Date(member.join_date), 'MMM d, yyyy')
                        : 'Date not available'
                      }
                    </div>
                    {isValidDate(member.join_date) && (
                      <div className="text-xs text-orange-500 dark:text-orange-400">
                        Member for {Math.floor((new Date() - new Date(member.join_date)) / (1000 * 60 * 60 * 24 * 365))} years
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Address Information */}
        {member.address && member.address.street && (
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-indigo-500" />
                  Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <div className="flex items-start">
                    <MapPin className="mr-3 h-4 w-4 text-indigo-500 mt-0.5" />
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{member.address.street}</div>
                      <div className="text-xs text-indigo-500 dark:text-indigo-400">
                        {[
                          member.address.city,
                          member.address.state,
                          member.address.zip
                        ].filter(Boolean).join(', ')}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Family Information */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-teal-500" />
                  Family
                </CardTitle>
              </CardHeader>
              <CardContent>
              {familyInfo ? (
                <div className="p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                  <div className="flex items-start">
                    <Users className="mr-3 h-4 w-4 text-teal-500 mt-0.5" />
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        {familyInfo.name || familyInfo.family_name || 'Family'}
                      </div>
                      <div className="text-xs text-teal-500 dark:text-teal-400">
                        {familyInfo.members.length} members
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {familyInfo.members
                          .filter(m => m.id !== member.id)
                          .slice(0, 3)
                          .map((familyMember) => (
                            <Badge 
                              key={familyMember.id} 
                              variant="outline" 
                              className="text-xs cursor-pointer hover:bg-teal-100 dark:hover:bg-teal-800 transition-colors"
                              onClick={() => navigate(`/members/${familyMember.id}`)}
                            >
                              {formatName(familyMember.firstname, familyMember.lastname)}
                            </Badge>
                          ))}
                        {familyInfo.members.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{familyInfo.members.length - 4} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 dark:bg-slate-900/20 rounded-lg">
                  <div className="flex items-start">
                    <Users className="mr-3 h-4 w-4 text-slate-500 mt-0.5" />
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Not assigned to a family
                    </div>
                  </div>
                </div>
              )}
              </CardContent>
            </Card>
          </motion.div>

        {/* Child Guardians */}
        {member.member_type === 'child' && guardians.length > 0 && (
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-amber-500" />
                  Guardians
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {guardians.map((guardian) => (
                          <div 
                            key={guardian.id} 
                            className="flex items-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-800 transition-all"
                            onClick={() => navigate(`/members/${guardian.guardian.id}`)}
                          >
                    <Shield className="mr-3 h-4 w-4 text-amber-500" />
                            <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        {formatName(guardian.guardian.firstname, guardian.guardian.lastname)}
                      </div>
                      <div className="text-xs text-amber-500 dark:text-amber-400">
                        {guardian.relationship || 'Guardian'}
                      </div>
                    </div>
                            <ChevronRight className="h-4 w-4 text-amber-400" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Custom Desktop & Tablet Layout - Hidden on Mobile */}
      <div className="hidden lg:block">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <motion.div variants={itemVariants}>
            {/* Activity Stats Cards */}
            <div className="grid grid-cols-4 gap-8 mb-12">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Church className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-4xl font-bold text-green-900 dark:text-green-100">
                    {attendanceStats.totalCount}
                  </div>
                  <p className="text-lg text-green-600 dark:text-green-400">Events Attended</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-4xl font-bold text-emerald-900 dark:text-emerald-100">
                    {(() => {
                      const donationData = getDonationDisplayData();
                      return donationData.donations.length;
                    })()}
                  </div>
                  <p className="text-lg text-emerald-600 dark:text-emerald-400">Total Gifts</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-4xl font-bold text-purple-900 dark:text-purple-100">
                    {groups.length}
                  </div>
                  <p className="text-lg text-purple-600 dark:text-purple-400">Groups</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Handshake className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-4xl font-bold text-orange-900 dark:text-orange-100">
                    {volunteers.length}
                  </div>
                  <p className="text-lg text-orange-600 dark:text-orange-400">Volunteer Roles</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
              {/* Left Sidebar - Member Overview */}
              <div className="xl:col-span-1 space-y-8">
                {/* Member Quick Info Card */}
                <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 sticky top-8">
                  <CardHeader className="pb-6 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800/50 dark:to-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                    <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                      <User className="h-6 w-6" />
                      Member Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="text-center mb-6">
                      <Avatar className="h-32 w-32 mx-auto mb-4 ring-4 ring-slate-200 dark:ring-slate-700">
                        <AvatarImage src={member.image_url} />
                        <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-slate-500 to-slate-600 text-white">
                          {getInitials(member.firstname, member.lastname)}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{formatName(member.firstname, member.lastname)}</h3>
                      <div className="flex flex-wrap gap-2 justify-center mt-3">
                        <Badge variant={member.status === 'active' ? 'default' : 'secondary'} className="text-sm">
                          {member.status}
                        </Badge>
                        <Badge variant="outline" className="text-sm capitalize">
                          {member.member_type}
                        </Badge>
                      </div>
                      {member.occupation && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
                          {member.occupation}
                        </p>
                      )}
                    </div>

                    {/* Contact Info */}
                    {(member.email || member.phone) && (
                      <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Contact</h4>
                        <div className="space-y-3">
                          {member.email && (
                            <div className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <Mail className="mr-3 h-4 w-4 text-blue-500" />
                              <span className="text-sm font-medium text-slate-900 dark:text-white">{member.email}</span>
                            </div>
                          )}
                          {member.phone && (
                            <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                              <Phone className="mr-3 h-4 w-4 text-green-500" />
                              <span className="text-sm font-medium text-slate-900 dark:text-white">{formatPhoneNumber(member.phone)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Address Information */}
                    {member.address && member.address.street && (
                      <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Address</h4>
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                          <div className="flex items-start">
                            <MapPin className="mr-3 h-4 w-4 text-indigo-500 mt-0.5" />
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-slate-900 dark:text-white">{member.address.street}</div>
                              <div className="text-xs text-indigo-500 dark:text-indigo-400">
                                {[
                                  member.address.city,
                                  member.address.state,
                                  member.address.zip
                                ].filter(Boolean).join(', ')}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Family Information */}
                      <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Family</h4>
                      {familyInfo ? (
                        <div className="p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                          <div className="flex items-start">
                            <Users className="mr-3 h-4 w-4 text-teal-500 mt-0.5" />
                            <div className="space-y-2">
                              <div className="text-sm font-medium text-slate-900 dark:text-white">
                                {familyInfo.name || familyInfo.family_name || 'Family'}
                              </div>
                              <div className="text-xs text-teal-500 dark:text-teal-400">
                                {familyInfo.members.length} members
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {familyInfo.members
                                  .filter(m => m.id !== member.id)
                                  .slice(0, 3)
                                  .map((familyMember) => (
                                    <Badge 
                                      key={familyMember.id} 
                                      variant="outline" 
                                      className="text-xs cursor-pointer hover:bg-teal-100 dark:hover:bg-teal-800 transition-colors"
                                      onClick={() => navigate(`/members/${familyMember.id}`)}
                                    >
                                      {formatName(familyMember.firstname, familyMember.lastname)}
                                    </Badge>
                                  ))}
                                {familyInfo.members.length > 4 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{familyInfo.members.length - 4} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-50 dark:bg-slate-900/20 rounded-lg">
                          <div className="flex items-start">
                            <Users className="mr-3 h-4 w-4 text-slate-500 mt-0.5" />
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              Not assigned to a family
                          </div>
                        </div>
                      </div>
                    )}
                    </div>

                    {/* Child Guardians */}
                    {member.member_type === 'child' && guardians.length > 0 && (
                      <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Guardians</h4>
                        <div className="space-y-3">
                          {guardians.map((guardian) => (
                            <div 
                              key={guardian.id} 
                              className="flex items-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-800 transition-all"
                              onClick={() => navigate(`/members/${guardian.guardian.id}`)}
                            >
                              <Shield className="mr-3 h-4 w-4 text-amber-500" />
                              <div className="flex-1">
                                <div className="text-sm font-medium text-slate-900 dark:text-white">
                                  {formatName(guardian.guardian.firstname, guardian.guardian.lastname)}
                                </div>
                                <div className="text-xs text-amber-500 dark:text-amber-400">
                                  {guardian.relationship || 'Guardian'}
                                </div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-amber-400" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Main Content Area */}
              <div className="xl:col-span-3 space-y-8">
                {/* Navigation Tabs */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-700">
                    {[
                      { id: 'overview', label: 'Overview', icon: FileText, color: 'blue' },
                      { id: 'attendance', label: 'Attendance', icon: Church, color: 'green', count: attendance.length },
                      { 
                        id: 'giving', 
                        label: 'Giving', 
                        icon: DollarSign, 
                        color: 'emerald', 
                        count: (() => {
                          const donationData = getDonationDisplayData();
                          return donationData.donations.length;
                        })()
                      },
                      { id: 'groups', label: 'Groups', icon: Users, color: 'purple', count: groups.length },
                      { id: 'volunteering', label: 'Volunteering', icon: Handshake, color: 'orange', count: volunteers.length },
                      { id: 'family', label: 'Family', icon: Heart, color: 'pink' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        className={`flex items-center gap-3 px-6 py-4 text-base font-medium border-b-2 transition-colors ${
                          activeTab === tab.id
                            ? `border-${tab.color}-500 text-${tab.color}-600 dark:text-${tab.color}-400`
                            : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                        }`}
                        onClick={() => setActiveTab(tab.id)}
                      >
                        <tab.icon className="h-5 w-5" />
                        {tab.label}
                        {tab.count !== undefined && (
                          <Badge variant="secondary" className="ml-2 text-sm">
                            {tab.count}
                          </Badge>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Content */}
                <div className="min-h-[700px]">
                  {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Personal Information */}
                      <Card className="border-0 shadow-xl">
                        <CardHeader className="pb-6 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-b border-blue-200 dark:border-blue-800">
                          <CardTitle className="text-xl font-bold text-blue-900 dark:text-blue-100 flex items-center gap-3">
                            <User className="h-6 w-6" />
                            Personal Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-base text-blue-600 dark:text-blue-400 font-medium">Full Name</div>
                              <div className="text-lg font-semibold text-blue-900 dark:text-blue-100">{formatName(member.firstname, member.lastname)}</div>
                            </div>
                            <div>
                              <div className="text-base text-blue-600 dark:text-blue-400 font-medium">Member Type</div>
                              <div className="text-lg font-semibold text-blue-900 dark:text-blue-100 capitalize">{member.member_type}</div>
                            </div>
                            <div>
                              <div className="text-base text-blue-600 dark:text-blue-400 font-medium">Status</div>
                              <div className="text-lg font-semibold text-blue-900 dark:text-blue-100 capitalize">{member.status}</div>
                            </div>
                            <div>
                              <div className="text-base text-blue-600 dark:text-blue-400 font-medium">Role</div>
                              <div className="text-lg font-semibold text-blue-900 dark:text-blue-100 capitalize">{member.role}</div>
                            </div>
                            {member.gender && (
                              <div>
                                <div className="text-base text-blue-600 dark:text-blue-400 font-medium">Gender</div>
                                <div className="text-lg font-semibold text-blue-900 dark:text-blue-100 capitalize">{member.gender}</div>
                              </div>
                            )}
                            {member.birth_date && (
                              <div>
                                <div className="text-base text-blue-600 dark:text-blue-400 font-medium">Age</div>
                                <div className="text-lg font-semibold text-blue-900 dark:text-blue-100">{calculateAge(member.birth_date)} years old</div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Contact Information */}
                      <Card className="border-0 shadow-xl">
                        <CardHeader className="pb-6 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-b border-green-200 dark:border-green-800">
                          <CardTitle className="text-xl font-bold text-green-900 dark:text-green-100 flex items-center gap-3">
                            <Mail className="h-6 w-6" />
                            Contact Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                          {member.email && (
                            <div className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                              <Mail className="mr-4 h-5 w-5 text-green-500" />
                              <span className="text-base font-medium text-green-900 dark:text-green-100">{member.email}</span>
                            </div>
                          )}
                          {member.phone && (
                            <div className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                              <Phone className="mr-4 h-5 w-5 text-green-500" />
                              <span className="text-base font-medium text-green-900 dark:text-green-100">{formatPhoneNumber(member.phone)}</span>
                            </div>
                          )}
                          {member.address && member.address.street && (
                            <div className="flex items-start p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                              <MapPin className="mr-4 h-5 w-5 text-green-500 mt-0.5" />
                              <div className="space-y-1">
                                <div className="text-base font-medium text-green-900 dark:text-green-100">{member.address.street}</div>
                                <div className="text-sm text-green-600 dark:text-green-400">
                                  {[member.address.city, member.address.state, member.address.zip].filter(Boolean).join(', ')}
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Important Dates */}
                      <Card className="border-0 shadow-xl">
                        <CardHeader className="pb-6 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-b border-orange-200 dark:border-orange-800">
                          <CardTitle className="text-xl font-bold text-orange-900 dark:text-orange-100 flex items-center gap-3">
                            <Calendar className="h-6 w-6" />
                            Important Dates
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                          {member.birth_date && (
                            <div className="flex items-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                              <Calendar className="mr-4 h-5 w-5 text-orange-500" />
                              <div>
                                <div className="text-base font-medium text-orange-900 dark:text-orange-100">
                                  Birthday: {isValidDate(member.birth_date) 
                                    ? format(new Date(member.birth_date), 'MMM d, yyyy')
                                    : 'Date not available'
                                  }
                                </div>
                                {isValidDate(member.birth_date) && calculateAge(member.birth_date) && (
                                  <div className="text-sm text-orange-600 dark:text-orange-400">
                                    {calculateAge(member.birth_date)} years old
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          {member.join_date && (
                            <div className="flex items-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                              <Calendar className="mr-4 h-5 w-5 text-orange-500" />
                              <div>
                                <div className="text-base font-medium text-orange-900 dark:text-orange-100">
                                  Join Date: {isValidDate(member.join_date) 
                                    ? format(new Date(member.join_date), 'MMM d, yyyy')
                                    : 'Date not available'
                                  }
                                </div>
                                {isValidDate(member.join_date) && (
                                  <div className="text-sm text-orange-600 dark:text-orange-400">
                                    Member for {Math.floor((new Date() - new Date(member.join_date)) / (1000 * 60 * 60 * 24 * 365))} years
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Communication Preferences */}
                      <Card className="border-0 shadow-xl">
                        <CardHeader className="pb-6 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-b border-purple-200 dark:border-purple-800">
                          <CardTitle className="text-xl font-bold text-purple-900 dark:text-purple-100 flex items-center gap-3">
                            <MessageSquare className="h-6 w-6" />
                            Communication Preferences
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                          <div className="flex gap-3">
                            <Button variant="outline" size="default" className="text-base">
                              <MessageSquare className="mr-3 h-4 w-4" />
                              SMS
                            </Button>
                            <Button variant="outline" size="default" className="text-base">
                              <Mail className="mr-3 h-4 w-4" />
                              Email
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {activeTab === 'attendance' && (
                    <div className="space-y-6">
                      {/* Attendance History Header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Attendance History</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">View {member?.firstname || 'member'}'s attendance records and engagement statistics</p>
                        </div>
                        <Button 
                          onClick={() => member && setIsRetroCheckInOpen(true)}
                          disabled={!member}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          Check In to Past Event
                        </Button>
                      </div>

                      {/* Attendance by Event Type */}
                      <Card className="border-0 shadow-lg">
                        <CardHeader className="pb-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-b border-green-200 dark:border-green-800">
                          <CardTitle className="text-lg font-bold text-green-900 dark:text-green-100 flex items-center gap-2">
                            <Church className="h-5 w-5" />
                            Attendance by Event Type
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          {(() => {
                            // Use the improved event type breakdown from unified service
                            const eventTypeStats = {};
                            
                            Object.entries(attendanceStats.eventTypeBreakdown).forEach(([eventType, count]) => {
                              eventTypeStats[eventType] = {
                                attended: count,
                                total: count
                              };
                            });
                            
                            // If no attendance data, show empty state
                            if (Object.keys(eventTypeStats).length === 0) {
                              return (
                                <div className="text-center py-8">
                                  <Church className="h-12 w-12 text-green-400 mx-auto mb-3" />
                                  <p className="text-green-600 dark:text-green-400 mb-2">No attendance records</p>
                                  <p className="text-sm text-green-500 dark:text-green-300">
                                    Attendance statistics will appear here once events are attended
                                  </p>
                                </div>
                              );
                            }
                            
                            // Display the actual statistics
                            return (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {Object.entries(eventTypeStats).map(([eventType, stats]) => (
                                  <div key={eventType} className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                                      <CheckCircle className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                      <div className="font-semibold text-green-900 dark:text-green-100 capitalize">
                                        {eventType}
                                      </div>
                                      <div className="text-sm text-green-600 dark:text-green-400">
                                        {stats.attended} event{stats.attended !== 1 ? 's' : ''} attended
                                      </div>
                                    </div>
                                    <Badge className="ml-auto bg-green-500 text-white">
                                      {stats.attended}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </CardContent>
                      </Card>

                      {/* Recent Attendance */}
                      <Card className="border-0 shadow-lg">
                        <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-b border-blue-200 dark:border-blue-800">
                          <CardTitle className="text-lg font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Recent Attendance
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            {attendance.slice(0, 5).map((record) => {
                              // Safely get the date value
                              const dateValue = record.events?.start_date || record.event?.date || record.created_at;
                              const isValidDate = dateValue && !isNaN(new Date(dateValue).getTime());
                              
                              return (
                                <div key={record.id} className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                                    <CheckCircle className="h-4 w-4 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-blue-900 dark:text-blue-100">
                                      {record.events?.title || record.event?.title || 'Event'}
                                    </div>
                                    <div className="text-sm text-blue-600 dark:text-blue-400">
                                      {isValidDate 
                                        ? format(new Date(dateValue), 'MMM d, yyyy • h:mm a')
                                        : 'Date not available'
                                      }
                                    </div>
                                  </div>
                                  <div className="text-xs text-blue-600 dark:text-blue-400">
                                    {record.events?.location || record.event?.location || 'Location'}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {activeTab === 'giving' && (
                    <div className="space-y-6">
                      {(() => {
                        const donationData = getDonationDisplayData();
                        
                        return (
                          <>
                            {/* Giving Overview */}
                            <Card className="border-0 shadow-lg">
                              <CardHeader className="pb-4 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 border-b border-emerald-200 dark:border-emerald-800">
                                <CardTitle className="text-lg font-bold text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
                                  <DollarSign className="h-5 w-5" />
                                  {donationData.title}
                                </CardTitle>
                                <CardDescription className="text-emerald-700 dark:text-emerald-300">
                                  {donationData.description}
                                </CardDescription>
                                {donationData.isFamilyData && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <Users className="h-4 w-4 text-emerald-600" />
                                    <span className="text-sm text-emerald-600 dark:text-emerald-400">
                                      Showing family donations (includes all family members)
                                    </span>
                                  </div>
                                )}
                              </CardHeader>
                              <CardContent className="p-4">
                                {donationData.isLoading ? (
                                  <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2"></div>
                                    <p className="text-sm text-emerald-600">Loading...</p>
                                  </div>
                                ) : donationData.donations.length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                      <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                                        ${donationData.donations.reduce((sum, d) => sum + (d.amount || 0), 0).toLocaleString()}
                                      </div>
                                      <div className="text-sm text-emerald-600 dark:text-emerald-400">
                                        {donationData.isFamilyData ? 'Family Total Given' : 'Total Given'}
                                      </div>
                                    </div>
                                    <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                      <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                                        {donationData.donations.length}
                                      </div>
                                      <div className="text-sm text-emerald-600 dark:text-emerald-400">
                                        {donationData.isFamilyData ? 'Family Total Gifts' : 'Total Gifts'}
                                      </div>
                                    </div>
                                    <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                      <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                                        ${Math.round(donationData.donations.reduce((sum, d) => sum + (d.amount || 0), 0) / Math.max(donationData.donations.length, 1))}
                                      </div>
                                      <div className="text-sm text-emerald-600 dark:text-emerald-400">
                                        {donationData.isFamilyData ? 'Family Average Gift' : 'Average Gift'}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center py-8">
                                    <DollarSign className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
                                    <p className="text-emerald-600 dark:text-emerald-400 mb-2">No donation records found</p>
                                    <p className="text-sm text-emerald-500 dark:text-emerald-300">
                                      {donationData.isFamilyData 
                                        ? 'No family donations recorded yet'
                                        : 'No individual donations recorded yet'
                                      }
                                    </p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>

                            {/* Giving by Fund */}
                            {donationData.donations.length > 0 && (
                              <Card className="border-0 shadow-lg">
                                <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-b border-blue-200 dark:border-blue-800">
                                  <CardTitle className="text-lg font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                                    <PieChart className="h-5 w-5" />
                                    {donationData.isFamilyData ? 'Family Giving by Fund' : 'Giving by Fund'}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                  {(() => {
                                    // Calculate fund statistics
                                    const fundStats = {};
                                    donationData.donations.forEach(donation => {
                                      const fund = donation.fund_name || donation.fund_designation || 'General Fund';
                                      if (!fundStats[fund]) {
                                        fundStats[fund] = { total: 0, count: 0 };
                                      }
                                      fundStats[fund].total += donation.amount || 0;
                                      fundStats[fund].count += 1;
                                    });

                                    const totalAmount = donationData.donations.reduce((sum, d) => sum + (d.amount || 0), 0);
                                    const colors = ['blue', 'green', 'purple', 'orange', 'pink', 'indigo'];

                                    return (
                                      <div className="space-y-3">
                                        {Object.entries(fundStats).map(([fund, stats], index) => (
                                          <div key={fund} className={`flex items-center justify-between p-3 bg-${colors[index % colors.length]}-50 dark:bg-${colors[index % colors.length]}-900/20 rounded-lg`}>
                                            <div className="flex items-center">
                                              <div className={`w-3 h-3 bg-${colors[index % colors.length]}-500 rounded-full mr-3`}></div>
                                              <span className={`font-medium text-${colors[index % colors.length]}-900 dark:text-${colors[index % colors.length]}-100`}>{fund}</span>
                                            </div>
                                            <div className="text-right">
                                              <div className={`font-semibold text-${colors[index % colors.length]}-900 dark:text-${colors[index % colors.length]}-100`}>
                                                ${stats.total.toLocaleString()}
                                              </div>
                                              <div className={`text-xs text-${colors[index % colors.length]}-600 dark:text-${colors[index % colors.length]}-400`}>
                                                {Math.round((stats.total / totalAmount) * 100)}% • {stats.count} gift{stats.count !== 1 ? 's' : ''}
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    );
                                  })()}
                                </CardContent>
                              </Card>
                            )}

                            {/* Recent Donations */}
                            {donationData.donations.length > 0 && (
                              <Card className="border-0 shadow-lg">
                                <CardHeader className="pb-4 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-b border-orange-200 dark:border-orange-800">
                                  <CardTitle className="text-lg font-bold text-orange-900 dark:text-orange-100 flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    {donationData.isFamilyData ? 'Recent Family Donations' : 'Recent Donations'}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                  <div className="space-y-3">
                                    {donationData.donations.slice(0, 5).map((donation) => {
                                      // Safely get the date value
                                      const dateValue = donation.date || donation.created_at;
                                      const isValidDate = dateValue && !isNaN(new Date(dateValue).getTime());
                                      
                                      return (
                                        <div key={donation.id} className="flex items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
                                            <DollarSign className="h-4 w-4 text-white" />
                                          </div>
                                          <div className="flex-1">
                                            <div className="font-medium text-orange-900 dark:text-orange-100">
                                              ${donation.amount?.toLocaleString() || '0'}
                                            </div>
                                            <div className="text-sm text-orange-600 dark:text-orange-400">
                                              {donation.fund_name || donation.fund_designation || 'General Fund'} • {isValidDate 
                                                ? format(new Date(dateValue), 'MMM d, yyyy')
                                                : 'Date not available'
                                              }
                                            </div>
                                            {donationData.isFamilyData && donation.member_id !== member?.id && (
                                              <div className="text-xs text-orange-500 dark:text-orange-400">
                                                From family member
                                              </div>
                                            )}
                                          </div>
                                          <Badge variant="outline" className="text-xs">
                                            {donation.payment_method || 'Check'}
                                          </Badge>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {activeTab === 'groups' && (
                    <div className="space-y-6">
                      {/* Group Overview */}
                      <Card className="border-0 shadow-lg">
                        <CardHeader className="pb-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-b border-purple-200 dark:border-purple-800">
                          <CardTitle className="text-lg font-bold text-purple-900 dark:text-purple-100 flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Group Overview
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                                {groups.length}
                              </div>
                              <div className="text-sm text-purple-600 dark:text-purple-400">Active Groups</div>
                            </div>
                            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                                {groups.filter(g => g.role === 'leader').length}
                              </div>
                              <div className="text-sm text-purple-600 dark:text-purple-400">Leadership Roles</div>
                            </div>
                            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                                {groups.filter(g => g.role === 'member').length}
                              </div>
                              <div className="text-sm text-purple-600 dark:text-purple-400">Memberships</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Group Memberships */}
                      <Card className="border-0 shadow-lg">
                        <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-b border-blue-200 dark:border-blue-800">
                          <CardTitle className="text-lg font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Group Memberships
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            {groups.map((groupMembership) => {
                              // Safely get the date value
                              const dateValue = groupMembership.joined_date || groupMembership.created_at;
                              const isValidDate = dateValue && !isNaN(new Date(dateValue).getTime());
                              
                              // Safely get group information
                              const group = groupMembership.groups || groupMembership.group;
                              const groupName = group?.name || 'Unknown Group';
                              const groupDescription = group?.description || 'No description available';
                              const groupLeader = group?.leader_name || group?.leader || group?.leader_name;
                              const isLeader = groupMembership.role === 'leader';
                              
                              return (
                                <div key={groupMembership.id} className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                  <div className={`w-10 h-10 ${isLeader ? 'bg-yellow-500' : 'bg-blue-500'} rounded-lg flex items-center justify-center mr-3`}>
                                    {isLeader ? (
                                      <Crown className="h-5 w-5 text-white" />
                                    ) : (
                                      <Users className="h-5 w-5 text-white" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-blue-900 dark:text-blue-100">
                                      {groupName}
                                      {isLeader && (
                                        <Badge variant="default" className="ml-2 text-xs bg-yellow-500">
                                          Leader
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-sm text-blue-600 dark:text-blue-400">
                                      {groupDescription}
                                    </div>
                                    {groupLeader && !isLeader && (
                                      <div className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                                        Leader: {groupLeader}
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <Badge variant={isLeader ? 'default' : 'secondary'} className="text-xs">
                                      {groupMembership.role || 'member'}
                                    </Badge>
                                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                      Joined {isValidDate 
                                        ? format(new Date(dateValue), 'MMM yyyy')
                                        : 'Date not available'
                                      }
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {activeTab === 'family' && (
                    <FamilyAssignment 
                      member={member} 
                      onFamilyUpdate={() => {
                        loadFamilyInfo(member.id);
                        loadFamilyDonations();
                      }}
                    />
                  )}

                  {activeTab === 'volunteering' && (
                    <div className="space-y-6">
                      {/* Volunteering Overview */}
                      <Card className="border-0 shadow-lg">
                        <CardHeader className="pb-4 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-b border-orange-200 dark:border-orange-800">
                          <CardTitle className="text-lg font-bold text-orange-900 dark:text-orange-100 flex items-center gap-2">
                            <Handshake className="h-5 w-5" />
                            Volunteering Overview
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                                {volunteers.length}
                              </div>
                              <div className="text-sm text-orange-600 dark:text-orange-400">Total Assignments</div>
                            </div>
                            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                                {new Set(volunteers.map(v => v.events?.id)).size}
                              </div>
                              <div className="text-sm text-orange-600 dark:text-orange-400">Events Volunteered</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Volunteer Roles */}
                      <Card className="border-0 shadow-lg">
                        <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-b border-blue-200 dark:border-blue-800">
                          <CardTitle className="text-lg font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                            <Handshake className="h-5 w-5" />
                            Volunteer Roles
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          {volunteers.length > 0 ? (
                            <div className="space-y-3">
                              {volunteers.map((volunteer) => {
                                // Safely get the date value
                                const dateValue = volunteer.created_at;
                                const isValidDate = dateValue && !isNaN(new Date(dateValue).getTime());
                                
                                return (
                                  <div key={volunteer.id} className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                                      <Handshake className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium text-blue-900 dark:text-blue-100">{volunteer.role}</div>
                                      <div className="text-sm text-blue-600 dark:text-blue-400">
                                        {volunteer.events?.title || 'Event'}
                                      </div>
                                      {volunteer.notes && (
                                        <div className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                                          {volunteer.notes}
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <Badge variant="secondary" className="text-xs">
                                        Volunteer
                                      </Badge>
                                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                        {isValidDate 
                                          ? format(new Date(dateValue), 'MMM d, yyyy')
                                          : 'Date not available'
                                        }
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <Handshake className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                              <p className="text-slate-600 dark:text-slate-400">No volunteer roles assigned yet</p>
                              <Button variant="outline" className="mt-3">
                                <Plus className="mr-2 h-4 w-4" />
                                Assign Role
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Mobile Accordion View - Hidden on Tablet and Desktop */}
      <div className="lg:hidden mt-8">
        <motion.div variants={itemVariants}>
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="overview">
              <AccordionTrigger className="text-lg font-semibold px-4">
                <FileText className="h-5 w-5 mr-3" />
                Overview
              </AccordionTrigger>
              <AccordionContent>
                <Card className="border-0 shadow-md">
                  <CardContent className="p-4 space-y-6">
                    {/* Personal Information */}
                    <section>
                      <h3 className="text-base font-semibold flex items-center gap-2 mb-3 text-blue-900 dark:text-blue-100">
                        <User className="h-4 w-4" /> Personal Information
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <div className="text-sm text-muted-foreground">Full Name:</div>
                          <div className="font-medium">{formatName(member.firstname, member.lastname)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Member Type:</div>
                          <div className="font-medium capitalize">{member.member_type}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Status:</div>
                          <div className="font-medium capitalize">{member.status}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Role:</div>
                          <div className="font-medium capitalize">{member.role}</div>
                        </div>
                        {member.gender && (
                          <div>
                            <div className="text-sm text-muted-foreground">Gender:</div>
                            <div className="font-medium capitalize">{member.gender}</div>
                          </div>
                        )}
                        {member.birth_date && (
                          <div>
                            <div className="text-sm text-muted-foreground">Age:</div>
                            <div className="font-medium">{calculateAge(member.birth_date)} years old</div>
                          </div>
                        )}
                        {member.occupation && (
                          <div>
                            <div className="text-sm text-muted-foreground">Occupation:</div>
                            <div className="font-medium break-words">{member.occupation}</div>
                          </div>
                        )}
                      </div>
                    </section>

                    {/* Contact Information */}
                    {(member.email || member.phone || (member.address && member.address.street)) && (
                      <section>
                        <h3 className="text-base font-semibold flex items-center gap-2 mb-3 text-green-900 dark:text-green-100">
                          <Mail className="h-4 w-4" /> Contact Information
                        </h3>
                        <div className="space-y-3">
                          {member.email && (
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                              <div className="text-sm font-medium text-green-900 dark:text-green-100">{member.email}</div>
                            </div>
                          )}
                          {member.phone && (
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                              <div className="text-sm font-medium text-green-900 dark:text-green-100">{formatPhoneNumber(member.phone)}</div>
                            </div>
                          )}
                          {member.address && member.address.street && (
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                              <div className="text-sm font-medium text-green-900 dark:text-green-100">{member.address.street}</div>
                              <div className="text-xs text-green-600 dark:text-green-400">
                                {[member.address.city, member.address.state, member.address.zip].filter(Boolean).join(', ')}
                              </div>
                            </div>
                          )}
                        </div>
                      </section>
                    )}

                    {/* Important Dates */}
                    {(member.birth_date || member.join_date) && (
                      <section>
                        <h3 className="text-base font-semibold flex items-center gap-2 mb-3 text-orange-900 dark:text-orange-100">
                          <Calendar className="h-4 w-4" /> Important Dates
                        </h3>
                        <div className="space-y-3">
                          {member.birth_date && (
                            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                              <div className="text-sm font-medium text-orange-900 dark:text-orange-100">
                                Birthday: {isValidDate(member.birth_date) 
                                  ? format(new Date(member.birth_date), 'MMM d, yyyy')
                                  : 'Date not available'
                                }
                              </div>
                              {isValidDate(member.birth_date) && calculateAge(member.birth_date) && (
                                <div className="text-xs text-orange-600 dark:text-orange-400">
                                  {calculateAge(member.birth_date)} years old
                                </div>
                              )}
                            </div>
                          )}
                          {member.join_date && (
                            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                              <div className="text-sm font-medium text-orange-900 dark:text-orange-100">
                                Join Date: {isValidDate(member.join_date) 
                                  ? format(new Date(member.join_date), 'MMM d, yyyy')
                                  : 'Date not available'
                                }
                              </div>
                              {isValidDate(member.join_date) && (
                                <div className="text-xs text-orange-600 dark:text-orange-400">
                                  Member for {Math.floor((new Date() - new Date(member.join_date)) / (1000 * 60 * 60 * 24 * 365))} years
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </section>
                    )}

                    {/* Communication Preferences */}
                    {member.communication_preferences && (
                      <section>
                        <h3 className="text-base font-semibold flex items-center gap-2 mb-3 text-purple-900 dark:text-purple-100">
                          <MessageSquare className="h-4 w-4" /> Communication Preferences
                        </h3>
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <div className="flex flex-wrap gap-2">
                            {member.communication_preferences.sms && (
                              <Badge variant="default" className="text-xs bg-purple-500">
                                <MessageSquare className="w-3 h-3 mr-1" />
                                SMS
                              </Badge>
                            )}
                            {member.communication_preferences.email && (
                              <Badge variant="default" className="text-xs bg-blue-500">
                                <Mail className="w-3 h-3 mr-1" />
                                Email
                              </Badge>
                            )}
                            {member.communication_preferences.mail && (
                              <Badge variant="default" className="text-xs bg-gray-500">
                                <FileText className="w-3 h-3 mr-1" />
                                Mail
                              </Badge>
                            )}
                          </div>
                        </div>
                      </section>
                    )}

                    {/* Family Information */}
                    {familyInfo && (
                      <section>
                        <h3 className="text-base font-semibold flex items-center gap-2 mb-3 text-pink-900 dark:text-pink-100">
                          <Heart className="h-4 w-4" /> Family Information
                        </h3>
                        <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                          <div className="text-sm font-medium text-pink-900 dark:text-pink-100">
                            {familyInfo.name || 'Family'}
                          </div>
                          <div className="text-xs text-pink-600 dark:text-pink-400">
                            {familyInfo.members?.length || 0} member{(familyInfo.members?.length || 0) !== 1 ? 's' : ''}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {familyInfo.members
                              ?.filter(m => m.id !== member.id)
                              .slice(0, 3)
                              .map((familyMember) => (
                                <Badge key={familyMember.id} variant="outline" className="text-xs">
                                  {formatName(familyMember.firstname, familyMember.lastname)}
                                </Badge>
                              ))}
                            {familyInfo.members && familyInfo.members.length > 4 && (
                              <Badge variant="outline" className="text-xs">
                                +{familyInfo.members.length - 4} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </section>
                    )}

                    {/* Child Guardians */}
                    {member.member_type === 'child' && guardians.length > 0 && (
                      <section>
                        <h3 className="text-base font-semibold flex items-center gap-2 mb-3 text-amber-900 dark:text-amber-100">
                          <Shield className="h-4 w-4" /> Guardians
                        </h3>
                        <div className="space-y-2">
                          {guardians.map((guardian) => (
                            <div key={guardian.id} className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                              <div className="text-sm font-medium text-amber-900 dark:text-amber-100">
                                {formatName(guardian.guardian.firstname, guardian.guardian.lastname)}
                              </div>
                              <div className="text-xs text-amber-600 dark:text-amber-400">
                                {guardian.relationship || 'Guardian'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="attendance">
              <AccordionTrigger className="text-lg font-semibold px-4">
                <Church className="h-5 w-5 mr-3" />
                Attendance ({attendance.length})
              </AccordionTrigger>
              <AccordionContent>
                <Card className="border-0 shadow-md">
                  <CardContent className="p-4">
                    {/* Add Check In to Past Event button for mobile */}
                    <div className="mb-4">
                      <Button 
                        onClick={() => member && setIsRetroCheckInOpen(true)}
                        disabled={!member}
                        className="w-full"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Check In to Past Event
                      </Button>
                    </div>
                    {isAttendanceLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                        <p className="text-sm text-green-600">Loading...</p>
                      </div>
                    ) : attendance.length > 0 ? (
                      <div className="space-y-4">
                        {/* Attendance by Event Type */}
                        <div>
                          <h4 className="text-sm font-semibold mb-3 text-green-900 dark:text-green-100">Attendance by Event Type</h4>
                          {(() => {
                            // Use the improved event type breakdown from unified service
                            const eventTypeStats = {};
                            
                            Object.entries(attendanceStats.eventTypeBreakdown).forEach(([eventType, count]) => {
                              eventTypeStats[eventType] = {
                                attended: count
                              };
                            });
                            
                            if (Object.keys(eventTypeStats).length === 0) {
                              return (
                                <div className="text-center py-4">
                                  <p className="text-sm text-green-600 dark:text-green-400">No attendance records</p>
                                </div>
                              );
                            }
                            
                            return (
                              <div className="space-y-2">
                                {Object.entries(eventTypeStats).map(([eventType, stats]) => (
                                  <div key={eventType} className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                                      <CheckCircle className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium text-green-900 dark:text-green-100 capitalize">
                                        {eventType}
                                      </div>
                                      <div className="text-xs text-green-600 dark:text-green-400">
                                        {stats.attended} event{stats.attended !== 1 ? 's' : ''} attended
                                      </div>
                                    </div>
                                    <Badge className="bg-green-500 text-white">
                                      {stats.attended}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>

                        {/* Recent Attendance */}
                        <div>
                          <h4 className="text-sm font-semibold mb-3 text-blue-900 dark:text-blue-100">Recent Attendance</h4>
                          <div className="space-y-2">
                            {attendance.slice(0, 5).map((record) => {
                              const dateValue = record.events?.start_date || record.event?.date || record.created_at;
                              const isValidDate = dateValue && !isNaN(new Date(dateValue).getTime());
                              
                              return (
                                <div key={record.id} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                  <div className="font-medium text-blue-900 dark:text-blue-100">
                                    {record.events?.title || record.event?.title || 'Event'}
                                  </div>
                                  <div className="text-sm text-blue-600 dark:text-blue-400">
                                    {isValidDate 
                                      ? format(new Date(dateValue), 'MMM d, yyyy • h:mm a')
                                      : 'Date not available'
                                    }
                                  </div>
                                  <div className="text-xs text-blue-600 dark:text-blue-400">
                                    {record.events?.location || record.event?.location || 'Location'}
                                  </div>
                                </div>
                              );
                            })}
                            {attendance.length > 5 && (
                              <p className="text-sm text-muted-foreground text-center">
                                +{attendance.length - 5} more events
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">No attendance records</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="giving">
              <AccordionTrigger className="text-lg font-semibold px-4">
                <DollarSign className="h-5 w-5 mr-3" />
                Giving ({(() => {
                  const donationData = getDonationDisplayData();
                  return donationData.donations.length;
                })()})
              </AccordionTrigger>
              <AccordionContent>
                <Card className="border-0 shadow-md">
                  <CardContent className="p-4">
                    {(() => {
                      const donationData = getDonationDisplayData();
                      
                      return donationData.isLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2"></div>
                          <p className="text-sm text-emerald-600">Loading...</p>
                        </div>
                      ) : donationData.donations.length > 0 ? (
                        <div className="space-y-4">
                          {/* Giving Overview */}
                          <div>
                            <h4 className="text-sm font-semibold mb-3 text-emerald-900 dark:text-emerald-100">
                              {donationData.title}
                            </h4>
                            {donationData.isFamilyData && (
                              <div className="flex items-center gap-2 mb-3">
                                <Users className="h-4 w-4 text-emerald-600" />
                                <span className="text-xs text-emerald-600 dark:text-emerald-400">
                                  Showing family donations (includes all family members)
                                </span>
                              </div>
                            )}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-center">
                                <div className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
                                  ${donationData.donations.reduce((sum, d) => sum + (d.amount || 0), 0).toLocaleString()}
                                </div>
                                <div className="text-xs text-emerald-600 dark:text-emerald-400">
                                  {donationData.isFamilyData ? 'Family Total Given' : 'Total Given'}
                                </div>
                              </div>
                              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                                <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                                  {donationData.donations.length}
                                </div>
                                <div className="text-xs text-blue-600 dark:text-blue-400">
                                  {donationData.isFamilyData ? 'Family Total Gifts' : 'Total Gifts'}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Recent Donations */}
                          <div>
                            <h4 className="text-sm font-semibold mb-3 text-orange-900 dark:text-orange-100">
                              {donationData.isFamilyData ? 'Recent Family Donations' : 'Recent Donations'}
                            </h4>
                            <div className="space-y-2">
                              {donationData.donations.slice(0, 3).map((donation) => {
                                const dateValue = donation.date || donation.created_at;
                                const isValidDate = dateValue && !isNaN(new Date(dateValue).getTime());
                                
                                return (
                                  <div key={donation.id} className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                    <div className="font-medium text-orange-900 dark:text-orange-100">
                                      ${donation.amount?.toLocaleString() || '0'}
                                    </div>
                                    <div className="text-sm text-orange-600 dark:text-orange-400">
                                      {donation.fund_name || donation.fund_designation || 'General Fund'} • {isValidDate 
                                        ? format(new Date(dateValue), 'MMM d, yyyy')
                                        : 'Date not available'
                                      }
                                    </div>
                                    {donationData.isFamilyData && donation.member_id !== member?.id && (
                                      <div className="text-xs text-orange-500 dark:text-orange-400">
                                        From family member
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-sm text-muted-foreground">
                            {donationData.isFamilyData 
                              ? 'No family donations recorded yet'
                              : 'No individual donations recorded yet'
                            }
                          </p>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="groups">
              <AccordionTrigger className="text-lg font-semibold px-4">
                <Users className="h-5 w-5 mr-3" />
                Groups ({groups.length})
              </AccordionTrigger>
              <AccordionContent>
                <Card className="border-0 shadow-md">
                  <CardContent className="p-4">
                    {isGroupsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                        <p className="text-sm text-purple-600">Loading...</p>
                      </div>
                    ) : groups.length > 0 ? (
                      <div className="space-y-4">
                        {/* Group Overview */}
                        <div>
                          <h4 className="text-sm font-semibold mb-3 text-purple-900 dark:text-purple-100">Group Overview</h4>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                              <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                                {groups.length}
                              </div>
                              <div className="text-xs text-purple-600 dark:text-purple-400">Active Groups</div>
                            </div>
                            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                              <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                                {groups.filter(g => g.role === 'leader').length}
                              </div>
                              <div className="text-xs text-purple-600 dark:text-purple-400">Leadership</div>
                            </div>
                            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                              <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                                {groups.filter(g => g.role === 'member').length}
                              </div>
                              <div className="text-xs text-purple-600 dark:text-purple-400">Memberships</div>
                            </div>
                          </div>
                        </div>

                        {/* Group Memberships */}
                        <div>
                          <h4 className="text-sm font-semibold mb-3 text-blue-900 dark:text-blue-100">Group Memberships</h4>
                          <div className="space-y-2">
                            {groups.map((groupMembership) => {
                              const dateValue = groupMembership.joined_date || groupMembership.created_at;
                              const isValidDate = dateValue && !isNaN(new Date(dateValue).getTime());
                              
                              const group = groupMembership.groups || groupMembership.group;
                              const groupName = group?.name || 'Unknown Group';
                              const groupDescription = group?.description || 'No description available';
                              const groupLeader = group?.leader_name || group?.leader || group?.leader_name;
                              const isLeader = groupMembership.role === 'leader';
                              
                              return (
                                <div key={groupMembership.id} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="font-medium text-blue-900 dark:text-blue-100">
                                      {groupName}
                                      {isLeader && (
                                        <Badge variant="default" className="ml-2 text-xs bg-yellow-500">
                                          Leader
                                        </Badge>
                                      )}
                                    </div>
                                    <Badge variant={isLeader ? 'default' : 'secondary'} className="text-xs">
                                      {groupMembership.role || 'member'}
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-blue-600 dark:text-blue-400">
                                    {groupDescription}
                                  </div>
                                  {groupLeader && !isLeader && (
                                    <div className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                                      Leader: {groupLeader}
                                    </div>
                                  )}
                                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                    Joined {isValidDate 
                                      ? format(new Date(dateValue), 'MMM yyyy')
                                      : 'Date not available'
                                    }
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">No group memberships</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="volunteering">
              <AccordionTrigger className="text-lg font-semibold px-4">
                <Handshake className="h-5 w-5 mr-3" />
                Volunteering ({volunteers.length})
              </AccordionTrigger>
              <AccordionContent>
                <Card className="border-0 shadow-md">
                  <CardContent className="p-4">
                    {isVolunteersLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-2"></div>
                        <p className="text-sm text-orange-600">Loading...</p>
                      </div>
                    ) : volunteers.length > 0 ? (
                      <div className="space-y-4">
                        {/* Volunteering Overview */}
                        <div>
                          <h4 className="text-sm font-semibold mb-3 text-orange-900 dark:text-orange-100">Volunteering Overview</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-center">
                              <div className="text-lg font-bold text-orange-900 dark:text-orange-100">
                                {volunteers.length}
                              </div>
                              <div className="text-xs text-orange-600 dark:text-orange-400">Total Assignments</div>
                            </div>
                            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-center">
                              <div className="text-lg font-bold text-orange-900 dark:text-orange-100">
                                {new Set(volunteers.map(v => v.events?.id)).size}
                              </div>
                              <div className="text-xs text-orange-600 dark:text-orange-400">Events Volunteered</div>
                            </div>
                          </div>
                        </div>

                        {/* Volunteer Roles */}
                        <div>
                          <h4 className="text-sm font-semibold mb-3 text-blue-900 dark:text-blue-100">Volunteer Roles</h4>
                          <div className="space-y-2">
                            {volunteers.slice(0, 5).map((volunteer) => {
                              const dateValue = volunteer.created_at;
                              const isValidDate = dateValue && !isNaN(new Date(dateValue).getTime());
                              
                              return (
                                <div key={volunteer.id} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="font-medium text-blue-900 dark:text-blue-100">
                                      {volunteer.role}
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                      Volunteer
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-blue-600 dark:text-blue-400">
                                    {volunteer.events?.title || 'Event'}
                                  </div>
                                  {volunteer.notes && (
                                    <div className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                                      {volunteer.notes}
                                    </div>
                                  )}
                                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                    {isValidDate 
                                      ? format(new Date(dateValue), 'MMM d, yyyy')
                                      : 'Date not available'
                                    }
                                  </div>
                                </div>
                              );
                            })}
                            {volunteers.length > 5 && (
                              <p className="text-sm text-muted-foreground text-center">
                                +{volunteers.length - 5} more roles
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">No volunteer roles assigned yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="family">
              <AccordionTrigger className="text-lg font-semibold px-4">
                <Heart className="h-5 w-5 mr-3" />
                Family
              </AccordionTrigger>
              <AccordionContent>
                <FamilyAssignment 
                  member={member} 
                  onFamilyUpdate={() => {
                    loadFamilyInfo(member.id);
                    loadFamilyDonations();
                  }}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update {member ? formatName(member.firstname, member.lastname) : 'member'}'s information
            </DialogDescription>
          </DialogHeader>
          {member ? (
            <MemberForm
              initialData={member}
              onSave={handleEditMember}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-muted-foreground">Loading member data...</span>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {formatName(member.firstname, member.lastname)}? This action cannot be undone.
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

      {/* Retro Check-in Dialog */}
      <Dialog open={isRetroCheckInOpen} onOpenChange={setIsRetroCheckInOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Attendance</DialogTitle>
            <DialogDescription>
              Select an event to mark {member ? formatName(member.firstname, member.lastname) : 'member'} as present
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button
              variant="outline"
              onClick={loadPastEvents}
              disabled={isEventsLoading || !member}
              className="w-full"
            >
              {isEventsLoading ? 'Loading events...' : 'Load Past Events'}
            </Button>
            {pastEvents.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {pastEvents.map((event) => {
                  // Safely get the date value
                  const dateValue = event.date || event.start_date || event.created_at;
                  const isValidDate = dateValue && !isNaN(new Date(dateValue).getTime());
                  
                  return (
                    <Button
                      key={event.id}
                      variant={selectedEvent?.id === event.id ? "default" : "outline"}
                      onClick={() => setSelectedEvent(event)}
                      className="w-full justify-start"
                    >
                      <div className="text-left">
                        <div className="font-medium">{event.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {isValidDate 
                            ? format(new Date(dateValue), 'MMM d, yyyy')
                            : 'Date not available'
                          }
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRetroCheckInOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRetroCheckIn}
              disabled={!selectedEvent || !member}
            >
              Mark Present
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
} 
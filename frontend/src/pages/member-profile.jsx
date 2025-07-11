import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
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
  Trash2,
  Plus,
  Calendar as CalendarIcon,
  Crown,
  Heart,
  Shield,
  FileText,
  CheckCircle,
  XCircle,
  DollarSign
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

export function MemberProfile() {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/members')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Person Profile</h1>
            <p className="text-muted-foreground">
              View and manage person information
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsEditDialogOpen(true)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={member.image_url} />
                  <AvatarFallback className="text-2xl">
                    {getInitials(member.firstname, member.lastname)}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-2xl">{formatName(member.firstname, member.lastname)}</CardTitle>
                <div className="mt-2 flex gap-2">
                  <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                    {member.status}
                  </Badge>
                  {member.member_type === 'child' ? (
                    <Badge variant="secondary" className="text-xs">Child</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">Adult</Badge>
                  )}
                  {member.role !== 'member' && (
                    <Badge variant="outline" className="text-xs capitalize">{member.role}</Badge>
                  )}
                </div>
                {member.occupation && (
                  <p className="mt-2 text-sm text-muted-foreground">{member.occupation}</p>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Contact Information */}
                {(member.email || member.phone) && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Contact Information</h4>
                {member.email && (
                  <div className="flex items-center text-sm">
                    <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{member.email}</span>
                  </div>
                )}
                {member.phone && (
                  <div className="flex items-center text-sm">
                    <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{formatPhoneNumber(member.phone)}</span>
                  </div>
                )}
                  </div>
                )}

                {/* Personal Information */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Personal Information</h4>
                  {member.gender && (
                  <div className="flex items-center text-sm">
                      <User className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="capitalize">{member.gender}</span>
                    </div>
                  )}
                  {member.birth_date && (
                    <div className="flex items-center text-sm">
                      <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>Birth: {format(new Date(member.birth_date), 'MMM d, yyyy')} {calculateAge(member.birth_date) && `(${calculateAge(member.birth_date)} years old)`}</span>
                    </div>
                  )}
                  {member.join_date && (
                    <div className="flex items-center text-sm">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>Joined: {format(new Date(member.join_date), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                </div>

                {/* Address Information */}
                {member.address && member.address.street && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Address</h4>
                    <div className="flex items-start text-sm">
                      <MapPin className="mr-2 h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <div>{member.address.street}</div>
                        <div className="text-muted-foreground">
                          {[
                        member.address.city,
                        member.address.state,
                        member.address.zip
                      ].filter(Boolean).join(', ')}
                  </div>
                        {member.address.country && (
                          <div className="text-muted-foreground">{member.address.country}</div>
                )}
                </div>
              </div>
                  </div>
                )}

                {/* Communication Preferences */}
                {member.communication_preferences && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Communication Preferences</h4>
                    <div className="flex flex-wrap gap-2">
                      {member.communication_preferences.sms && (
                        <Badge variant="outline" className="text-xs">SMS</Badge>
                      )}
                      {member.communication_preferences.email && (
                        <Badge variant="outline" className="text-xs">Email</Badge>
                      )}
                      {member.communication_preferences.mail && (
                        <Badge variant="outline" className="text-xs">Mail</Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Ministry Involvement */}
                {member.ministry_involvement && member.ministry_involvement.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Ministry Involvement</h4>
                    <div className="flex flex-wrap gap-2">
                      {member.ministry_involvement.map((ministry, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">{ministry}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {member.tags && member.tags.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {member.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}


              </div>

              {/* Family Information for Adults */}
              {member.member_type === 'adult' && (member.marital_status || member.spouse_name || member.anniversary_date) && (
                <div className="mt-4 p-3 bg-pink-50 dark:bg-pink-950/20 rounded-lg border border-pink-200 dark:border-pink-800">
                  <h3 className="font-semibold text-pink-900 dark:text-pink-100 mb-2 text-sm">Family Information</h3>
                  <div className="space-y-1 text-xs">
                    {member.marital_status && (
                      <div className="flex items-center gap-2">
                        <Heart className="h-3 w-3 text-pink-600" />
                        <span className="capitalize">{member.marital_status}</span>
                      </div>
                    )}
                    {member.spouse_name && (
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-pink-600" />
                        <span>Spouse: {member.spouse_name}</span>
                      </div>
                    )}
                    {member.anniversary_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-pink-600" />
                        <span>Anniversary: {format(new Date(member.anniversary_date), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                    {member.has_children && (
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 text-pink-600" />
                        <span>Has Children</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Emergency Contact */}
              {member.emergency_contact && (member.emergency_contact.name || member.emergency_contact.phone) && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                  <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2 text-sm">Emergency Contact</h3>
                  <div className="space-y-1 text-xs">
                    {member.emergency_contact.name && (
                      <div className="flex items-center gap-2">
                        <Shield className="h-3 w-3 text-red-600" />
                        <span>{member.emergency_contact.name}</span>
                      </div>
                    )}
                    {member.emergency_contact.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-red-600" />
                        <span>{formatPhoneNumber(member.emergency_contact.phone)}</span>
                      </div>
                    )}
                    {member.emergency_contact.relationship && (
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-red-600" />
                        <span className="capitalize">{member.emergency_contact.relationship}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Guardian Information for Children */}
              {member.member_type === 'child' && (
                <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2 text-sm">Guardians</h3>
                  {isGuardiansLoading ? (
                    <div className="text-xs text-orange-700 dark:text-orange-300">Loading guardians...</div>
                  ) : guardians.length > 0 ? (
                    <div className="space-y-3">
                      {guardians.map((guardian, index) => (
                        <div key={guardian.id} className="flex items-start gap-3 p-2 bg-white dark:bg-gray-800 rounded-lg border border-orange-200 dark:border-orange-800">
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
                    <div className="text-xs text-orange-700 dark:text-orange-300">No guardians assigned</div>
                  )}
                </div>
              )}

              {/* Notes */}
              {member.notes && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-950/20 rounded-lg border border-gray-200 dark:border-gray-800">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm">Notes</h3>
                  <p className="text-xs text-gray-700 dark:text-gray-300">{member.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Tabs defaultValue="attendance">
            <TabsList>
              <TabsTrigger value="attendance">
                <Church className="h-4 w-4 mr-2" />
                Attendance
              </TabsTrigger>
              <TabsTrigger value="giving">
                <DollarSign className="h-4 w-4 mr-2" />
                Giving
              </TabsTrigger>
              <TabsTrigger value="family">
                <Users className="h-4 w-4 mr-2" />
                Family
              </TabsTrigger>
              <TabsTrigger value="groups">
                <Users className="h-4 w-4 mr-2" />
                Groups
              </TabsTrigger>
              <TabsTrigger value="details">
                <FileText className="h-4 w-4 mr-2" />
                All Details
              </TabsTrigger>
              <TabsTrigger value="notes">
                <Clock className="h-4 w-4 mr-2" />
                Notes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="attendance">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Attendance History</CardTitle>
                    <CardDescription>
                      View person's attendance records and statistics
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      loadPastEvents();
                      setIsRetroCheckInOpen(true);
                    }}
                    variant="outline"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Check In to Past Event
                  </Button>
                </CardHeader>
                <CardContent>
                  {isAttendanceLoading ? (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">Loading attendance history...</p>
                    </div>
                  ) : attendance.length > 0 ? (
                    <div className="space-y-6">
                      {/* Attendance by Event Type */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Attendance by Event Type</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                              <Card key={eventType}>
                                                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-medium capitalize">{eventType}</h4>
                                    <div className="flex items-center gap-2">
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                      <span className="text-lg font-bold text-green-600">{stats.attended}</span>
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
                          <h3 className="text-lg font-semibold mb-4">Volunteer History</h3>
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
                      )}

                      {/* Recent Attendance */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Recent Attendance</h3>
                    <div className="space-y-4">
                          {attendance.slice(0, 10).map((record) => (
                        <Card key={record.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <p className="font-medium">{record.events.title}</p>
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Calendar className="h-4 w-4 mr-2" />
                                  {format(new Date(record.events.start_date), 'MMM d, yyyy • h:mm a')}
                                </div>
                                {record.events.location && (
                                  <div className="flex items-center text-sm text-muted-foreground">
                                    <MapPin className="h-4 w-4 mr-2" />
                                    {record.events.location}
                                  </div>
                                )}
                              </div>
                                  {volunteers.some(v => v.event_id === record.events.id) && (
                                    <Badge variant="destructive" className="ml-2">
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
                          <div className="text-center mt-4">
                            <p className="text-sm text-muted-foreground">
                              Showing 10 of {attendance.length} events
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-2">No attendance records found</p>
                      <p className="text-sm text-muted-foreground">
                        This person hasn't attended any events yet.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="giving">
              <Card>
                <CardHeader>
                  <CardTitle>Giving History</CardTitle>
                  <CardDescription>
                    View {member?.firstname} {member?.lastname}'s donation records and statistics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isDonationsLoading ? (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">Loading giving history...</p>
                    </div>
                  ) : donations.length > 0 ? (
                    <div className="space-y-6">
                      {/* Giving Statistics */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Giving Statistics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                                <Card>
                                  <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-sm text-muted-foreground">Total Given</p>
                                        <p className="text-2xl font-bold text-green-600">
                                          ${totalAmount.toLocaleString()}
                                        </p>
                                      </div>
                                      <DollarSign className="h-8 w-8 text-green-600" />
                                    </div>
                                  </CardContent>
                                </Card>
                                <Card>
                                  <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-sm text-muted-foreground">This Year</p>
                                        <p className="text-2xl font-bold text-blue-600">
                                          ${thisYearAmount.toLocaleString()}
                                        </p>
                                      </div>
                                      <Calendar className="h-8 w-8 text-blue-600" />
                                    </div>
                                  </CardContent>
                                </Card>
                                <Card>
                                  <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-sm text-muted-foreground">Average Gift</p>
                                        <p className="text-2xl font-bold text-purple-600">
                                          ${averageDonation.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                        </p>
                                      </div>
                                      <Heart className="h-8 w-8 text-purple-600" />
                                    </div>
                                  </CardContent>
                                </Card>
                                <Card>
                                  <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-sm text-muted-foreground">Total Gifts</p>
                                        <p className="text-2xl font-bold text-orange-600">
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

            <TabsContent value="groups">
              <Card>
                <CardHeader>
                  <CardTitle>Groups</CardTitle>
                  <CardDescription>
                    Person's group memberships
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isGroupsLoading ? (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">Loading groups...</p>
                    </div>
                  ) : groups.length > 0 ? (
                    <div className="space-y-4">
                      {groups.map((item) => (
                        <Card key={item.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <p className="font-medium">{item.group.name}</p>
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <User className="h-4 w-4 mr-2" />
                                  {item.group.leader ? 
                                    `${item.group.leader.firstname} ${item.group.leader.lastname}` : 
                                    'No leader assigned'}
                                </div>
                                {item.group.description && (
                                  <p className="text-sm text-muted-foreground">
                                    {item.group.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">No group memberships found.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>All Member Details</CardTitle>
                  <CardDescription>
                    Complete information for {member?.firstname} {member?.lastname}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="font-medium">Full Name:</span>
                          <span>{member?.firstname} {member?.lastname}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Member Type:</span>
                          <Badge variant={member?.member_type === 'child' ? 'secondary' : 'outline'}>
                            {member?.member_type}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Status:</span>
                          <Badge variant={member?.status === 'active' ? 'default' : 'secondary'}>
                            {member?.status}
                          </Badge>
                        </div>
                        {member?.role && member?.role !== 'member' && (
                          <div className="flex justify-between">
                            <span className="font-medium">Role:</span>
                            <Badge variant="outline" className="capitalize">{member?.role}</Badge>
                          </div>
                        )}
                        {member?.gender && (
                          <div className="flex justify-between">
                            <span className="font-medium">Gender:</span>
                            <span className="capitalize">{member?.gender}</span>
                          </div>
                        )}
                        {member?.occupation && (
                          <div className="flex justify-between">
                            <span className="font-medium">Occupation:</span>
                            <span>{member?.occupation}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">Important Dates</h3>
                      <div className="space-y-3">
                        {member?.birth_date && (
                          <div className="flex justify-between">
                            <span className="font-medium">Birth Date:</span>
                            <span>{format(new Date(member.birth_date), 'MMM d, yyyy')} {calculateAge(member.birth_date) && `(${calculateAge(member.birth_date)} years old)`}</span>
                          </div>
                        )}
                        {member?.join_date && (
                          <div className="flex justify-between">
                            <span className="font-medium">Join Date:</span>
                            <span>{format(new Date(member.join_date), 'MMM d, yyyy')}</span>
                          </div>
                        )}
                        {member?.anniversary_date && (
                          <div className="flex justify-between">
                            <span className="font-medium">Anniversary:</span>
                            <span>{format(new Date(member.anniversary_date), 'MMM d, yyyy')}</span>
                          </div>
                        )}
                        {member?.last_attendance_date && (
                          <div className="flex justify-between">
                            <span className="font-medium">Last Attendance:</span>
                            <span>{format(new Date(member.last_attendance_date), 'MMM d, yyyy')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contact Information */}
                    {(member?.email || member?.phone) && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Contact Information</h3>
                        <div className="space-y-3">
                          {member?.email && (
                            <div className="flex justify-between">
                              <span className="font-medium">Email:</span>
                              <span className="text-blue-600 dark:text-blue-400">{member.email}</span>
                            </div>
                          )}
                          {member?.phone && (
                            <div className="flex justify-between">
                              <span className="font-medium">Phone:</span>
                              <span>{formatPhoneNumber(member.phone)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Address */}
                    {member?.address && member?.address.street && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Address</h3>
                        <div className="space-y-2">
                          <div>{member.address.street}</div>
                          <div className="text-muted-foreground">
                            {[
                              member.address.city,
                              member.address.state,
                              member.address.zip
                            ].filter(Boolean).join(', ')}
                          </div>
                          {member.address.country && (
                            <div className="text-muted-foreground">{member.address.country}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Family Information for Adults */}
                    {member?.member_type === 'adult' && (member?.marital_status || member?.spouse_name || member?.has_children) && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Family Information</h3>
                        <div className="space-y-3">
                          {member?.marital_status && (
                            <div className="flex justify-between">
                              <span className="font-medium">Marital Status:</span>
                              <span className="capitalize">{member.marital_status}</span>
                            </div>
                          )}
                          {member?.spouse_name && (
                            <div className="flex justify-between">
                              <span className="font-medium">Spouse:</span>
                              <span>{member.spouse_name}</span>
                            </div>
                          )}
                          {member?.has_children && (
                            <div className="flex justify-between">
                              <span className="font-medium">Has Children:</span>
                              <Badge variant="outline">Yes</Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Guardian Information for Children */}
                    {member?.member_type === 'child' && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Guardian Information</h3>
                        {isGuardiansLoading ? (
                          <div className="text-muted-foreground">Loading guardians...</div>
                        ) : guardians.length > 0 ? (
                          <div className="space-y-3">
                            {guardians.map((guardian, index) => (
                              <div key={guardian.id} className="border rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                  <Avatar className="h-10 w-10 flex-shrink-0">
                                    <AvatarImage src={guardian.image_url} />
                                    <AvatarFallback className="text-sm">
                                      {getInitials(guardian.firstname, guardian.lastname)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-2">
                                      <button
                                        onClick={() => navigate(`/members/${guardian.id}`)}
                                        className="font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                      >
                                        {guardian.firstname} {guardian.lastname}
                                      </button>
                                      {guardian.is_primary && (
                                        <Badge variant="outline" className="text-xs">Primary</Badge>
                                      )}
                                    </div>
                                    <div className="space-y-1 text-sm text-muted-foreground">
                                      <div>Relationship: {guardian.relationship}</div>
                                      {guardian.email && <div>Email: {guardian.email}</div>}
                                      {guardian.phone && <div>Phone: {formatPhoneNumber(guardian.phone)}</div>}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-muted-foreground">No guardians assigned</div>
                        )}
                      </div>
                    )}

                    {/* Emergency Contact */}
                    {member?.emergency_contact && (member?.emergency_contact.name || member?.emergency_contact.phone) && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Emergency Contact</h3>
                        <div className="space-y-3">
                          {member.emergency_contact.name && (
                            <div className="flex justify-between">
                              <span className="font-medium">Name:</span>
                              <span>{member.emergency_contact.name}</span>
                            </div>
                          )}
                          {member.emergency_contact.phone && (
                            <div className="flex justify-between">
                              <span className="font-medium">Phone:</span>
                              <span>{formatPhoneNumber(member.emergency_contact.phone)}</span>
                            </div>
                          )}
                          {member.emergency_contact.relationship && (
                            <div className="flex justify-between">
                              <span className="font-medium">Relationship:</span>
                              <span className="capitalize">{member.emergency_contact.relationship}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Communication Preferences */}
                    {member?.communication_preferences && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Communication Preferences</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="font-medium">SMS:</span>
                            <Badge variant={member.communication_preferences.sms ? 'default' : 'secondary'}>
                              {member.communication_preferences.sms ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Email:</span>
                            <Badge variant={member.communication_preferences.email ? 'default' : 'secondary'}>
                              {member.communication_preferences.email ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Mail:</span>
                            <Badge variant={member.communication_preferences.mail ? 'default' : 'secondary'}>
                              {member.communication_preferences.mail ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Ministry Involvement */}
                    {member?.ministry_involvement && member?.ministry_involvement.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Ministry Involvement</h3>
                        <div className="flex flex-wrap gap-2">
                          {member.ministry_involvement.map((ministry, index) => (
                            <Badge key={index} variant="secondary">{ministry}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {member?.tags && member?.tags.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                          {member.tags.map((tag, index) => (
                            <Badge key={index} variant="outline">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    )}



                    {/* Notes */}
                    {member?.notes && (
                      <div className="space-y-4 md:col-span-2">
                        <h3 className="text-lg font-semibold border-b pb-2">Notes</h3>
                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                          <p className="text-gray-700 dark:text-gray-300">{member.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes">
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                  <CardDescription>
                    Person's notes and history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">Notes functionality coming soon.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Member Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[95vw] lg:max-w-[1200px] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit {member.firstname} {member.lastname}</DialogTitle>
            <DialogDescription>
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
    </div>
  );
} 
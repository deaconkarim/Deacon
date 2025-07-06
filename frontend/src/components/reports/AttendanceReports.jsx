import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, subMonths } from 'date-fns';
import { Calendar, Download, Users, TrendingUp, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';

export function AttendanceReports() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [dailyData, setDailyData] = useState([]);
  const [serviceBreakdown, setServiceBreakdown] = useState([]);
  const [memberStats, setMemberStats] = useState([]);
  const [eventDetails, setEventDetails] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isTopAttendeesOpen, setIsTopAttendeesOpen] = useState(true);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(true);
  const [isAddingAttendee, setIsAddingAttendee] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [members, setMembers] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadAttendanceData();
  }, [selectedMonth]);

  useEffect(() => {
    if (isAddingAttendee) {
      loadMembers();
    }
  }, [isAddingAttendee]);

  const loadAttendanceData = async () => {
    try {
      const startDate = startOfMonth(selectedMonth);
      const endDate = endOfMonth(selectedMonth);
      
      // Get today's date to filter only past events
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');

      // Fetch events for the selected month - ONLY PAST EVENTS
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .gte('start_date', format(startDate, 'yyyy-MM-dd'))
        .lte('start_date', Math.min(endDateStr, todayStr)) // Only include events up to today
        .order('start_date', { ascending: false }); // Order by date descending

      if (eventsError) throw eventsError;

      // Fetch attendance records for these events
      const { data: attendance, error: attendanceError } = await supabase
        .from('event_attendance')
        .select(`
          *,
          members (
            firstname,
            lastname
          )
        `)
        .in('event_id', events.map(e => e.id));

      if (attendanceError) throw attendanceError;

      const processedData = processAttendanceData(events, attendance);
      setDailyData(processedData.dailyData);
      setServiceBreakdown(processedData.serviceBreakdown);
      setMemberStats(processedData.memberStats);
      setEventDetails(processedData.eventDetails);
    } catch (error) {
      console.error('Error loading attendance data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load attendance data',
        variant: 'destructive'
      });
    }
  };

  const loadMembers = async () => {
    try {
      setIsLoadingMembers(true);
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('firstname', { ascending: true });

      if (error) throw error;

      // Filter out members who have already attended
      const filteredMembers = data.filter(member => {
        const memberName = `${member.firstname} ${member.lastname}`;
        return !selectedEvent?.attendingMembers?.includes(memberName);
      });

      setMembers(filteredMembers);
    } catch (error) {
      console.error('Error loading members:', error);
      toast({
        title: 'Error',
        description: 'Failed to load members',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const processAttendanceData = (events, attendance) => {
    // Events are already sorted by date from the database query
    const sortedEvents = events;

    // Process daily attendance data
    const dailyData = sortedEvents.map(event => {
      const eventAttendance = attendance.filter(a => a.event_id === event.id);
      const attendingCount = eventAttendance.filter(a => 
        a.status === 'checked-in' || a.status === 'attending'
      ).length;

      return {
        date: format(parseISO(event.start_date), 'MMM d'),
        count: attendingCount
      };
    });

    // Process service breakdown
    const serviceBreakdown = sortedEvents.reduce((acc, event) => {
      const eventAttendance = attendance.filter(a => a.event_id === event.id);
      const attendingCount = eventAttendance.filter(a => 
        a.status === 'checked-in' || a.status === 'attending'
      ).length;

      const type = event.event_type || 'Other';
      if (!acc[type]) {
        acc[type] = 0;
      }
      acc[type] += attendingCount;
      return acc;
    }, {});

    // Format service breakdown data for the chart
    const formattedServiceBreakdown = Object.entries(serviceBreakdown)
      .map(([name, value]) => ({
        name,
        value: value || 0
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);

    // Process member statistics
    const memberStatsObj = attendance.reduce((acc, record) => {
      if (record.status === 'checked-in' || record.status === 'attending') {
        const memberName = `${record.members.firstname} ${record.members.lastname}`;
        if (!acc[memberName]) {
          acc[memberName] = 0;
        }
        acc[memberName]++;
      }
      return acc;
    }, {});

    // Convert member stats object to array and sort by attendance count
    const memberStats = Object.entries(memberStatsObj)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Get top 10 attendees

    // Process event details
    const eventDetails = sortedEvents.map(event => {
      const eventAttendance = attendance.filter(a => a.event_id === event.id);
      const attendingMembers = eventAttendance
        .filter(a => a.status === 'checked-in' || a.status === 'attending')
        .map(a => `${a.members.firstname} ${a.members.lastname}`)
        .sort();

      return {
        id: event.id,
        title: event.title,
        date: event.start_date,
        type: event.event_type || 'Other',
        attendees: attendingMembers.length,
        attendingMembers
      };
    });

    return {
      dailyData,
      serviceBreakdown: formattedServiceBreakdown,
      memberStats,
      eventDetails
    };
  };

  const handleExport = () => {
    const headers = ['Date', 'Attendees'];
    const csvContent = [
      headers.join(','),
      ...dailyData.map(row => `${row.date},${row.count}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `attendance-${format(selectedMonth, 'yyyy-MM')}.csv`;
    link.click();
  };

  const handleAddAttendee = async () => {
    if (!selectedMember || !selectedEvent) return;

    try {
      const { error } = await supabase
        .from('event_attendance')
        .insert({
          event_id: selectedEvent.id,
          member_id: selectedMember.id,
          status: 'checked-in',
          check_in_time: new Date().toISOString()
        });

      if (error) throw error;

      // Refresh the event details
      const { data: attendance, error: attendanceError } = await supabase
        .from('event_attendance')
        .select(`
          *,
          members (
            firstname,
            lastname
          )
        `)
        .eq('event_id', selectedEvent.id);

      if (attendanceError) throw attendanceError;

      const updatedEvent = {
        ...selectedEvent,
        attendingMembers: attendance
          .filter(a => a.status === 'checked-in' || a.status === 'attending')
          .map(a => `${a.members.firstname} ${a.members.lastname}`)
          .sort(),
        attendees: attendance.filter(a => 
          a.status === 'checked-in' || a.status === 'attending'
        ).length
      };

      setSelectedEvent(updatedEvent);
      setSelectedMember(null);
      setIsAddingAttendee(false);
      toast({
        title: 'Success',
        description: 'Attendee added successfully'
      });
    } catch (error) {
      console.error('Error adding attendee:', error);
      toast({
        title: 'Error',
        description: 'Failed to add attendee',
        variant: 'destructive'
      });
    }
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setIsEventDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select
            value={format(selectedMonth, 'yyyy-MM')}
            onValueChange={(value) => setSelectedMonth(parseISO(value))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const date = subMonths(new Date(), i);
                return (
                  <SelectItem key={format(date, 'yyyy-MM')} value={format(date, 'yyyy-MM')}>
                    {format(date, 'MMMM yyyy')}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Daily Attendance</CardTitle>
              <CardDescription>Attendance trends for {format(selectedMonth, 'MMMM yyyy')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#2563eb"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service Breakdown</CardTitle>
              <CardDescription>Attendance by service type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Service Breakdown</h4>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={serviceBreakdown}>
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        interval={0}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#2563eb" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Attendees</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsTopAttendeesOpen(!isTopAttendeesOpen)}
                >
                  {isTopAttendeesOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CardHeader>
              {isTopAttendeesOpen && (
                <CardContent>
                  <div className="space-y-1">
                    {memberStats.map((member) => (
                      <div
                        key={member.name}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100"
                      >
                        <span>{member.name}</span>
                        <span>{member.count} events</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Event Details</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEventDetailsOpen(!isEventDetailsOpen)}
                >
                  {isEventDetailsOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CardHeader>
              {isEventDetailsOpen && (
                <CardContent>
                  <div className="space-y-1">
                    {[...eventDetails].reverse().map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleEventClick(event)}
                      >
                        <div>
                          <div className="font-medium">{event.title}</div>
                          <div className="text-sm text-gray-500">
                            {event.date && format(parseISO(event.date), 'MMMM d, yyyy')}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {event.attendees} attended
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      )}

      <Dialog 
        open={isEventDialogOpen} 
        onOpenChange={(open) => {
          setIsEventDialogOpen(open);
          if (!open) {
            setSelectedEvent(null);
            setIsAddingAttendee(false);
            setSelectedMember(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>
              {selectedEvent?.date && format(parseISO(selectedEvent.date), 'MMMM d, yyyy')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {selectedEvent?.type}
              </div>
              <div className="text-sm font-medium">
                {selectedEvent?.attendees} attended
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Attended Members</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingAttendee(true)}
                >
                  Add Attendee
                </Button>
              </div>
              {isAddingAttendee && (
                <div className="space-y-2 p-4 border rounded-lg">
                  <Select
                    value={selectedMember?.id}
                    onValueChange={(value) => {
                      const member = members.find(m => m.id === value);
                      setSelectedMember(member);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a member" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingMembers ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : (
                        members.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.firstname} {member.lastname}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsAddingAttendee(false);
                        setSelectedMember(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddAttendee}
                      disabled={!selectedMember}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              )}
              <div className="max-h-[300px] overflow-y-auto space-y-1">
                {selectedEvent?.attendingMembers?.map((member) => (
                  <div
                    key={member}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100"
                  >
                    <span>{member}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
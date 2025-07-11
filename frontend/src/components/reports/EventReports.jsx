import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Filter, 
  Clock,
  Users,
  MapPin,
  Heart,
  Star,
  Target,
  BarChart3,
  PieChart,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Settings,
  FileText,
  Printer,
  Share2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  HelpCircle,
  Plus,
  Minus,
  Equal,
  Award,
  Zap,
  UserPlus,
  UserMinus,
  UserCog,
  Building,
  Car,
  GraduationCap,
  Briefcase,
  Camera,
  Music,
  BookOpen,
  Shield,
  Gift,
  Activity,
  Home,
  Mail,
  Phone,
  Baby,
  Crown
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart,
  ScatterChart,
  Scatter
} from 'recharts';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabaseClient';

export function EventReports() {
  const [selectedDateRange, setSelectedDateRange] = useState('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [eventData, setEventData] = useState({
    totalEvents: 0,
    totalAttendance: 0,
    averageAttendance: 0,
    eventTypes: [],
    eventPerformance: [],
    attendanceTrend: [],
    eventCategories: [],
    topEvents: [],
    eventLocations: [],
    eventEngagement: [],
    volunteerStats: [],
    eventFeedback: [],
    eventCosts: [],
    eventRevenue: []
  });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadEventData();
  }, [selectedDateRange, selectedMonth]);

  const loadEventData = async () => {
    setIsLoading(true);
    try {
      const startDate = startOfMonth(selectedMonth);
      const endDate = endOfMonth(selectedMonth);
      
      // Get current user's organization ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: orgUser, error: orgError } = await supabase
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (orgError || !orgUser) throw new Error('Unable to determine organization');
      
      // Fetch events for the selected period and organization
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('organization_id', orgUser.organization_id)
        .gte('start_date', format(startDate, 'yyyy-MM-dd'))
        .lte('start_date', format(endDate, 'yyyy-MM-dd'))
        .order('start_date', { ascending: false });

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

      const processedData = processEventData(events, attendance);
      setEventData(processedData);
    } catch (error) {
      console.error('Error loading event data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load event data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processEventData = (events, attendance) => {
    const totalEvents = events.length;
    const totalAttendance = attendance.filter(a => 
      a.status === 'checked-in' || a.status === 'attending'
    ).length;
    const averageAttendance = totalEvents > 0 ? Math.round(totalAttendance / totalEvents) : 0;

    // Event types breakdown
    const eventTypes = events.reduce((acc, event) => {
      const type = event.event_type || 'Other';
      if (!acc[type]) {
        acc[type] = { count: 0, attendance: 0 };
      }
      acc[type].count += 1;
      
      const eventAttendance = attendance.filter(a => 
        a.event_id === event.id && (a.status === 'checked-in' || a.status === 'attending')
      );
      acc[type].attendance += eventAttendance.length;
      return acc;
    }, {});

    const eventTypesData = Object.entries(eventTypes).map(([type, data]) => ({
      type,
      count: data.count,
      attendance: data.attendance,
      avgAttendance: Math.round(data.attendance / data.count)
    }));

    // Event performance (last 12 months)
    const eventPerformance = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(new Date(), i);
      const monthEvents = events.filter(e => {
        const eventDate = parseISO(e.start_date);
        return eventDate.getMonth() === date.getMonth() && 
               eventDate.getFullYear() === date.getFullYear();
      });
      const monthAttendance = attendance.filter(a => {
        const event = events.find(e => e.id === a.event_id);
        if (!event) return false;
        const eventDate = parseISO(event.start_date);
        return eventDate.getMonth() === date.getMonth() && 
               eventDate.getFullYear() === date.getFullYear() &&
               (a.status === 'checked-in' || a.status === 'attending');
      });
      
      return {
        month: format(date, 'MMM yyyy'),
        events: monthEvents.length,
        attendance: monthAttendance.length,
        avgAttendance: monthEvents.length > 0 ? Math.round(monthAttendance.length / monthEvents.length) : 0
      };
    }).reverse();

    // Attendance trend
    const attendanceTrend = events.map(event => {
      const eventAttendance = attendance.filter(a => 
        a.event_id === event.id && (a.status === 'checked-in' || a.status === 'attending')
      );
      return {
        event: event.title,
        date: format(parseISO(event.start_date), 'MMM d'),
        attendance: eventAttendance.length,
        capacity: event.capacity || 100,
        percentage: Math.round((eventAttendance.length / (event.capacity || 100)) * 100)
      };
    }).sort((a, b) => parseISO(a.date) - parseISO(b.date));

    // Event categories
    const eventCategories = [
      { category: 'Worship Services', count: Math.floor(totalEvents * 0.4), avgAttendance: 85 },
      { category: 'Bible Study', count: Math.floor(totalEvents * 0.2), avgAttendance: 15 },
      { category: 'Youth Events', count: Math.floor(totalEvents * 0.15), avgAttendance: 25 },
      { category: 'Social Events', count: Math.floor(totalEvents * 0.1), avgAttendance: 40 },
      { category: 'Prayer Meetings', count: Math.floor(totalEvents * 0.1), avgAttendance: 12 },
      { category: 'Special Events', count: Math.floor(totalEvents * 0.05), avgAttendance: 60 }
    ];

    // Top events by attendance
    const topEvents = events.map(event => {
      const eventAttendance = attendance.filter(a => 
        a.event_id === event.id && (a.status === 'checked-in' || a.status === 'attending')
      );
      return {
        title: event.title,
        date: event.start_date,
        type: event.event_type || 'Other',
        attendance: eventAttendance.length,
        capacity: event.capacity || 100,
        percentage: Math.round((eventAttendance.length / (event.capacity || 100)) * 100)
      };
    }).sort((a, b) => b.attendance - a.attendance).slice(0, 10);

    // Event locations (mock)
    const eventLocations = [
      { location: 'Main Sanctuary', events: Math.floor(totalEvents * 0.6), avgAttendance: 75 },
      { location: 'Fellowship Hall', events: Math.floor(totalEvents * 0.2), avgAttendance: 30 },
      { location: 'Youth Room', events: Math.floor(totalEvents * 0.1), avgAttendance: 20 },
      { location: 'Prayer Room', events: Math.floor(totalEvents * 0.05), avgAttendance: 12 },
      { location: 'Outdoor Area', events: Math.floor(totalEvents * 0.05), avgAttendance: 50 }
    ];

    // Event engagement levels
    const eventEngagement = [
      { level: 'High Engagement', count: Math.floor(totalEvents * 0.3), color: '#10b981' },
      { level: 'Medium Engagement', count: Math.floor(totalEvents * 0.5), color: '#3b82f6' },
      { level: 'Low Engagement', count: Math.floor(totalEvents * 0.2), color: '#f59e0b' }
    ];

    // Volunteer stats (mock)
    const volunteerStats = [
      { area: 'Worship Team', events: 12, volunteers: 8, avgPerEvent: 2.5 },
      { area: 'Children\'s Ministry', events: 8, volunteers: 6, avgPerEvent: 3.2 },
      { area: 'Greeting Team', events: 15, volunteers: 4, avgPerEvent: 1.8 },
      { area: 'Technical Support', events: 10, volunteers: 3, avgPerEvent: 1.5 },
      { area: 'Prayer Team', events: 5, volunteers: 5, avgPerEvent: 2.0 }
    ];

    // Event feedback (mock)
    const eventFeedback = [
      { event: 'Sunday Service', rating: 4.8, feedback: 15, positive: 14 },
      { event: 'Youth Group', rating: 4.6, feedback: 8, positive: 7 },
      { event: 'Bible Study', rating: 4.7, feedback: 12, positive: 11 },
      { event: 'Prayer Meeting', rating: 4.9, feedback: 6, positive: 6 },
      { event: 'Social Event', rating: 4.5, feedback: 10, positive: 9 }
    ];

    // Event costs and revenue (mock)
    const eventCosts = [
      { category: 'Worship Services', cost: 1200, revenue: 0, net: -1200 },
      { category: 'Youth Events', cost: 800, revenue: 200, net: -600 },
      { category: 'Social Events', cost: 500, revenue: 300, net: -200 },
      { category: 'Special Events', cost: 1500, revenue: 800, net: -700 },
      { category: 'Bible Study', cost: 200, revenue: 0, net: -200 }
    ];

    return {
      totalEvents,
      totalAttendance,
      averageAttendance,
      eventTypes: eventTypesData,
      eventPerformance,
      attendanceTrend,
      eventCategories,
      topEvents,
      eventLocations,
      eventEngagement,
      volunteerStats,
      eventFeedback,
      eventCosts,
      eventRevenue: eventCosts // Using same data for demo
    };
  };

  const handleExport = (type) => {
    const headers = {
      events: ['Event', 'Date', 'Type', 'Attendance', 'Capacity', 'Percentage'],
      performance: ['Month', 'Events', 'Attendance', 'Avg Attendance'],
      feedback: ['Event', 'Rating', 'Feedback Count', 'Positive Feedback']
    };

    const data = eventData[type] || [];
    const csvContent = [
      headers[type].join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `event-${type}-${format(selectedMonth, 'yyyy-MM')}.csv`;
    link.click();
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const StatCard = ({ title, value, change, icon: Icon, color = "bg-blue-500" }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change && (
              <div className="flex items-center mt-1">
                {change > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {Math.abs(change)}% from last month
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${color} text-white`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Event Reports</h2>
          <p className="text-muted-foreground">Comprehensive event analytics and performance insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={format(selectedMonth, 'yyyy-MM')} onValueChange={(value) => setSelectedMonth(parseISO(value))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
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
          <Button variant="outline" onClick={() => handleExport('events')}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Events"
              value={eventData.totalEvents}
              change={8.3}
              icon={Calendar}
              color="bg-gradient-to-r from-blue-500 to-cyan-500"
            />
            <StatCard
              title="Total Attendance"
              value={eventData.totalAttendance}
              change={12.5}
              icon={Users}
              color="bg-gradient-to-r from-green-500 to-emerald-500"
            />
            <StatCard
              title="Avg Attendance"
              value={eventData.averageAttendance}
              change={5.2}
              icon={TrendingUp}
              color="bg-gradient-to-r from-purple-500 to-pink-500"
            />
            <StatCard
              title="Event Types"
              value={eventData.eventTypes?.length || 0}
              change={2.1}
              icon={Activity}
              color="bg-gradient-to-r from-yellow-500 to-orange-500"
            />
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
              <TabsTrigger value="volunteers">Volunteers</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Event Performance Trend</CardTitle>
                    <CardDescription>Event and attendance trends over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={eventData.eventPerformance}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip />
                          <Legend />
                          <Bar yAxisId="left" dataKey="events" fill="#8884d8" name="Events" />
                          <Line yAxisId="right" type="monotone" dataKey="attendance" stroke="#82ca9d" name="Attendance" />
                          <Line yAxisId="right" type="monotone" dataKey="avgAttendance" stroke="#ffc658" name="Avg Attendance" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Event Types</CardTitle>
                    <CardDescription>Distribution by event type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={eventData.eventTypes}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {eventData.eventTypes.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Events</CardTitle>
                    <CardDescription>Events with highest attendance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {eventData.topEvents?.slice(0, 5).map((event, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                          <div>
                            <p className="font-medium">{event.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {event.date && format(parseISO(event.date), 'MMM d, yyyy')} • {event.type}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{event.attendance} attendees</p>
                            <Badge variant="outline">{event.percentage}% capacity</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Event Locations</CardTitle>
                    <CardDescription>Events by location</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {eventData.eventLocations?.map((location, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center space-x-3">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{location.location}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{location.events} events</p>
                            <p className="text-sm text-muted-foreground">Avg {location.avgAttendance} attendees</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Event Performance Analysis</CardTitle>
                  <CardDescription>Detailed performance metrics and trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={eventData.eventPerformance}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="events" stackId="1" stroke="#8884d8" fill="#8884d8" />
                        <Area type="monotone" dataKey="attendance" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                        <Area type="monotone" dataKey="avgAttendance" stackId="1" stroke="#ffc658" fill="#ffc658" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Trends</CardTitle>
                  <CardDescription>Attendance patterns and capacity utilization</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={eventData.attendanceTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="attendance" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="categories" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Event Categories</CardTitle>
                  <CardDescription>Performance by event category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {eventData.eventCategories?.map((category, index) => (
                      <div key={index} className="p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold">{category.category}</h4>
                          <Badge variant="outline">{category.count} events</Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Average Attendance</span>
                            <span>{category.avgAttendance} attendees</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min((category.avgAttendance / 100) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="feedback" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Event Feedback</CardTitle>
                  <CardDescription>Event ratings and feedback analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {eventData.eventFeedback?.map((feedback, index) => (
                      <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star key={i} className={`w-4 h-4 ${i < Math.floor(feedback.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                            ))}
                          </div>
                          <div>
                            <p className="font-semibold">{feedback.event}</p>
                            <p className="text-sm text-muted-foreground">
                              {feedback.feedback} feedback responses
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{feedback.rating}/5</p>
                          <Badge variant="outline">{feedback.positive}/{feedback.feedback} positive</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="volunteers" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Volunteer Participation</CardTitle>
                  <CardDescription>Volunteer involvement by ministry area</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {eventData.volunteerStats?.map((area, index) => (
                      <div key={index} className="p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold">{area.area}</h4>
                          <Badge variant="outline">{area.volunteers} volunteers</Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Events Covered</span>
                            <span>{area.events} events</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span>Average per Event</span>
                            <span>{area.avgPerEvent} volunteers</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min((area.volunteers / (area.events * 3)) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Event Detail Dialog */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>Detailed event information and statistics</DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Attendance</p>
                  <p className="text-2xl font-bold">{selectedEvent.attendance}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Capacity</p>
                  <p className="text-lg font-semibold">{selectedEvent.capacity}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 
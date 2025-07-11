import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, parseISO, differenceInYears } from 'date-fns';
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  UserX, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Filter, 
  Calendar,
  MapPin,
  Mail,
  Phone,
  Heart,
  Baby,
  Crown,
  GraduationCap,
  Briefcase,
  Home,
  Building,
  Car,
  Camera,
  Music,
  BookOpen,
  Shield,
  Gift,
  Activity,
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
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  HelpCircle,
  Plus,
  Minus,
  Equal,
  Target,
  Star,
  Award,
  Zap,
  Users2,
  UserMinus,
  UserCog
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
import { getMembers } from '@/lib/data';
import { supabase } from '@/lib/supabaseClient';

export function MemberReports() {
  const [selectedDateRange, setSelectedDateRange] = useState('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [memberData, setMemberData] = useState({
    totalMembers: 0,
    activeMembers: 0,
    newMembers: 0,
    inactiveMembers: 0,
    demographics: {},
    growthTrend: [],
    engagementMetrics: [],
    memberTypes: [],
    ageDistribution: [],
    locationData: [],
    familyComposition: [],
    attendanceStats: [],
    volunteerStats: [],
    communicationStats: []
  });
  const [selectedMember, setSelectedMember] = useState(null);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadMemberData();
  }, [selectedDateRange, selectedMonth]);

  const loadMemberData = async () => {
    setIsLoading(true);
    try {
      const members = await getMembers();
      const processedData = processMemberData(members);
      setMemberData(processedData);
    } catch (error) {
      console.error('Error loading member data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load member data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processMemberData = (members) => {
    const totalMembers = members.length;
    const activeMembers = members.filter(m => m.status === 'active').length;
    const newMembers = members.filter(m => {
      const joinDate = parseISO(m.join_date);
      const threeMonthsAgo = subMonths(new Date(), 3);
      return joinDate > threeMonthsAgo;
    }).length;
    const inactiveMembers = members.filter(m => m.status === 'inactive').length;

    // Demographics
    const demographics = {
      gender: {
        male: members.filter(m => m.gender === 'male').length,
        female: members.filter(m => m.gender === 'female').length,
        other: members.filter(m => !m.gender || m.gender === 'other').length
      },
      ageGroups: {
        '18-25': members.filter(m => {
          const age = m.birth_date ? differenceInYears(new Date(), parseISO(m.birth_date)) : 0;
          return age >= 18 && age <= 25;
        }).length,
        '26-35': members.filter(m => {
          const age = m.birth_date ? differenceInYears(new Date(), parseISO(m.birth_date)) : 0;
          return age >= 26 && age <= 35;
        }).length,
        '36-50': members.filter(m => {
          const age = m.birth_date ? differenceInYears(new Date(), parseISO(m.birth_date)) : 0;
          return age >= 36 && age <= 50;
        }).length,
        '51-65': members.filter(m => {
          const age = m.birth_date ? differenceInYears(new Date(), parseISO(m.birth_date)) : 0;
          return age >= 51 && age <= 65;
        }).length,
        '65+': members.filter(m => {
          const age = m.birth_date ? differenceInYears(new Date(), parseISO(m.birth_date)) : 0;
          return age > 65;
        }).length
      },
      memberTypes: {
        adult: members.filter(m => m.member_type === 'adult').length,
        child: members.filter(m => m.member_type === 'child').length,
        visitor: members.filter(m => m.member_type === 'visitor').length
      }
    };

    // Growth trend (mock data for last 12 months)
    const growthTrend = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(new Date(), i);
      return {
        month: format(date, 'MMM yyyy'),
        total: Math.floor(totalMembers * (0.8 + Math.random() * 0.4)),
        new: Math.floor(Math.random() * 10),
        active: Math.floor(totalMembers * (0.7 + Math.random() * 0.3))
      };
    }).reverse();

    // Engagement metrics
    const engagementMetrics = [
      { name: 'Highly Engaged', count: Math.floor(activeMembers * 0.3), color: '#10b981' },
      { name: 'Moderately Engaged', count: Math.floor(activeMembers * 0.5), color: '#3b82f6' },
      { name: 'Low Engagement', count: Math.floor(activeMembers * 0.2), color: '#f59e0b' },
      { name: 'Inactive', count: inactiveMembers, color: '#ef4444' }
    ];

    // Age distribution
    const ageDistribution = Object.entries(demographics.ageGroups).map(([range, count]) => ({
      range,
      count
    }));

    // Location data (mock)
    const locationData = [
      { city: 'Downtown', count: Math.floor(totalMembers * 0.4) },
      { city: 'North Side', count: Math.floor(totalMembers * 0.25) },
      { city: 'South Side', count: Math.floor(totalMembers * 0.2) },
      { city: 'East Side', count: Math.floor(totalMembers * 0.1) },
      { city: 'West Side', count: Math.floor(totalMembers * 0.05) }
    ];

    // Family composition
    const familyComposition = [
      { type: 'Single Adults', count: Math.floor(totalMembers * 0.3) },
      { type: 'Married Couples', count: Math.floor(totalMembers * 0.4) },
      { type: 'Families with Children', count: Math.floor(totalMembers * 0.2) },
      { type: 'Empty Nesters', count: Math.floor(totalMembers * 0.1) }
    ];

    // Attendance stats (mock)
    const attendanceStats = [
      { member: 'John Smith', attendance: 95, lastAttendance: '2024-12-15' },
      { member: 'Sarah Johnson', attendance: 88, lastAttendance: '2024-12-15' },
      { member: 'Mike Davis', attendance: 82, lastAttendance: '2024-12-08' },
      { member: 'Lisa Wilson', attendance: 78, lastAttendance: '2024-12-01' },
      { member: 'David Brown', attendance: 75, lastAttendance: '2024-12-08' }
    ];

    // Volunteer stats (mock)
    const volunteerStats = [
      { area: 'Worship Team', volunteers: 12, needed: 15 },
      { area: 'Children\'s Ministry', volunteers: 8, needed: 10 },
      { area: 'Greeting Team', volunteers: 6, needed: 8 },
      { area: 'Technical Support', volunteers: 4, needed: 6 },
      { area: 'Prayer Team', volunteers: 10, needed: 12 }
    ];

    // Communication stats (mock)
    const communicationStats = [
      { method: 'Email', subscribed: Math.floor(totalMembers * 0.8), active: Math.floor(totalMembers * 0.6) },
      { method: 'SMS', subscribed: Math.floor(totalMembers * 0.6), active: Math.floor(totalMembers * 0.4) },
      { method: 'Newsletter', subscribed: Math.floor(totalMembers * 0.7), active: Math.floor(totalMembers * 0.5) },
      { method: 'App Notifications', subscribed: Math.floor(totalMembers * 0.5), active: Math.floor(totalMembers * 0.3) }
    ];

    return {
      totalMembers,
      activeMembers,
      newMembers,
      inactiveMembers,
      demographics,
      growthTrend,
      engagementMetrics,
      memberTypes: Object.entries(demographics.memberTypes).map(([type, count]) => ({ type, count })),
      ageDistribution,
      locationData,
      familyComposition,
      attendanceStats,
      volunteerStats,
      communicationStats
    };
  };

  const handleExport = (type) => {
    const headers = {
      members: ['Name', 'Email', 'Phone', 'Member Type', 'Status', 'Join Date'],
      demographics: ['Category', 'Count', 'Percentage'],
      attendance: ['Member', 'Attendance %', 'Last Attendance']
    };

    const data = memberData[type] || [];
    const csvContent = [
      headers[type].join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `member-${type}-${format(selectedMonth, 'yyyy-MM')}.csv`;
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
          <h2 className="text-2xl font-bold">Member Analytics</h2>
          <p className="text-muted-foreground">Comprehensive member insights and demographics</p>
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
          <Button variant="outline" onClick={() => handleExport('members')}>
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
              title="Total Members"
              value={memberData.totalMembers}
              change={5.2}
              icon={Users}
              color="bg-gradient-to-r from-blue-500 to-cyan-500"
            />
            <StatCard
              title="Active Members"
              value={memberData.activeMembers}
              change={2.1}
              icon={UserCheck}
              color="bg-gradient-to-r from-green-500 to-emerald-500"
            />
            <StatCard
              title="New Members"
              value={memberData.newMembers}
              change={12.5}
              icon={UserPlus}
              color="bg-gradient-to-r from-purple-500 to-pink-500"
            />
            <StatCard
              title="Inactive Members"
              value={memberData.inactiveMembers}
              change={-3.2}
              icon={UserX}
              color="bg-gradient-to-r from-yellow-500 to-orange-500"
            />
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="demographics">Demographics</TabsTrigger>
              <TabsTrigger value="growth">Growth</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="volunteers">Volunteers</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Member Growth Trend</CardTitle>
                    <CardDescription>Member growth over the last 12 months</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={memberData.growthTrend}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip />
                          <Legend />
                          <Bar yAxisId="left" dataKey="new" fill="#8884d8" name="New Members" />
                          <Line yAxisId="right" type="monotone" dataKey="total" stroke="#82ca9d" name="Total Members" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Member Types</CardTitle>
                    <CardDescription>Distribution by member type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={memberData.memberTypes}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {memberData.memberTypes.map((entry, index) => (
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
                    <CardTitle>Age Distribution</CardTitle>
                    <CardDescription>Member age demographics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={memberData.ageDistribution}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="range" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Geographic Distribution</CardTitle>
                    <CardDescription>Members by location</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {memberData.locationData?.map((location, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center space-x-3">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{location.city}</span>
                          </div>
                          <Badge variant="outline">{location.count} members</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="demographics" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Gender Distribution</CardTitle>
                    <CardDescription>Member gender demographics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(memberData.demographics?.gender || {}).map(([gender, count]) => (
                        <div key={gender} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${
                              gender === 'male' ? 'bg-blue-500' : 
                              gender === 'female' ? 'bg-pink-500' : 'bg-gray-500'
                            }`}></div>
                            <span className="font-medium capitalize">{gender}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{count}</p>
                            <p className="text-sm text-muted-foreground">
                              {Math.round((count / memberData.totalMembers) * 100)}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Family Composition</CardTitle>
                    <CardDescription>Member family types</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {memberData.familyComposition?.map((family, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center space-x-3">
                            <Users2 className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{family.type}</span>
                          </div>
                          <Badge variant="outline">{family.count} members</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="growth" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Member Growth Analysis</CardTitle>
                  <CardDescription>Detailed growth trends and patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={memberData.growthTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="total" stackId="1" stroke="#8884d8" fill="#8884d8" />
                        <Area type="monotone" dataKey="active" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                        <Area type="monotone" dataKey="new" stackId="1" stroke="#ffc658" fill="#ffc658" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="engagement" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Member Engagement Levels</CardTitle>
                  <CardDescription>Engagement distribution and metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={memberData.engagementMetrics}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {memberData.engagementMetrics.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Attendees</CardTitle>
                  <CardDescription>Members with highest attendance rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {memberData.attendanceStats?.map((stat, index) => (
                      <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="text-sm">
                              {stat.member.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{stat.member}</p>
                            <p className="text-sm text-muted-foreground">
                              Last: {stat.lastAttendance && format(parseISO(stat.lastAttendance), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{stat.attendance}%</p>
                          <Badge variant="outline">Attendance Rate</Badge>
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
                  <CardTitle>Volunteer Needs</CardTitle>
                  <CardDescription>Volunteer requirements by ministry area</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {memberData.volunteerStats?.map((area, index) => (
                      <div key={index} className="p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold">{area.area}</h4>
                          <Badge variant={area.volunteers >= area.needed ? "default" : "secondary"}>
                            {area.volunteers >= area.needed ? "Filled" : "Needs Help"}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Current Volunteers</span>
                            <span>{area.volunteers} / {area.needed}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min((area.volunteers / area.needed) * 100, 100)}%` }}
                            ></div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{Math.round((area.volunteers / area.needed) * 100)}% filled</span>
                            <span>{area.needed - area.volunteers} more needed</span>
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

      {/* Member Detail Dialog */}
      <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedMember?.name}</DialogTitle>
            <DialogDescription>Detailed member information and statistics</DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Attendance Rate</p>
                  <p className="text-2xl font-bold">{selectedMember.attendance}%</p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Last Attendance</p>
                  <p className="text-lg font-semibold">
                    {selectedMember.lastAttendance && format(parseISO(selectedMember.lastAttendance), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 
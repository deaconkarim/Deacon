import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, parseISO, differenceInYears } from 'date-fns';
import { 
  Users2, 
  Home, 
  Heart, 
  Baby, 
  Crown, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Filter, 
  Calendar,
  MapPin,
  Mail,
  Phone,
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
  Gift
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
import { familyService } from '@/lib/familyService';
import { getMembers } from '@/lib/data';
import { supabase } from '@/lib/supabaseClient';

export function FamilyReports() {
  const [selectedDateRange, setSelectedDateRange] = useState('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [familyData, setFamilyData] = useState({
    totalFamilies: 0,
    totalMembers: 0,
    averageFamilySize: 0,
    familyComposition: [],
    familyGrowth: [],
    familyTypes: [],
    familySizes: [],
    familyLocations: [],
    familyEngagement: [],
    familyAttendance: [],
    familyVolunteering: [],
    familyGiving: [],
    familyEvents: [],
    familyCommunication: []
  });
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [isFamilyDialogOpen, setIsFamilyDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadFamilyData();
  }, [selectedDateRange, selectedMonth]);

  const loadFamilyData = async () => {
    setIsLoading(true);
    try {
      const families = await familyService.getFamilies();
      const members = await getMembers();
      const processedData = processFamilyData(families, members);
      setFamilyData(processedData);
    } catch (error) {
      console.error('Error loading family data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load family data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processFamilyData = (families, members) => {
    const totalFamilies = families.length;
    const totalMembers = members.length;
    const averageFamilySize = totalFamilies > 0 ? (totalMembers / totalFamilies).toFixed(1) : 0;

    // Family composition by type
    const familyComposition = [
      { type: 'Nuclear Families', count: Math.floor(totalFamilies * 0.6) },
      { type: 'Single Parent', count: Math.floor(totalFamilies * 0.2) },
      { type: 'Blended Families', count: Math.floor(totalFamilies * 0.1) },
      { type: 'Empty Nesters', count: Math.floor(totalFamilies * 0.05) },
      { type: 'Young Couples', count: Math.floor(totalFamilies * 0.05) }
    ];

    // Family sizes distribution
    const familySizes = [
      { size: '1-2 members', count: Math.floor(totalFamilies * 0.3) },
      { size: '3-4 members', count: Math.floor(totalFamilies * 0.4) },
      { size: '5-6 members', count: Math.floor(totalFamilies * 0.2) },
      { size: '7+ members', count: Math.floor(totalFamilies * 0.1) }
    ];

    // Family growth trend (mock data)
    const familyGrowth = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(new Date(), i);
      return {
        month: format(date, 'MMM yyyy'),
        families: Math.floor(totalFamilies * (0.8 + Math.random() * 0.4)),
        members: Math.floor(totalMembers * (0.8 + Math.random() * 0.4)),
        newFamilies: Math.floor(Math.random() * 5)
      };
    }).reverse();

    // Family types
    const familyTypes = [
      { type: 'With Children', count: Math.floor(totalFamilies * 0.7) },
      { type: 'Without Children', count: Math.floor(totalFamilies * 0.3) }
    ];

    // Family locations (mock)
    const familyLocations = [
      { area: 'Downtown', families: Math.floor(totalFamilies * 0.4) },
      { area: 'North Side', families: Math.floor(totalFamilies * 0.25) },
      { area: 'South Side', families: Math.floor(totalFamilies * 0.2) },
      { area: 'East Side', families: Math.floor(totalFamilies * 0.1) },
      { area: 'West Side', families: Math.floor(totalFamilies * 0.05) }
    ];

    // Family engagement levels
    const familyEngagement = [
      { level: 'Highly Engaged', count: Math.floor(totalFamilies * 0.3), color: '#10b981' },
      { level: 'Moderately Engaged', count: Math.floor(totalFamilies * 0.5), color: '#3b82f6' },
      { level: 'Low Engagement', count: Math.floor(totalFamilies * 0.2), color: '#f59e0b' }
    ];

    // Family attendance stats (mock)
    const familyAttendance = [
      { family: 'Smith Family', members: 4, avgAttendance: 95, lastAttendance: '2024-12-15' },
      { family: 'Johnson Family', members: 3, avgAttendance: 88, lastAttendance: '2024-12-15' },
      { family: 'Davis Family', members: 5, avgAttendance: 82, lastAttendance: '2024-12-08' },
      { family: 'Wilson Family', members: 2, avgAttendance: 78, lastAttendance: '2024-12-01' },
      { family: 'Brown Family', members: 4, avgAttendance: 75, lastAttendance: '2024-12-08' }
    ];

    // Family volunteering stats (mock)
    const familyVolunteering = [
      { area: 'Worship Team', families: 8, totalMembers: 12 },
      { area: 'Children\'s Ministry', families: 6, totalMembers: 10 },
      { area: 'Greeting Team', families: 4, totalMembers: 6 },
      { area: 'Technical Support', families: 3, totalMembers: 4 },
      { area: 'Prayer Team', families: 7, totalMembers: 10 }
    ];

    // Family giving stats (mock)
    const familyGiving = [
      { family: 'Smith Family', totalGiven: 2500, frequency: 'Monthly', lastGift: '2024-12-01' },
      { family: 'Johnson Family', totalGiven: 1800, frequency: 'Monthly', lastGift: '2024-12-01' },
      { family: 'Davis Family', totalGiven: 1200, frequency: 'Weekly', lastGift: '2024-12-08' },
      { family: 'Wilson Family', totalGiven: 900, frequency: 'Monthly', lastGift: '2024-11-15' },
      { family: 'Brown Family', totalGiven: 600, frequency: 'Monthly', lastGift: '2024-12-01' }
    ];

    // Family events participation (mock)
    const familyEvents = [
      { event: 'Sunday Service', families: Math.floor(totalFamilies * 0.9), avgMembers: 3.2 },
      { event: 'Youth Group', families: Math.floor(totalFamilies * 0.4), avgMembers: 1.5 },
      { event: 'Bible Study', families: Math.floor(totalFamilies * 0.6), avgMembers: 2.1 },
      { event: 'Prayer Meeting', families: Math.floor(totalFamilies * 0.3), avgMembers: 1.8 },
      { event: 'Social Events', families: Math.floor(totalFamilies * 0.7), avgMembers: 2.5 }
    ];

    // Family communication preferences (mock)
    const familyCommunication = [
      { method: 'Email', families: Math.floor(totalFamilies * 0.8), active: Math.floor(totalFamilies * 0.6) },
      { method: 'SMS', families: Math.floor(totalFamilies * 0.6), active: Math.floor(totalFamilies * 0.4) },
      { method: 'Newsletter', families: Math.floor(totalFamilies * 0.7), active: Math.floor(totalFamilies * 0.5) },
      { method: 'App Notifications', families: Math.floor(totalFamilies * 0.5), active: Math.floor(totalFamilies * 0.3) }
    ];

    return {
      totalFamilies,
      totalMembers,
      averageFamilySize,
      familyComposition,
      familyGrowth,
      familyTypes,
      familySizes,
      familyLocations,
      familyEngagement,
      familyAttendance,
      familyVolunteering,
      familyGiving,
      familyEvents,
      familyCommunication
    };
  };

  const handleExport = (type) => {
    const headers = {
      families: ['Family Name', 'Members', 'Type', 'Location', 'Engagement'],
      attendance: ['Family', 'Members', 'Avg Attendance', 'Last Attendance'],
      giving: ['Family', 'Total Given', 'Frequency', 'Last Gift']
    };

    const data = familyData[type] || [];
    const csvContent = [
      headers[type].join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `family-${type}-${format(selectedMonth, 'yyyy-MM')}.csv`;
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
          <h2 className="text-2xl font-bold">Family Reports</h2>
          <p className="text-muted-foreground">Comprehensive family analytics and insights</p>
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
          <Button variant="outline" onClick={() => handleExport('families')}>
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
              title="Total Families"
              value={familyData.totalFamilies}
              change={3.2}
              icon={Users2}
              color="bg-gradient-to-r from-blue-500 to-cyan-500"
            />
            <StatCard
              title="Total Members"
              value={familyData.totalMembers}
              change={5.1}
              icon={Users}
              color="bg-gradient-to-r from-green-500 to-emerald-500"
            />
            <StatCard
              title="Avg Family Size"
              value={familyData.averageFamilySize}
              change={1.8}
              icon={Home}
              color="bg-gradient-to-r from-purple-500 to-pink-500"
            />
            <StatCard
              title="Active Families"
              value={Math.floor(familyData.totalFamilies * 0.85)}
              change={2.3}
              icon={Heart}
              color="bg-gradient-to-r from-yellow-500 to-orange-500"
            />
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="composition">Composition</TabsTrigger>
              <TabsTrigger value="growth">Growth</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="volunteering">Volunteering</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Family Growth Trend</CardTitle>
                    <CardDescription>Family and member growth over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={familyData.familyGrowth}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip />
                          <Legend />
                          <Bar yAxisId="left" dataKey="newFamilies" fill="#8884d8" name="New Families" />
                          <Line yAxisId="right" type="monotone" dataKey="families" stroke="#82ca9d" name="Total Families" />
                          <Line yAxisId="right" type="monotone" dataKey="members" stroke="#ffc658" name="Total Members" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Family Types</CardTitle>
                    <CardDescription>Distribution by family composition</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={familyData.familyTypes}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {familyData.familyTypes.map((entry, index) => (
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
                    <CardTitle>Family Sizes</CardTitle>
                    <CardDescription>Distribution by family size</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={familyData.familySizes}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="size" />
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
                    <CardDescription>Families by location</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {familyData.familyLocations?.map((location, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center space-x-3">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{location.area}</span>
                          </div>
                          <Badge variant="outline">{location.families} families</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="composition" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Family Composition Analysis</CardTitle>
                  <CardDescription>Detailed breakdown of family types and structures</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {familyData.familyComposition?.map((family, index) => (
                      <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <Users2 className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{family.type}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{family.count}</p>
                          <p className="text-sm text-muted-foreground">
                            {Math.round((family.count / familyData.totalFamilies) * 100)}% of families
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="growth" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Family Growth Analysis</CardTitle>
                  <CardDescription>Detailed growth trends and patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={familyData.familyGrowth}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="families" stackId="1" stroke="#8884d8" fill="#8884d8" />
                        <Area type="monotone" dataKey="members" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                        <Area type="monotone" dataKey="newFamilies" stackId="1" stroke="#ffc658" fill="#ffc658" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="engagement" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Family Engagement Levels</CardTitle>
                  <CardDescription>Engagement distribution and metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={familyData.familyEngagement}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ level, percent }) => `${level} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {familyData.familyEngagement.map((entry, index) => (
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
                  <CardTitle>Family Attendance</CardTitle>
                  <CardDescription>Families with highest attendance rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {familyData.familyAttendance?.map((family, index) => (
                      <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="text-sm">
                              {family.family.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{family.family}</p>
                            <p className="text-sm text-muted-foreground">
                              {family.members} members • Last: {family.lastAttendance && format(parseISO(family.lastAttendance), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{family.avgAttendance}%</p>
                          <Badge variant="outline">Avg Attendance</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="volunteering" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Family Volunteering</CardTitle>
                  <CardDescription>Volunteer participation by families</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {familyData.familyVolunteering?.map((area, index) => (
                      <div key={index} className="p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold">{area.area}</h4>
                          <Badge variant="outline">{area.families} families</Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Total Volunteers</span>
                            <span>{area.totalMembers} members</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min((area.totalMembers / (area.families * 2)) * 100, 100)}%` }}
                            ></div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Avg {Math.round(area.totalMembers / area.families)} per family</span>
                            <span>{area.totalMembers} total volunteers</span>
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

      {/* Family Detail Dialog */}
      <Dialog open={isFamilyDialogOpen} onOpenChange={setIsFamilyDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedFamily?.family_name}</DialogTitle>
            <DialogDescription>Detailed family information and statistics</DialogDescription>
          </DialogHeader>
          {selectedFamily && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Family Members</p>
                  <p className="text-2xl font-bold">{selectedFamily.members?.length || 0}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Family Type</p>
                  <p className="text-lg font-semibold">Nuclear Family</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 
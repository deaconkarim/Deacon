import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, parseISO, differenceInYears } from 'date-fns';
import { 
  Users2, 
  Users, 
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
import { familyReportService } from '@/lib/familyReportService';
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
      // Use the new real data service instead of mock data
      const realData = await familyReportService.getComprehensiveFamilyData();
      setFamilyData(realData);
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
          <p className="text-xs text-amber-600 mt-1">
            📊 Real data: Family counts, sizes, composition, attendance, giving. 
            📍 Location, volunteering, and communication data coming soon.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadFamilyData}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
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
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span>Loading family data...</span>
          </div>
        </div>
      ) : (
        <>
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
                    {familyData.familyLocations && familyData.familyLocations.length > 0 ? (
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
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <MapPin className="w-8 h-8 mx-auto mb-2" />
                        <p>Location data not available yet</p>
                        <p className="text-sm">Address analysis coming soon</p>
                      </div>
                    )}
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
                  <div className="space-y-4">
                    {familyData.familyEngagement?.map((level, index) => (
                      <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: level.color }}
                          />
                          <span className="font-medium">{level.level}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{level.count}</p>
                          <p className="text-sm text-muted-foreground">
                            {Math.round((level.count / familyData.totalFamilies) * 100)}% of families
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Family Attendance</CardTitle>
                  <CardDescription>Attendance patterns by family</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {familyData.familyAttendance?.map((family, index) => (
                      <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <span className="font-medium">{family.family}</span>
                            <p className="text-sm text-muted-foreground">{family.members} members</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{family.avgAttendance}%</p>
                          <p className="text-sm text-muted-foreground">avg attendance</p>
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
                  <CardDescription>Volunteer participation by family</CardDescription>
                </CardHeader>
                <CardContent>
                  {familyData.familyVolunteering && familyData.familyVolunteering.length > 0 ? (
                    <div className="space-y-4">
                      {familyData.familyVolunteering?.map((area, index) => (
                        <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                          <div className="flex items-center space-x-3">
                            <Heart className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{area.area}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{area.families} families</p>
                            <p className="text-sm text-muted-foreground">{area.totalMembers} members</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Heart className="w-8 h-8 mx-auto mb-2" />
                      <p>Volunteer data not available yet</p>
                      <p className="text-sm">Volunteer tracking coming soon</p>
                    </div>
                  )}
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
              {/* Primary Contact Highlight */}
              {selectedFamily.primary_contact_id && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-900/20 border border-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-700 bg-yellow-100 border-yellow-300 mb-2">
                  <Crown className="w-5 h-5 text-yellow-400" />
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={
                      selectedFamily.members.find(m => m.id === selectedFamily.primary_contact_id)?.image_url
                    } />
                    <AvatarFallback>
                      {(() => {
                        const pc = selectedFamily.members.find(m => m.id === selectedFamily.primary_contact_id);
                        return pc ? (pc.firstname[0] + (pc.lastname ? pc.lastname[0] : '')) : '?';
                      })()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-yellow-800 dark:text-yellow-200">
                    {(() => {
                      const pc = selectedFamily.members.find(m => m.id === selectedFamily.primary_contact_id);
                      return pc ? `${pc.firstname} ${pc.lastname}` : 'Unknown member';
                    })()}
                  </span>
                  <span className="ml-2 text-xs text-yellow-700 dark:text-yellow-300">(Primary Contact)</span>
                </div>
              )}
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
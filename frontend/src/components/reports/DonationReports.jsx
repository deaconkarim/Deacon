import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Filter, 
  Calendar,
  Users,
  Heart,
  Gift,
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
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  HelpCircle,
  Plus,
  Minus,
  Equal,
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
  Shield
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
import { getDonations, getDonationAnalytics } from '@/lib/donationService';
import { supabase } from '@/lib/supabaseClient';

export function DonationReports() {
  const [selectedDateRange, setSelectedDateRange] = useState('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [donationData, setDonationData] = useState({
    totalDonations: 0,
    totalAmount: 0,
    averageGift: 0,
    donorCount: 0,
    givingTrends: [],
    donationCategories: [],
    topDonors: [],
    givingGoals: [],
    recurringDonations: [],
    campaignPerformance: [],
    donorRetention: [],
    givingMethods: [],
    donorDemographics: [],
    seasonalGiving: []
  });
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [isDonorDialogOpen, setIsDonorDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDonationData();
  }, [selectedDateRange, selectedMonth]);

  const loadDonationData = async () => {
    setIsLoading(true);
    try {
      const startDate = startOfMonth(selectedMonth);
      const endDate = endOfMonth(selectedMonth);
      
      // Get donations for the selected period
      const donations = await getDonations({
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd')
      });

      const processedData = processDonationData(donations);
      setDonationData(processedData);
    } catch (error) {
      console.error('Error loading donation data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load donation data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processDonationData = (donations) => {
    const totalDonations = donations.length;
    const totalAmount = donations.reduce((sum, donation) => sum + (donation.amount || 0), 0);
    const averageGift = totalDonations > 0 ? Math.round(totalAmount / totalDonations) : 0;
    
    // Get unique donors
    const uniqueDonors = new Set(donations.map(d => d.donor_name || 'Anonymous'));
    const donorCount = uniqueDonors.size;

    // Giving trends (last 12 months)
    const givingTrends = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(new Date(), i);
      const monthDonations = donations.filter(d => {
        const donationDate = parseISO(d.created_at);
        return donationDate.getMonth() === date.getMonth() && 
               donationDate.getFullYear() === date.getFullYear();
      });
      return {
        month: format(date, 'MMM yyyy'),
        amount: monthDonations.reduce((sum, d) => sum + (d.amount || 0), 0),
        count: monthDonations.length,
        donors: new Set(monthDonations.map(d => d.donor_name || 'Anonymous')).size
      };
    }).reverse();

    // Donation categories
    const donationCategories = donations.reduce((acc, donation) => {
      const category = donation.category || 'General';
      if (!acc[category]) {
        acc[category] = { amount: 0, count: 0 };
      }
      acc[category].amount += donation.amount || 0;
      acc[category].count += 1;
      return acc;
    }, {});

    const categoryData = Object.entries(donationCategories).map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count,
      avgAmount: Math.round(data.amount / data.count)
    }));

    // Top donors
    const donorStats = donations.reduce((acc, donation) => {
      const donorName = donation.donor_name || 'Anonymous';
      if (!acc[donorName]) {
        acc[donorName] = { total: 0, count: 0, lastDonation: null };
      }
      acc[donorName].total += donation.amount || 0;
      acc[donorName].count += 1;
      if (!acc[donorName].lastDonation || donation.created_at > acc[donorName].lastDonation) {
        acc[donorName].lastDonation = donation.created_at;
      }
      return acc;
    }, {});

    const topDonors = Object.entries(donorStats)
      .map(([name, data]) => ({
        name,
        total: data.total,
        count: data.count,
        lastDonation: data.lastDonation,
        avgGift: Math.round(data.total / data.count)
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Giving goals (mock)
    const givingGoals = [
      { name: 'Monthly Goal', target: 15000, actual: 12450, percentage: 83 },
      { name: 'Building Fund', target: 50000, actual: 32000, percentage: 64 },
      { name: 'Missions', target: 10000, actual: 8500, percentage: 85 },
      { name: 'Youth Ministry', target: 5000, actual: 4200, percentage: 84 },
      { name: 'Emergency Fund', target: 8000, actual: 6500, percentage: 81 }
    ];

    // Recurring donations (mock)
    const recurringDonations = [
      { donor: 'John Smith', amount: 500, frequency: 'Monthly', status: 'Active', startDate: '2024-01-01' },
      { donor: 'Sarah Johnson', amount: 250, frequency: 'Monthly', status: 'Active', startDate: '2024-02-15' },
      { donor: 'Mike Davis', amount: 100, frequency: 'Weekly', status: 'Active', startDate: '2024-03-01' },
      { donor: 'Lisa Wilson', amount: 300, frequency: 'Monthly', status: 'Paused', startDate: '2024-01-15' },
      { donor: 'David Brown', amount: 150, frequency: 'Monthly', status: 'Active', startDate: '2024-04-01' }
    ];

    // Campaign performance (mock)
    const campaignPerformance = [
      { name: 'Christmas Offering', goal: 10000, raised: 8500, donors: 45, endDate: '2024-12-25' },
      { name: 'Building Fund', goal: 50000, raised: 32000, donors: 23, endDate: '2024-06-30' },
      { name: 'Missions Trip', goal: 8000, raised: 6500, donors: 18, endDate: '2024-05-15' },
      { name: 'Youth Camp', goal: 3000, raised: 2800, donors: 12, endDate: '2024-07-01' },
      { name: 'Emergency Relief', goal: 5000, raised: 4200, donors: 15, endDate: '2024-04-30' }
    ];

    // Donor retention (mock)
    const donorRetention = [
      { period: 'New Donors', count: 25, retained: 18, rate: 72 },
      { period: '1-6 months', count: 45, retained: 38, rate: 84 },
      { period: '6-12 months', count: 30, retained: 25, rate: 83 },
      { period: '1-2 years', count: 20, retained: 18, rate: 90 },
      { period: '2+ years', count: 15, retained: 14, rate: 93 }
    ];

    // Giving methods (mock)
    const givingMethods = [
      { method: 'Online Giving', amount: Math.floor(totalAmount * 0.6), count: Math.floor(totalDonations * 0.7) },
      { method: 'Cash/Check', amount: Math.floor(totalAmount * 0.25), count: Math.floor(totalDonations * 0.2) },
      { method: 'Bank Transfer', amount: Math.floor(totalAmount * 0.1), count: Math.floor(totalDonations * 0.08) },
      { method: 'Mobile App', amount: Math.floor(totalAmount * 0.05), count: Math.floor(totalDonations * 0.02) }
    ];

    // Donor demographics (mock)
    const donorDemographics = [
      { age: '18-25', donors: 8, avgGift: 75, totalAmount: 600 },
      { age: '26-35', donors: 15, avgGift: 120, totalAmount: 1800 },
      { age: '36-50', donors: 25, avgGift: 200, totalAmount: 5000 },
      { age: '51-65', donors: 20, avgGift: 300, totalAmount: 6000 },
      { age: '65+', donors: 12, avgGift: 250, totalAmount: 3000 }
    ];

    // Seasonal giving (mock)
    const seasonalGiving = [
      { month: 'January', amount: Math.floor(totalAmount * 0.08), donors: Math.floor(donorCount * 0.1) },
      { month: 'February', amount: Math.floor(totalAmount * 0.07), donors: Math.floor(donorCount * 0.09) },
      { month: 'March', amount: Math.floor(totalAmount * 0.08), donors: Math.floor(donorCount * 0.1) },
      { month: 'April', amount: Math.floor(totalAmount * 0.09), donors: Math.floor(donorCount * 0.11) },
      { month: 'May', amount: Math.floor(totalAmount * 0.08), donors: Math.floor(donorCount * 0.1) },
      { month: 'June', amount: Math.floor(totalAmount * 0.07), donors: Math.floor(donorCount * 0.09) },
      { month: 'July', amount: Math.floor(totalAmount * 0.06), donors: Math.floor(donorCount * 0.08) },
      { month: 'August', amount: Math.floor(totalAmount * 0.07), donors: Math.floor(donorCount * 0.09) },
      { month: 'September', amount: Math.floor(totalAmount * 0.08), donors: Math.floor(donorCount * 0.1) },
      { month: 'October', amount: Math.floor(totalAmount * 0.09), donors: Math.floor(donorCount * 0.11) },
      { month: 'November', amount: Math.floor(totalAmount * 0.1), donors: Math.floor(donorCount * 0.12) },
      { month: 'December', amount: Math.floor(totalAmount * 0.13), donors: Math.floor(donorCount * 0.15) }
    ];

    return {
      totalDonations,
      totalAmount,
      averageGift,
      donorCount,
      givingTrends,
      donationCategories: categoryData,
      topDonors,
      givingGoals,
      recurringDonations,
      campaignPerformance,
      donorRetention,
      givingMethods,
      donorDemographics,
      seasonalGiving
    };
  };

  const handleExport = (type) => {
    const headers = {
      donations: ['Date', 'Donor', 'Amount', 'Category', 'Method'],
      donors: ['Name', 'Total Given', 'Donation Count', 'Last Donation', 'Avg Gift'],
      campaigns: ['Campaign', 'Goal', 'Raised', 'Donors', 'End Date']
    };

    const data = donationData[type] || [];
    const csvContent = [
      headers[type].join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `donation-${type}-${format(selectedMonth, 'yyyy-MM')}.csv`;
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
          <h2 className="text-2xl font-bold">Donation Analytics</h2>
          <p className="text-muted-foreground">Comprehensive giving insights and donor analytics</p>
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
          <Button variant="outline" onClick={() => handleExport('donations')}>
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
              title="Total Donations"
              value={donationData.totalDonations}
              change={8.3}
              icon={Gift}
              color="bg-gradient-to-r from-blue-500 to-cyan-500"
            />
            <StatCard
              title="Total Amount"
              value={`$${donationData.totalAmount?.toLocaleString() || '0'}`}
              change={12.5}
              icon={DollarSign}
              color="bg-gradient-to-r from-green-500 to-emerald-500"
            />
            <StatCard
              title="Average Gift"
              value={`$${donationData.averageGift?.toLocaleString() || '0'}`}
              change={5.2}
              icon={Heart}
              color="bg-gradient-to-r from-purple-500 to-pink-500"
            />
            <StatCard
              title="Active Donors"
              value={donationData.donorCount}
              change={3.1}
              icon={Users}
              color="bg-gradient-to-r from-yellow-500 to-orange-500"
            />
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="donors">Donors</TabsTrigger>
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
              <TabsTrigger value="recurring">Recurring</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Giving Trends</CardTitle>
                    <CardDescription>Monthly donation amounts and donor counts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={donationData.givingTrends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip formatter={(value, name) => [
                            name === 'amount' ? `$${value.toLocaleString()}` : value,
                            name === 'amount' ? 'Amount' : name === 'count' ? 'Donations' : 'Donors'
                          ]} />
                          <Legend />
                          <Bar yAxisId="left" dataKey="count" fill="#8884d8" name="Donations" />
                          <Line yAxisId="right" type="monotone" dataKey="amount" stroke="#82ca9d" name="Amount" />
                          <Line yAxisId="right" type="monotone" dataKey="donors" stroke="#ffc658" name="Donors" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Giving by Category</CardTitle>
                    <CardDescription>Donation distribution by category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={donationData.donationCategories}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="amount"
                          >
                            {donationData.donationCategories.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']} />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Giving Methods</CardTitle>
                    <CardDescription>Donations by payment method</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {donationData.givingMethods?.map((method, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center space-x-3">
                            <CreditCard className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{method.method}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${method.amount.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">{method.count} donations</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Donor Demographics</CardTitle>
                    <CardDescription>Giving patterns by age group</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {donationData.donorDemographics?.map((demo, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                          <div>
                            <p className="font-medium">{demo.age}</p>
                            <p className="text-sm text-muted-foreground">{demo.donors} donors</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${demo.totalAmount.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">Avg ${demo.avgGift}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Giving Trends Analysis</CardTitle>
                  <CardDescription>Detailed analysis of donation patterns over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={donationData.givingTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value, name) => [
                          name === 'amount' ? `$${value.toLocaleString()}` : value,
                          name === 'amount' ? 'Amount' : name === 'count' ? 'Donations' : 'Donors'
                        ]} />
                        <Legend />
                        <Area type="monotone" dataKey="amount" stackId="1" stroke="#8884d8" fill="#8884d8" />
                        <Area type="monotone" dataKey="count" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                        <Area type="monotone" dataKey="donors" stackId="1" stroke="#ffc658" fill="#ffc658" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="donors" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Donors</CardTitle>
                  <CardDescription>Most generous contributors</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {donationData.topDonors?.map((donor, index) => (
                      <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="text-sm">
                              {donor.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{donor.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {donor.count} donations • Last: {donor.lastDonation && format(parseISO(donor.lastDonation), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">${donor.total.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">Avg ${donor.avgGift}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="campaigns" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Performance</CardTitle>
                  <CardDescription>Fundraising campaign results</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {donationData.campaignPerformance?.map((campaign, index) => (
                      <div key={index} className="p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold">{campaign.name}</h4>
                          <Badge variant={campaign.raised >= campaign.goal ? "default" : "secondary"}>
                            {campaign.raised >= campaign.goal ? "Completed" : "In Progress"}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Progress</span>
                            <span>${campaign.raised.toLocaleString()} / ${campaign.goal.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min((campaign.raised / campaign.goal) * 100, 100)}%` }}
                            ></div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{Math.round((campaign.raised / campaign.goal) * 100)}% complete</span>
                            <span>{campaign.donors} donors</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="goals" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Giving Goals</CardTitle>
                  <CardDescription>Progress towards financial goals</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {donationData.givingGoals?.map((goal, index) => (
                      <div key={index} className="p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold">{goal.name}</h4>
                          <Badge variant={goal.percentage >= 100 ? "default" : "secondary"}>
                            {goal.percentage}% complete
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Progress</span>
                            <span>${goal.actual.toLocaleString()} / ${goal.target.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(goal.percentage, 100)}%` }}
                            ></div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{goal.percentage}% complete</span>
                            <span>${goal.target - goal.actual} remaining</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recurring" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recurring Donations</CardTitle>
                  <CardDescription>Monthly and weekly recurring contributions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {donationData.recurringDonations?.map((donation, index) => (
                      <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="text-sm">
                              {donation.donor.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{donation.donor}</p>
                            <p className="text-sm text-muted-foreground">
                              {donation.frequency} • Started {donation.startDate && format(parseISO(donation.startDate), 'MMM yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">${donation.amount.toLocaleString()}</p>
                          <Badge variant={donation.status === 'Active' ? "default" : "secondary"}>
                            {donation.status}
                          </Badge>
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

      {/* Donor Detail Dialog */}
      <Dialog open={isDonorDialogOpen} onOpenChange={setIsDonorDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedDonor?.name}</DialogTitle>
            <DialogDescription>Detailed donor information and giving history</DialogDescription>
          </DialogHeader>
          {selectedDonor && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Total Given</p>
                  <p className="text-2xl font-bold">${selectedDonor.total.toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Donation Count</p>
                  <p className="text-2xl font-bold">{selectedDonor.count}</p>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Last Donation</p>
                <p className="text-lg font-semibold">
                  {selectedDonor.lastDonation && format(parseISO(selectedDonor.lastDonation), 'MMMM d, yyyy')}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 
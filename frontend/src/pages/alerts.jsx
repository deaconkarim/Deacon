import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Bell, 
  Calendar, 
  Users, 
  Gift,
  Heart,
  Award,
  Clock,
  Filter,
  Search
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useToast } from '../components/ui/use-toast';
import { 
  getUpcomingEvents,
  getAlertStats,
  getEventsByType,
  getTodaysEvents,
  getThisWeeksEvents
} from '../lib/alertsService';

export default function AlertsPage() {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('30'); // 7, 30, 90 days
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [eventsData, statsData] = await Promise.all([
        getUpcomingEvents(parseInt(timeRange)),
        getAlertStats()
      ]);

      setUpcomingEvents(eventsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading alerts data:', error);
      toast({
        title: "Error",
        description: "Failed to load alerts data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'birthday': return <Gift className="h-5 w-5" />;
      case 'anniversary': return <Heart className="h-5 w-5" />;
      case 'membership': return <Award className="h-5 w-5" />;
      default: return <Calendar className="h-5 w-5" />;
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'birthday': return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'anniversary': return 'bg-red-100 text-red-800 border-red-200';
      case 'membership': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyColor = (daysUntil) => {
    if (daysUntil === 0) return 'bg-red-100 text-red-800 border-red-200';
    if (daysUntil === 1) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (daysUntil <= 7) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getUrgencyText = (daysUntil) => {
    if (daysUntil === 0) return 'Today';
    if (daysUntil === 1) return 'Tomorrow';
    if (daysUntil <= 7) return `${daysUntil} days`;
    return `${daysUntil} days`;
  };

  // Filter events based on search and type
  const filteredEvents = upcomingEvents.filter(event => {
    const matchesSearch = event.member.firstname.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.member.lastname.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedFilter === 'all' || event.type === selectedFilter;
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Upcoming Celebrations</h1>
          <p className="text-gray-600">Birthdays, anniversaries, and membership milestones</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Upcoming</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUpcoming || 0}</div>
            <p className="text-xs text-muted-foreground">
              Next {timeRange} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Birthdays</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.birthdays || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats.today || 0} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anniversaries</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.anniversaries || 0}</div>
            <p className="text-xs text-muted-foreground">
              Wedding anniversaries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memberships</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.memberships || 0}</div>
            <p className="text-xs text-muted-foreground">
              Membership anniversaries
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-3 py-2 border border-input rounded-md bg-background"
          >
            <option value="all">All Types</option>
            <option value="birthday">Birthdays</option>
            <option value="anniversary">Anniversaries</option>
            <option value="membership">Memberships</option>
          </select>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-input rounded-md bg-background"
          >
            <option value="7">Next 7 days</option>
            <option value="30">Next 30 days</option>
            <option value="90">Next 90 days</option>
          </select>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Events</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4">
            {filteredEvents.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-gray-500">No upcoming events found.</p>
                  <p className="text-sm text-gray-400 mt-2">
                    {searchQuery ? 'Try adjusting your search or filters.' : 'Check back in a few days for new events.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredEvents.map((event) => (
                <Card key={event.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-full ${getEventColor(event.type)}`}>
                          {getEventIcon(event.type)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{event.title}</h3>
                          <p className="text-sm text-gray-600">{event.description}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {event.member.firstname} {event.member.lastname}
                            </Badge>
                            {event.member.phone && (
                              <Badge variant="outline" className="text-xs">
                                📞 {event.member.phone}
                              </Badge>
                            )}
                            {event.member.email && (
                              <Badge variant="outline" className="text-xs">
                                📧 {event.member.email}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={`${getUrgencyColor(event.daysUntil)}`}>
                          {getUrgencyText(event.daysUntil)}
                        </Badge>
                        <p className="text-sm text-gray-500 mt-1">
                          {format(event.date, 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="today" className="space-y-4">
          <div className="grid gap-4">
            {filteredEvents.filter(event => event.isToday).length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-gray-500">No events today.</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Check the "All Events" tab to see upcoming celebrations.
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredEvents
                .filter(event => event.isToday)
                .map((event) => (
                  <Card key={event.id} className="border-2 border-red-200 bg-red-50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-full ${getEventColor(event.type)}`}>
                            {getEventIcon(event.type)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{event.title}</h3>
                            <p className="text-sm text-gray-600">{event.description}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {event.member.firstname} {event.member.lastname}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-red-100 text-red-800 border-red-200">
                            Today!
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="week" className="space-y-4">
          <div className="grid gap-4">
            {filteredEvents.filter(event => event.daysUntil <= 7).length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-gray-500">No events this week.</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Check the "All Events" tab to see upcoming celebrations.
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredEvents
                .filter(event => event.daysUntil <= 7)
                .map((event) => (
                  <Card key={event.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-full ${getEventColor(event.type)}`}>
                            {getEventIcon(event.type)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{event.title}</h3>
                            <p className="text-sm text-gray-600">{event.description}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {event.member.firstname} {event.member.lastname}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={`${getUrgencyColor(event.daysUntil)}`}>
                            {getUrgencyText(event.daysUntil)}
                          </Badge>
                          <p className="text-sm text-gray-500 mt-1">
                            {format(event.date, 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
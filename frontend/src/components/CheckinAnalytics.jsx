import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { userCacheService } from '../lib/userCache';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subWeeks, startOfMonth, endOfMonth } from 'date-fns';
import { BarChart3, TrendingUp, Users, Clock, Calendar, Download, Filter, RefreshCw } from 'lucide-react';

export default function CheckinAnalytics({ selectedEvent, organizationId }) {
  const [analyticsData, setAnalyticsData] = useState({
    attendanceTrends: [],
    hourlyDistribution: [],
    ageGroupStats: [],
    gradeStats: [],
    guardianStats: [],
    eventComparison: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('week'); // 'week', 'month', 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedMetrics, setSelectedMetrics] = useState(['attendance', 'hourly', 'demographics']);

  // Get current user's organization ID if not provided
  const getCurrentUserOrganizationId = async () => {
    if (organizationId) return organizationId;
    return await userCacheService.getCurrentUserOrganizationId();
  };

  // Calculate date range based on selection
  const getDateRange = useMemo(() => {
    const now = new Date();
    
    switch (dateRange) {
      case 'week':
        return {
          start: startOfWeek(now, { weekStartsOn: 0 }),
          end: endOfWeek(now, { weekStartsOn: 0 })
        };
      case 'month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
      case 'custom':
        return {
          start: customStartDate ? new Date(customStartDate) : subWeeks(now, 1),
          end: customEndDate ? new Date(customEndDate) : now
        };
      default:
        return {
          start: startOfWeek(now, { weekStartsOn: 0 }),
          end: endOfWeek(now, { weekStartsOn: 0 })
        };
    }
  }, [dateRange, customStartDate, customEndDate]);

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const orgId = await getCurrentUserOrganizationId();
      if (!orgId) return;

      const { start, end } = getDateRange;

      // Fetch check-in logs for the date range
      const { data: checkinLogs, error: logsError } = await supabase
        .from('child_checkin_logs')
        .select(`
          *,
          child:members!child_checkin_logs_child_id_fkey(*),
          checked_in_by:members!child_checkin_logs_checked_in_by_fkey(*),
          event:events!child_checkin_logs_event_id_fkey(*)
        `)
        .eq('organization_id', orgId)
        .gte('check_in_time', start.toISOString())
        .lte('check_in_time', end.toISOString())
        .order('check_in_time', { ascending: true });

      if (logsError) throw logsError;

      // Fetch all children for demographic data
      const { data: allChildren, error: childrenError } = await supabase
        .from('members')
        .select('*, child_allergies(*)')
        .eq('member_type', 'child')
        .eq('organization_id', orgId);

      if (childrenError) throw childrenError;

      // Process analytics data
      const processedData = processAnalyticsData(checkinLogs, allChildren, start, end);
      setAnalyticsData(processedData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Process raw data into analytics
  const processAnalyticsData = (logs, children, startDate, endDate) => {
    // Attendance trends by day
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const attendanceTrends = days.map(day => {
      const dayLogs = logs.filter(log => 
        format(new Date(log.check_in_time), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      );
      return {
        date: format(day, 'MMM dd'),
        checkedIn: dayLogs.length,
        checkedOut: dayLogs.filter(log => log.check_out_time).length,
        total: children.length
      };
    });

    // Hourly distribution
    const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => {
      const hourLogs = logs.filter(log => {
        const logHour = new Date(log.check_in_time).getHours();
        return logHour === hour;
      });
      return {
        hour: `${hour}:00`,
        count: hourLogs.length
      };
    });

    // Age group statistics
    const ageGroups = {
      '0-2': { label: 'Infant (0-2)', count: 0, checkedIn: 0 },
      '3-5': { label: 'Preschool (3-5)', count: 0, checkedIn: 0 },
      '6-11': { label: 'Elementary (6-11)', count: 0, checkedIn: 0 },
      '12-14': { label: 'Middle School (12-14)', count: 0, checkedIn: 0 },
      '15+': { label: 'High School (15+)', count: 0, checkedIn: 0 }
    };

    children.forEach(child => {
      if (child.birth_date) {
        const age = new Date().getFullYear() - new Date(child.birth_date).getFullYear();
        let group;
        if (age <= 2) group = '0-2';
        else if (age <= 5) group = '3-5';
        else if (age <= 11) group = '6-11';
        else if (age <= 14) group = '12-14';
        else group = '15+';

        ageGroups[group].count++;
        
        // Check if checked in during this period
        const isCheckedIn = logs.some(log => 
          log.child_id === child.id && 
          !log.check_out_time &&
          new Date(log.check_in_time) >= startDate &&
          new Date(log.check_in_time) <= endDate
        );
        if (isCheckedIn) ageGroups[group].checkedIn++;
      }
    });

    const ageGroupStats = Object.values(ageGroups).filter(group => group.count > 0);

    // Grade statistics
    const gradeStats = {};
    children.forEach(child => {
      if (child.grade) {
        if (!gradeStats[child.grade]) {
          gradeStats[child.grade] = { grade: child.grade, count: 0, checkedIn: 0 };
        }
        gradeStats[child.grade].count++;
        
        const isCheckedIn = logs.some(log => 
          log.child_id === child.id && 
          !log.check_out_time &&
          new Date(log.check_in_time) >= startDate &&
          new Date(log.check_in_time) <= endDate
        );
        if (isCheckedIn) gradeStats[child.grade].checkedIn++;
      }
    });

    // Guardian statistics
    const guardianStats = {};
    logs.forEach(log => {
      const guardianId = log.checked_in_by?.id;
      if (guardianId) {
        if (!guardianStats[guardianId]) {
          guardianStats[guardianId] = {
            name: `${log.checked_in_by?.firstname || ''} ${log.checked_in_by?.lastname || ''}`,
            checkins: 0,
            children: new Set()
          };
        }
        guardianStats[guardianId].checkins++;
        guardianStats[guardianId].children.add(log.child_id);
      }
    });

    const guardianStatsArray = Object.values(guardianStats).map(guardian => ({
      name: guardian.name,
      checkins: guardian.checkins,
      uniqueChildren: guardian.children.size
    })).sort((a, b) => b.checkins - a.checkins).slice(0, 10);

    // Event comparison (if multiple events in range)
    const eventStats = {};
    logs.forEach(log => {
      const eventId = log.event_id;
      if (!eventStats[eventId]) {
        eventStats[eventId] = {
          title: log.event?.title || 'Unknown Event',
          checkins: 0,
          uniqueChildren: new Set()
        };
      }
      eventStats[eventId].checkins++;
      eventStats[eventId].uniqueChildren.add(log.child_id);
    });

    const eventComparison = Object.values(eventStats).map(event => ({
      title: event.title,
      checkins: event.checkins,
      uniqueChildren: event.uniqueChildren.size
    })).sort((a, b) => b.checkins - a.checkins);

    return {
      attendanceTrends,
      hourlyDistribution,
      ageGroupStats,
      gradeStats: Object.values(gradeStats).sort((a, b) => a.grade.localeCompare(b.grade)),
      guardianStats: guardianStatsArray,
      eventComparison
    };
  };

  // Export analytics data
  const exportAnalytics = () => {
    const { start, end } = getDateRange;
    
    const csvData = [
      ['Analytics Report', `Generated ${format(new Date(), 'MMM dd, yyyy h:mm a')}`],
      ['Date Range', `${format(start, 'MMM dd, yyyy')} - ${format(end, 'MMM dd, yyyy')}`],
      [],
      ['Attendance Trends'],
      ['Date', 'Checked In', 'Checked Out', 'Total Children']
    ];

    analyticsData.attendanceTrends.forEach(day => {
      csvData.push([day.date, day.checkedIn, day.checkedOut, day.total]);
    });

    csvData.push([], ['Hourly Distribution'], ['Hour', 'Check-ins']);
    analyticsData.hourlyDistribution.forEach(hour => {
      csvData.push([hour.hour, hour.count]);
    });

    csvData.push([], ['Age Group Statistics'], ['Age Group', 'Total', 'Checked In', 'Percentage']);
    analyticsData.ageGroupStats.forEach(group => {
      const percentage = group.count > 0 ? ((group.checkedIn / group.count) * 100).toFixed(1) : 0;
      csvData.push([group.label, group.count, group.checkedIn, `${percentage}%`]);
    });

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `checkin-analytics-${format(start, 'yyyy-MM-dd')}-to-${format(end, 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Load data when component mounts or date range changes
  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange, customStartDate, customEndDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="animate-spin h-8 w-8 mr-3 text-primary" />
        <span className="text-lg text-muted-foreground">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>Error loading analytics: {error}</p>
        <button 
          onClick={fetchAnalyticsData}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-card p-6 rounded-lg border">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Check-in Analytics</h2>
          <p className="text-muted-foreground">Comprehensive insights and reporting</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportAnalytics}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <button
            onClick={fetchAnalyticsData}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="mb-6 p-4 bg-muted rounded-lg">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="p-2 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          
          {dateRange === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="p-2 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="p-2 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-muted p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-muted-foreground">Total Check-ins</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {analyticsData.attendanceTrends.reduce((sum, day) => sum + day.checkedIn, 0)}
          </p>
        </div>
        <div className="bg-muted p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-green-500" />
            <span className="text-sm text-muted-foreground">Peak Hour</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {analyticsData.hourlyDistribution.reduce((peak, hour) => 
              hour.count > peak.count ? hour : peak
            , { hour: 'N/A', count: 0 }).hour}
          </p>
        </div>
        <div className="bg-muted p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            <span className="text-sm text-muted-foreground">Avg Daily</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {analyticsData.attendanceTrends.length > 0 
              ? Math.round(analyticsData.attendanceTrends.reduce((sum, day) => sum + day.checkedIn, 0) / analyticsData.attendanceTrends.length)
              : 0
            }
          </p>
        </div>
        <div className="bg-muted p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-purple-500" />
            <span className="text-sm text-muted-foreground">Date Range</span>
          </div>
          <p className="text-sm font-bold text-foreground">
            {format(getDateRange.start, 'MMM dd')} - {format(getDateRange.end, 'MMM dd')}
          </p>
        </div>
      </div>

      {/* Charts and Analytics */}
      <div className="space-y-8">
        {/* Attendance Trends */}
        {selectedMetrics.includes('attendance') && (
          <div className="bg-muted p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-foreground mb-4">Attendance Trends</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analyticsData.attendanceTrends.map((day, index) => (
                <div key={index} className="bg-background p-4 rounded-lg border">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">{day.date}</p>
                    <p className="text-2xl font-bold text-foreground">{day.checkedIn}</p>
                    <p className="text-xs text-muted-foreground">
                      {day.total > 0 ? `${Math.round((day.checkedIn / day.total) * 100)}%` : '0%'} of total
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hourly Distribution */}
        {selectedMetrics.includes('hourly') && (
          <div className="bg-muted p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-foreground mb-4">Hourly Distribution</h3>
            <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
              {analyticsData.hourlyDistribution.map((hour, index) => (
                <div key={index} className="bg-background p-2 rounded border text-center">
                  <p className="text-xs text-muted-foreground mb-1">{hour.hour}</p>
                  <p className="text-sm font-medium text-foreground">{hour.count}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Demographics */}
        {selectedMetrics.includes('demographics') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Age Groups */}
            <div className="bg-muted p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-foreground mb-4">Age Group Statistics</h3>
              <div className="space-y-3">
                {analyticsData.ageGroupStats.map((group, index) => (
                  <div key={index} className="bg-background p-3 rounded-lg border">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-foreground">{group.label}</span>
                      <span className="text-sm text-muted-foreground">
                        {group.checkedIn}/{group.count}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${group.count > 0 ? (group.checkedIn / group.count) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Grades */}
            <div className="bg-muted p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-foreground mb-4">Grade Statistics</h3>
              <div className="space-y-3">
                {analyticsData.gradeStats.map((grade, index) => (
                  <div key={index} className="bg-background p-3 rounded-lg border">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-foreground">Grade {grade.grade}</span>
                      <span className="text-sm text-muted-foreground">
                        {grade.checkedIn}/{grade.count}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${grade.count > 0 ? (grade.checkedIn / grade.count) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Top Guardians */}
        {analyticsData.guardianStats.length > 0 && (
          <div className="bg-muted p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-foreground mb-4">Top Guardians</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analyticsData.guardianStats.map((guardian, index) => (
                <div key={index} className="bg-background p-4 rounded-lg border">
                  <div className="text-center">
                    <p className="font-medium text-foreground mb-1">{guardian.name}</p>
                    <p className="text-2xl font-bold text-primary">{guardian.checkins}</p>
                    <p className="text-sm text-muted-foreground">
                      {guardian.uniqueChildren} unique children
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Event Comparison */}
        {analyticsData.eventComparison.length > 1 && (
          <div className="bg-muted p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-foreground mb-4">Event Comparison</h3>
            <div className="space-y-3">
              {analyticsData.eventComparison.map((event, index) => (
                <div key={index} className="bg-background p-4 rounded-lg border">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-foreground">{event.title}</span>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">{event.checkins}</p>
                      <p className="text-sm text-muted-foreground">
                        {event.uniqueChildren} children
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
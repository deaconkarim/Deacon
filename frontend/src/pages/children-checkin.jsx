import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { userCacheService } from '../lib/userCache';
import { Search, Filter, Users, CheckCircle, XCircle, Plus, Download, RefreshCw, QrCode, BarChart3, Tabs, TabsContent, TabsList, TabsTrigger } from 'lucide-react';
import QuickCheckin from '../components/QuickCheckin';
import CheckinAnalytics from '../components/CheckinAnalytics';

// Helper function to get current user's organization ID
const getCurrentUserOrganizationId = async () => {
  return await userCacheService.getCurrentUserOrganizationId();
};

// Constants for pagination and performance
const CHILDREN_PER_PAGE = 50;
const SEARCH_DEBOUNCE_MS = 300;

export default function ChildrenCheckin() {
  // Core state
  const [children, setChildren] = useState([]);
  const [guardians, setGuardians] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkinLogs, setCheckinLogs] = useState([]);
  const [allCheckinHistory, setAllCheckinHistory] = useState([]);

  // Enhanced state for scalability
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    ageGroup: '',
    grade: '',
    hasAllergies: false,
    checkedIn: 'all' // 'all', 'checked-in', 'not-checked-in'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalChildren, setTotalChildren] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedChildren, setSelectedChildren] = useState(new Set());
  const [bulkOperation, setBulkOperation] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    totalChildren: 0,
    checkedIn: 0,
    notCheckedIn: 0,
    withAllergies: 0
  });

  // Memoized filtered children for performance
  const filteredChildren = useMemo(() => {
    if (!children.length) return [];
    
    return children.filter(child => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const fullName = `${child.firstname} ${child.lastname}`.toLowerCase();
        if (!fullName.includes(searchLower)) return false;
      }

      // Age group filter
      if (filters.ageGroup && child.birth_date) {
        const age = calculateAge(child.birth_date);
        if (filters.ageGroup === 'infant' && age > 2) return false;
        if (filters.ageGroup === 'toddler' && (age < 2 || age > 4)) return false;
        if (filters.ageGroup === 'preschool' && (age < 4 || age > 5)) return false;
        if (filters.ageGroup === 'elementary' && (age < 5 || age > 11)) return false;
        if (filters.ageGroup === 'middle' && (age < 11 || age > 14)) return false;
        if (filters.ageGroup === 'high' && age < 14) return false;
      }

      // Grade filter
      if (filters.grade && child.grade !== filters.grade) return false;

      // Allergy filter
      if (filters.hasAllergies && !child.has_allergies) return false;

      // Check-in status filter
      if (filters.checkedIn !== 'all') {
        const isCheckedIn = checkinLogs.some(
          log => log.child_id === child.id && !log.check_out_time
        );
        if (filters.checkedIn === 'checked-in' && !isCheckedIn) return false;
        if (filters.checkedIn === 'not-checked-in' && isCheckedIn) return false;
      }

      return true;
    });
  }, [children, searchTerm, filters, checkinLogs]);

  // Paginated children
  const paginatedChildren = useMemo(() => {
    const startIndex = (currentPage - 1) * CHILDREN_PER_PAGE;
    return filteredChildren.slice(startIndex, startIndex + CHILDREN_PER_PAGE);
  }, [filteredChildren, currentPage]);

  // Calculate age helper
  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchTerm, filters]);

  // Fetch children with pagination
  const fetchChildren = useCallback(async (page = 1, search = '', filters = {}) => {
    try {
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) {
        setError('No organization ID found');
        return;
      }

      setLoading(true);
      
      // Build query with filters
      let query = supabase
        .from('members')
        .select('*, child_allergies(*), child_emergency_contacts(*)', { count: 'exact' })
        .eq('member_type', 'child')
        .eq('organization_id', organizationId);

      // Apply search
      if (search) {
        query = query.or(`firstname.ilike.%${search}%,lastname.ilike.%${search}%`);
      }

      // Apply filters
      if (filters.ageGroup) {
        // Age filtering will be done in JavaScript for now
        // In production, you might want to add age columns to the database
      }

      if (filters.grade) {
        query = query.eq('grade', filters.grade);
      }

      // Get paginated results
      const { data, error, count } = await query
        .range((page - 1) * CHILDREN_PER_PAGE, page * CHILDREN_PER_PAGE - 1)
        .order('firstname', { ascending: true });

      if (error) throw error;

      // Process children data to add computed fields
      const processedChildren = data.map(child => ({
        ...child,
        age: child.birth_date ? calculateAge(child.birth_date) : null,
        has_allergies: child.child_allergies && child.child_allergies.length > 0,
        emergency_contacts: child.child_emergency_contacts || []
      }));

      if (page === 1) {
        setChildren(processedChildren);
      } else {
        setChildren(prev => [...prev, ...processedChildren]);
      }

      setTotalChildren(count || 0);
      setCurrentPage(page);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  // Load more children (infinite scroll)
  const loadMoreChildren = useCallback(async () => {
    if (isLoadingMore || children.length >= totalChildren) return;
    
    setIsLoadingMore(true);
    await fetchChildren(currentPage + 1, searchTerm, filters);
  }, [isLoadingMore, children.length, totalChildren, currentPage, searchTerm, filters, fetchChildren]);

  // Fetch guardians
  const fetchGuardians = useCallback(async () => {
    try {
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) return;

      const { data, error } = await supabase
        .from('child_guardians')
        .select(`
          *,
          guardian:guardian_id(*),
          child:child_id(*)
        `)
        .eq('organization_id', organizationId);

      if (error) throw error;
      setGuardians(data);
    } catch (err) {
      console.error('Error fetching guardians:', err);
    }
  }, []);

  // Fetch events
  const fetchEvents = useCallback(async () => {
    try {
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) return;

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('organization_id', organizationId)
        .order('start_date', { ascending: true });
      
      if (error) throw error;
      
      // Filter for check-in events
      const checkinEvents = data.filter(event => 
        event.attendance_type === 'checkin' || 
        event.attendance_type === 'Check-in' ||
        event.attendance_type === 'check-in'
      );
      
      setEvents(checkinEvents);

      // Find the next Sunday service event
      const nextSundayService = checkinEvents.find(event => {
        const eventDate = new Date(event.start_date);
        return eventDate.getDay() === 0 && eventDate >= new Date();
      });

      if (nextSundayService) {
        setSelectedEvent(nextSundayService);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  }, []);

  // Fetch check-in logs for selected event
  const fetchCheckinLogs = useCallback(async () => {
    if (!selectedEvent) return;

    try {
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) return;

      const { data, error } = await supabase
        .from('child_checkin_logs')
        .select(`
          *,
          child:members!child_checkin_logs_child_id_fkey(*),
          checked_in_by:members!child_checkin_logs_checked_in_by_fkey(*),
          checked_out_by:members!child_checkin_logs_checked_out_by_fkey(*)
        `)
        .eq('event_id', selectedEvent.id)
        .eq('organization_id', organizationId);

      if (error) throw error;
      setCheckinLogs(data);
    } catch (err) {
      console.error('Error fetching check-in logs:', err);
    }
  }, [selectedEvent]);

  // Calculate statistics
  const calculateStats = useCallback(() => {
    const checkedIn = checkinLogs.filter(log => !log.check_out_time).length;
    const withAllergies = children.filter(child => child.has_allergies).length;
    
    setStats({
      totalChildren: children.length,
      checkedIn,
      notCheckedIn: children.length - checkedIn,
      withAllergies
    });
  }, [children, checkinLogs]);

  // Update stats when data changes
  useEffect(() => {
    calculateStats();
  }, [children, checkinLogs, calculateStats]);

  // Initial data fetch
  useEffect(() => {
    fetchChildren();
    fetchGuardians();
    fetchEvents();
  }, [fetchChildren, fetchGuardians, fetchEvents]);

  // Fetch check-in logs when event changes
  useEffect(() => {
    fetchCheckinLogs();
  }, [fetchCheckinLogs]);

  // Handle check-in
  const handleCheckin = async (childId, guardianId) => {
    if (!selectedEvent) return;

    try {
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) return;

      // Create check-in log
      const { error: checkinError } = await supabase
        .from('child_checkin_logs')
        .insert([{
          child_id: childId,
          event_id: selectedEvent.id,
          checked_in_by: guardianId,
          organization_id: organizationId,
          check_in_time: new Date().toISOString(),
        }]);

      if (checkinError) throw checkinError;

      // Create event attendance record
      const { error: attendanceError } = await supabase
        .from('event_attendance')
        .insert([{
          event_id: selectedEvent.id,
          member_id: childId,
          organization_id: organizationId,
          status: 'checked-in'
        }]);

      if (attendanceError) throw attendanceError;

      // Refresh data
      await fetchCheckinLogs();
      await fetchChildren(currentPage, searchTerm, filters);
    } catch (error) {
      console.error('Error checking in child:', error);
      setError(error.message);
    }
  };

  // Handle check-out
  const handleCheckout = async (logId, guardianId) => {
    try {
      const { error } = await supabase
        .from('child_checkin_logs')
        .update({
          checked_out_by: guardianId,
          check_out_time: new Date().toISOString()
        })
        .eq('id', logId);

      if (error) throw error;

      // Refresh data
      await fetchCheckinLogs();
      await fetchChildren(currentPage, searchTerm, filters);
    } catch (err) {
      setError(err.message);
    }
  };

  // Bulk check-in
  const handleBulkCheckin = async () => {
    if (!selectedEvent || selectedChildren.size === 0) return;

    try {
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) return;

      const guardianId = bulkOperation?.guardianId;
      if (!guardianId) return;

      // Create check-in logs for all selected children
      const checkinData = Array.from(selectedChildren).map(childId => ({
        child_id: childId,
        event_id: selectedEvent.id,
        checked_in_by: guardianId,
        organization_id: organizationId,
        check_in_time: new Date().toISOString(),
      }));

      const { error: checkinError } = await supabase
        .from('child_checkin_logs')
        .insert(checkinData);

      if (checkinError) throw checkinError;

      // Create event attendance records
      const attendanceData = Array.from(selectedChildren).map(childId => ({
        event_id: selectedEvent.id,
        member_id: childId,
        organization_id: organizationId,
        status: 'checked-in'
      }));

      const { error: attendanceError } = await supabase
        .from('event_attendance')
        .insert(attendanceData);

      if (attendanceError) throw attendanceError;

      // Clear selection and refresh data
      setSelectedChildren(new Set());
      setBulkOperation(null);
      await fetchCheckinLogs();
      await fetchChildren(currentPage, searchTerm, filters);
    } catch (error) {
      console.error('Error bulk checking in children:', error);
      setError(error.message);
    }
  };

  // Toggle child selection
  const toggleChildSelection = (childId) => {
    const newSelection = new Set(selectedChildren);
    if (newSelection.has(childId)) {
      newSelection.delete(childId);
    } else {
      newSelection.add(childId);
    }
    setSelectedChildren(newSelection);
  };

  // Select all children on current page
  const selectAllOnPage = () => {
    const allIds = paginatedChildren.map(child => child.id);
    setSelectedChildren(new Set(allIds));
  };

  // Clear all selections
  const clearSelection = () => {
    setSelectedChildren(new Set());
    setBulkOperation(null);
  };

  // Export data
  const exportData = () => {
    const csvData = [
      ['Name', 'Age', 'Grade', 'Check-in Status', 'Guardian', 'Check-in Time', 'Check-out Time']
    ];

    checkinLogs.forEach(log => {
      const child = children.find(c => c.id === log.child_id);
      const guardian = guardians.find(g => g.child_id === log.child_id && g.is_primary);
      
      csvData.push([
        `${child?.firstname || ''} ${child?.lastname || ''}`,
        child?.age || '',
        child?.grade || '',
        log.check_out_time ? 'Checked Out' : 'Checked In',
        `${guardian?.guardian?.firstname || ''} ${guardian?.guardian?.lastname || ''}`,
        log.check_in_time ? format(new Date(log.check_in_time), 'MMM d, yyyy h:mm a') : '',
        log.check_out_time ? format(new Date(log.check_out_time), 'MMM d, yyyy h:mm a') : ''
      ]);
    });

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `children-checkin-${selectedEvent?.title || 'event'}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Get initials helper
  const getInitials = (firstname, lastname) => {
    return `${firstname?.[0] || ''}${lastname?.[0] || ''}`.toUpperCase();
  };

  if (loading && children.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 mx-auto mb-4 text-primary" />
          <p className="text-lg text-muted-foreground">Loading children's check-in system...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 text-center">
        <XCircle className="h-8 w-8 mx-auto mb-4" />
        <p className="text-lg">Error: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden px-0 sm:px-4 sm:rounded-lg sm:shadow bg-background box-border">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 px-2 md:px-0 w-full">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Children Check-in</h1>
          <p className="text-muted-foreground mt-2">Manage check-ins for {stats.totalChildren} children</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex-1 md:flex-none bg-secondary text-secondary-foreground px-4 py-3 rounded-lg font-medium hover:bg-secondary/90 transition-colors flex items-center justify-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
          <a
            href="/children-check-in/add"
            className="flex-1 md:flex-none bg-primary text-primary-foreground px-6 py-3 rounded-lg text-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Child
          </a>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 px-2 md:px-0">
        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-muted-foreground">Total</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.totalChildren}</p>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-sm text-muted-foreground">Checked In</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.checkedIn}</p>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <span className="text-sm text-muted-foreground">Not Checked In</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.notCheckedIn}</p>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-orange-500" />
            <span className="text-sm text-muted-foreground">With Allergies</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.withAllergies}</p>
        </div>
      </div>

      {/* Event Selection */}
      <div className="mb-8 px-2 md:px-0">
        <label className="block text-lg font-medium text-foreground mb-3">
          Select Event
        </label>
        <select
          className="w-full p-4 border border-input bg-background text-foreground rounded-lg text-lg h-14 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          value={selectedEvent?.id || ''} 
          onChange={(e) => {
            const event = events.find(ev => ev.id === e.target.value);
            setSelectedEvent(event);
          }}
        >
          <option value="">Select an event</option>
          {events.map(event => (
            <option key={event.id} value={event.id}>
              {event.title} - {format(new Date(event.start_date), 'MMM d, yyyy h:mm a')}
            </option>
          ))}
        </select>
      </div>

      {selectedEvent && (
        <Tabs defaultValue="bulk-checkin" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="bulk-checkin">Bulk Check-in</TabsTrigger>
            <TabsTrigger value="quick-checkin">Quick Check-in</TabsTrigger>
            <TabsTrigger value="checkout">Check-out</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="bulk-checkin" className="space-y-8">
            {/* Search and Filters */}
            <div className="bg-card p-6 rounded-lg border">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search children by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>
              <button
                onClick={exportData}
                className="px-4 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Age Group</label>
                  <select
                    value={filters.ageGroup}
                    onChange={(e) => setFilters(prev => ({ ...prev, ageGroup: e.target.value }))}
                    className="w-full p-2 border border-input bg-background text-foreground rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">All Ages</option>
                    <option value="infant">Infant (0-2)</option>
                    <option value="toddler">Toddler (2-4)</option>
                    <option value="preschool">Preschool (4-5)</option>
                    <option value="elementary">Elementary (5-11)</option>
                    <option value="middle">Middle School (11-14)</option>
                    <option value="high">High School (14+)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Grade</label>
                  <select
                    value={filters.grade}
                    onChange={(e) => setFilters(prev => ({ ...prev, grade: e.target.value }))}
                    className="w-full p-2 border border-input bg-background text-foreground rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">All Grades</option>
                    <option value="K">Kindergarten</option>
                    <option value="1">1st Grade</option>
                    <option value="2">2nd Grade</option>
                    <option value="3">3rd Grade</option>
                    <option value="4">4th Grade</option>
                    <option value="5">5th Grade</option>
                    <option value="6">6th Grade</option>
                    <option value="7">7th Grade</option>
                    <option value="8">8th Grade</option>
                    <option value="9">9th Grade</option>
                    <option value="10">10th Grade</option>
                    <option value="11">11th Grade</option>
                    <option value="12">12th Grade</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Check-in Status</label>
                  <select
                    value={filters.checkedIn}
                    onChange={(e) => setFilters(prev => ({ ...prev, checkedIn: e.target.value }))}
                    className="w-full p-2 border border-input bg-background text-foreground rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="all">All</option>
                    <option value="checked-in">Checked In</option>
                    <option value="not-checked-in">Not Checked In</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.hasAllergies}
                      onChange={(e) => setFilters(prev => ({ ...prev, hasAllergies: e.target.checked }))}
                      className="rounded border-input"
                    />
                    <span className="text-sm font-medium text-muted-foreground">Has Allergies</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Bulk Operations */}
          {selectedChildren.size > 0 && (
            <div className="bg-card p-6 rounded-lg border border-primary">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {selectedChildren.size} children selected
                  </h3>
                  <p className="text-muted-foreground">Choose an action to perform on all selected children</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={clearSelection}
                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
                  >
                    Clear Selection
                  </button>
                  <button
                    onClick={() => setBulkOperation({ type: 'checkin', guardianId: '' })}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Bulk Check-in
                  </button>
                </div>
              </div>

              {/* Bulk Check-in Form */}
              {bulkOperation?.type === 'checkin' && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Select Guardian for All Children
                      </label>
                      <select
                        value={bulkOperation.guardianId}
                        onChange={(e) => setBulkOperation(prev => ({ ...prev, guardianId: e.target.value }))}
                        className="w-full p-3 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">Select guardian</option>
                        {guardians
                          .filter(g => selectedChildren.has(g.child_id))
                          .map(guardian => (
                            <option key={guardian.id} value={guardian.guardian_id}>
                              {guardian.guardian?.firstname || ''} {guardian.guardian?.lastname || ''}
                            </option>
                          ))}
                      </select>
                    </div>
                    <button
                      onClick={handleBulkCheckin}
                      disabled={!bulkOperation.guardianId}
                      className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Check-in All Selected
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Check-in Section */}
          <div className="bg-card p-6 rounded-lg border">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h2 className="text-2xl font-semibold text-foreground">Check-in Children</h2>
              <div className="flex gap-2">
                <button
                  onClick={selectAllOnPage}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors text-sm"
                >
                  Select All on Page
                </button>
                <button
                  onClick={clearSelection}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors text-sm"
                >
                  Clear Selection
                </button>
              </div>
            </div>

            {/* Children Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedChildren.map(child => {
                const childGuardians = guardians.filter(g => g.child_id === child.id);
                const isCheckedIn = checkinLogs.some(
                  log => log.child_id === child.id && !log.check_out_time
                );
                const isSelected = selectedChildren.has(child.id);

                return (
                  <div 
                    key={child.id} 
                    className={`border border-border p-4 rounded-lg bg-muted/50 w-full transition-all cursor-pointer hover:shadow-md ${
                      isSelected ? 'ring-2 ring-primary bg-primary/10' : ''
                    } ${isCheckedIn ? 'border-green-500 bg-green-50' : ''}`}
                    onClick={() => toggleChildSelection(child.id)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={child.image_url} />
                          <AvatarFallback className="text-lg bg-muted text-muted-foreground">
                            {getInitials(child.firstname, child.lastname)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-lg font-medium text-foreground">
                            {child.firstname} {child.lastname}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {child.age ? `${child.age} years` : ''} {child.grade ? `• Grade ${child.grade}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {child.has_allergies && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                            Allergies
                          </span>
                        )}
                        {isSelected && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </div>

                    {!isCheckedIn ? (
                      <div className="mt-3">
                        <label className="block text-sm text-muted-foreground mb-2">
                          Check in with guardian:
                        </label>
                        <select
                          className="w-full p-3 border border-input bg-background text-foreground rounded-lg text-sm h-12 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          onChange={(e) => {
                            e.stopPropagation();
                            handleCheckin(child.id, e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="">Select guardian</option>
                          {childGuardians.map(guardian => (
                            <option key={guardian.id} value={guardian.guardian_id}>
                              {guardian.guardian?.firstname || ''} {guardian.guardian?.lastname || ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="mt-3 text-green-600 text-sm font-medium flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Checked in
                      </div>
                    )}

                    <div className="mt-3 flex gap-2">
                      <a
                        href={`/edit-child/${child.id}`}
                        className="text-sm bg-secondary text-secondary-foreground px-3 py-1 rounded hover:bg-secondary/90 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Edit
                      </a>
                      {child.has_allergies && (
                        <span className="text-sm text-red-600 px-2 py-1 bg-red-100 rounded">
                          ⚠️ Allergies
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More Button */}
            {children.length < totalChildren && (
              <div className="text-center mt-6">
                <button
                  onClick={loadMoreChildren}
                  disabled={isLoadingMore}
                  className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                >
                  {isLoadingMore ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Load More Children
                    </>
                  )}
                </button>
                <p className="text-sm text-muted-foreground mt-2">
                  Showing {children.length} of {totalChildren} children
                </p>
              </div>
            )}
          </div>

          {/* Check-out Section */}
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-2xl font-semibold mb-6 text-foreground">Check-out Children</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {checkinLogs
                .filter(log => !log.check_out_time)
                .map(log => {
                  const childGuardians = guardians.filter(g => g.child_id === log.child_id);

                  return (
                    <div key={log.id} className="border border-border p-4 rounded-lg bg-muted/50 w-full">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={log.child?.image_url} />
                          <AvatarFallback className="text-2xl bg-muted text-muted-foreground">
                            {getInitials(log.child?.firstname, log.child?.lastname)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-xl font-medium text-foreground">
                            {log.child?.firstname || ''} {log.child?.lastname || ''}
                          </h3>
                          <p className="text-lg text-muted-foreground">
                            Checked in by: {log.checked_in_by?.firstname || ''} {log.checked_in_by?.lastname || ''}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="block text-lg text-muted-foreground mb-2">
                          Check out with guardian:
                        </label>
                        <select
                          className="w-full p-4 border border-input bg-background text-foreground rounded-lg text-lg h-14 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          onChange={(e) => handleCheckout(log.id, e.target.value)}
                        >
                          <option value="">Select guardian</option>
                          {childGuardians.map(guardian => (
                            <option key={guardian.id} value={guardian.guardian_id}>
                              {guardian.guardian?.firstname || ''} {guardian.guardian?.lastname || ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          </TabsContent>

          <TabsContent value="quick-checkin" className="space-y-8">
            <QuickCheckin 
              selectedEvent={selectedEvent} 
              onCheckinComplete={() => {
                fetchCheckinLogs();
                fetchChildren(currentPage, searchTerm, filters);
              }}
            />
          </TabsContent>

          <TabsContent value="checkout" className="space-y-8">
            {/* Check-out Section */}
            <div className="bg-card p-6 rounded-lg border">
              <h2 className="text-2xl font-semibold mb-6 text-foreground">Check-out Children</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {checkinLogs
                  .filter(log => !log.check_out_time)
                  .map(log => {
                    const childGuardians = guardians.filter(g => g.child_id === log.child_id);

                    return (
                      <div key={log.id} className="border border-border p-4 rounded-lg bg-muted/50 w-full">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={log.child?.image_url} />
                            <AvatarFallback className="text-2xl bg-muted text-muted-foreground">
                              {getInitials(log.child?.firstname, log.child?.lastname)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="text-xl font-medium text-foreground">
                              {log.child?.firstname || ''} {log.child?.lastname || ''}
                            </h3>
                            <p className="text-lg text-muted-foreground">
                              Checked in by: {log.checked_in_by?.firstname || ''} {log.checked_in_by?.lastname || ''}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <label className="block text-lg text-muted-foreground mb-2">
                            Check out with guardian:
                          </label>
                          <select
                            className="w-full p-4 border border-input bg-background text-foreground rounded-lg text-lg h-14 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            onChange={(e) => handleCheckout(log.id, e.target.value)}
                          >
                            <option value="">Select guardian</option>
                            {childGuardians.map(guardian => (
                              <option key={guardian.id} value={guardian.guardian_id}>
                                {guardian.guardian?.firstname || ''} {guardian.guardian?.lastname || ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Check-in History */}
            <div className="bg-card p-6 rounded-lg border">
              <h2 className="text-2xl font-semibold mb-6 text-foreground">Check-in History</h2>
              {/* Mobile: vertical list, Desktop: table */}
              <div className="block md:hidden">
                <ul className="space-y-4">
                  {allCheckinHistory.slice(0, 20).map(log => (
                    <li key={log.id} className="border border-border rounded-lg p-4 bg-muted/50">
                      <div className="font-semibold text-lg">{log.child?.firstname || ''} {log.child?.lastname || ''}</div>
                      <div className="text-base text-muted-foreground">{log.event?.title}</div>
                      <div className="text-base">Checked in: {log.check_in_time ? format(new Date(log.check_in_time), 'MMM d, yyyy h:mm a') : '-'}</div>
                      <div className="text-base">Checked out: {log.check_out_time ? format(new Date(log.check_out_time), 'MMM d, yyyy h:mm a') : '-'}</div>
                      <div className="text-base text-muted-foreground">Guardian: {log.checked_in_by?.firstname || ''} {log.checked_in_by?.lastname || ''}</div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-6 py-4 text-left text-base font-medium text-muted-foreground uppercase tracking-wider">
                        Child
                      </th>
                      <th className="px-2 md:px-6 py-2 md:py-4 text-left text-xs md:text-base font-medium text-muted-foreground uppercase tracking-wider">
                        Event
                      </th>
                      <th className="px-2 md:px-6 py-2 md:py-4 text-left text-xs md:text-base font-medium text-muted-foreground uppercase tracking-wider">
                        Checked In
                      </th>
                      <th className="px-2 md:px-6 py-2 md:py-4 text-left text-xs md:text-base font-medium text-muted-foreground uppercase tracking-wider">
                        Checked Out
                      </th>
                      <th className="px-2 md:px-6 py-2 md:py-4 text-left text-xs md:text-base font-medium text-muted-foreground uppercase tracking-wider">
                        Guardian
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-background divide-y divide-border">
                    {allCheckinHistory.slice(0, 50).map(log => (
                      <tr key={log.id}>
                        <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap">
                          {log.child?.firstname || ''} {log.child?.lastname || ''}
                        </td>
                        <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap">
                          {log.event?.title}
                        </td>
                        <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap">
                          {log.check_in_time ? format(new Date(log.check_in_time), 'MMM d, yyyy h:mm a') : ''}
                        </td>
                        <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap">
                          {log.check_out_time ? format(new Date(log.check_out_time), 'MMM d, yyyy h:mm a') : ''}
                        </td>
                        <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap">
                          {log.checked_in_by?.firstname || ''} {log.checked_in_by?.lastname || ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-8">
            <CheckinAnalytics selectedEvent={selectedEvent} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
} 
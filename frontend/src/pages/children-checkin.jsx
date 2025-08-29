import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { userCacheService } from '../lib/userCache';

// Helper function to get current user's organization ID
const getCurrentUserOrganizationId = async () => {
  return await userCacheService.getCurrentUserOrganizationId();
};

export default function ChildrenCheckin() {
  const [children, setChildren] = useState([]);
  const [guardians, setGuardians] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkinLogs, setCheckinLogs] = useState([]);
  const [allCheckinHistory, setAllCheckinHistory] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');

  // Fetch children and their guardians
  useEffect(() => {
    async function fetchChildren() {
      try {
        const organizationId = await getCurrentUserOrganizationId();
        if (!organizationId) {
          setError('No organization ID found');
          return;
        }

        const { data: childrenData, error: childrenError } = await supabase
          .from('members')
          .select('*')
          .eq('member_type', 'child')
          .eq('organization_id', organizationId);

        if (childrenError) throw childrenError;

        const { data: guardiansData, error: guardiansError } = await supabase
          .from('child_guardians')
          .select(`
            *,
            guardian:guardian_id(*),
            child:child_id(*)
          `);

        if (guardiansError) throw guardiansError;

        setChildren(childrenData);
        setGuardians(guardiansData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchChildren();
  }, []);

    // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const organizationId = await getCurrentUserOrganizationId();
        if (!organizationId) {
          console.error('No organization ID found');
          return;
        }

        // First, let's see what events we have
        const { data: allEvents, error: allEventsError } = await supabase
          .from('events')
          .select('*')
          .eq('organization_id', organizationId)
          .order('start_date', { ascending: true });
        
        if (allEventsError) throw allEventsError;
        
        // Filter for check-in events
        const checkinEvents = allEvents.filter(event => 
          event.attendance_type === 'checkin' || 
          event.attendance_type === 'Check-in' ||
          event.attendance_type === 'check-in'
        );
        
        setEvents(checkinEvents);

        // Find the next Sunday service event
        const nextSundayService = checkinEvents.find(event => {
          const eventDate = new Date(event.start_date);
          // Check if it's a Sunday (0 is Sunday in getDay())
          return eventDate.getDay() === 0 && eventDate >= new Date();
        });

        if (nextSundayService) {
          setSelectedEvent(nextSundayService);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    fetchEvents();
  }, []);

  // Fetch all check-in history
  useEffect(() => {
    async function fetchAllCheckinHistory() {
      try {
        const organizationId = await getCurrentUserOrganizationId();
        if (!organizationId) {
          console.error('No organization ID found');
          return;
        }

        const { data, error } = await supabase
          .from('child_checkin_logs')
          .select(`
            *,
            child:members!child_checkin_logs_child_id_fkey(*),
            checked_in_by:members!child_checkin_logs_checked_in_by_fkey(*),
            checked_out_by:members!child_checkin_logs_checked_out_by_fkey(*),
            event:events!child_checkin_logs_event_id_fkey(*)
          `)
          .eq('organization_id', organizationId)
          .order('check_in_time', { ascending: false });

        if (error) throw error;
        setAllCheckinHistory(data);
      } catch (err) {
        console.error('Error fetching all check-in history:', err);
      }
    }

    fetchAllCheckinHistory();
  }, []);

  // Fetch check-in logs for selected event
  useEffect(() => {
    if (!selectedEvent) return;

    async function fetchCheckinLogs() {
      try {
        const organizationId = await getCurrentUserOrganizationId();
        if (!organizationId) {
          setError('No organization ID found');
          return;
        }

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
        setError(err.message);
      }
    }

    fetchCheckinLogs();
  }, [selectedEvent]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && searchFilter) {
        setSearchFilter('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchFilter]);

  // Handle check-in
  const handleCheckin = async (childId, guardianId) => {
    if (!selectedEvent) return;

    try {
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) {
        console.error('No organization ID found');
        return;
      }

      // Create check-in log
      const { data: checkinLog, error: checkinError } = await supabase
        .from('child_checkin_logs')
        .insert([
          {
            child_id: childId,
            event_id: selectedEvent.id,
            checked_in_by: guardianId,
            organization_id: organizationId,
            check_in_time: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (checkinError) throw checkinError;

      // Create event attendance record
      const { error: attendanceError } = await supabase
        .from('event_attendance')
        .insert([
          {
            event_id: selectedEvent.id,
            member_id: childId,
            organization_id: organizationId,
            status: 'checked-in'
          },
        ]);

      if (attendanceError) throw attendanceError;

      // Refresh check-in logs and history
      fetchCheckinLogs();
      fetchAllCheckinHistory();
    } catch (error) {
      console.error('Error checking in child:', error);
    }
  };

  const fetchCheckinLogs = async () => {
    if (!selectedEvent) return;

    try {
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) {
        console.error('No organization ID found');
        return;
      }

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
    } catch (error) {
      console.error('Error fetching check-in logs:', error);
    }
  };

  const fetchAllCheckinHistory = async () => {
    try {
      // Get current organization ID
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) {
        console.error('No organization ID found');
        return;
      }

      // Get the check-in logs for this organization
      const { data: logs, error: logsError } = await supabase
        .from('child_checkin_logs')
        .select('*')
        .eq('organization_id', organizationId)
        .order('check_in_time', { ascending: false });

      if (logsError) throw logsError;

      if (!logs || logs.length === 0) {
        setAllCheckinHistory([]);
        return;
      }

      // Get unique IDs for related data
      const childIds = [...new Set(logs.map(log => log.child_id).filter(Boolean))];
      const guardianIds = [...new Set([
        ...logs.map(log => log.checked_in_by).filter(Boolean),
        ...logs.map(log => log.checked_out_by).filter(Boolean)
      ])];
      const eventIds = [...new Set(logs.map(log => log.event_id).filter(Boolean))];

      // Fetch related data for this organization
      const [childrenData, guardiansData, eventsData] = await Promise.all([
        childIds.length > 0 ? supabase.from('members').select('id, firstname, lastname, image_url').in('id', childIds).eq('organization_id', organizationId) : { data: [] },
        guardianIds.length > 0 ? supabase.from('members').select('id, firstname, lastname').in('id', guardianIds).eq('organization_id', organizationId) : { data: [] },
        eventIds.length > 0 ? supabase.from('events').select('id, title').in('id', eventIds).eq('organization_id', organizationId) : { data: [] }
      ]);

      // Create lookup maps
      const childrenMap = (childrenData.data || []).reduce((acc, child) => {
        acc[child.id] = child;
        return acc;
      }, {});
      
      const guardiansMap = (guardiansData.data || []).reduce((acc, guardian) => {
        acc[guardian.id] = guardian;
        return acc;
      }, {});
      
      const eventsMap = (eventsData.data || []).reduce((acc, event) => {
        acc[event.id] = event;
        return acc;
      }, {});

      // Combine the data
      const enrichedLogs = logs.map(log => ({
        ...log,
        child: childrenMap[log.child_id] || null,
        checked_in_by: guardiansMap[log.checked_in_by] || null,
        checked_out_by: guardiansMap[log.checked_out_by] || null,
        event: eventsMap[log.event_id] || null
      }));

      setAllCheckinHistory(enrichedLogs);
    } catch (error) {
      console.error('Error fetching all check-in history:', error);
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

      // Refresh check-in logs and history
      const { data, error: fetchError } = await supabase
        .from('child_checkin_logs')
        .select(`
          *,
          child:members!child_checkin_logs_child_id_fkey(*),
          checked_in_by:members!child_checkin_logs_checked_in_by_fkey(*),
          checked_out_by:members!child_checkin_logs_checked_out_by_fkey(*),
          event:events!child_checkin_logs_event_id_fkey(*)
        `)
        .eq('event_id', selectedEvent.id);

      if (fetchError) throw fetchError;
      setCheckinLogs(data);
      
      // Also refresh all history
      fetchAllCheckinHistory();
    } catch (err) {
      setError(err.message);
    }
  };

  const getInitials = (firstname, lastname) => {
    return `${firstname[0]}${lastname[0]}`.toUpperCase();
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="w-full max-w-full overflow-x-hidden px-0 sm:px-4 sm:rounded-lg sm:shadow bg-background box-border">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 px-2 md:px-0 w-full">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground w-full md:w-auto">Children Check-in</h1>
        <div className="flex gap-2 w-full md:w-auto">
          <a
            href="/children-check-in/add"
            className="flex-1 md:flex-none bg-primary text-primary-foreground px-6 md:px-6 py-3 md:py-3 rounded-lg text-lg md:text-lg font-medium hover:bg-primary/90 h-14 md:h-14 flex items-center justify-center transition-colors"
          >
            Add Child
          </a>
        </div>
      </div>

      {/* Event Selection */}
      <div className="mb-8 px-2 md:px-0">
        <label className="block text-lg md:text-lg font-medium text-foreground mb-3 md:mb-3">
          Select Event
        </label>
        <select
          className="w-full p-4 md:p-4 border border-input bg-background text-foreground rounded-lg text-lg md:text-lg h-14 md:h-14 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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
        <div className="space-y-8 md:space-y-8">
          {/* Check-in Section */}
          <div className="bg-card p-3 md:p-6 rounded-lg border">
            <h2 className="text-2xl md:text-2xl font-semibold mb-6 md:mb-6 px-1 md:px-0 text-foreground">Check-in Children</h2>
            
            {/* Search Filter */}
            <div className="mb-6">
              <label htmlFor="search-filter" className="block text-sm font-medium text-muted-foreground mb-2">
                Search Children by Name
              </label>
              <div className="relative">
                <input
                  id="search-filter"
                  type="text"
                  placeholder="Type to search children..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full p-3 pl-10 pr-12 border border-input bg-background text-foreground rounded-lg text-sm h-12 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {searchFilter && (
                  <button
                    onClick={() => setSearchFilter('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                    type="button"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {searchFilter && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Showing {children.filter(child => 
                    child.firstname?.toLowerCase().includes(searchFilter.toLowerCase()) ||
                    child.lastname?.toLowerCase().includes(searchFilter.toLowerCase())
                  ).length} of {children.length} children
                </p>
              )}
            </div>
            
            <div className="flex flex-col gap-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
              {children
                .filter(child => 
                  searchFilter === '' || 
                  child.firstname?.toLowerCase().includes(searchFilter.toLowerCase()) ||
                  child.lastname?.toLowerCase().includes(searchFilter.toLowerCase())
                )
                .map(child => {
                  const childGuardians = guardians.filter(g => g.child_id === child.id);
                  const isCheckedIn = checkinLogs.some(
                    log => log.child_id === child.id && !log.check_out_time
                  );

                  return (
                    <div key={child.id} className="border border-border p-4 md:p-4 rounded-lg bg-muted/50 w-full">
                      <div className="flex items-center justify-between mb-3 md:mb-3">
                        <div className="flex items-center gap-3 md:gap-3">
                          <Avatar className="h-12 w-12 md:h-12 md:w-12">
                            <AvatarImage src={child.image_url} />
                            <AvatarFallback className="text-lg md:text-lg bg-muted text-muted-foreground">{getInitials(child.firstname, child.lastname)}</AvatarFallback>
                          </Avatar>
                          <h3 className="text-lg md:text-lg font-medium text-foreground">{child.firstname} {child.lastname}</h3>
                        </div>
                        <a
                          href={`/edit-child/${child.id}`}
                          className="text-sm bg-secondary text-secondary-foreground px-3 py-1 rounded hover:bg-secondary/90"
                        >
                          Edit
                        </a>
                      </div>
                      {!isCheckedIn ? (
                        <div className="mt-3 md:mt-3">
                          <label className="block text-sm md:text-sm text-muted-foreground mb-2 md:mb-2">
                            Check in with guardian:
                          </label>
                          <select
                            className="w-full p-3 md:p-3 border border-input bg-background text-foreground rounded-lg text-sm md:text-sm h-12 md:h-12 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            onChange={(e) => handleCheckin(child.id, e.target.value)}
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
                        <div className="mt-3 md:mt-3 text-green-600 text-sm md:text-sm font-medium">
                          Checked in
                        </div>
                      )}
                    </div>
                  );
                })}
              
              {/* No children found message */}
              {children.filter(child => 
                searchFilter === '' || 
                child.firstname?.toLowerCase().includes(searchFilter.toLowerCase()) ||
                child.lastname?.toLowerCase().includes(searchFilter.toLowerCase())
              ).length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  {searchFilter ? `No children found matching "${searchFilter}"` : 'No children available'}
                </div>
              )}
            </div>
          </div>

          {/* Check-out Section */}
          <div className="bg-card p-3 md:p-6 rounded-lg border">
            <h2 className="text-2xl md:text-2xl font-semibold mb-6 md:mb-6 px-1 md:px-0 text-foreground">Check-out Children</h2>
            <div className="flex flex-col gap-4 md:grid md:grid-cols-1 md:gap-4">
              {checkinLogs
                .filter(log => !log.check_out_time)
                .map(log => {
                  const childGuardians = guardians.filter(g => g.child_id === log.child_id);

                  return (
                    <div key={log.id} className="border border-border p-4 md:p-6 rounded-lg bg-muted/50 w-full">
                      <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                        <Avatar className="h-16 w-16 md:h-16 md:w-16">
                          <AvatarImage src={log.child.image_url} />
                          <AvatarFallback className="text-2xl md:text-2xl bg-muted text-muted-foreground">{getInitials(log.child.firstname, log.child.lastname)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-xl md:text-xl font-medium text-foreground">
                            {log.child.firstname} {log.child.lastname}
                          </h3>
                          <p className="text-lg md:text-lg text-muted-foreground">
                            Checked in by: {log.checked_in_by?.firstname || ''} {log.checked_in_by?.lastname || ''}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 md:mt-4">
                        <label className="block text-lg md:text-lg text-muted-foreground mb-2 md:mb-2">
                          Check out with guardian:
                        </label>
                        <select
                          className="w-full p-4 md:p-4 border border-input bg-background text-foreground rounded-lg text-lg md:text-lg h-14 md:h-14 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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
          <div className="bg-card p-3 md:p-6 rounded-lg border">
            <h2 className="text-2xl md:text-2xl font-semibold mb-6 md:mb-6 px-1 md:px-0 text-foreground">Check-in History</h2>
            {/* Mobile: vertical list, Desktop: table */}
            <div className="block md:hidden">
              <ul className="space-y-4">
                {allCheckinHistory.map(log => (
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
            <div className="hidden md:block overflow-x-auto -mx-2 md:mx-0">
              <table className="min-w-full divide-y divide-border text-xs md:text-base">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-2 md:px-6 py-2 md:py-4 text-left text-xs md:text-base font-medium text-muted-foreground uppercase tracking-wider">
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
                  {allCheckinHistory.map(log => (
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
        </div>
      )}
    </div>
  );
} 
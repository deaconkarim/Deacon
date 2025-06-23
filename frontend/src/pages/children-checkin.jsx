import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ChildrenCheckin() {
  const [children, setChildren] = useState([]);
  const [guardians, setGuardians] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkinLogs, setCheckinLogs] = useState([]);
  const [allCheckinHistory, setAllCheckinHistory] = useState([]);

  // Fetch children and their guardians
  useEffect(() => {
    async function fetchChildren() {
      try {
        const { data: childrenData, error: childrenError } = await supabase
          .from('members')
          .select('*')
          .eq('member_type', 'child');

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
        // First, let's see what events we have
        const { data: allEvents, error: allEventsError } = await supabase
          .from('events')
          .select('*')
          .order('start_date', { ascending: true });

        if (allEventsError) throw allEventsError;
        
        console.log('All events:', allEvents);
        
        // Filter for check-in events
        const checkinEvents = allEvents.filter(event => 
          event.attendance_type === 'checkin' || 
          event.attendance_type === 'Check-in' ||
          event.attendance_type === 'check-in'
        );
        
        console.log('Filtered check-in events:', checkinEvents);
        
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
        const { data, error } = await supabase
          .from('child_checkin_logs')
          .select(`
            *,
            child:child_id(*),
            checked_in_by(*),
            checked_out_by(*),
            event:event_id(*)
          `)
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
        const { data, error } = await supabase
          .from('child_checkin_logs')
          .select(`
            *,
            child:child_id(*),
            checked_in_by(*),
            checked_out_by(*)
          `)
          .eq('event_id', selectedEvent.id);

        if (error) throw error;
        setCheckinLogs(data);
      } catch (err) {
        setError(err.message);
      }
    }

    fetchCheckinLogs();
  }, [selectedEvent]);

  // Handle check-in
  const handleCheckin = async (childId, guardianId) => {
    if (!selectedEvent) return;

    try {
      // Create check-in log
      const { data: checkinLog, error: checkinError } = await supabase
        .from('child_checkin_logs')
        .insert([
          {
            child_id: childId,
            event_id: selectedEvent.id,
            checked_in_by: guardianId,
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
      const { data, error } = await supabase
        .from('child_checkin_logs')
        .select(`
          *,
          child:child_id(*),
          checked_in_by(*),
          checked_out_by(*)
        `)
        .eq('event_id', selectedEvent.id);

      if (error) throw error;
      setCheckinLogs(data);
    } catch (error) {
      console.error('Error fetching check-in logs:', error);
    }
  };

  const fetchAllCheckinHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('child_checkin_logs')
        .select(`
          *,
          child:child_id(*),
          checked_in_by(*),
          checked_out_by(*),
          event:event_id(*)
        `)
        .order('check_in_time', { ascending: false });

      if (error) throw error;
      setAllCheckinHistory(data);
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
          child:child_id(*),
          checked_in_by(*),
          checked_out_by(*)
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
    <div className="w-full px-0 md:px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 px-2 md:px-0">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">Children Check-in</h1>
        <a
          href="/children-check-in/add"
          className="w-full md:w-auto bg-primary text-primary-foreground px-6 py-3 rounded-lg text-lg font-medium hover:bg-primary/90 h-14 flex items-center justify-center transition-colors"
        >
          Add Child
        </a>
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
        <div className="space-y-8">
          {/* Check-in Section */}
          <div className="bg-card p-3 md:p-6 rounded-lg border">
            <h2 className="text-2xl font-semibold mb-6 px-1 md:px-0 text-foreground">Check-in Children</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {children.map(child => {
                const childGuardians = guardians.filter(g => g.child_id === child.id);
                const isCheckedIn = checkinLogs.some(
                  log => log.child_id === child.id && !log.check_out_time
                );

                return (
                  <div key={child.id} className="border border-border p-3 md:p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={child.image_url} />
                        <AvatarFallback className="text-lg bg-muted text-muted-foreground">{getInitials(child.firstname, child.lastname)}</AvatarFallback>
                      </Avatar>
                      <h3 className="text-lg font-medium text-foreground">{child.firstname} {child.lastname}</h3>
                    </div>
                    {!isCheckedIn ? (
                      <div className="mt-3">
                        <label className="block text-sm text-muted-foreground mb-2">
                          Check in with guardian:
                        </label>
                        <select
                          className="w-full p-3 border border-input bg-background text-foreground rounded-lg text-sm h-12 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          onChange={(e) => handleCheckin(child.id, e.target.value)}
                        >
                          <option value="">Select guardian</option>
                          {childGuardians.map(guardian => (
                            <option key={guardian.id} value={guardian.guardian_id}>
                              {guardian.guardian.firstname} {guardian.guardian.lastname}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="mt-3 text-green-600 text-sm font-medium">
                        Checked in
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Check-out Section */}
          <div className="bg-card p-3 md:p-6 rounded-lg border">
            <h2 className="text-2xl font-semibold mb-6 px-1 md:px-0 text-foreground">Check-out Children</h2>
            <div className="grid grid-cols-1 gap-4">
              {checkinLogs
                .filter(log => !log.check_out_time)
                .map(log => {
                  const childGuardians = guardians.filter(g => g.child_id === log.child_id);

                  return (
                    <div key={log.id} className="border border-border p-3 md:p-6 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-4 mb-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={log.child.image_url} />
                          <AvatarFallback className="text-2xl bg-muted text-muted-foreground">{getInitials(log.child.firstname, log.child.lastname)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-xl font-medium text-foreground">
                            {log.child.firstname} {log.child.lastname}
                          </h3>
                          <p className="text-lg text-muted-foreground">
                            Checked in by: {log.checked_in_by.firstname} {log.checked_in_by.lastname}
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
                              {guardian.guardian.firstname} {guardian.guardian.lastname}
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
            <h2 className="text-2xl font-semibold mb-6 px-1 md:px-0 text-foreground">Check-in History</h2>
            <div className="overflow-x-auto -mx-3 md:mx-0">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 md:px-6 py-4 text-left text-base font-medium text-muted-foreground uppercase tracking-wider">
                      Child
                    </th>
                    <th className="px-3 md:px-6 py-4 text-left text-base font-medium text-muted-foreground uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-3 md:px-6 py-4 text-left text-base font-medium text-muted-foreground uppercase tracking-wider">
                      Check-in Time
                    </th>
                    <th className="px-3 md:px-6 py-4 text-left text-base font-medium text-muted-foreground uppercase tracking-wider">
                      Check-in By
                    </th>
                    <th className="px-3 md:px-6 py-4 text-left text-base font-medium text-muted-foreground uppercase tracking-wider">
                      Check-out Time
                    </th>
                    <th className="px-3 md:px-6 py-4 text-left text-base font-medium text-muted-foreground uppercase tracking-wider">
                      Check-out By
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {allCheckinHistory.map(log => (
                    <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={log.child.image_url} />
                            <AvatarFallback className="text-lg bg-muted text-muted-foreground">{getInitials(log.child.firstname, log.child.lastname)}</AvatarFallback>
                          </Avatar>
                          <span className="text-lg text-foreground">{log.child.firstname} {log.child.lastname}</span>
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap text-lg text-foreground">
                        {log.event ? log.event.title : 'Unknown Event'}
                      </td>
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap text-lg text-foreground">
                        {format(new Date(log.check_in_time), 'MMM d, h:mm a')}
                      </td>
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap text-lg text-foreground">
                        {log.checked_in_by.firstname} {log.checked_in_by.lastname}
                      </td>
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap text-lg text-foreground">
                        {log.check_out_time
                          ? format(new Date(log.check_out_time), 'MMM d, h:mm a')
                          : '-'}
                      </td>
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap text-lg text-foreground">
                        {log.checked_out_by
                          ? `${log.checked_out_by.firstname} ${log.checked_out_by.lastname}`
                          : '-'}
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
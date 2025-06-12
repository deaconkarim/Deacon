import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { format } from 'date-fns';

export default function ChildrenCheckin() {
  const [children, setChildren] = useState([]);
  const [guardians, setGuardians] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkinLogs, setCheckinLogs] = useState([]);

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
    async function fetchEvents() {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .gte('start_date', new Date().toISOString())
          .order('start_date', { ascending: true });

        if (error) throw error;
        setEvents(data);

        // Find the next Sunday service event
        const nextSundayService = data.find(event => {
          const eventDate = new Date(event.start_date);
          // Check if it's a Sunday (0 is Sunday in getDay())
          return eventDate.getDay() === 0 && 
                 // Check if it's a service event (you might want to adjust this condition based on your event naming convention)
                 event.title.toLowerCase().includes('service');
        });

        if (nextSundayService) {
          setSelectedEvent(nextSundayService);
        }
      } catch (err) {
        setError(err.message);
      }
    }

    fetchEvents();
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
    try {
      const { error } = await supabase
        .from('child_checkin_logs')
        .insert({
          child_id: childId,
          event_id: selectedEvent.id,
          checked_in_by: guardianId,
          check_in_time: new Date().toISOString()
        });

      if (error) throw error;

      // Refresh check-in logs
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
    } catch (err) {
      setError(err.message);
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

      // Refresh check-in logs
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
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Children Check-in</h1>
        <a
          href="/children-check-in/add"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Child
        </a>
      </div>

      {/* Event Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Event
        </label>
        <select
          className="w-full p-2 border rounded"
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
        <div className="space-y-6">
          {/* Check-in Section */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Check-in Children</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {children.map(child => {
                const childGuardians = guardians.filter(g => g.child_id === child.id);
                const isCheckedIn = checkinLogs.some(
                  log => log.child_id === child.id && !log.check_out_time
                );

                return (
                  <div key={child.id} className="border p-4 rounded">
                    <h3 className="font-medium">{child.firstname} {child.lastname}</h3>
                    {!isCheckedIn ? (
                      <div className="mt-2">
                        <label className="block text-sm text-gray-600 mb-1">
                          Check in with guardian:
                        </label>
                        <select
                          className="w-full p-2 border rounded"
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
                      <div className="mt-2 text-green-600">
                        Checked in
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Check-out Section */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Check-out Children</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {checkinLogs
                .filter(log => !log.check_out_time)
                .map(log => {
                  const childGuardians = guardians.filter(g => g.child_id === log.child_id);

                  return (
                    <div key={log.id} className="border p-4 rounded">
                      <h3 className="font-medium">
                        {log.child.firstname} {log.child.lastname}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Checked in by: {log.checked_in_by.firstname} {log.checked_in_by.lastname}
                      </p>
                      <div className="mt-2">
                        <label className="block text-sm text-gray-600 mb-1">
                          Check out with guardian:
                        </label>
                        <select
                          className="w-full p-2 border rounded"
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
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Check-in History</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Child
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check-in Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check-in By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check-out Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check-out By
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {checkinLogs.map(log => (
                    <tr key={log.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.child.firstname} {log.child.lastname}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {format(new Date(log.check_in_time), 'MMM d, h:mm a')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.checked_in_by.firstname} {log.checked_in_by.lastname}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.check_out_time
                          ? format(new Date(log.check_out_time), 'MMM d, h:mm a')
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
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
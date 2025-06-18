import { supabase } from './supabaseClient';

// Helper function to get current organization ID
const getCurrentOrganizationId = () => {
  return localStorage.getItem('currentOrganizationId');
};

// Helper function to safely parse integers from form inputs
const safeParseInt = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = parseInt(value);
  return isNaN(parsed) ? null : parsed;
};

// Members
export async function getMembers() {
  try {
    const organizationId = getCurrentOrganizationId();
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('organization_id', organizationId)
      .order('firstname', { ascending: true })
      .order('lastname', { ascending: true });

    if (error) throw error;

    // Parse address JSON for each member and transform to camelCase
    const parsedData = data.map(member => {
      try {
        // Transform snake_case to camelCase
        const transformedMember = {
          ...member,
          firstName: member.firstname || '',
          lastName: member.lastname || '',
          joinDate: member.join_date,
          createdAt: member.created_at,
          updatedAt: member.updated_at
        };

        // If address is already an object, use it directly
        if (typeof member.address === 'object' && member.address !== null) {
          return {
            ...transformedMember,
            address: member.address
          };
        }
        
        // If address is a string, check if it's already a valid object
        if (typeof member.address === 'string') {
          const cleanAddress = member.address.trim();
          if (!cleanAddress) {
            return { 
              ...transformedMember,
              address: null 
            };
          }
          
          // Try to parse as JSON, but if it fails, use the string as is
          try {
            const parsed = JSON.parse(cleanAddress);
            return {
              ...transformedMember,
              address: parsed
            };
          } catch (parseError) {
            // If parsing fails, use the string as is
            return {
              ...transformedMember,
              address: cleanAddress
            };
          }
        }
        
        // If address is null or undefined, return null
        return {
          ...transformedMember,
          address: null
        };
      } catch (error) {
        console.error('Error parsing member data:', error);
        return member;
      }
    });

    return parsedData;
  } catch (error) {
    console.error('Error fetching members:', error);
    throw error;
  }
}

export const addMember = async (memberData) => {
  try {
    const organizationId = getCurrentOrganizationId();
    const { data, error } = await supabase
      .from('members')
      .insert([{
        firstname: memberData.firstname,
        lastname: memberData.lastname,
        email: memberData.email,
        phone: memberData.phone,
        status: memberData.status || 'active',
        image_url: memberData.image_url,
        organization_id: organizationId
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

export const updateMember = async (id, memberData) => {
  try {
    const organizationId = getCurrentOrganizationId();
    const { data, error } = await supabase
      .from('members')
      .update({
        firstname: memberData.firstname,
        lastname: memberData.lastname,
        email: memberData.email,
        phone: memberData.phone,
        status: memberData.status,
        image_url: memberData.image_url,
        gender: memberData.gender
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

export const deleteMember = async (id) => {
  try {
    const organizationId = getCurrentOrganizationId();
    
    // First, try to delete from event_attendance
    try {
      const { error: eventAttendanceError } = await supabase
        .from('event_attendance')
        .delete()
        .eq('member_id', id)
        .eq('organization_id', organizationId);

      if (eventAttendanceError && eventAttendanceError.code !== '42P01') { // Ignore "table doesn't exist" error
        throw eventAttendanceError;
      }
    } catch (error) {
      // Continue execution even if this fails
    }

    // Then try to delete from member_event_attendance
    try {
      const { error: memberEventAttendanceError } = await supabase
        .from('member_event_attendance')
        .delete()
        .eq('member_id', id)
        .eq('organization_id', organizationId);

      if (memberEventAttendanceError && memberEventAttendanceError.code !== '42P01') { // Ignore "table doesn't exist" error
        throw memberEventAttendanceError;
      }
    } catch (error) {
      // Continue execution even if this fails
    }

    // Finally delete the member
    const { error: memberError } = await supabase
      .from('members')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (memberError) throw memberError;

    return true;
  } catch (error) {
    throw error;
  }
};

// Events
export const getEvents = async () => {
  try {
    const organizationId = getCurrentOrganizationId();
    const now = new Date();
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('start_date', now.toISOString())
      .order('start_date', { ascending: true });
    
    if (error) throw error;

    // First, group events by their title and recurrence pattern
    const eventGroups = data.reduce((groups, event) => {
      const key = `${event.title}-${event.recurrence_pattern || 'non-recurring'}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(event);
      return groups;
    }, {});

    // Process each group to get the next instance
    const processedEvents = Object.values(eventGroups).map(group => {
      // If it's not a recurring event, return it as is
      if (!group[0].is_recurring) {
        return group[0];
      }

      // For recurring events, find the next occurrence
      const today = new Date();
      let nextDate = new Date(group[0].start_date);
      
      // Keep adding intervals until we find a future date
      while (nextDate < today) {
        switch (group[0].recurrence_pattern) {
          case 'daily':
            nextDate.setDate(nextDate.getDate() + 1);
            break;
          case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
          case 'biweekly':
            nextDate.setDate(nextDate.getDate() + 14);
            break;
          case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
          default:
            nextDate.setDate(nextDate.getDate() + 7); // Default to weekly
        }
      }

      // Create a new event instance with the next occurrence date
      return {
        ...group[0],
        start_date: nextDate.toISOString(),
        end_date: new Date(nextDate.getTime() + (new Date(group[0].end_date) - new Date(group[0].start_date))).toISOString()
      };
    });

    return processedEvents || [];
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
};

export const addEvent = async (event) => {
  try {
    const organizationId = getCurrentOrganizationId();
    
    // Generate a unique ID for the event
    const eventId = `${event.title}-${new Date(event.startDate).getTime()}`
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 255); // Ensure we don't exceed the column length

    const eventData = {
      id: eventId,
      title: event.title,
      description: event.description,
      start_date: new Date(event.startDate).toISOString(),
      end_date: new Date(event.endDate).toISOString(),
      location: event.location,
      url: event.url,
      is_recurring: event.is_recurring || false,
      recurrence_pattern: event.is_recurring ? event.recurrence_pattern : null,
      monthly_week: event.recurrence_pattern === 'monthly_weekday' ? safeParseInt(event.monthly_week) : null,
      monthly_weekday: event.recurrence_pattern === 'monthly_weekday' ? safeParseInt(event.monthly_weekday) : null,
      allow_rsvp: event.allow_rsvp !== undefined ? event.allow_rsvp : true,
      attendance_type: event.attendance_type || 'rsvp',
      event_type: event.event_type || 'Sunday Worship Service',
      needs_volunteers: event.needs_volunteers || false,
      volunteer_roles: event.volunteer_roles || [],
      parent_event_id: null, // Will be set for instances
      organization_id: organizationId
    };

    // If it's a recurring event, first create the master event
    if (event.is_recurring) {
      // Create master event with is_master flag
      const masterEvent = {
        ...eventData,
        is_master: true,
        is_recurring: true
      };

      // Insert master event
      const { data: masterData, error: masterError } = await supabase
        .from('events')
        .insert([masterEvent])
        .select()
        .single();

      if (masterError) throw masterError;

      // Generate instances with parent_event_id pointing to master event
      const instances = generateRecurringInstances({
        ...eventData,
        parent_event_id: masterData.id
      });
      
      // Insert all instances
      const { data: instancesData, error: instancesError } = await supabase
        .from('events')
        .insert(instances)
        .select();
      
      if (instancesError) throw instancesError;
      return masterData; // Return the master event
    } else {
      // For non-recurring events, just insert the single event
      const { data, error } = await supabase
        .from('events')
        .insert([eventData])
        .select();
      
      if (error) throw error;
      return data[0];
    }
  } catch (error) {
    throw error;
  }
};

export const updateEvent = async (id, updates) => {
  try {
    const organizationId = getCurrentOrganizationId();
    
    // First, get the original event to check if it's recurring
    const { data: originalEvent, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (fetchError) throw fetchError;

    const eventData = {
      title: updates.title,
      description: updates.description,
      start_date: updates.start_date,
      end_date: updates.end_date,
      location: updates.location,
      url: updates.url,
      is_recurring: updates.is_recurring || false,
      recurrence_pattern: updates.is_recurring ? updates.recurrence_pattern : null,
      monthly_week: updates.recurrence_pattern === 'monthly_weekday' ? safeParseInt(updates.monthly_week) : null,
      monthly_weekday: updates.recurrence_pattern === 'monthly_weekday' ? safeParseInt(updates.monthly_weekday) : null,
      allow_rsvp: updates.allow_rsvp !== undefined ? updates.allow_rsvp : true,
      attendance_type: updates.attendance_type || 'rsvp',
      needs_volunteers: updates.needs_volunteers || false,
      volunteer_roles: updates.volunteer_roles || []
    };

    // If it's a recurring event, update master and all instances
    if (originalEvent.is_recurring) {
      // First update the master event
      const masterId = originalEvent.is_master ? originalEvent.id : originalEvent.parent_event_id;
      
      const { data: masterData, error: masterError } = await supabase
        .from('events')
        .update({
          ...eventData,
          is_master: true
        })
        .eq('id', masterId)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (masterError) throw masterError;

      // Then update all instances
      const { data: instancesData, error: instancesError } = await supabase
        .from('events')
        .update(eventData)
        .eq('parent_event_id', masterId)
        .eq('organization_id', organizationId)
        .select();
      
      if (instancesError) throw instancesError;
      return masterData;
    } else {
      // For non-recurring events, just update the single event
      const { data, error } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', id)
        .eq('organization_id', organizationId)
        .select();
      
      if (error) throw error;
      return data[0];
    }
  } catch (error) {
    throw error;
  }
};

export const deleteEvent = async (id) => {
  try {
    const organizationId = getCurrentOrganizationId();
    
    // First, get the original event to check if it's recurring
    const { data: originalEvent, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (fetchError) throw fetchError;

    // If it's a recurring event, delete master and all instances
    if (originalEvent.is_recurring) {
      const masterId = originalEvent.is_master ? originalEvent.id : originalEvent.parent_event_id;
      
      // Delete all instances first
      const { error: instancesError } = await supabase
        .from('events')
        .delete()
        .eq('parent_event_id', masterId)
        .eq('organization_id', organizationId);
      
      if (instancesError) throw instancesError;

      // Then delete the master event
      const { error: masterError } = await supabase
        .from('events')
        .delete()
        .eq('id', masterId)
        .eq('organization_id', organizationId);
      
      if (masterError) throw masterError;
    } else {
      // For non-recurring events, just delete the single event
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)
        .eq('organization_id', organizationId);
      
      if (error) throw error;
    }

    return true;
  } catch (error) {
    throw error;
  }
};

// Helper function to generate recurring event instances
const generateRecurringInstances = (event) => {
  const instances = [];
  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);
  const duration = endDate.getTime() - startDate.getTime();
  
  // Generate events for the next year
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  
  let currentDate = new Date(startDate);
  
  while (currentDate <= maxDate) {
    const occurrenceEndDate = new Date(currentDate.getTime() + duration);
    const instanceId = `${event.id}-${currentDate.toISOString()}`
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    instances.push({
      ...event,
      id: instanceId,
      start_date: currentDate.toISOString(),
      end_date: occurrenceEndDate.toISOString(),
      is_master: false,
      parent_event_id: event.parent_event_id
    });
    
    // Increment based on recurrence pattern
    switch (event.recurrence_pattern) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case 'biweekly':
        currentDate.setDate(currentDate.getDate() + 14);
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
      case 'monthly_weekday':
        // Get the next month
        currentDate.setMonth(currentDate.getMonth() + 1);
        // Set to first day of the month
        currentDate.setDate(1);
        
        // Get the target weekday (0-6, where 0 is Sunday)
        const targetWeekday = parseInt(event.monthly_weekday);
        // Get the target week (1-5, where 5 means last week)
        const targetWeek = parseInt(event.monthly_week);
        
        // Find the target date
        if (targetWeek === 5) {
          // For last week, start from the end of the month
          currentDate.setMonth(currentDate.getMonth() + 1);
          currentDate.setDate(0); // Last day of the month
          // Go backwards to find the target weekday
          while (currentDate.getDay() !== targetWeekday) {
            currentDate.setDate(currentDate.getDate() - 1);
          }
        } else {
          // For other weeks, find the first occurrence of the target weekday
          while (currentDate.getDay() !== targetWeekday) {
            currentDate.setDate(currentDate.getDate() + 1);
          }
          // Add weeks to get to the target week
          currentDate.setDate(currentDate.getDate() + (targetWeek - 1) * 7);
        }
        break;
      default:
        currentDate.setDate(currentDate.getDate() + 7); // Default to weekly
    }
  }
  
  return instances;
};

// Donations
export async function getDonations() {
  try {
    const organizationId = getCurrentOrganizationId();
    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .eq('organization_id', organizationId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error;
  }
}

export async function addDonation(donation) {
  try {
    const organizationId = getCurrentOrganizationId();
    
    // Ensure attendance is properly handled
    const donationData = {
      ...donation,
      amount: parseFloat(donation.amount),
      date: new Date(donation.date).toISOString(),
      attendance: donation.attendance ? parseInt(donation.attendance) : null,
      organization_id: organizationId
    };

    const { data, error } = await supabase
      .from('donations')
      .insert([donationData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

export async function addMultipleDonations(donations) {
  try {
    const organizationId = getCurrentOrganizationId();
    
    const donationsData = donations.map(donation => ({
      amount: parseFloat(donation.amount),
      date: new Date(donation.date).toISOString(),
      attendance: donation.attendance ? parseInt(donation.attendance) : null,
      type: donation.type || 'weekly',
      organization_id: organizationId
    }));

    const { data, error } = await supabase
      .from('donations')
      .insert(donationsData)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

export async function updateDonation(id, updates) {
  try {
    const organizationId = getCurrentOrganizationId();
    
    const { data, error } = await supabase
      .from('donations')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

export async function deleteDonation(id) {
  try {
    const organizationId = getCurrentOrganizationId();
    
    const { error } = await supabase
      .from('donations')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) throw error;
    return true;
  } catch (error) {
    throw error;
  }
}

// Groups
export async function getGroups() {
  try {
    const organizationId = getCurrentOrganizationId();
    
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error;
  }
}

export const getMemberAttendance = async (memberId) => {
  try {
    const organizationId = getCurrentOrganizationId();
    
    const { data, error } = await supabase
      .from('event_attendance')
      .select(`
        *,
        events (
          id,
          title,
          start_date,
          end_date,
          location
        )
      `)
      .eq('member_id', memberId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform the data to show 'attended' for past events
    const now = new Date();
    return data.map(record => ({
      ...record,
      status: new Date(record.events.start_date) < now ? 'attended' : record.status
    }));
  } catch (error) {
    throw error;
  }
};

export const getMemberGroups = async (memberId) => {
  try {
    const organizationId = getCurrentOrganizationId();
    
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        *,
        groups (
          id,
          name,  
          description,
          leader:members!leader_id (
            id,
            firstname,
            lastname
          )
        )
      `)
      .eq('member_id', memberId)
      .eq('organization_id', organizationId);

    if (error) throw error;
    
    // Transform the data to camelCase for the frontend
    return data.map(item => ({
      ...item,
      group: {
        ...item.groups,
        leader: item.groups.leader ? {
          ...item.groups.leader,
          firstName: item.groups.leader.firstname,
          lastName: item.groups.leader.lastname
        } : null
      }
    }));
  } catch (error) {
    throw error;
  }
};
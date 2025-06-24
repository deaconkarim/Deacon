import { supabase } from './supabaseClient';

// Helper function to get current user's organization ID
const getCurrentUserOrganizationId = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .eq('approval_status', 'approved')
      .single();

    if (error) throw error;
    return data?.organization_id;
  } catch (error) {
    console.error('Error getting user organization:', error);
    return null;
  }
};

// Helper function to check if user is approved
export const isUserApproved = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('organization_users')
      .select('approval_status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (error) return false;
    return data?.approval_status === 'approved';
  } catch (error) {
    console.error('Error checking user approval status:', error);
    return false;
  }
};

// Helper function to get user's approval status
export const getUserApprovalStatus = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('organization_users')
      .select('approval_status, rejection_reason')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (error) return null;
    return data;
  } catch (error) {
    console.error('Error getting user approval status:', error);
    return null;
  }
};

// Helper function to check if user is admin
export const isUserAdmin = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('organization_users')
      .select('role')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .eq('approval_status', 'approved')
      .single();

    if (error) return false;
    return data?.role === 'admin';
  } catch (error) {
    console.error('Error checking user admin status:', error);
    return false;
  }
};

// Helper function to safely parse integers from form inputs
const safeParseInt = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = parseInt(value);
  return isNaN(parsed) ? null : parsed;
};

// Helper function to safely parse volunteer roles
export const parseVolunteerRoles = (volunteerRoles) => {
  if (!volunteerRoles) return [];
  
  try {
    // If it's already an array/object, return it
    if (Array.isArray(volunteerRoles)) {
      return volunteerRoles;
    }
    
    // If it's a string, try to parse it as JSON
    if (typeof volunteerRoles === 'string') {
      return JSON.parse(volunteerRoles);
    }
    
    // If it's an object, return it as an array
    if (typeof volunteerRoles === 'object') {
      return [volunteerRoles];
    }
    
    return [];
  } catch (error) {
    console.error('Error parsing volunteer roles:', error);
    return [];
  }
};

// Members
export async function getMembers() {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('organization_id', organizationId)
      .neq('firstname', 'Unknown') // Filter out auth users created during fix
      .neq('lastname', 'User') // Filter out auth users created during fix
      .not('firstname', 'is', null) // Exclude members without first names
      .not('lastname', 'is', null) // Exclude members without last names
      .neq('firstname', '') // Exclude members with empty first names
      .neq('lastname', '') // Exclude members with empty last names
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
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

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
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

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
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    // First, try to delete from event_attendance
    try {
      const { error: eventAttendanceError } = await supabase
        .from('event_attendance')
        .delete()
        .eq('member_id', id);

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
        .eq('member_id', id);

      if (memberEventAttendanceError && memberEventAttendanceError.code !== '42P01') { // Ignore "table doesn't exist" error
        throw memberEventAttendanceError;
      }
    } catch (error) {
      // Continue execution even if this fails
    }

    // Finally delete the member (only if they belong to the same organization)
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
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

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

// Get all events for dashboard statistics (including past events)
export const getAllEvents = async () => {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('organization_id', organizationId)
      .order('start_date', { ascending: true });
    
    if (error) throw error;

    // For dashboard statistics, return all individual event instances
    // Don't group recurring events - we want to count each instance
    return data || [];
  } catch (error) {
    console.error('Error fetching all events:', error);
    return [];
  }
};

export const addEvent = async (event) => {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

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
      volunteer_roles: event.volunteer_roles ? JSON.stringify(event.volunteer_roles) : null,
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
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

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
      start_date: updates.startDate,
      end_date: updates.endDate,
      location: updates.location,
      url: updates.url,
      is_recurring: updates.is_recurring || false,
      recurrence_pattern: updates.is_recurring ? updates.recurrence_pattern : null,
      monthly_week: updates.recurrence_pattern === 'monthly_weekday' ? safeParseInt(updates.monthly_week) : null,
      monthly_weekday: updates.recurrence_pattern === 'monthly_weekday' ? safeParseInt(updates.monthly_weekday) : null,
      allow_rsvp: updates.allow_rsvp !== undefined ? updates.allow_rsvp : true,
      attendance_type: updates.attendance_type || 'rsvp',
      needs_volunteers: updates.needs_volunteers || false,
      volunteer_roles: updates.volunteer_roles ? JSON.stringify(updates.volunteer_roles) : null
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
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    // First, get the event to check if it's recurring
    const { data: event, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (fetchError) throw fetchError;

    // If it's a recurring event, delete master and all instances
    if (event.is_recurring) {
      const masterId = event.is_master ? event.id : event.parent_event_id;
      
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
    const organizationId = await getCurrentUserOrganizationId();
    console.log('=== GETDONATIONS DEBUG ===');
    console.log('Organization ID:', organizationId);
    
    if (!organizationId) {
      console.error('No organization ID found for user');
      throw new Error('User not associated with any organization');
    }

    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .eq('organization_id', organizationId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    console.log('Donations fetched:', data?.length || 0, 'records');
    console.log('Sample donation:', data?.[0]);
    console.log('All donations:', data);
    console.log('=== END GETDONATIONS DEBUG ===');
    
    return data || [];
  } catch (error) {
    console.error('Error fetching donations:', error);
    return [];
  }
}

export async function addDonation(donation) {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    const { data, error } = await supabase
      .from('donations')
      .insert([{
        ...donation,
        organization_id: organizationId
      }])
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
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    const donationsWithOrg = donations.map(donation => ({
      ...donation,
      organization_id: organizationId
    }));

    const { data, error } = await supabase
      .from('donations')
      .insert(donationsWithOrg)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

export async function updateDonation(id, updates) {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

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
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

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
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching groups:', error);
    return [];
  }
}

export const getMemberAttendance = async (memberId) => {
  try {
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

export const addEventAttendance = async (eventId, memberId, status = 'attending') => {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    const { data, error } = await supabase
      .from('event_attendance')
      .upsert({
        event_id: eventId,
        member_id: memberId,
        status: status
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding event attendance:', error);
    throw error;
  }
};

export const getEventAttendance = async (eventId) => {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    const { data, error } = await supabase
      .from('event_attendance')
      .select('*')
      .eq('event_id', eventId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching event attendance:', error);
    throw error;
  }
};

export const getMemberGroups = async (memberId) => {
  try {
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
      .eq('member_id', memberId);

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

// Approval Management Functions
export const getPendingApprovals = async () => {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    // First get the pending organization_users
    const { data: orgUsers, error: orgUsersError } = await supabase
      .from('organization_users')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('approval_status', 'pending')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (orgUsersError) throw orgUsersError;

    if (!orgUsers || orgUsers.length === 0) {
      return [];
    }

    // Get the user IDs from the pending approvals
    const userIds = orgUsers.map(ou => ou.user_id);

    // Fetch the corresponding member data
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, firstname, lastname, email, user_id')
      .in('user_id', userIds);

    if (membersError) throw membersError;

    // Create a map of user_id to member data
    const memberMap = {};
    if (members) {
      members.forEach(member => {
        memberMap[member.user_id] = member;
      });
    }

    // Combine the data
    const result = orgUsers.map(orgUser => ({
      id: orgUser.id,
      user_id: orgUser.user_id,
      role: orgUser.role,
      created_at: orgUser.created_at,
      firstname: memberMap[orgUser.user_id]?.firstname || 'Unknown',
      lastname: memberMap[orgUser.user_id]?.lastname || 'User',
      email: memberMap[orgUser.user_id]?.email || 'No email'
    }));

    return result;
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    throw error;
  }
};

export const approveUser = async (userId, role = 'member') => {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('organization_users')
      .update({
        approval_status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user.id,
        role: role
      })
      .eq('user_id', userId)
      .eq('organization_id', organizationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error approving user:', error);
    throw error;
  }
};

export const rejectUser = async (userId, rejectionReason) => {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('organization_users')
      .update({
        approval_status: 'rejected',
        approved_at: new Date().toISOString(),
        approved_by: user.id,
        rejection_reason: rejectionReason
      })
      .eq('user_id', userId)
      .eq('organization_id', organizationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error rejecting user:', error);
    throw error;
  }
};

export const getApprovalNotifications = async () => {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      console.log('No organization ID found, returning empty array');
      return [];
    }

    const { data, error } = await supabase
      .from('approval_notifications')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'unread')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching approval notifications:', error);
      // If table doesn't exist or permission denied, return empty array
      if (error.code === 'PGRST116' || error.message.includes('permission denied')) {
        return [];
      }
      throw error;
    }
    return data || [];
  } catch (error) {
    console.error('Error fetching approval notifications:', error);
    // Return empty array instead of throwing to prevent app crashes
    return [];
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const { error } = await supabase
      .from('approval_notifications')
      .update({ status: 'read' })
      .eq('id', notificationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export const makeUserAdmin = async (userId) => {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if current user is admin
    const isCurrentUserAdmin = await isUserAdmin();
    if (!isCurrentUserAdmin) {
      throw new Error('Only admins can make other users admin');
    }

    const { error } = await supabase
      .from('organization_users')
      .update({
        role: 'admin'
      })
      .eq('user_id', userId)
      .eq('organization_id', organizationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error making user admin:', error);
    throw error;
  }
};

export const removeUserAdmin = async (userId) => {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if current user is admin
    const isCurrentUserAdmin = await isUserAdmin();
    if (!isCurrentUserAdmin) {
      throw new Error('Only admins can remove admin privileges');
    }

    // Prevent removing admin from themselves
    if (userId === user.id) {
      throw new Error('Cannot remove admin privileges from yourself');
    }

    const { error } = await supabase
      .from('organization_users')
      .update({
        role: 'member'
      })
      .eq('user_id', userId)
      .eq('organization_id', organizationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error removing user admin:', error);
    throw error;
  }
};

// Event Volunteers
export const getEventVolunteers = async (eventId) => {
  try {
    const { data, error } = await supabase
      .from('event_volunteers')
      .select('*, member:members(*), event:events(*)')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching event volunteers:', error);
    return [];
  }
};

export const addEventVolunteer = async ({ eventId, memberId, role, notes }) => {
  try {
    const { data, error } = await supabase
      .from('event_volunteers')
      .insert([
        {
          event_id: eventId,
          member_id: memberId,
          role,
          notes: notes || null
        }
      ])
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding event volunteer:', error);
    throw error;
  }
};

export const updateEventVolunteer = async (eventVolunteerId, { role, notes }) => {
  try {
    const { data, error } = await supabase
      .from('event_volunteers')
      .update({ role, notes })
      .eq('id', eventVolunteerId)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating event volunteer:', error);
    throw error;
  }
};

export const removeEventVolunteer = async (eventVolunteerId) => {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    const { error } = await supabase
      .from('event_volunteers')
      .delete()
      .eq('id', eventVolunteerId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error removing event volunteer:', error);
    throw error;
  }
};

// Get volunteer statistics for dashboard
export const getVolunteerStats = async () => {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    // Get events in the next 30 days that have volunteers enabled
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const today = new Date();

    const { data: upcomingEvents, error: eventsError } = await supabase
      .from('events')
      .select('id, title, start_date, needs_volunteers, volunteer_roles')
      .eq('organization_id', organizationId)
      .gte('start_date', today.toISOString())
      .lte('start_date', thirtyDaysFromNow.toISOString())
      .order('start_date', { ascending: true });

    if (eventsError) throw eventsError;

    // Filter events that have volunteers enabled
    const eventsWithVolunteersEnabled = upcomingEvents.filter(event => event.needs_volunteers === true);
    const eventsWithVolunteersEnabledCount = eventsWithVolunteersEnabled.length;

    // Get all volunteer assignments for these events
    const eventIds = eventsWithVolunteersEnabled.map(event => event.id);
    
    let totalVolunteersSignedUp = 0;
    let eventsStillNeedingVolunteers = 0;

    if (eventIds.length > 0) {
      const { data: volunteerAssignments, error: volunteersError } = await supabase
        .from('event_volunteers')
        .select(`
          id,
          event_id,
          role,
          notes,
          created_at,
          events!inner(id, title, start_date, organization_id, volunteer_roles),
          members!inner(id, firstname, lastname, email, image_url)
        `)
        .in('event_id', eventIds);

      if (volunteersError) throw volunteersError;

      totalVolunteersSignedUp = volunteerAssignments?.length || 0;

      // Check which events still need volunteers
      eventsStillNeedingVolunteers = eventsWithVolunteersEnabled.filter(event => {
        const eventVolunteers = volunteerAssignments?.filter(v => v.event_id === event.id) || [];
        const volunteerRoles = parseVolunteerRoles(event.volunteer_roles);
        const totalRolesNeeded = volunteerRoles.reduce((sum, role) => sum + (role.quantity || 1), 0);
        return eventVolunteers.length < totalRolesNeeded;
      }).length;
    }

    // Get unique volunteers (people who have volunteered)
    const { data: allVolunteers, error: allVolunteersError } = await supabase
      .from('event_volunteers')
      .select(`
        id,
        role,
        notes,
        created_at,
        events!inner(id, title, start_date, organization_id),
        members!inner(id, firstname, lastname, email, image_url)
      `)
      .eq('events.organization_id', organizationId);

    if (allVolunteersError) throw allVolunteersError;

    const uniqueVolunteers = new Set(allVolunteers?.map(v => v.members.id) || []);
    const totalUniqueVolunteers = uniqueVolunteers.size;

    // Get recent volunteer assignments (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentVolunteers = allVolunteers?.filter(volunteer => {
      const assignmentDate = new Date(volunteer.created_at);
      return assignmentDate >= sevenDaysAgo;
    }) || [];

    return {
      totalVolunteers: totalUniqueVolunteers,
      upcomingVolunteers: totalVolunteersSignedUp,
      recentVolunteers: recentVolunteers.length,
      eventsNeedingVolunteers: eventsStillNeedingVolunteers,
      eventsWithVolunteersEnabled: eventsWithVolunteersEnabledCount,
      totalVolunteersSignedUp: totalVolunteersSignedUp,
      eventsStillNeedingVolunteers: eventsStillNeedingVolunteers,
      upcomingEventsWithVolunteers: eventsWithVolunteersEnabled.slice(0, 5),
      allVolunteers: allVolunteers || []
    };
  } catch (error) {
    console.error('Error fetching volunteer statistics:', error);
    throw error;
  }
};

// Get the current user's organization name
export const getOrganizationName = async () => {
  try {
    console.log('getOrganizationName: Starting...');
    const { data: { user } } = await supabase.auth.getUser();
    console.log('getOrganizationName: User:', user?.id);
    if (!user) return null;

    // Get the user's organization ID
    const { data: userOrg, error: userOrgError } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    console.log('getOrganizationName: User org data:', userOrg, 'Error:', userOrgError);
    if (userOrgError || !userOrg) return null;

    // Get the organization name
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', userOrg.organization_id)
      .single();

    console.log('getOrganizationName: Organization data:', org, 'Error:', orgError);
    if (orgError || !org) return null;

    console.log('getOrganizationName: Returning name:', org.name);
    return org.name;
  } catch (error) {
    console.error('Error getting organization name:', error);
    return null;
  }
};

// Get current user's member information
export const getCurrentUserMember = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data; // This will be null if no member record exists
  } catch (error) {
    console.error('Error fetching current user member:', error);
    throw error;
  }
};

// Update current user's member information
export const updateCurrentUserMember = async (updates) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    // First check if a member record exists for this user
    const { data: existingMember, error: checkError } = await supabase
      .from('members')
      .select('id, email')
      .eq('user_id', user.id)
      .maybeSingle();

    if (checkError) throw checkError;

    let result;
    if (existingMember) {
      // Update existing member record
      const { data, error } = await supabase
        .from('members')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        // If there's a duplicate email error, try to find and update the member with that email
        if (error.code === '23505' && error.details?.includes('email')) {
          console.log('Duplicate email detected, trying to update existing member with that email');
          
          // Find the member with the duplicate email
          const { data: duplicateMember, error: duplicateError } = await supabase
            .from('members')
            .select('id, user_id')
            .eq('email', updates.email)
            .maybeSingle();
          
          if (duplicateError) throw duplicateError;
          
          if (duplicateMember) {
            // If the duplicate member has no user_id, update it with the current user's ID
            if (!duplicateMember.user_id) {
              const { data: updatedData, error: updateError } = await supabase
                .from('members')
                .update({
                  ...updates,
                  user_id: user.id,
                  organization_id: organizationId
                })
                .eq('id', duplicateMember.id)
                .select()
                .single();
              
              if (updateError) throw updateError;
              result = updatedData;
            } else {
              // If the duplicate member has a different user_id, this is a conflict
              throw new Error('Email is already associated with another user account');
            }
          } else {
            throw error; // Re-throw the original error if we can't find the duplicate
          }
        } else {
          throw error;
        }
      } else {
        result = data;
      }
    } else {
      // Check if there's already a member with the same email
      if (updates.email) {
        const { data: duplicateMember, error: duplicateError } = await supabase
          .from('members')
          .select('id, user_id')
          .eq('email', updates.email)
          .maybeSingle();
        
        if (duplicateError) throw duplicateError;
        
        if (duplicateMember) {
          // If the duplicate member has no user_id, update it with the current user's ID
          if (!duplicateMember.user_id) {
            const { data: updatedData, error: updateError } = await supabase
              .from('members')
              .update({
                ...updates,
                user_id: user.id,
                organization_id: organizationId,
                status: 'active'
              })
              .eq('id', duplicateMember.id)
              .select()
              .single();
            
            if (updateError) throw updateError;
            result = updatedData;
          } else {
            // If the duplicate member has a different user_id, this is a conflict
            throw new Error('Email is already associated with another user account');
          }
        } else {
          // Create new member record
          const { data, error } = await supabase
            .from('members')
            .insert([{
              ...updates,
              user_id: user.id,
              organization_id: organizationId,
              status: 'active'
            }])
            .select()
            .single();

          if (error) throw error;
          result = data;
        }
      } else {
        // Create new member record without email
        const { data, error } = await supabase
          .from('members')
          .insert([{
            ...updates,
            user_id: user.id,
            organization_id: organizationId,
            status: 'active'
          }])
          .select()
          .single();

        if (error) throw error;
        result = data;
      }
    }

    return result;
  } catch (error) {
    console.error('Error updating current user member:', error);
    throw error;
  }
};

// Update current user's email in auth
export const updateCurrentUserEmail = async (newEmail) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      email: newEmail
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user email:', error);
    throw error;
  }
};

// Update current user's password
export const updateCurrentUserPassword = async (newPassword) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user password:', error);
    throw error;
  }
};

// Delete a user and all their related records
export const deleteUser = async (userId, organizationId) => {
  try {
    // Get the auth user ID from the member record
    const { data: memberData, error: memberError } = await supabase
      .from('members')
      .select('user_id')
      .eq('id', userId)
      .single();

    if (memberError) throw memberError;

    const authUserId = memberData.user_id;

    // Prevent deleting the current user
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser && authUserId === currentUser.id) {
      throw new Error('Cannot delete your own account');
    }

    // Delete organization_users record first
    if (authUserId) {
      const { error: orgUserError } = await supabase
        .from('organization_users')
        .delete()
        .eq('user_id', authUserId)
        .eq('organization_id', organizationId);

      if (orgUserError) {
        console.error('Error deleting organization_users record:', orgUserError);
        // Continue with member deletion even if org_users deletion fails
      }
    }

    // Delete the member record
    const { error: memberDeleteError } = await supabase
      .from('members')
      .delete()
      .eq('id', userId);

    if (memberDeleteError) throw memberDeleteError;

    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Get attendance statistics for dashboard
export const getAttendanceStats = async () => {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    // Get all events for the last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

    // Fetch all events in the last 30 days
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, start_date, event_type, organization_id')
      .eq('organization_id', organizationId)
      .gte('start_date', thirtyDaysAgo.toISOString().slice(0, 10))
      .order('start_date', { ascending: false });
    if (eventsError) throw eventsError;

    // Fetch all attendance records for these events
    const eventIds = events.map(e => e.id);
    let attendance = [];
    if (eventIds.length > 0) {
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('event_attendance')
        .select('id, event_id, status, created_at, member_id')
        .in('event_id', eventIds);
      if (attendanceError) throw attendanceError;
      attendance = attendanceData;
    }

    // Fetch all active members for the organization
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('status', 'active');
    if (membersError) throw membersError;
    const activeMemberIds = members.map(m => m.id);
    const activeCount = activeMemberIds.length;

    console.log('=== ATTENDANCE DEBUG ===');
    console.log('Active members count:', activeCount);
    console.log('Active member IDs:', activeMemberIds);
    console.log('Total attendance records:', attendance.length);
    console.log('Events count:', events.length);
    console.log('Sample attendance records:', attendance.slice(0, 5));
    console.log('Attendance member IDs:', attendance.map(a => a.member_id).filter(id => id));

    // Helper: categorize event type
    const categorize = (event) => {
      const type = (event.event_type || '').toLowerCase();
      const title = (event.title || '').toLowerCase();
      if (type.includes('sunday') || type.includes('service') || type.includes('worship') ||
          title.includes('sunday') || title.includes('service') || title.includes('worship')) {
        return 'sundayService';
      } else if (type.includes('bible') || type.includes('study') || type.includes('class') ||
                 title.includes('bible') || title.includes('study') || title.includes('class')) {
        return 'bibleStudy';
      } else if (type.includes('fellowship') || type.includes('social') || type.includes('gathering') ||
                 title.includes('fellowship') || title.includes('social') || title.includes('gathering')) {
        return 'fellowship';
      } else {
        return 'other';
      }
    };

    // Build breakdown for last 30 days and last 7 days
    const breakdown = {
      sundayService: { recentAttendance: 0, thisWeekAttendance: 0, recentUnique: new Set(), thisWeekUnique: new Set() },
      bibleStudy: { recentAttendance: 0, thisWeekAttendance: 0, recentUnique: new Set(), thisWeekUnique: new Set() },
      fellowship: { recentAttendance: 0, thisWeekAttendance: 0, recentUnique: new Set(), thisWeekUnique: new Set() },
    };

    // Map eventId to event
    const eventMap = Object.fromEntries(events.map(e => [e.id, e]));

    attendance.forEach(record => {
      const event = eventMap[record.event_id];
      if (!event) return;
      const category = categorize(event);
      if (record.status === 'checked-in' || record.status === 'attending') {
        const recordDate = new Date(record.created_at);
        if (recordDate >= thirtyDaysAgo) {
          if (breakdown[category]) {
            breakdown[category].recentAttendance++;
            if (record.member_id) breakdown[category].recentUnique.add(record.member_id);
          }
        }
        if (recordDate >= sevenDaysAgo) {
          if (breakdown[category]) {
            breakdown[category].thisWeekAttendance++;
            if (record.member_id) breakdown[category].thisWeekUnique.add(record.member_id);
          }
        }
      }
    });

    // Calculate percent of active members for each
    const percent = (uniqueSet) => {
      if (activeCount === 0) return 0;
      const filtered = Array.from(uniqueSet).filter(id => activeMemberIds.includes(id));
      return Math.round((filtered.length / activeCount) * 100);
    };

    console.log('Breakdown:', breakdown);
    console.log('Sunday Service unique recent:', breakdown.sundayService.recentUnique.size);
    console.log('Sunday Service unique week:', breakdown.sundayService.thisWeekUnique.size);
    console.log('Bible Study unique recent:', breakdown.bibleStudy.recentUnique.size);
    console.log('Bible Study unique week:', breakdown.bibleStudy.thisWeekUnique.size);
    console.log('Fellowship unique recent:', breakdown.fellowship.recentUnique.size);
    console.log('Fellowship unique week:', breakdown.fellowship.thisWeekUnique.size);
    console.log('=== END ATTENDANCE DEBUG ===');

    // Return in dashboard format
    return {
      sundayService: {
        recentAttendance: breakdown.sundayService.recentAttendance,
        thisWeekAttendance: breakdown.sundayService.thisWeekAttendance,
        percentRecent: percent(breakdown.sundayService.recentUnique),
        percentWeek: percent(breakdown.sundayService.thisWeekUnique)
      },
      bibleStudy: {
        recentAttendance: breakdown.bibleStudy.recentAttendance,
        thisWeekAttendance: breakdown.bibleStudy.thisWeekAttendance,
        percentRecent: percent(breakdown.bibleStudy.recentUnique),
        percentWeek: percent(breakdown.bibleStudy.thisWeekUnique)
      },
      fellowship: {
        recentAttendance: breakdown.fellowship.recentAttendance,
        thisWeekAttendance: breakdown.fellowship.thisWeekAttendance,
        percentRecent: percent(breakdown.fellowship.recentUnique),
        percentWeek: percent(breakdown.fellowship.thisWeekUnique)
      }
    };
  } catch (error) {
    console.error('Error fetching attendance statistics:', error);
    throw error;
  }
};
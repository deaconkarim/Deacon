import { supabase } from './supabaseClient';

// Members
export async function getMembers() {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
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

export const addMember = async (member) => {
  // Ensure address is properly formatted as JSONB
  const memberData = {
    ...member,
    // Don't modify the address object at all, let Supabase handle it
    joinDate: member.joinDate ? new Date(member.joinDate).toISOString() : new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('members')
    .insert([memberData])
    .select()
    .single();

  if (error) throw error;

  // Parse the address before returning
  return {
    ...data,
    address: data.address ? JSON.parse(data.address) : null
  };
};

export const updateMember = async (id, updates) => {
  try {
    // Check if email is being changed and if it already exists (only for non-null, non-empty emails)
    if (updates.email && updates.email.trim() && updates.email.trim() !== '') {
      const { data: existingMembers, error: checkError } = await supabase
        .from('members')
        .select('email, id')
        .eq('email', updates.email.trim())
        .neq('id', id);

      if (checkError) {
        console.error('Error checking for duplicate email:', checkError);
        throw checkError;
      }

      if (existingMembers && existingMembers.length > 0) {
        throw new Error('A member with this email already exists');
      }
    }

    // Transform camelCase back to database column names
    const memberData = {
      ...updates,
      firstname: updates.firstName,
      lastname: updates.lastName,
      join_date: updates.joinDate,
      created_at: updates.createdAt,
      updated_at: updates.updatedAt
    };

    // Handle empty email - convert to null to avoid unique constraint issues
    if (memberData.email === '' || memberData.email === undefined) {
      memberData.email = null;
    }

    // Remove the camelCase properties to avoid confusion
    delete memberData.firstName;
    delete memberData.lastName;
    delete memberData.joinDate;
    delete memberData.createdAt;
    delete memberData.updatedAt;

    const { data, error } = await supabase
      .from('members')
      .update(memberData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      // Handle duplicate email constraint specifically
      if (error.code === '23505' && error.message.includes('members_email_key')) {
        throw new Error('A member with this email already exists');
      }
      throw error;
    }

    // Transform back to camelCase for the frontend
    return {
      ...data,
      firstName: data.firstname,
      lastName: data.lastname,
      joinDate: data.join_date,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Error updating member:', error);
    throw error;
  }
};

export const deleteMember = async (id) => {
  try {
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

    // Finally delete the member
    const { error: memberError } = await supabase
      .from('members')
      .delete()
      .eq('id', id);

    if (memberError) throw memberError;

    return true;
  } catch (error) {
    throw error;
  }
};

// Events
export const getEvents = async () => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_date', { ascending: true });
    
    if (error) throw error;

    // Process recurring events to show only one instance
    const processedEvents = data.reduce((acc, event) => {
      // If it's not a recurring event, add it as is
      if (!event.is_recurring) {
        acc.push(event);
        return acc;
      }

      // For recurring events, check if we already have an instance
      const existingInstance = acc.find(e => 
        e.title === event.title && 
        e.is_recurring && 
        e.recurrence_pattern === event.recurrence_pattern
      );

      // If no instance exists, add this one
      if (!existingInstance) {
        acc.push(event);
      }

      return acc;
    }, []);

    return processedEvents || [];
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
};

export const addEvent = async (event) => {
  try {
    // Generate a unique ID for the event
    const eventId = `${event.title}-${new Date(event.startDate).toISOString()}`
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const eventData = {
      id: eventId,
      title: event.title,
      description: event.description,
      start_date: event.startDate,
      end_date: event.endDate,
      location: event.location,
      url: event.url,
      is_recurring: event.is_recurring || false,
      recurrence_pattern: event.is_recurring ? event.recurrence_pattern : null,
      monthly_week: event.recurrence_pattern === 'monthly_weekday' ? event.monthly_week : null,
      monthly_weekday: event.recurrence_pattern === 'monthly_weekday' ? event.monthly_weekday : null,
      allow_rsvp: event.allow_rsvp !== undefined ? event.allow_rsvp : true,
      parent_event_id: null // Will be set for instances
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
        parent_event_id: masterData.id,
        monthly_week: event.monthly_week,
        monthly_weekday: event.monthly_weekday
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
    // First, get the original event to check if it's recurring
    const { data: originalEvent, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
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
      monthly_week: updates.recurrence_pattern === 'monthly_weekday' ? updates.monthly_week : null,
      monthly_weekday: updates.recurrence_pattern === 'monthly_weekday' ? updates.monthly_weekday : null,
      allow_rsvp: updates.allow_rsvp !== undefined ? updates.allow_rsvp : true
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
        .select()
        .single();

      if (masterError) throw masterError;

      // Then update all instances
      const { data: instancesData, error: instancesError } = await supabase
        .from('events')
        .update(eventData)
        .eq('parent_event_id', masterId)
        .select();
      
      if (instancesError) throw instancesError;
      return masterData;
    } else {
      // For non-recurring events, just update the single event
      const { data, error } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', id)
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
    // First, get the original event to check if it's recurring
    const { data: originalEvent, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // If it's a recurring event, delete master and all instances
    if (originalEvent.is_recurring) {
      const masterId = originalEvent.is_master ? originalEvent.id : originalEvent.parent_event_id;
      
      // Delete all instances first
      const { error: instancesError } = await supabase
        .from('events')
        .delete()
        .eq('parent_event_id', masterId);
      
      if (instancesError) throw instancesError;

      // Then delete the master event
      const { error: masterError } = await supabase
        .from('events')
        .delete()
        .eq('id', masterId);
      
      if (masterError) throw masterError;
    } else {
      // For non-recurring events, just delete the single event
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);
      
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
  
  // Generate events for the next 3 months
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);
  
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
    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error;
  }
}

export async function addDonation(donation) {
  try {
    // Ensure attendance is properly handled
    const donationData = {
      ...donation,
      amount: parseFloat(donation.amount),
      date: new Date(donation.date).toISOString(),
      attendance: donation.attendance ? parseInt(donation.attendance) : null
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

export async function updateDonation(id, updates) {
  try {
    const { data, error } = await supabase
      .from('donations')
      .update(updates)
      .eq('id', id)
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
    const { error } = await supabase
      .from('donations')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    throw error;
  }
}

// Groups
export async function getGroups() {
  try {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error;
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
      .eq('memberid', memberId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
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
      .eq('memberid', memberId)
      .order('created_at', { ascending: false });

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
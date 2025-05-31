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
          joinDate: member.joindate,
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
        return {
          ...member,
          firstName: member.firstname || '',
          lastName: member.lastname || '',
          joinDate: member.joindate,
          createdAt: member.created_at,
          updatedAt: member.updated_at,
          address: null
        };
      }
    });

    return parsedData;
  } catch (error) {
    return [];
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
  // Ensure address is properly formatted as JSONB
  const memberData = {
    ...updates,
    // Don't modify the address object at all, let Supabase handle it
    joinDate: updates.joinDate ? new Date(updates.joinDate).toISOString() : undefined
  };

  const { data, error } = await supabase
    .from('members')
    .update(memberData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Parse the address before returning
  return {
    ...data,
    address: data.address ? JSON.parse(data.address) : null
  };
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
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true });
  
  if (error) return [];
  return data;
};

export const addEvent = async (event) => {
  const { data, error } = await supabase
    .from('events')
    .insert([event])
    .select();
  
  if (error) throw error;
  return data[0];
};

export const updateEvent = async (id, updates) => {
  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return data[0];
};

export const deleteEvent = async (id) => {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
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
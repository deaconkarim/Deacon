import { supabase } from './supabaseClient';

// Members
export async function getMembers() {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching members:', error);
      throw error;
    }

    console.log('Raw members data:', data);

    // Parse address JSON for each member
    const parsedData = data.map(member => {
      try {
        console.log('Processing member:', member.id);
        console.log('Address type:', typeof member.address);
        console.log('Raw address:', member.address);

        // If address is already an object, use it directly
        if (typeof member.address === 'object' && member.address !== null) {
          console.log('Using address as object');
          return {
            ...member,
            address: member.address
          };
        }
        
        // If address is a string, check if it's already a valid object
        if (typeof member.address === 'string') {
          const cleanAddress = member.address.trim();
          if (!cleanAddress) {
            return { ...member, address: null };
          }
          
          // Try to parse as JSON, but if it fails, use the string as is
          try {
            const parsed = JSON.parse(cleanAddress);
            return {
              ...member,
              address: parsed
            };
          } catch (parseError) {
            // If parsing fails, use the string as is
            return {
              ...member,
              address: cleanAddress
            };
          }
        }
        
        // If address is null or undefined, return null
        console.log('Using null address');
        return {
          ...member,
          address: null
        };
      } catch (error) {
        console.error('Error processing member address:', member.id, error);
        return {
          ...member,
          address: null
        };
      }
    });

    console.log('Parsed members data:', parsedData);
    return parsedData;
  } catch (error) {
    console.error('Error in getMembers:', error);
    return [];
  }
}

export const addMember = async (member) => {
  // Ensure address is properly formatted as JSONB
  const memberData = {
    ...member,
    // Don't modify the address object at all, let Supabase handle it
    join_date: member.join_date ? new Date(member.join_date).toISOString() : new Date().toISOString()
  };

  console.log('Adding member with data:', memberData);

  const { data, error } = await supabase
    .from('members')
    .insert([memberData])
    .select()
    .single();

  if (error) {
    console.error('Error adding member:', error);
    throw error;
  }

  console.log('Added member:', data);
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
    join_date: updates.join_date ? new Date(updates.join_date).toISOString() : undefined
  };

  console.log('Updating member with data:', memberData);

  const { data, error } = await supabase
    .from('members')
    .update(memberData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating member:', error);
    throw error;
  }

  console.log('Updated member:', data);
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
      console.error('Error deleting from event_attendance:', error);
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
      console.error('Error deleting from member_event_attendance:', error);
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
    console.error('Error deleting member:', error);
    throw error;
  }
};

// Events
export const getEvents = async () => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true });
  
  if (error) {
    console.error('Error fetching events:', error);
    return [];
  }
  return data;
};

export const addEvent = async (event) => {
  const { data, error } = await supabase
    .from('events')
    .insert([event])
    .select();
  
  if (error) {
    console.error('Error adding event:', error);
    throw error;
  }
  return data[0];
};

export const updateEvent = async (id, updates) => {
  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', id)
    .select();
  
  if (error) {
    console.error('Error updating event:', error);
    throw error;
  }
  return data[0];
};

export const deleteEvent = async (id) => {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};

// Donations
export async function getDonations() {
  try {
    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching donations:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getDonations:', error);
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

    console.log('Adding donation with data:', donationData);

    const { data, error } = await supabase
      .from('donations')
      .insert([donationData])
      .select()
      .single();

    if (error) {
      console.error('Error adding donation:', error);
      if (error.code === '42501') {
        console.error('Authentication error - please ensure you are logged in');
      }
      throw error;
    }

    console.log('Successfully added donation:', data);
    return data;
  } catch (error) {
    console.error('Error in addDonation:', error);
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

    if (error) {
      console.error('Error updating donation:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateDonation:', error);
    throw error;
  }
}

export async function deleteDonation(id) {
  try {
    const { error } = await supabase
      .from('donations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting donation:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteDonation:', error);
    throw error;
  }
}

// Groups
export async function getGroups() {
  try {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching groups:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getGroups:', error);
    throw error;
  }
}
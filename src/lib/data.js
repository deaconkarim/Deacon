import { supabase } from './supabaseClient';

// Members
export async function getMembers() {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true });

  if (error) {
    console.error('Error fetching members:', error);
    throw error;
  }

  return data;
}

export const addMember = async (member) => {
  // Ensure address is properly formatted as JSONB
  const memberData = {
    ...member,
    address: member.address ? JSON.stringify(member.address) : null
  };

  const { data, error } = await supabase
    .from('members')
    .insert([memberData])
    .select()
    .single();

  if (error) {
    console.error('Error adding member:', error);
    throw error;
  }

  return data;
};

export const updateMember = async (id, updates) => {
  // Ensure address is properly formatted as JSONB
  const memberData = {
    ...updates,
    address: updates.address ? JSON.stringify(updates.address) : null
  };

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

  return data;
};

export const deleteMember = async (id) => {
  const { error } = await supabase
    .from('members')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting member:', error);
    throw error;
  }
};

// Prayer Requests
export async function getPrayerRequests() {
  const { data, error } = await supabase
    .from('prayer_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function addPrayerRequest(request) {
  const { data, error } = await supabase
    .from('prayer_requests')
    .insert([request])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePrayerRequest(id, request) {
  const { data, error } = await supabase
    .from('prayer_requests')
    .update(request)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePrayerRequest(id) {
  const { error } = await supabase
    .from('prayer_requests')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Prayer Responses
export async function getPrayerResponses(requestId) {
  const { data, error } = await supabase
    .from('prayer_responses')
    .select('*')
    .eq('prayer_request_id', requestId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function addPrayerResponse(response) {
  const { data, error } = await supabase
    .from('prayer_responses')
    .insert([response])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePrayerResponse(id, response) {
  const { data, error } = await supabase
    .from('prayer_responses')
    .update(response)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePrayerResponse(id) {
  const { error } = await supabase
    .from('prayer_responses')
    .delete()
    .eq('id', id);

  if (error) throw error;
} 
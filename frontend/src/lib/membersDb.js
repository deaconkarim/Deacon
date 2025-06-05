import { supabase } from './supabaseClient';

// Fetch all members
export async function getMembers() {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('first_name', { ascending: true })
      .order('last_name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error;
  }
}

// Add a new member
export async function addMember(member) {
  try {
    const { data, error } = await supabase
      .from('members')
      .insert([member])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

// Update a member
export async function updateMember(id, updates) {
  try {
    const { data, error } = await supabase
      .from('members')
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

// Delete a member
export async function deleteMember(id) {
  try {
    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    throw error;
  }
}

// Subscribe to members changes
export const subscribeToMembers = (callback) => {
  return supabase
    .channel('members_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'members'
      },
      callback
    )
    .subscribe();
}; 
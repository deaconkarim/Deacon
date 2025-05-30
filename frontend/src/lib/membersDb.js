import { supabase } from './supabaseClient';

// Fetch all members
export const fetchMembers = async () => {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('lastName', { ascending: true })
    .order('firstName', { ascending: true });

  if (error) {
    console.error('Error fetching members:', error);
    throw error;
  }

  return data;
};

// Add a new member
export const addMember = async (memberData) => {
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

// Update a member
export const updateMember = async (id, memberData) => {
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

// Delete a member
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
import { supabase } from './supabaseClient';

// Helper function to get the current organization ID (including impersonation)
const getCurrentOrganizationId = async () => {
  // Check if we're impersonating a user and use that organization ID
  const impersonatingUser = localStorage.getItem('impersonating_user');
  if (impersonatingUser) {
    const impersonationData = JSON.parse(impersonatingUser);
    return impersonationData.organization_id;
  }

  // Check if we're impersonating an organization directly
  const impersonatingOrg = localStorage.getItem('impersonating_organization');
  if (impersonatingOrg) {
    const impersonationData = JSON.parse(impersonatingOrg);
    return impersonationData.organization_id;
  }

  // Get organization from current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: orgUsers, error: orgError } = await supabase
    .from('organization_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1);

  if (orgError || !orgUsers || orgUsers.length === 0) throw new Error('Unable to determine organization');
  
  return orgUsers[0].organization_id;
};

export const familyService = {
  // Get all families with their members
  async getFamilies() {
    // Get the current organization ID (including impersonation)
    const organizationId = await getCurrentOrganizationId();

    // Get families that belong to the current organization
    const { data, error } = await supabase
      .from('family_members_view')
      .select('*')
      .eq('family_organization_id', organizationId)
      .order('family_name', { ascending: true });

    if (error) throw error;

    if (error) throw error;

    // Group by family
    const families = {};
    data.forEach(row => {
      if (!families[row.family_id]) {
        families[row.family_id] = {
          id: row.family_id,
          family_name: row.family_name,
          primary_contact_id: row.primary_contact_id,
          address: row.family_address,
          phone: row.family_phone,
          email: row.family_email,
          members: []
        };
      }
      
      if (row.member_id) {
        families[row.family_id].members.push({
          id: row.member_id,
          firstname: row.firstname,
          lastname: row.lastname,
          email: row.member_email,
          phone: row.member_phone,
          image_url: row.image_url,
          member_type: row.member_type,
          birth_date: row.birth_date,
          gender: row.gender,
          marital_status: row.marital_status,
          relationship_type: row.relationship_type,
          is_primary: row.is_primary
        });
      }
    });

    return Object.values(families);
  },

  // Get a single family by ID
  async getFamily(familyId) {
    // Get the current organization ID (including impersonation)
    const organizationId = await getCurrentOrganizationId();

    const { data, error } = await supabase
      .from('family_members_view')
      .select('*')
      .eq('family_id', familyId)
      .eq('family_organization_id', organizationId)
      .order('firstname', { ascending: true });

    if (error) throw error;

    if (data.length === 0) return null;

    const family = {
      id: data[0].family_id,
      family_name: data[0].family_name,
      primary_contact_id: data[0].primary_contact_id,
      address: data[0].family_address,
      phone: data[0].family_phone,
      email: data[0].family_email,
      members: []
    };

    data.forEach(row => {
      if (row.member_id) {
        family.members.push({
          id: row.member_id,
          firstname: row.firstname,
          lastname: row.lastname,
          email: row.member_email,
          phone: row.member_phone,
          image_url: row.image_url,
          member_type: row.member_type,
          birth_date: row.birth_date,
          gender: row.gender,
          marital_status: row.marital_status,
          relationship_type: row.relationship_type,
          is_primary: row.is_primary
        });
      }
    });

    return family;
  },

  // Create a new family
  async createFamily(familyData) {
    // Get the current organization ID (including impersonation)
    const organizationId = await getCurrentOrganizationId();

    // Add organization_id to family data
    const familyDataWithOrg = {
      ...familyData,
      organization_id: organizationId
    };

    const { data, error } = await supabase
      .from('families')
      .insert(familyDataWithOrg)
      .select()
      .limit(1);

    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  },

  // Update a family
  async updateFamily(familyId, updates) {
    const { data, error } = await supabase
      .from('families')
      .update(updates)
      .eq('id', familyId)
      .select()
      .limit(1);

    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  },

  // Delete a family
  async deleteFamily(familyId) {
    const { error } = await supabase
      .from('families')
      .delete()
      .eq('id', familyId);

    if (error) throw error;
  },

  // Add a member to a family
  async addMemberToFamily(familyId, memberId, relationshipType = 'other', isPrimary = false) {
    const { data, error } = await supabase
      .from('family_relationships')
      .insert({
        family_id: familyId,
        member_id: memberId,
        relationship_type: relationshipType,
        is_primary: isPrimary
      })
      .select()
      .limit(1);

    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  },

  // Remove a member from a family
  async removeMemberFromFamily(familyId, memberId) {
    const { error } = await supabase
      .from('family_relationships')
      .delete()
      .eq('family_id', familyId)
      .eq('member_id', memberId);

    if (error) throw error;
  },

  // Update family relationship
  async updateFamilyRelationship(familyId, memberId, updates) {
    const { data, error } = await supabase
      .from('family_relationships')
      .update(updates)
      .eq('family_id', familyId)
      .eq('member_id', memberId)
      .select()
      .limit(1);

    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  },

  // Get members not in any family
  async getUnassignedMembers() {
    // Get the current organization ID (including impersonation)
    const organizationId = await getCurrentOrganizationId();

    // First, get all members in the current organization
    const { data: allMembers, error: membersError } = await supabase
      .from('members')
      .select('*')
      .eq('organization_id', organizationId)
      .order('firstname', { ascending: true });

    if (membersError) throw membersError;

    // Get all family relationships
    const { data: familyRelationships, error: relationshipsError } = await supabase
      .from('family_relationships')
      .select('member_id');

    if (relationshipsError) throw relationshipsError;

    // Filter out members who are in any family
    const unassignedMembers = allMembers.filter(member => 
      !familyRelationships.some(fr => fr.member_id === member.id)
    );

    return unassignedMembers;
  },

  // Get members that could be added to a family
  async getAvailableMembers(familyId) {
    // Get the current organization ID (including impersonation)
    const organizationId = await getCurrentOrganizationId();

    // First, get all members in the current organization
    const { data: allMembers, error: membersError } = await supabase
      .from('members')
      .select('*')
      .eq('organization_id', organizationId)
      .order('firstname', { ascending: true });

    if (membersError) throw membersError;

    // Get all family relationships to see who's already in families
    const { data: familyRelationships, error: relationshipsError } = await supabase
      .from('family_relationships')
      .select('member_id, family_id');

    if (relationshipsError) throw relationshipsError;

    // Filter out members who are in other families (but keep members in the current family)
    const availableMembers = allMembers.filter(member => {
      const memberRelationships = familyRelationships.filter(fr => fr.member_id === member.id);
      // Member is available if they're not in any family, or if they're only in the current family
      return memberRelationships.length === 0 || 
             (memberRelationships.length === 1 && memberRelationships[0].family_id === familyId);
    });

    return availableMembers;
  },

  // Search families by name
  async searchFamilies(searchTerm) {
    const { data, error } = await supabase
      .from('families')
      .select(`
        *,
        family_relationships (
          member_id,
          relationship_type,
          members (
            id,
            firstname,
            lastname,
            member_type
          )
        )
      `)
      .ilike('family_name', `%${searchTerm}%`)
      .order('family_name', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Get family statistics
  async getFamilyStats() {
    // Get the current organization ID (including impersonation)
    const organizationId = await getCurrentOrganizationId();

    // Get families that belong to the current organization
    const { data: familyData, error: familiesError } = await supabase
      .from('family_members_view')
      .select('family_id')
      .eq('family_organization_id', organizationId);

    if (familiesError) throw familiesError;

    // Get unique family IDs
    const uniqueFamilies = new Set(familyData.map(f => f.family_id));

    // Get all members in the current organization
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, member_type')
      .eq('organization_id', organizationId);

    if (membersError) throw membersError;

    // Get all family relationships
    const { data: familyRelationships, error: relationshipsError } = await supabase
      .from('family_relationships')
      .select('member_id');

    if (relationshipsError) throw relationshipsError;

    // Get unique member IDs that are in families
    const membersInFamilies = new Set(familyRelationships.map(fr => fr.member_id));
    
    const stats = {
      totalFamilies: uniqueFamilies.size,
      totalMembers: members.length,
      adults: members.filter(m => m.member_type === 'adult').length,
      children: members.filter(m => m.member_type === 'child').length,
      membersInFamilies: membersInFamilies.size,
      membersWithoutFamilies: members.length - membersInFamilies.size
    };

    return stats;
  }
}; 
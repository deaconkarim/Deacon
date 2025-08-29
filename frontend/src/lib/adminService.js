import { supabase } from './supabase';

// ==================== ORGANIZATIONS ====================

export async function getOrganizations() {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Get member and user counts separately for each organization
    const processedData = await Promise.all(data?.map(async (org) => {
      // Get member count
      const { count: memberCount } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', org.id);
      
      // Get user count (from organization_users table if it exists, otherwise from members with user_id)
      const { count: userCount } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', org.id)
        .not('user_id', 'is', null);
      
      return {
        ...org,
        member_count: memberCount || 0,
        user_count: userCount || 0
      };
    }) || []);
    
    return processedData;
  } catch (error) {
    console.error('Error fetching organizations:', error);
    throw error;
  }
}

export async function createOrganization(orgData) {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .insert([{
        name: orgData.name,
        email: orgData.contact_email,
        phone: orgData.contact_phone,
        address: orgData.address
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating organization:', error);
    throw error;
  }
}

export async function updateOrganization(id, orgData) {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .update(orgData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating organization:', error);
    throw error;
  }
}

export async function deleteOrganization(id) {
  try {

    // First, check if the organization exists and get basic info
    const { data: org, error: selectError } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', id)
      .single();

    if (selectError) {
      console.error('Error fetching organization for deletion:', selectError);
      throw new Error(`Could not find organization: ${selectError.message}`);
    }

    if (!org) {
      throw new Error('Organization not found');
    }

    // Use the stored procedure to handle deletion safely

    const { data, error: rpcError } = await supabase.rpc('delete_organization_simple', {
      org_id: id
    });

    if (rpcError) {
      console.error('Stored procedure deletion failed:', rpcError);
      
      // Fallback to manual deletion if stored procedure fails

      // Delete ALL activity_log entries first to prevent FK violations

      try {
        const { error: allActivityError } = await supabase
          .from('activity_log')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
        
        if (allActivityError) {

        } else {

        }
      } catch (error) {

      }

      // Essential tables that must be cleaned
      const criticalTables = [
        'donations',
        'events',
        'members',
        'organization_invitations'
      ];

      for (const table of criticalTables) {
        try {

          const { error } = await supabase
            .from(table)
            .delete()
            .eq('organization_id', id);
          
          if (error) {

          }
        } catch (cleanError) {

        }
      }

      const { error: deleteError } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Organization deletion failed:', deleteError);
        throw new Error(`Failed to delete organization: ${deleteError.message}`);
      }
    } else {

    }

  } catch (error) {
    console.error('Error deleting organization:', error);
    throw error;
  }
}

export async function getOrganizationStats(id) {
  try {
    const [
      { count: memberCount },
      { count: eventCount },
      { count: donationCount },
      { data: recentActivity }
    ] = await Promise.all([
      supabase.from('members').select('*', { count: 'exact', head: true }).eq('organization_id', id),
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('organization_id', id),
      supabase.from('donations').select('*', { count: 'exact', head: true }).eq('organization_id', id),
      supabase
        .from('activity_log')
        .select('*')
        .eq('organization_id', id)
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

    const { data: donations } = await supabase
      .from('donations')
      .select('amount')
      .eq('organization_id', id);

    const totalDonations = donations?.reduce((sum, d) => sum + parseFloat(d.amount), 0) || 0;

    return {
      members: memberCount || 0,
      events: eventCount || 0,
      donations: donationCount || 0,
      totalDonationAmount: totalDonations,
      recentActivity: recentActivity || []
    };
  } catch (error) {
    console.error('Error fetching organization stats:', error);
    throw error;
  }
}

// ==================== USERS ====================

export async function getAllUsers() {
  try {
    // First try the system_users view
    const { data: viewData, error: viewError } = await supabase
      .from('system_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (!viewError && viewData) {
      return viewData;
    }

    // Fallback: Query auth.users and members directly

    const { data: authUsers, error: authError } = await supabase
      .from('members')
      .select(`
        id,
        firstname, 
        lastname,
        email,
        status,
        role,
        organization_id,
        user_id,
        created_at,
        organizations(name)
      `)
      .order('created_at', { ascending: false });

    if (authError) {
      console.error('Fallback query also failed:', authError);
      return [];
    }

    // Transform the data to match expected format
    const transformedUsers = (authUsers || []).map(member => ({
      id: member.user_id || member.id,
      email: member.email,
      firstname: member.firstname,
      lastname: member.lastname,
      organization_id: member.organization_id,
      organization_name: member.organizations?.name,
      role: member.role,
      status: member.status,
      created_at: member.created_at
    }));

    return transformedUsers;
  } catch (error) {
    console.error('Error fetching users:', error);
    return []; // Return empty array instead of throwing
  }
}

export async function createUser(userData) {
  try {
    // Create auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        firstname: userData.firstname,
        lastname: userData.lastname,
        organization_id: userData.organization_id,
        role: userData.role
      }
    });

    if (authError) throw authError;

    // Create member record
    const { data: member, error: memberError } = await supabase
      .from('members')
      .insert([{
        user_id: authUser.user.id,
        organization_id: userData.organization_id,
        firstname: userData.firstname,
        lastname: userData.lastname,
        email: userData.email,
        role: userData.role,
        status: userData.status || 'active'
      }])
      .select()
      .single();

    if (memberError) throw memberError;

    return { user: authUser.user, member };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function updateUser(id, userData) {
  try {
    // Update auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.updateUserById(id, {
      email: userData.email,
      user_metadata: {
        firstname: userData.firstname,
        lastname: userData.lastname,
        organization_id: userData.organization_id,
        role: userData.role
      }
    });

    if (authError) throw authError;

    // Update member record
    const { data: member, error: memberError } = await supabase
      .from('members')
      .update({
        firstname: userData.firstname,
        lastname: userData.lastname,
        email: userData.email,
        role: userData.role,
        status: userData.status
      })
      .eq('user_id', id)
      .select()
      .single();

    if (memberError) throw memberError;

    return { user: authUser.user, member };
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

export async function deleteUser(id) {
  try {
    // Delete member record first
    await supabase
      .from('members')
      .delete()
      .eq('user_id', id);

    // Delete auth user
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

// ==================== IMPERSONATION ====================

export async function impersonateUser(userId) {
  try {
    // Generate a temporary access token for the user
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: userId // This would need to be the user's email
    });

    if (error) throw error;

    // Store the current admin session
    const currentSession = await supabase.auth.getSession();
    localStorage.setItem('admin_session_backup', JSON.stringify(currentSession));

    // Set impersonation flag
    localStorage.setItem('impersonating_user_id', userId);

    return data;
  } catch (error) {
    console.error('Error impersonating user:', error);
    throw error;
  }
}

export async function exitImpersonation() {
  try {
    // Restore admin session
    const adminSession = localStorage.getItem('admin_session_backup');
    if (adminSession) {
      const session = JSON.parse(adminSession);
      await supabase.auth.setSession(session.data.session);
    }

    // Clear impersonation data
    localStorage.removeItem('impersonating_user_id');
    localStorage.removeItem('admin_session_backup');

    return true;
  } catch (error) {
    console.error('Error exiting impersonation:', error);
    throw error;
  }
}

export function isImpersonating() {
  return localStorage.getItem('impersonating_user_id') !== null;
}

export function getImpersonatedUserId() {
  return localStorage.getItem('impersonating_user_id');
}

// ==================== SYSTEM STATS ====================

export async function getSystemStats() {
  try {
    // First try the system_stats view
    const { data: stats, error } = await supabase
      .from('system_stats')
      .select('*')
      .maybeSingle();

    if (!error && stats) {
      return {
        organizations: {
          total: stats.total_organizations || 0,
          recent: stats.recent_organizations || 0
        },
        users: {
          total: stats.total_users || 0,
          recent: stats.recent_users || 0
        },
        members: {
          total: stats.total_members || 0
        },
        donations: {
          total: stats.total_donations || 0,
          totalAmount: stats.total_donation_amount || 0
        }
      };
    }

    // Fallback: Calculate stats manually with parallel queries

    const [
      { count: totalOrgs },
      { count: totalMembers },
      { data: donations },
      recentOrgsResult,
      recentUsersResult
    ] = await Promise.all([
      supabase.from('organizations').select('*', { count: 'exact', head: true }),
      supabase.from('members').select('*', { count: 'exact', head: true }),
      supabase.from('donations').select('amount'),
      supabase.from('organizations').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 30*24*60*60*1000).toISOString()),
      supabase.from('members').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 30*24*60*60*1000).toISOString())
    ]);

    const totalDonations = donations?.length || 0;
    const totalDonationAmount = donations?.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0) || 0;

    const calculatedStats = {
      organizations: {
        total: totalOrgs || 0,
        recent: recentOrgsResult.count || 0
      },
      users: {
        total: totalMembers || 0, // Using members as proxy for users
        recent: recentUsersResult.count || 0
      },
      members: {
        total: totalMembers || 0
      },
      donations: {
        total: totalDonations,
        totalAmount: totalDonationAmount
      }
    };

    return calculatedStats;
  } catch (error) {
    console.error('Error fetching system stats:', error);
    // Return fallback data if everything fails
    return {
      organizations: { total: 0, recent: 0 },
      users: { total: 0, recent: 0 },
      members: { total: 0 },
      donations: { total: 0, totalAmount: 0 }
    };
  }
}

// ==================== ACTIVITY LOG ====================

export async function logActivity(organizationId, action, details) {
  try {
    const { data, error } = await supabase
      .from('activity_log')
      .insert([{
        organization_id: organizationId,
        action,
        details,
        created_at: new Date().toISOString()
      }]);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error logging activity:', error);
    throw error;
  }
}

export async function getSystemActivity(limit = 50) {
  try {
    const { data, error } = await supabase
      .from('activity_log')
      .select(`
        *,
        organizations(name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {

      // Fallback: Query without organization join
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (fallbackError) {
        console.error('Fallback activity query also failed:', fallbackError);
        return [];
      }
      
      return fallbackData || [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching system activity:', error);
    // Return empty array if fails
    return [];
  }
} 
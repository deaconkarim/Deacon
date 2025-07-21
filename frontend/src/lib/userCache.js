import { supabase } from './supabaseClient';

// User cache to prevent repeated auth calls
let userCache = null;
let userCacheTimestamp = null;
const USER_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

// Organization cache to prevent repeated org queries
let organizationCache = null;
let organizationCacheTimestamp = null;
const ORG_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const userCacheService = {
  // Get current user with caching
  async getCurrentUser() {
    const now = Date.now();
    
    // Check cache first
    if (userCache && userCacheTimestamp && (now - userCacheTimestamp) < USER_CACHE_DURATION) {
      console.log('👤 [UserCache] Using cached user data');
      return userCache;
    }

    try {
      console.log('👤 [UserCache] Fetching fresh user data');
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      
      // Cache the result
      userCache = user;
      userCacheTimestamp = now;
      
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // Get current user's organization with caching
  async getCurrentUserOrganization() {
    const now = Date.now();
    
    // Check cache first
    if (organizationCache && organizationCacheTimestamp && (now - organizationCacheTimestamp) < ORG_CACHE_DURATION) {
      console.log('🏢 [UserCache] Using cached organization data');
      return organizationCache;
    }

    try {
      const user = await this.getCurrentUser();
      if (!user) return null;

      // Check for impersonation first
      const impersonatingUser = localStorage.getItem('impersonating_user');
      if (impersonatingUser) {
        const impersonationData = JSON.parse(impersonatingUser);
        console.log('🔍 [UserCache] Using impersonated organization:', impersonationData.organization_id);
        organizationCache = {
          organization_id: impersonationData.organization_id,
          organization_name: impersonationData.organization_name,
          role: impersonationData.role || 'member'
        };
        organizationCacheTimestamp = now;
        return organizationCache;
      }

      const impersonatingOrg = localStorage.getItem('impersonating_organization');
      if (impersonatingOrg) {
        const impersonationData = JSON.parse(impersonatingOrg);
        console.log('🔍 [UserCache] Using impersonated organization:', impersonationData.organization_id);
        organizationCache = {
          organization_id: impersonationData.organization_id,
          organization_name: impersonationData.organization_name,
          role: 'admin'
        };
        organizationCacheTimestamp = now;
        return organizationCache;
      }

      // Get organization from database
      const { data: orgUsers, error } = await supabase
        .from('organization_users')
        .select(`
          organization_id,
          role,
          organizations(name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1);

      if (error) throw error;

      if (!orgUsers || orgUsers.length === 0) {
        organizationCache = null;
        organizationCacheTimestamp = now;
        return null;
      }

      const orgUser = orgUsers[0];
      organizationCache = {
        organization_id: orgUser.organization_id,
        organization_name: orgUser.organizations?.name,
        role: orgUser.role
      };
      organizationCacheTimestamp = now;

      return organizationCache;
    } catch (error) {
      console.error('Error getting current user organization:', error);
      return null;
    }
  },

  // Get current user's organization ID (simplified)
  async getCurrentUserOrganizationId() {
    const org = await this.getCurrentUserOrganization();
    return org?.organization_id || null;
  },

  // Check if user is approved
  async isUserApproved() {
    const org = await this.getCurrentUserOrganization();
    return org?.role === 'admin'; // Assuming 'admin' means approved for now
  },

  // Check if user is admin
  async isUserAdmin() {
    const org = await this.getCurrentUserOrganization();
    return org?.role === 'admin';
  },

  // Get user's role
  async getUserRole() {
    const org = await this.getCurrentUserOrganization();
    return org?.role || 'member';
  },

  // Clear all caches
  clearCache() {
    userCache = null;
    userCacheTimestamp = null;
    organizationCache = null;
    organizationCacheTimestamp = null;
    console.log('🗑️ [UserCache] All caches cleared');
  },

  // Clear user cache only
  clearUserCache() {
    userCache = null;
    userCacheTimestamp = null;
    console.log('🗑️ [UserCache] User cache cleared');
  },

  // Clear organization cache only
  clearOrganizationCache() {
    organizationCache = null;
    organizationCacheTimestamp = null;
    console.log('🗑️ [UserCache] Organization cache cleared');
  }
}; 
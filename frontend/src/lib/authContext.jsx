import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState([]);
  const [currentOrganization, setCurrentOrganization] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // Debug environment variables
  console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('Supabase Anon Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Present' : 'Missing');

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserOrganizations(session.user.id);
      }
      setLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserOrganizations(session.user.id);
      } else {
        setOrganizations([]);
        setCurrentOrganization(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserOrganizations = async (userId) => {
    try {
      console.log('Fetching organizations for user:', userId);
      console.log('Supabase client:', supabase);
      
      // Test if we can access the table at all
      console.log('Testing basic table access...');
      const testQuery = supabase.from('organization_users').select('count');
      console.log('Test query object:', testQuery);
      
      // Add a timeout to the query
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 10000)
      );
      
      console.log('Building main query...');
      const queryPromise = supabase
        .from('organization_users')
        .select(`
          organization_id,
          role,
          status,
          organizations (
            id,
            name,
            slug,
            description,
            logo_url
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active');

      console.log('Query object:', queryPromise);
      console.log('About to execute query...');
      
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      console.log('Query completed. Data:', data, 'Error:', error);

      if (error) {
        console.error('Error fetching organizations:', error);
        throw error;
      }

      console.log('Organizations data:', data);

      const orgs = data.map(item => ({
        id: item.organization_id,
        name: item.organizations.name,
        slug: item.organizations.slug,
        description: item.organizations.description,
        logo_url: item.organizations.logo_url,
        role: item.role,
        status: item.status
      }));

      console.log('Processed organizations:', orgs);
      setOrganizations(orgs);

      // Set current organization to the first one or from localStorage
      const savedOrgId = localStorage.getItem('currentOrganizationId');
      console.log('Saved org ID from localStorage:', savedOrgId);
      const currentOrg = savedOrgId 
        ? orgs.find(org => org.id === savedOrgId)
        : orgs[0];
      
      console.log('Current organization to set:', currentOrg);
      if (currentOrg) {
        setCurrentOrganization(currentOrg);
        setUserRole(currentOrg.role);
        localStorage.setItem('currentOrganizationId', currentOrg.id);
      } else {
        console.log('No current organization found');
      }
    } catch (error) {
      console.error('Error fetching user organizations:', error);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setOrganizations([]);
      setCurrentOrganization(null);
      setUserRole(null);
      localStorage.removeItem('currentOrganizationId');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    loading,
    organizations,
    currentOrganization,
    userRole,
    signOut,
    isOwner: userRole === 'owner',
    isAdmin: userRole === 'owner' || userRole === 'admin',
    isMember: userRole === 'owner' || userRole === 'admin' || userRole === 'member',
    isViewer: userRole === 'owner' || userRole === 'admin' || userRole === 'member' || userRole === 'viewer'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 
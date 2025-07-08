import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/authContext';
import { supabase } from '../lib/supabaseClient';
import { Shield, AlertTriangle } from 'lucide-react';

export function AdminRoute({ children }) {
  const { user } = useAuth();
  const [isSystemAdmin, setIsSystemAdmin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkSystemAdminStatus = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        console.log('Checking system admin status for user:', user.id);
        
        // First, find the System Administration organization
        const { data: systemOrg, error: orgError } = await supabase
          .from('organizations')
          .select('id, name')
          .eq('name', 'System Administration')
          .single();

        if (orgError) {
          console.error('Error finding System Administration organization:', orgError);
          setError('System Administration organization not found');
          setIsSystemAdmin(false);
          setIsLoading(false);
          return;
        }

        if (!systemOrg) {
          console.error('System Administration organization does not exist');
          setError('System Administration organization not configured');
          setIsSystemAdmin(false);
          setIsLoading(false);
          return;
        }

        console.log('Found System Administration org:', systemOrg);

        // Check if the user is an admin in the System Administration organization
        const { data: orgUser, error: userError } = await supabase
          .from('organization_users')
          .select('role, approval_status')
          .eq('user_id', user.id)
          .eq('organization_id', systemOrg.id)
          .maybeSingle();

        if (userError) {
          console.error('Error checking user role in System Administration:', userError);
          setIsSystemAdmin(false);
          setIsLoading(false);
          return;
        }

        if (!orgUser) {
          console.log('User not found in System Administration organization');
          setIsSystemAdmin(false);
          setIsLoading(false);
          return;
        }

        console.log('User org relationship:', orgUser);

        // Check if user is an approved admin in the System Administration organization
        const isAdmin = orgUser.role === 'admin' && 
                       orgUser.approval_status === 'approved';

        console.log('Is system admin?', isAdmin);
        setIsSystemAdmin(isAdmin);
        
      } catch (error) {
        console.error('Error checking system admin status:', error);
        setError('Failed to verify admin permissions');
        setIsSystemAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSystemAdminStatus();
  }, [user]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
            Verifying Admin Access
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Checking system administration privileges...
          </div>
        </div>
      </div>
    );
  }

  if (!isSystemAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-700">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              Access Restricted
            </h1>
            
            <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              The Admin Center is restricted to System Administration organization admins only. 
              {error && (
                <span className="block mt-2 text-sm text-red-600 dark:text-red-400">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  {error}
                </span>
              )}
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => window.history.back()}
                className="w-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-6 py-3 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Go Back
              </button>
              
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                If you believe you should have access, please contact your system administrator.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children;
} 
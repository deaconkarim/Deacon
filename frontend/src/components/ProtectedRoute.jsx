import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/authContext';
import { isUserApproved, getUserApprovalStatus } from '../lib/data';

export function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const [isApproved, setIsApproved] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkApprovalStatus = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const approved = await isUserApproved();
        setIsApproved(approved);
      } catch (error) {
        console.error('Error checking approval status:', error);
        setIsApproved(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkApprovalStatus();
  }, [user]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isApproved) {
    return <Navigate to="/approval-status" replace />;
  }

  return children;
} 
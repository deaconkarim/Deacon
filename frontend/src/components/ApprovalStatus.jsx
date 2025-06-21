import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, XCircle, AlertCircle, LogOut, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { getUserApprovalStatus } from '@/lib/data';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

const ApprovalStatus = () => {
  const [approvalStatus, setApprovalStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkApprovalStatus();
  }, []);

  const checkApprovalStatus = async () => {
    try {
      const status = await getUserApprovalStatus();
      setApprovalStatus(status);
      
      // If approved, automatically navigate to dashboard after a short delay
      if (status?.approval_status === 'approved') {
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (error) {
      console.error('Error checking approval status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await checkApprovalStatus();
    setIsRefreshing(false);
  };

  const handleContinueToApp = () => {
    navigate('/dashboard');
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
      navigate('/login');
    } catch (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!approvalStatus) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <CardTitle>Account Status Unknown</CardTitle>
            <CardDescription>
              Unable to determine your account status. Please contact your organization administrator.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={handleSignOut} variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          title: 'Approval Pending',
          description: 'Your registration is being reviewed by an administrator.',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      case 'approved':
        return {
          icon: CheckCircle,
          title: 'Approved!',
          description: 'Your account has been approved. You can now access the organization.',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'rejected':
        return {
          icon: XCircle,
          title: 'Registration Rejected',
          description: 'Your registration request has been rejected.',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      default:
        return {
          icon: AlertCircle,
          title: 'Unknown Status',
          description: 'Your account status is unknown.',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const statusConfig = getStatusConfig(approvalStatus.approval_status);
  const IconComponent = statusConfig.icon;

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className={`${statusConfig.bgColor} ${statusConfig.borderColor} border-2`}>
          <CardHeader className="text-center">
            <IconComponent className={`h-16 w-16 mx-auto mb-4 ${statusConfig.color}`} />
            <CardTitle className={statusConfig.color}>{statusConfig.title}</CardTitle>
            <CardDescription className="text-gray-600">
              {statusConfig.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {approvalStatus.approval_status === 'pending' && (
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
                  <span className="ml-2 text-sm text-gray-600">Waiting for approval...</span>
                </div>
                <p className="text-xs text-gray-500">
                  You will be notified once an administrator reviews your request.
                </p>
                <Button 
                  onClick={handleRefresh} 
                  variant="outline" 
                  size="sm"
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Checking...' : 'Check Status'}
                </Button>
              </div>
            )}

            {approvalStatus.approval_status === 'rejected' && approvalStatus.rejection_reason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <h4 className="font-medium text-red-800 mb-2">Reason for Rejection:</h4>
                <p className="text-sm text-red-700">{approvalStatus.rejection_reason}</p>
              </div>
            )}

            {approvalStatus.approval_status === 'approved' && (
              <div className="text-center space-y-3">
                <p className="text-sm text-green-700">
                  Redirecting you to the dashboard...
                </p>
                <Button 
                  onClick={handleContinueToApp} 
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Continue to App
                </Button>
              </div>
            )}

            <div className="text-center pt-4 border-t">
              <Button onClick={handleSignOut} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ApprovalStatus; 
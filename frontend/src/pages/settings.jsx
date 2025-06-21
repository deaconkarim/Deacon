import React from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ChurchInfoSettings from '@/components/settings/ChurchInfoSettings';
import AccountSettings from '@/components/settings/AccountSettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import DataManagementSettings from '@/components/settings/DataManagementSettings';
import UserManagementSettings from '@/components/settings/UserManagementSettings';
import PendingApprovals from '@/components/settings/PendingApprovals';
import { isUserAdmin } from '@/lib/data';
import { useState, useEffect } from 'react';

export function Settings() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const adminStatus = await isUserAdmin();
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <motion.h1 
          className="text-3xl font-bold tracking-tight"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          Settings
        </motion.h1>
        <motion.p 
          className="text-muted-foreground"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          Manage your organization management system settings.
        </motion.p>
      </div>
      
      <Tabs defaultValue="church" className="w-full">
        <div className="overflow-x-auto">
          <TabsList className="mb-4 w-max min-w-full">
            <TabsTrigger value="church">Church Information</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            {isAdmin && <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>}
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="data">Data Management</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="church">
          <ChurchInfoSettings />
        </TabsContent>
        
        <TabsContent value="users">
          <UserManagementSettings />
        </TabsContent>
        
        {isAdmin && (
          <TabsContent value="approvals">
            <PendingApprovals />
          </TabsContent>
        )}
        
        <TabsContent value="account">
          <AccountSettings />
        </TabsContent>
        
        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>
        
        <TabsContent value="data">
          <DataManagementSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
import React from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ChurchInfoSettings from '@/components/settings/ChurchInfoSettings';
import AccountSettings from '@/components/settings/AccountSettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import DataManagementSettings from '@/components/settings/DataManagementSettings';
import UserManagementSettings from '@/components/settings/UserManagementSettings';

export function Settings() {
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
          Manage your church management system settings.
        </motion.p>
      </div>
      
      <Tabs defaultValue="church" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="church">Church Information</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="data">Data Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="church">
          <ChurchInfoSettings />
        </TabsContent>
        
        <TabsContent value="users">
          <UserManagementSettings />
        </TabsContent>
        
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
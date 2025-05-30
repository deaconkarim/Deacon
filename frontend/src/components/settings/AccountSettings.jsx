import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, User, Mail, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
};

const AccountSettings = () => {
  const [userSettings, setUserSettings] = useState({
    name: 'Admin User',
    email: 'admin@example.com',
  });
  const [passwordFields, setPasswordFields] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleUserSettingsChange = (e) => {
    const { name, value } = e.target;
    setUserSettings(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordFields(prev => ({ ...prev, [name]: value}));
  }

  const handleSaveAccountSettings = () => {
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Account Settings Saved",
        description: "Your account information has been updated."
      });
    }, 1000);
  };

  const handleChangePassword = () => {
    if (passwordFields.newPassword !== passwordFields.confirmPassword) {
        toast({
            title: "Password Mismatch",
            description: "New password and confirm password do not match.",
            variant: "destructive"
        });
        return;
    }
    if (passwordFields.newPassword.length < 6) {
        toast({
            title: "Password Too Short",
            description: "New password must be at least 6 characters long.",
            variant: "destructive"
        });
        return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Password Changed",
        description: "Your password has been successfully changed."
      });
      setPasswordFields({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }, 1500);
  }


  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Manage your account information and password.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <motion.div variants={itemVariants} className="space-y-2">
            <Label htmlFor="user-name">Name</Label>
            <div className="flex items-center">
              <User className="mr-2 h-4 w-4 text-muted-foreground" />
              <Input id="user-name" name="name" value={userSettings.name} onChange={handleUserSettingsChange} />
            </div>
          </motion.div>
          
          <motion.div variants={itemVariants} className="space-y-2">
            <Label htmlFor="user-email">Email Address</Label>
            <div className="flex items-center">
              <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
              <Input id="user-email" name="email" type="email" value={userSettings.email} onChange={handleUserSettingsChange} />
            </div>
          </motion.div>

          <motion.hr variants={itemVariants} className="my-6" />
          
          <motion.h3 variants={itemVariants} className="text-lg font-medium">Change Password</motion.h3>
          
          <motion.div variants={itemVariants} className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <div className="flex items-center">
              <Lock className="mr-2 h-4 w-4 text-muted-foreground" />
              <Input id="current-password" name="currentPassword" type="password" placeholder="Enter your current password" value={passwordFields.currentPassword} onChange={handlePasswordChange} />
            </div>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" name="newPassword" type="password" placeholder="Enter new password" value={passwordFields.newPassword} onChange={handlePasswordChange}/>
            </motion.div>
            
            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input id="confirm-password" name="confirmPassword" type="password" placeholder="Confirm new password" value={passwordFields.confirmPassword} onChange={handlePasswordChange}/>
            </motion.div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
          <Button onClick={handleSaveAccountSettings} disabled={isLoading}>
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? 'Saving Info...' : 'Save Account Info'}
          </Button>
          <Button onClick={handleChangePassword} variant="outline" disabled={isLoading}>
            <Lock className="mr-2 h-4 w-4" />
            {isLoading ? 'Changing...' : 'Change Password'}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default AccountSettings;
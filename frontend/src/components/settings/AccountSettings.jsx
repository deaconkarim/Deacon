import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, User, Mail, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { getCurrentUserMember, updateCurrentUserMember, updateCurrentUserEmail, updateCurrentUserPassword } from '@/lib/data';
import { supabase } from '@/lib/supabaseClient';
import { userCacheService } from '@/lib/userCache';

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
    firstname: '',
    lastname: '',
    email: '',
  });
  const [passwordFields, setPasswordFields] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const { toast } = useToast();

  // Load current user's information on component mount
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        setIsInitialLoading(true);
        const memberData = await getCurrentUserMember();
        
        if (memberData) {
          setUserSettings({
            firstname: memberData.firstname || '',
            lastname: memberData.lastname || '',
            email: memberData.email || '',
          });
        } else {
          // If no member record, try to get email from auth user
          const user = await userCacheService.getCurrentUser();
          if (user) {
            setUserSettings({
              firstname: '',
              lastname: '',
              email: user.email || '',
            });
          }
        }
      } catch (error) {
        console.error('Error loading user info:', error);
        toast({
          title: "Error Loading User Info",
          description: "Failed to load your account information. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadUserInfo();
  }, [toast]);

  const handleUserSettingsChange = (e) => {
    const { name, value } = e.target;
    setUserSettings(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordFields(prev => ({ ...prev, [name]: value}));
  }

  const handleSaveAccountSettings = async () => {
    setIsLoading(true);
    
    try {
      // Update member information
      await updateCurrentUserMember({
        firstname: userSettings.firstname,
        lastname: userSettings.lastname,
        email: userSettings.email,
      });

      // Update email in auth if it changed
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email !== userSettings.email) {
        await updateCurrentUserEmail(userSettings.email);
      }

      toast({
        title: "Account Settings Saved",
        description: "Your account information has been updated successfully."
      });
    } catch (error) {
      console.error('Error saving account settings:', error);
      toast({
        title: "Error Saving Settings",
        description: error.message || "Failed to save your account information. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
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

    setIsLoadingPassword(true);
    
    try {
      await updateCurrentUserPassword(passwordFields.newPassword);
      
      toast({
        title: "Password Changed",
        description: "Your password has been successfully changed."
      });
      setPasswordFields({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Error Changing Password",
        description: error.message || "Failed to change your password. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingPassword(false);
    }
  }

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading account information...</p>
        </div>
      </div>
    );
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
            <Label htmlFor="user-firstname">First Name</Label>
            <div className="flex items-center">
              <User className="mr-2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="user-firstname" 
                name="firstname" 
                value={userSettings.firstname} 
                onChange={handleUserSettingsChange}
                placeholder="Enter your first name"
              />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-2">
            <Label htmlFor="user-lastname">Last Name</Label>
            <div className="flex items-center">
              <User className="mr-2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="user-lastname" 
                name="lastname" 
                value={userSettings.lastname} 
                onChange={handleUserSettingsChange}
                placeholder="Enter your last name"
              />
            </div>
          </motion.div>
          
          <motion.div variants={itemVariants} className="space-y-2">
            <Label htmlFor="user-email">Email Address</Label>
            <div className="flex items-center">
              <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="user-email" 
                name="email" 
                type="email" 
                value={userSettings.email} 
                onChange={handleUserSettingsChange}
                placeholder="Enter your email address"
              />
            </div>
          </motion.div>

          <motion.hr variants={itemVariants} className="my-6" />
          
          <motion.h3 variants={itemVariants} className="text-lg font-medium">Change Password</motion.h3>
          
          <motion.div variants={itemVariants} className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <div className="flex items-center">
              <Lock className="mr-2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="current-password" 
                name="currentPassword" 
                type="password" 
                placeholder="Enter your current password" 
                value={passwordFields.currentPassword} 
                onChange={handlePasswordChange} 
              />
            </div>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input 
                id="new-password" 
                name="newPassword" 
                type="password" 
                placeholder="Enter new password" 
                value={passwordFields.newPassword} 
                onChange={handlePasswordChange}
              />
            </motion.div>
            
            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input 
                id="confirm-password" 
                name="confirmPassword" 
                type="password" 
                placeholder="Confirm new password" 
                value={passwordFields.confirmPassword} 
                onChange={handlePasswordChange}
              />
            </motion.div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
          <Button onClick={handleSaveAccountSettings} disabled={isLoading || isLoadingPassword}>
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? 'Saving Info...' : 'Save Account Info'}
          </Button>
          <Button onClick={handleChangePassword} variant="outline" disabled={isLoading || isLoadingPassword}>
            <Lock className="mr-2 h-4 w-4" />
            {isLoadingPassword ? 'Changing...' : 'Change Password'}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default AccountSettings;
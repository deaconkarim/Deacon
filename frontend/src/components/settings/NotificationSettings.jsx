import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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

const NotificationSettings = () => {
  const [notificationPrefs, setNotificationPrefs] = useState({
    email: true,
    browser: true,
    mobile: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleNotificationChange = (key, checked) => {
    setNotificationPrefs(prev => ({
      ...prev,
      [key]: checked
    }));
  };

  const handleSaveNotificationSettings = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Notification Preferences Saved",
        description: "Your notification settings have been updated."
      });
    }, 1000);
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Manage how you receive notifications.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <motion.div variants={itemVariants} className="space-y-2">
            <div className="flex items-center space-x-3">
              <Checkbox 
                id="email-notifications" 
                checked={notificationPrefs.email}
                onCheckedChange={(checked) => handleNotificationChange('email', Boolean(checked))}
              />
              <Label htmlFor="email-notifications" className="font-medium">Email Notifications</Label>
            </div>
            <p className="text-sm text-muted-foreground pl-8">
              Receive email notifications for important updates, events, and reminders.
            </p>
          </motion.div>
          
          <motion.div variants={itemVariants} className="space-y-2">
            <div className="flex items-center space-x-3">
              <Checkbox 
                id="browser-notifications" 
                checked={notificationPrefs.browser}
                onCheckedChange={(checked) => handleNotificationChange('browser', Boolean(checked))}
              />
              <Label htmlFor="browser-notifications" className="font-medium">Browser Notifications</Label>
            </div>
            <p className="text-sm text-muted-foreground pl-8">
              Receive browser notifications when you're using the application.
            </p>
          </motion.div>
          
          <motion.div variants={itemVariants} className="space-y-2">
            <div className="flex items-center space-x-3">
              <Checkbox 
                id="mobile-notifications" 
                checked={notificationPrefs.mobile}
                onCheckedChange={(checked) => handleNotificationChange('mobile', Boolean(checked))}
              />
              <Label htmlFor="mobile-notifications" className="font-medium">Mobile Notifications</Label>
            </div>
            <p className="text-sm text-muted-foreground pl-8">
              Receive push notifications on your mobile device (requires app installation).
            </p>
          </motion.div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveNotificationSettings} disabled={isLoading}>
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? 'Saving...' : 'Save Preferences'}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default NotificationSettings;
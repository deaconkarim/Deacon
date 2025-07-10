import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Building, Mail, Phone, Globe, MapPin, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient'; 

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
};

// Helper function to get current user's organization ID
const getCurrentUserOrganizationId = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('approval_status', 'approved')
      .limit(1);

    if (error) throw error;
    return data && data.length > 0 ? data[0].organization_id : null;
  } catch (error) {
    console.error('Error getting user organization:', error);
    return null;
  }
};

const ChurchInfoSettings = () => {
  const [churchSettings, setChurchSettings] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    pastor: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [organizationId, setOrganizationId] = useState(null);
  const { toast } = useToast();

  const handleChurchSettingsChange = (e) => {
    const { name, value } = e.target;
    setChurchSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveChurchSettings = async () => {
    if (!organizationId) {
      toast({
        title: "Error",
        description: "Unable to determine your organization.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Convert settings object to key-value pairs for the database
      const settingsToSave = Object.entries(churchSettings).map(([key, value]) => ({
        setting_key: key,
        setting_value: value,
        organization_id: organizationId
      }));

      // Use upsert to save all settings
      const { error } = await supabase
        .from('church_settings')
        .upsert(settingsToSave, { onConflict: 'setting_key,organization_id' });

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Church information has been updated successfully."
      });
    } catch (error) {
      toast({
        title: "Error Saving Settings",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    const fetchChurchSettings = async () => {
      setIsLoading(true);
      try {
        // First get the user's organization ID
        const orgId = await getCurrentUserOrganizationId();
        if (!orgId) {
          toast({
            title: "Error",
            description: "Unable to determine your organization.",
            variant: "destructive"
          });
          return;
        }
        setOrganizationId(orgId);

        // Fetch organization details
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('name, email, phone, website, address')
          .eq('id', orgId)
          .single();

        if (orgError) throw orgError;

        // Fetch church settings
        const { data, error } = await supabase
          .from('church_settings')
          .select('setting_key, setting_value')
          .eq('organization_id', orgId);

        if (error) throw error;

        // Start with organization data as defaults
        const settingsObject = {
          name: orgData?.name || '',
          email: orgData?.email || '',
          phone: orgData?.phone || '',
          website: orgData?.website || '',
          address: orgData?.address ? JSON.stringify(orgData.address) : '',
          pastor: ''
        };

        // Override with any saved settings
        if (data && data.length > 0) {
          data.forEach(item => {
            settingsObject[item.setting_key] = item.setting_value;
          });
        }

        setChurchSettings(settingsObject);
      } catch (error) {
        console.error("Error fetching church settings:", error);
        toast({
          title: "Error Loading Settings",
          description: "Unable to load church settings.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchChurchSettings();
  }, [toast]);

  if (!organizationId && !isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Unable to load church settings. Please make sure you are associated with an organization.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <Card>
        <CardHeader>
          <CardTitle>Church Information</CardTitle>
          <CardDescription>Update your church's basic information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <motion.div variants={itemVariants} className="space-y-2">
            <Label htmlFor="church-name">Church Name</Label>
            <div className="flex items-center">
              <Building className="mr-2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="church-name" 
                name="name" 
                value={churchSettings.name} 
                onChange={handleChurchSettingsChange}
                disabled={isLoading}
              />
            </div>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="church-email">Email Address</Label>
              <div className="flex items-center">
                <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="church-email" 
                  name="email" 
                  type="email" 
                  value={churchSettings.email} 
                  onChange={handleChurchSettingsChange}
                  disabled={isLoading}
                />
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="church-phone">Phone Number</Label>
              <div className="flex items-center">
                <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="church-phone" 
                  name="phone" 
                  value={churchSettings.phone} 
                  onChange={handleChurchSettingsChange}
                  disabled={isLoading}
                />
              </div>
            </motion.div>
          </div>
          
          <motion.div variants={itemVariants} className="space-y-2">
            <Label htmlFor="church-website">Website</Label>
            <div className="flex items-center">
              <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="church-website" 
                name="website" 
                value={churchSettings.website} 
                onChange={handleChurchSettingsChange}
                disabled={isLoading}
              />
            </div>
          </motion.div>
          
          <motion.div variants={itemVariants} className="space-y-2">
            <Label htmlFor="church-address">Address</Label>
            <div className="flex items-center">
              <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="church-address" 
                name="address" 
                value={churchSettings.address} 
                onChange={handleChurchSettingsChange}
                disabled={isLoading}
              />
            </div>
          </motion.div>
          
          <motion.div variants={itemVariants} className="space-y-2">
            <Label htmlFor="church-pastor">Lead Pastor</Label>
            <div className="flex items-center">
              <User className="mr-2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="church-pastor" 
                name="pastor" 
                value={churchSettings.pastor} 
                onChange={handleChurchSettingsChange}
                disabled={isLoading}
              />
            </div>
          </motion.div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveChurchSettings} disabled={isLoading || !organizationId}>
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default ChurchInfoSettings;